import {
  graphql,
  useLazyLoadQuery,
  useMutation,
  usePaginationFragment,
  useSubscribeToInvalidationState,
} from "react-relay";
import { Link, useParams } from "react-router-dom";
import { ListFigureRecords_rootQuery } from "./__generated__/ListFigureRecords_rootQuery.graphql";
import { ListFigureRecords_figureRecords$key } from "./__generated__/ListFigureRecords_figureRecords.graphql";
import { ListFigureRecords_figureRecordsQuery } from "./__generated__/ListFigureRecords_figureRecordsQuery.graphql";
import {
  Box,
  Button,
  CircularProgress,
  IconButton,
  List,
  ListItem,
  ListItemSecondaryAction,
  Paper,
  Slider,
  Typography,
} from "@mui/material";
import AverageFigureRecords from "../components/AverageFigureRecords";
import React, { Suspense } from "react";
import XorShift from "../domains/XorShift";
import { useDebounce } from "react-use";
import FigureRecord from "../components/FigureRecord";
import { useBackground } from "../hooks/useBackground";
import * as utf8 from "../utils/utf8";
import {
  atomFamily,
  constSelector,
  useRecoilState_TRANSITION_SUPPORT_UNSTABLE,
  useRecoilValue,
} from "recoil";
import averageFigureStateFamily, {
  FigureRecordsWrapper,
} from "../store/averageFigure";
import * as icons from "@mui/icons-material";
import { ListFigureRecords_updateFigureRecordMutation } from "./__generated__/ListFigureRecords_updateFigureRecordMutation.graphql";
import { useSnackbar } from "notistack";
import { formatError } from "../domains/error";

const seedStateFamily = atomFamily({
  key: "ListFigureRecords/seedStateFamily",
  default: (_: { character: string }) => 0,
});

const debouncedRandomLevelStateFamily = atomFamily({
  key: "ListFigureRecords/debouncedRandomLevelStateFamily",
  default: (_: { character: string }) => 0.9,
});

const colorState = constSelector<string>("#000000");

const sizeState = constSelector<number>(256);

const sharedProportionState = constSelector<number>(0);
const weightState = constSelector<number>(1);

export default function ListFigureRecords(): JSX.Element {
  const count = 100;
  const params = useParams();
  const characterValue = utf8.fromBase64(params.character!);
  const [fetchKey, setFetchKey] = React.useState(0);
  const [isPending, startTransition] = React.useTransition();
  const { characters } = useLazyLoadQuery<ListFigureRecords_rootQuery>(
    graphql`
      query ListFigureRecords_rootQuery(
        $character: CharacterValue!
        $cursor: String
        $count: Int!
      ) {
        characters(values: [$character]) {
          id
          ...ListFigureRecords_figureRecords
            @arguments(cursor: $cursor, count: $count)
        }
      }
    `,
    {
      count,
      character: characterValue,
    },
    { fetchPolicy: "store-and-network", fetchKey }
  );
  useSubscribeToInvalidationState(
    characters.map(({ id }) => id),
    () => {
      setFetchKey((prev) => prev + 1);
    }
  );

  const [updateFigureRecord, updateFigureRecordLoading] =
    useMutation<ListFigureRecords_updateFigureRecordMutation>(
      graphql`
        mutation ListFigureRecords_updateFigureRecordMutation(
          $input: UpdateFigureRecordInput!
        ) {
          updateFigureRecord(input: $input) {
            figureRecord {
              id
            }
            errors {
              message
            }
          }
        }
      `
    );
  const debouncedRandomLevelState = debouncedRandomLevelStateFamily({
    character: characterValue,
  });
  const [debouncedRandomLevel, setDebouncedRandomLevel] =
    useRecoilState_TRANSITION_SUPPORT_UNSTABLE(debouncedRandomLevelState);
  const [randomLevel, setRandomLevel] = React.useState(debouncedRandomLevel);

  const [isReadyRandomLevel] = useDebounce(
    () => {
      startTransition(() => {
        setDebouncedRandomLevel(randomLevel);
      });
    },
    500,
    [randomLevel]
  );

  const isReady = isReadyRandomLevel();

  if (characters.length === 0) {
    throw new Error(`No character found: ${characterValue}`);
  }

  const character = characters[0];

  const pagination = usePaginationFragment<
    ListFigureRecords_figureRecordsQuery,
    ListFigureRecords_figureRecords$key
  >(
    graphql`
      fragment ListFigureRecords_figureRecords on Character
      @argumentDefinitions(cursor: { type: "String" }, count: { type: "Int!" })
      @refetchable(queryName: "ListFigureRecords_figureRecordsQuery") {
        figureRecords(after: $cursor, first: $count, userType: MYSELF)
          @connection(key: "ListFigureRecords_figureRecords") {
          edges {
            node {
              id
              figureRecordId
              ...FigureRecord_figureRecord
            }
          }
          ...averageFigureSelector_figureRecords
        }
      }
    `,
    character
  );

  const seedState = seedStateFamily({ character: characterValue });
  const [_seed, setSeed] =
    useRecoilState_TRANSITION_SUPPORT_UNSTABLE(seedState);
  const background = useBackground();
  const averageFigure = useRecoilValue(
    averageFigureStateFamily({
      figureRecords: new FigureRecordsWrapper(pagination.data.figureRecords),
      sharedFigureRecords: null,
      character: characterValue,
      seedState,
      randomLevelState: debouncedRandomLevelState,
      colorState,
      sizeState,
      sharedProportionState,
      weightState,
    })
  );
  const { enqueueSnackbar } = useSnackbar();

  return (
    <div>
      <Typography variant="h6">文字形状一覧</Typography>
      <Button
        component={Link}
        to={`/characters/character/${encodeURIComponent(
          utf8.toBase64(characterValue)
        )}/figure-records/create`}
        state={{ background }}
        variant="contained"
      >
        形状を登録
      </Button>
      <Paper elevation={3} sx={{ m: 1, p: 1 }}>
        <div>{pagination.data.figureRecords.edges.length}件の平均文字</div>
        <Typography>ゆらぎ</Typography>
        <Slider
          min={0}
          max={1.0}
          step={0.01}
          value={randomLevel}
          onChange={(_e, value) => {
            setRandomLevel(value as number);
          }}
        />
        <Suspense fallback={<CircularProgress />}>
          <div style={{ contain: "strict", width: 256, height: 256 }}>
            {pagination.data.figureRecords.edges.map(({ node }) => (
              <div
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                }}
                key={node.id}
              >
                <FigureRecord figureRecordKey={node} color="#ddd" />
              </div>
            ))}
            <div
              style={{
                position: "absolute",
                top: 0,
                left: 0,
              }}
            >
              <AverageFigureRecords
                figure={averageFigure}
                updateSeed={() => {
                  startTransition(() => {
                    setSeed(XorShift.randomSeed());
                  });
                }}
              />
            </div>
            {(!isReady || isPending) && <CircularProgress />}
          </div>
        </Suspense>
      </Paper>

      {pagination.data.figureRecords.edges.length !== 0 ? (
        <List>
          {pagination.data.figureRecords.edges.map(({ node }) => (
            <ListItem key={node.id} divider={true}>
              <Suspense fallback={<CircularProgress />}>
                <FigureRecord figureRecordKey={node} />
              </Suspense>
              <ListItemSecondaryAction>
                <IconButton
                  onClick={() => {
                    updateFigureRecord({
                      variables: {
                        input: {
                          id: node.figureRecordId,
                          disabled: true,
                        },
                      },
                      onCompleted: ({ updateFigureRecord }) => {
                        if (updateFigureRecord.errors === null) {
                          enqueueSnackbar("字の形状を無効化しました", {
                            variant: "success",
                          });
                        } else {
                          for (const error of updateFigureRecord.errors) {
                            enqueueSnackbar(error.message, {
                              variant: "error",
                            });
                          }
                        }
                      },
                      onError: (error) => {
                        enqueueSnackbar(formatError(error), {
                          variant: "error",
                        });
                      },
                      updater: (store, data) => {
                        if (data.updateFigureRecord.figureRecord !== null) {
                          store
                            .get(data.updateFigureRecord.figureRecord.id)!
                            .invalidateRecord();

                          store.get(characters[0].id)!.invalidateRecord();
                        }
                      },
                    });
                  }}
                >
                  <icons.Delete />
                </IconButton>
              </ListItemSecondaryAction>
            </ListItem>
          ))}
        </List>
      ) : (
        <Paper>文字形状が登録されていません</Paper>
      )}

      {pagination.hasNext && (
        <Button
          onClick={() => pagination.loadNext(count)}
          variant="contained"
          disabled={pagination.isLoadingNext}
        >
          More
        </Button>
      )}
    </div>
  );
}

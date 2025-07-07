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
  selectorFamily,
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
import UpdateCharacterConfig from "../components/UpdateCharacterConfig";

const figureRecordsWrapperStateFamily = selectorFamily({
  key: "ListFigureRecords/figureRecordsWrapperStateFamily",
  get:
    ({ value }: { value: FigureRecordsWrapper }) =>
    () => {
      // 無限ループを避けるためのworkaround
      // constSelectorは参照で同一性チェックされるが、selectorFamilyはtoJSONで同一性チェックされるので無限ループを避けられる
      return value;
    },
});

const seedStateFamily = atomFamily({
  key: "ListFigureRecords/seedStateFamily",
  default: (_: { character: string }) => 0,
});

const colorState = constSelector<string>("#000000");

const sizeState = constSelector<number>(256);

const sharedProportionState = constSelector<number>(0);
const weightState = constSelector<number>(1);

export default function ListFigureRecords(): JSX.Element {
  const count = 100;
  const params = useParams();
  const characterValue = utf8.fromBase64(params.character!);
  const strokeCount = Number(params.strokeCount!);
  const [fetchKey, setFetchKey] = React.useState(0);
  const [isPending, startTransition] = React.useTransition();
  const { characters, userConfig } =
    useLazyLoadQuery<ListFigureRecords_rootQuery>(
      graphql`
        query ListFigureRecords_rootQuery(
          $character: CharacterValue!
          $strokeCount: Int!
          $cursor: String
          $count: Int!
        ) {
          characters(values: [$character]) {
            id
            characterConfig(strokeCount: $strokeCount) {
              ...ListFigureRecords_figureRecords
                @arguments(cursor: $cursor, count: $count)
            }
          }
          userConfig {
            randomLevel
          }
        }
      `,
      {
        count,
        character: characterValue,
        strokeCount,
      },
      { fetchPolicy: "store-and-network", fetchKey }
    );
  useSubscribeToInvalidationState(
    characters.map(({ id }) => id),
    () => {
      startTransition(() => {
        setFetchKey((prev) => prev + 1);
      });
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

  if (characters.length === 0) {
    throw new Error(`No character found: ${characterValue}`);
  }

  const character = characters[0];

  const characterConfigKey = character.characterConfig;

  const pagination = usePaginationFragment<
    ListFigureRecords_figureRecordsQuery,
    ListFigureRecords_figureRecords$key
  >(
    graphql`
      fragment ListFigureRecords_figureRecords on CharacterConfig
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
    characterConfigKey
  );

  const seedState = seedStateFamily({ character: characterValue });
  const [_seed, setSeed] =
    useRecoilState_TRANSITION_SUPPORT_UNSTABLE(seedState);
  const background = useBackground();
  const randomLevelState = constSelector(userConfig.randomLevel / 100);

  const averageFigure = useRecoilValue(
    averageFigureStateFamily({
      figureRecordsState: figureRecordsWrapperStateFamily({
        value: new FigureRecordsWrapper(pagination.data.figureRecords),
      }),
      sharedFigureRecordsState: constSelector(null),
      character: characterValue,
      seedState,
      randomLevelState,
      colorState,
      sizeState,
      sharedProportionState,
      weightState,
    })
  );
  const { enqueueSnackbar } = useSnackbar();

  return (
    <div>
      <UpdateCharacterConfig
        characterValue={characterValue}
        strokeCount={strokeCount}
      />
      <Typography variant="h6">文字形状一覧</Typography>
      <Button
        component={Link}
        to={`/figure-records/create/i/${utf8.toBase64(
          characterValue
        )}?${new URLSearchParams([
          ["strokeCount", String(strokeCount)],
        ]).toString()}`}
        state={{ background }}
        variant="contained"
      >
        形状を登録
      </Button>
      <Paper elevation={3} sx={{ m: 1, p: 1 }}>
        <div>{pagination.data.figureRecords.edges.length}件の平均文字</div>
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
            {isPending && <CircularProgress />}
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
                        if (!updateFigureRecord.errors) {
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
                        if (data.updateFigureRecord.figureRecord) {
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

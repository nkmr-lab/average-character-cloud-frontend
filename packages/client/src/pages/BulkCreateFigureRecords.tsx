import { graphql, useLazyLoadQuery, useMutation } from "react-relay";
import React from "react";
import { Link, useParams } from "react-router-dom";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  List,
  ListItem,
  Tooltip,
  Typography,
} from "@mui/material";
import { BulkCreateFigureRecords_rootQuery } from "./__generated__/BulkCreateFigureRecords_rootQuery.graphql";
import { useBackground } from "../hooks/useBackground";
import * as utf8 from "../utils/utf8";
import CanvasIframe, { CanvasIframeClient } from "../components/CanvasIframe";
import { BulkCreateFigureRecords_createFigureRecordMutation } from "./__generated__/BulkCreateFigureRecords_createFigureRecordMutation.graphql";
import ignoreResult from "../utils/ignoreResult";
import { useBeforeUnload } from "react-router-dom";

type BulkClient = {
  submit(): void;
};

// 1キャンバス
const BulkCanvas = React.forwardRef<
  BulkClient,
  {
    onChangeStrokesNumber: (strokesNumber: number) => void;
    onSubmitDone: (success: boolean | null) => void;
    character: string;
  }
>(function BulkCanvas(
  { onChangeStrokesNumber, onSubmitDone, character },
  ref
): JSX.Element {
  const canvasIframeClientRef = React.useRef<CanvasIframeClient | null>(null);
  const [createFigureRecord] =
    useMutation<BulkCreateFigureRecords_createFigureRecordMutation>(
      graphql`
        mutation BulkCreateFigureRecords_createFigureRecordMutation(
          $input: CreateFigureRecordInput!
        ) {
          createFigureRecord(input: $input) {
            figureRecord {
              id
              figureRecordId
              character {
                id
              }
            }
            errors {
              message
            }
          }
        }
      `
    );

  React.useImperativeHandle(ref, () => ({
    submit: () => {
      ignoreResult(async () => {
        const figure = await canvasIframeClientRef.current!.getFigureJSON();
        if (figure.strokes.length === 0) {
          onSubmitDone(null);
          return;
        }
        createFigureRecord({
          variables: {
            input: {
              figure: JSON.stringify(figure),
              character: character,
            },
          },
          onCompleted: ({ createFigureRecord }) => {
            if (createFigureRecord.errors === null) {
              onChangeStrokesNumber(0);
              void canvasIframeClientRef.current!.clear();
              onSubmitDone(true);
            } else {
              onSubmitDone(false);
            }
          },
          onError: () => {
            onSubmitDone(false);
          },
          updater: (store, data) => {
            if (data.createFigureRecord.figureRecord !== null) {
              store
                .get(data.createFigureRecord.figureRecord.character.id)!
                .invalidateRecord();
            }
          },
        });
      })();
    },
  }));

  return (
    <div>
      <CanvasIframe
        canvasIframeClientRef={canvasIframeClientRef}
        onEvent={(evt) => {
          onChangeStrokesNumber(evt.strokesNumber);
        }}
      />
      <div>
        <Button
          onClick={() => {
            onChangeStrokesNumber(0);
            void canvasIframeClientRef.current!.clear();
          }}
        >
          クリア
        </Button>
      </div>
    </div>
  );
});

// 1文字種(複数キャンバス)
const BulkCharacter = React.forwardRef<
  BulkClient,
  {
    character: string;
    number: number;
    onSubmitDone: (success: boolean | null) => void;
  }
>(function BulkCharacter(
  { character, number, onSubmitDone },
  ref
): JSX.Element {
  const [strokesNumbers, setStrokesNumbers] = React.useState<number[]>(
    Array.from({ length: number }, () => 0)
  );

  // 画数が0でないもののうち画数が違うものがあれば警告
  const isWarning = React.useMemo(
    () =>
      strokesNumbers
        .filter((strokesNumber) => strokesNumber !== 0)
        .some((x, _i, xs) => xs[0] !== x),
    [strokesNumbers]
  );

  const doneCount = React.useMemo(
    () => strokesNumbers.filter((strokesNumber) => strokesNumber !== 0).length,
    [strokesNumbers]
  );

  const bulkCLients = React.useRef<(BulkClient | null)[]>(
    Array.from({ length: number }).map(() => null)
  );

  React.useImperativeHandle(ref, () => ({
    submit: () => {
      for (const client of bulkCLients.current) {
        client!.submit();
      }
    },
  }));

  return (
    <>
      <Tooltip
        title={isWarning ? "書いた文字の中に画数が違うものがあります" : ""}
      >
        <Box sx={{ position: "relative", display: "inline-flex" }}>
          <CircularProgress
            variant="determinate"
            value={(doneCount / number) * 100}
            color={isWarning ? "warning" : "primary"}
            size={52}
          />
          <Box
            sx={{
              top: 0,
              left: 0,
              bottom: 0,
              right: 0,
              position: "absolute",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Typography>{character}</Typography>
          </Box>
        </Box>
      </Tooltip>
      <Box sx={{ display: "flex" }}>
        {Array.from({ length: number }, (_, i) => {
          return (
            <Box key={i} sx={{ m: 1 }}>
              <BulkCanvas
                ref={(client) => {
                  bulkCLients.current[i] = client;
                }}
                onSubmitDone={onSubmitDone}
                character={character}
                onChangeStrokesNumber={(strokesNumber) => {
                  setStrokesNumbers((prev) => {
                    const next = [...prev];
                    next[i] = strokesNumber;
                    return next;
                  });
                }}
              />
            </Box>
          );
        })}
      </Box>
    </>
  );
});

export type ParamsJSON = {
  characters: string[];
  number: number;
};

export default function BulkCreateFigureRecords(): JSX.Element {
  const params = useParams();
  const { characters, number }: ParamsJSON = JSON.parse(
    utf8.fromBase64(params.id!)
  );
  const background = useBackground();

  if (
    characters === null ||
    number === null ||
    !Number.isInteger(number) ||
    characters.length < 1 ||
    100 < characters.length ||
    number < 1 ||
    10 < number
  ) {
    throw Error("invalid query params");
  }

  useBeforeUnload((evt) => {
    evt.returnValue = "このページを離れると入力した内容が失われます。";
  });

  const data = useLazyLoadQuery<BulkCreateFigureRecords_rootQuery>(
    graphql`
      query BulkCreateFigureRecords_rootQuery {
        userConfig {
          allowSharingFigureRecords
        }
      }
    `,
    {},
    { fetchPolicy: "store-and-network" }
  );

  const bulkCLients = React.useRef<(BulkClient | null)[]>(
    Array.from({ length: characters.length }).map(() => null)
  );

  const [allCount, setAllCount] = React.useState(0);
  const [successCount, setSuccessCount] = React.useState(0);
  const [errorCount, setErrorCount] = React.useState(0);
  const [ignoreCount, setIgnoreCount] = React.useState(0);
  const loading = allCount !== successCount + errorCount + ignoreCount;
  const submitCount = allCount - ignoreCount;

  return (
    <div>
      <Typography variant="h6">一括文字登録</Typography>
      {!data.userConfig.allowSharingFigureRecords ? (
        <Alert severity="warning">
          書いた文字の形を他のユーザーと共有することが許可されていないため、ここに登録した文字をフォームの作成者が使うことはできません。
          <Link to="/user-config" state={{ background }}>
            ユーザ設定
          </Link>
          から「書いた文字の形を他のユーザの共有することを許可する」をオンにしてください。
        </Alert>
      ) : null}
      <List>
        {characters.map((character, i) => (
          <ListItem key={i}>
            <BulkCharacter
              character={character}
              number={number}
              onSubmitDone={(success) => {
                if (success === null) {
                  setIgnoreCount((prev) => prev + 1);
                } else if (success) {
                  setSuccessCount((prev) => prev + 1);
                } else {
                  setErrorCount((prev) => prev + 1);
                }
              }}
              ref={(client) => {
                bulkCLients.current[i] = client;
              }}
            />
          </ListItem>
        ))}
      </List>
      <Box sx={{ mb: 3 }}>
        {submitCount > 0 ? (
          <Alert severity={errorCount > 0 ? "error" : "success"}>
            {submitCount}文字中{successCount}文字の登録が完了しました。
            {errorCount > 0 ? `${errorCount}文字の登録に失敗しました。` : null}
          </Alert>
        ) : null}
        <Button
          disabled={loading}
          variant="contained"
          onClick={() => {
            if (loading) {
              return;
            }
            setAllCount(characters.length * number);
            setSuccessCount(0);
            setErrorCount(0);
            setIgnoreCount(0);
            for (const client of bulkCLients.current) {
              client!.submit();
            }
          }}
        >
          送信
        </Button>
      </Box>
    </div>
  );
}

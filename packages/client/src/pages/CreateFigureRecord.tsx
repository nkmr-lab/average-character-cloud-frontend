import {
  graphql,
  useFragment,
  useLazyLoadQuery,
  useMutation,
  useSubscribeToInvalidationState,
} from "react-relay";
import React from "react";
import { Link, useParams } from "react-router-dom";
import { CreateFigureRecord_rootQuery } from "./__generated__/CreateFigureRecord_rootQuery.graphql";
import { CreateFigureRecord_characterConfig$key } from "./__generated__/CreateFigureRecord_characterConfig.graphql";
import { CreateFigureRecord_createFigureRecordMutation } from "./__generated__/CreateFigureRecord_createFigureRecordMutation.graphql";
import Button from "@mui/material/Button";
import { formatError } from "../domains/error";
import { useSnackbar } from "notistack";
import CanvasIframeClient from "../domains/CanvasIframeClient";
import { useBackground } from "../hooks/useBackground";
import {
  Alert,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
} from "@mui/material";
import useCreateCharacterConfig from "../hooks/useCreateCharacterConfig";
import * as utf8 from "../utils/utf8";
import ignoreResult from "../utils/ignoreResult";
import useUpdateCharacterConfig from "../hooks/useUpdateCharacterConfig";

export default function CreateFigureRecord(): JSX.Element {
  const params = useParams();
  const characterValue = utf8.fromBase64(params.character!);
  const [fetchKey, setFetchKey] = React.useState(0);
  const rootData = useLazyLoadQuery<CreateFigureRecord_rootQuery>(
    graphql`
      query CreateFigureRecord_rootQuery($character: CharacterValue!) {
        characters(values: [$character]) {
          id
          value
          characterConfig {
            ...CreateFigureRecord_characterConfig
          }
        }
      }
    `,
    {
      character: characterValue,
    },
    { fetchPolicy: "store-and-network", fetchKey }
  );

  useSubscribeToInvalidationState(
    rootData.characters.map(({ id }) => id),
    () => {
      setFetchKey((prev) => prev + 1);
    }
  );
  const background = useBackground();

  if (rootData.characters.length === 0) {
    throw new Error("character not found");
  }
  const character = rootData.characters[0];

  const characterConfigKey = character.characterConfig;

  const characterConfig = useFragment<CreateFigureRecord_characterConfig$key>(
    graphql`
      fragment CreateFigureRecord_characterConfig on CharacterConfig {
        id
        strokeCount
      }
    `,
    characterConfigKey
  );
  const { enqueueSnackbar } = useSnackbar();

  const canvasIframeId = React.useId();

  const canvasIframeRef = React.useRef<HTMLIFrameElement | null>(null);
  const canvasIframeClientRef = React.useRef<CanvasIframeClient | null>(null);
  React.useEffect(() => {
    if (canvasIframeClientRef.current !== null) {
      return;
    }

    const canvasIframeClient = new CanvasIframeClient(
      canvasIframeId,
      canvasIframeRef.current!
    );
    canvasIframeClientRef.current = canvasIframeClient;
    return () => {
      canvasIframeClient.destroy();
      canvasIframeClientRef.current = null;
    };
  });

  const [createRecordFigure, createRecordFigureLoading] =
    useMutation<CreateFigureRecord_createFigureRecordMutation>(
      graphql`
        mutation CreateFigureRecord_createFigureRecordMutation(
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
  const [createCharacterConfig, _createCharacterConfigLoading] =
    useCreateCharacterConfig();

  const [mismatchedStrokeCountDialog, setMismatchedStrokeCountDialog] =
    React.useState<{
      configStrokeCount: number;
      figureStrokeCount: number;
    } | null>(null);
  const [updateCharacterConfig, updateCharacterConfigLoading] =
    useUpdateCharacterConfig();

  return (
    <div>
      <div>
        {characterConfig !== null ? (
          <div>
            画数{characterConfig.strokeCount}の「
            {character.value}」
            <Button
              component={Link}
              to={`/character-configs/character/${encodeURIComponent(
                utf8.toBase64(character.value)
              )}/update`}
              state={{ background }}
            >
              画数を変更
            </Button>
          </div>
        ) : (
          <Alert
            severity="warning"
            action={
              <Button
                component={Link}
                to={`/character-configs/create?${new URLSearchParams([
                  ["character", character.value],
                ]).toString()}`}
                state={{ background }}
              >
                手動登録
              </Button>
            }
          >
            「{character.value}
            」の画数設定が見つかりませんでした。
            <br />
            このまま続けた場合は、書いた字の画数が自動で設定されます。
          </Alert>
        )}

        <iframe
          title="canvas"
          src={`canvas/index.html?${canvasIframeId}`}
          style={{ width: 256, height: 256, border: "1px solid #ccc" }}
          ref={canvasIframeRef}
        ></iframe>
        <div>
          <Button
            variant="contained"
            onClick={ignoreResult(async () => {
              const strokes: Float32Array[] = (
                await canvasIframeClientRef.current!.send({
                  type: "getStrokes",
                })
              ).strokes;
              if (characterConfig === null) {
                createCharacterConfig({
                  input: {
                    character: character.value,
                    strokeCount: strokes.length,
                  },
                });
              }
              createRecordFigure({
                variables: {
                  input: {
                    figure: JSON.stringify({
                      strokes: strokes.map((stroke) => ({
                        points: Array.from(
                          { length: stroke.length / 3 },
                          (_, i) => ({
                            x: stroke[i * 3],
                            y: stroke[i * 3 + 1],
                            z: stroke[i * 3 + 2] / 10,
                          })
                        ),
                      })),
                      width: 256,
                      height: 256,
                    }),
                    character: character.value,
                  },
                },
                onCompleted: ({ createFigureRecord }) => {
                  if (createFigureRecord.errors === null) {
                    void canvasIframeClientRef.current!.send({
                      type: "clear",
                    });
                    enqueueSnackbar("文字を登録しました", {
                      variant: "success",
                    });
                    if (
                      characterConfig !== null &&
                      strokes.length !== characterConfig.strokeCount
                    ) {
                      setMismatchedStrokeCountDialog({
                        configStrokeCount: characterConfig.strokeCount,
                        figureStrokeCount: strokes.length,
                      });
                    }
                  } else {
                    for (const error of createFigureRecord.errors) {
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
                  if (data.createFigureRecord.figureRecord !== null) {
                    store
                      .get(data.createFigureRecord.figureRecord.character.id)!
                      .invalidateRecord();
                  }
                },
              });
            })}
            disabled={createRecordFigureLoading}
          >
            形状を登録
          </Button>
          <Button
            onClick={() => {
              void canvasIframeClientRef.current!.send({
                type: "clear",
              });
            }}
          >
            クリア
          </Button>
        </div>
      </div>
      {mismatchedStrokeCountDialog !== null && (
        <Dialog
          open
          onClose={() => {
            setMismatchedStrokeCountDialog(null);
          }}
        >
          <DialogContent>
            <DialogContentText>
              この文字の画数は{mismatchedStrokeCountDialog.configStrokeCount}
              と登録されていますが、
              {mismatchedStrokeCountDialog.figureStrokeCount}
              画の文字が書かれました。画数が設定と異なる文字は利用されません。
              {mismatchedStrokeCountDialog.figureStrokeCount}
              画で設定を更新しますか？
            </DialogContentText>
          </DialogContent>
          <DialogActions>
            <Button
              onClick={() => {
                setMismatchedStrokeCountDialog(null);
              }}
            >
              現在の画数設定を維持する
            </Button>
            <Button
              onClick={() => {
                updateCharacterConfig({
                  input: {
                    character: character.value,
                    strokeCount: mismatchedStrokeCountDialog.figureStrokeCount,
                  },
                  onSuccess: () => {
                    setMismatchedStrokeCountDialog(null);
                  },
                });
              }}
              disabled={updateCharacterConfigLoading}
            >
              画数設定を更新する
            </Button>
          </DialogActions>
        </Dialog>
      )}
    </div>
  );
}

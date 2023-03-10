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
            ??????{characterConfig.strokeCount}??????
            {character.value}???
            <Button
              component={Link}
              to={`/character-configs/character/${encodeURIComponent(
                utf8.toBase64(character.value)
              )}/update`}
              state={{ background }}
            >
              ???????????????
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
                ????????????
              </Button>
            }
          >
            ???{character.value}
            ??????????????????????????????????????????????????????
            <br />
            ???????????????????????????????????????????????????????????????????????????????????????
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
                    enqueueSnackbar("???????????????????????????", {
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
            ???????????????
          </Button>
          <Button
            onClick={() => {
              void canvasIframeClientRef.current!.send({
                type: "clear",
              });
            }}
          >
            ?????????
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
              ????????????????????????{mismatchedStrokeCountDialog.configStrokeCount}
              ?????????????????????????????????
              {mismatchedStrokeCountDialog.figureStrokeCount}
              ????????????????????????????????????????????????????????????????????????????????????????????????
              {mismatchedStrokeCountDialog.figureStrokeCount}
              ????????????????????????????????????
            </DialogContentText>
          </DialogContent>
          <DialogActions>
            <Button
              onClick={() => {
                setMismatchedStrokeCountDialog(null);
              }}
            >
              ????????????????????????????????????
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
              ???????????????????????????
            </Button>
          </DialogActions>
        </Dialog>
      )}
    </div>
  );
}

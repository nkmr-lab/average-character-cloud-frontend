import {
  graphql,
  useFragment,
  useLazyLoadQuery,
  useMutation,
  useSubscribeToInvalidationState,
} from "react-relay";
import React from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { CreateFigureRecord_rootQuery } from "./__generated__/CreateFigureRecord_rootQuery.graphql";
import { CreateFigureRecord_characterConfigs$key } from "./__generated__/CreateFigureRecord_characterConfigs.graphql";
import { CreateFigureRecord_createFigureRecordMutation } from "./__generated__/CreateFigureRecord_createFigureRecordMutation.graphql";
import Button from "@mui/material/Button";
import { formatError } from "../domains/error";
import { useSnackbar } from "notistack";
import { useBackground } from "../hooks/useBackground";
import {
  Alert,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
} from "@mui/material";
import useUpdateCharacterConfig from "../hooks/useUpdateCharacterConfig";
import * as utf8 from "../utils/utf8";
import ignoreResult from "../utils/ignoreResult";
import CanvasIframe, { CanvasIframeClient } from "../components/CanvasIframe";
import { FigureJSON } from "../domains/figure_drawer";

function parseCharacter(searchParams: URLSearchParams): string {
  const defaultValue = "あ";
  const character = searchParams.get("character");
  if (character === null) {
    return defaultValue;
  }

  try {
    const value = utf8.fromBase64(character);
    return [...value][0] ?? defaultValue;
  } catch {
    return defaultValue;
  }
}

function parseStrokeCount(searchParams: URLSearchParams): number | undefined {
  const strokeCount = searchParams.get("strokeCount");
  if (strokeCount === null) {
    return undefined;
  }

  const parsed = Number(strokeCount);
  if (!Number.isInteger(parsed) || parsed < 1 || parsed > 1000) {
    return undefined;
  }
  return parsed;
}

export default function CreateFigureRecord(): JSX.Element {
  const [searchParams] = useSearchParams();
  const characterValue = parseCharacter(searchParams);
  const strokeCount = parseStrokeCount(searchParams);
  const [fetchKey, setFetchKey] = React.useState(0);
  const rootData = useLazyLoadQuery<CreateFigureRecord_rootQuery>(
    graphql`
      query CreateFigureRecord_rootQuery($character: CharacterValue!) {
        characters(values: [$character]) {
          id
          value
          characterConfigs {
            ...CreateFigureRecord_characterConfigs
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

  const characterConfigsKey = character.characterConfigs;

  const allCharacterConfigs =
    useFragment<CreateFigureRecord_characterConfigs$key>(
      graphql`
        fragment CreateFigureRecord_characterConfigs on CharacterConfig
        @relay(plural: true) {
          id
          strokeCount
          disabled
        }
      `,
      characterConfigsKey
    );
  const characterConfigs = React.useMemo(
    () =>
      allCharacterConfigs.filter(
        (config) =>
          strokeCount === undefined || config.strokeCount === strokeCount
      ),
    [allCharacterConfigs, strokeCount]
  );
  const { enqueueSnackbar } = useSnackbar();

  const [createFigureRecord, createFigureRecordLoading] =
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

  const [mismatchedStrokeCountDialog, setMismatchedStrokeCountDialog] =
    React.useState<{
      figure: FigureJSON;
    } | null>(null);
  const [updateCharacterConfig, updateCharacterConfigLoading] =
    useUpdateCharacterConfig();

  const canvasIframeClientRef = React.useRef<CanvasIframeClient | null>(null);

  const submit = (figure: FigureJSON) =>
    createFigureRecord({
      variables: {
        input: {
          figure: JSON.stringify(figure),
          character: character.value,
        },
      },
      onCompleted: ({ createFigureRecord }) => {
        if (createFigureRecord.errors === null) {
          void canvasIframeClientRef.current!.clear();
          enqueueSnackbar("文字を登録しました", {
            variant: "success",
          });
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

  return (
    <div>
      <div>
        <div>
          {characterConfigs.length !== 0 ? (
            <>
              画数
              {characterConfigs.map((config) => config.strokeCount).join(", ")}
              の
            </>
          ) : null}
          「{character.value}」を書いてください。
        </div>

        <CanvasIframe canvasIframeClientRef={canvasIframeClientRef} />
        <div>
          <Button
            variant="contained"
            onClick={ignoreResult(async () => {
              const figure =
                await canvasIframeClientRef.current!.getFigureJSON();

              if (
                allCharacterConfigs.some(
                  (config) => config.strokeCount === figure.strokes.length
                )
              ) {
                submit(figure);
              } else {
                setMismatchedStrokeCountDialog({
                  figure,
                });
              }
            })}
            disabled={createFigureRecordLoading}
          >
            形状を登録
          </Button>
          <Button
            onClick={() => {
              void canvasIframeClientRef.current!.clear();
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
              「{character.value}」は
              {mismatchedStrokeCountDialog.figure.strokes.length}
              画であっていますか？
            </DialogContentText>
          </DialogContent>
          <DialogActions>
            <Button
              onClick={() => {
                setMismatchedStrokeCountDialog(null);
                updateCharacterConfig({
                  input: {
                    character: character.value,
                    strokeCount:
                      mismatchedStrokeCountDialog.figure.strokes.length,
                    disabled: false,
                  },
                });
                submit(mismatchedStrokeCountDialog.figure);
              }}
              disabled={updateCharacterConfigLoading}
            >
              はい
            </Button>
            <Button
              onClick={() => {
                setMismatchedStrokeCountDialog(null);
              }}
            >
              いいえ
            </Button>
          </DialogActions>
        </Dialog>
      )}
    </div>
  );
}

import React, { Suspense } from "react";
import {
  TextField,
  CircularProgress,
  Alert,
  Stack,
  Slider,
  Typography,
  Button,
  Grid,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Popover,
  Drawer,
  ToggleButton,
  ToggleButtonGroup,
  Dialog,
  DialogContent,
  Divider,
  DialogTitle,
  Paper,
  IconButton,
  Fade,
  Tooltip,
} from "@mui/material";
import AverageText from "../components/AverageText";
import { ErrorBoundary } from "react-error-boundary";
import { useDebounce } from "react-use";
import XorShift from "../domains/XorShift";
import * as FigureRendererTypes from "../domains/FigureRendererTypes";
import { HexColorPicker } from "react-colorful";

import { Link } from "react-router-dom";
import * as utf8 from "../utils/utf8";
import { useBackground } from "../hooks/useBackground";
import { Box } from "@mui/system";
import {
  atom,
  type RecoilValue,
  useRecoilCallback,
  useRecoilState_TRANSITION_SUPPORT_UNSTABLE,
  useRecoilValue_TRANSITION_SUPPORT_UNSTABLE,
  useRecoilValue,
  constSelector,
  selector,
} from "recoil";
import {
  averageTextStateFamily,
  figureRecordsFetchKeyFamily,
  figureRecordsQueryFamily,
  usingCharactersStateFamily,
} from "../store/averageText";
import {
  graphql,
  useLazyLoadQuery,
  useMutation,
  useSubscribeToInvalidationState,
} from "react-relay";
import { Generate_rootQuery } from "./__generated__/Generate_rootQuery.graphql";
import ListGenerateTemplates from "../components/ListGenerateTemplates";
import * as hexColor from "../utils/hexColor";
import { Generate_createFileMutation } from "./__generated__/Generate_createFileMutation.graphql";
import { Generate_verifyFileMutation } from "./__generated__/Generate_verifyFileMutation.graphql";
import { Generate_createGenerateTemplateMutation } from "./__generated__/Generate_createGenerateTemplateMutation.graphql";
import { Generate_updateGenerateTemplateMutation } from "./__generated__/Generate_updateGenerateTemplateMutation.graphql";
import { useSnackbar } from "notistack";
import { formatError } from "../domains/error";
import Draggable from "react-draggable";
import Chat, { isChatSupported } from "../components/Chat";
import * as icons from "@mui/icons-material";
import { graphQLSelector } from "recoil-relay";
import RelayEnvironment from "../RelayEnvironment";
import {
  Generate_userConfigQuery,
  Generate_userConfigQuery$data,
  Generate_userConfigQuery$variables,
} from "./__generated__/Generate_userConfigQuery.graphql";
import {
  Generate_userConfigMutation,
  Generate_userConfigMutation$variables,
} from "./__generated__/Generate_userConfigMutation.graphql";

const debouncedContentState = atom({
  key: "Generate/debouncedContentState",
  default: "",
});

const seedsState = atom({
  key: "Generate/seedsState",
  default: new Map<number, number>(),
});

const debouncedColorState = atom({
  key: "Generate/debouncedColorState",
  default: "#000000",
});

const debouncedFontSizeState = atom({
  key: "Generate/debouncedFontSizeState",
  default: 48,
});

const debouncedTopState = atom({
  key: "Generate/debouncedTopState",
  default: 5,
});

const debouncedLeftState = atom({
  key: "Generate/debouncedLeftState",
  default: 5,
});

const debouncedLineSpaceState = atom({
  key: "Generate/debouncedLineSpaceState",
  default: 0,
});

const debouncedLetterSpaceState = atom({
  key: "Generate/debouncedLetterSpaceState",
  default: 4,
});

const debouncedWeightState = atom({
  key: "Generate/debouncedWeightState",
  default: 1,
});

const backgroundImageUrlState = atom<string | null>({
  key: "Generate/backgroundImageUrlState",
  default: null,
});

const generateTemplateIdState = atom<string | null>({
  key: "Generate/generateTemplateIdState",
  default: null,
});

export const debouncedSharedProportionState = graphQLSelector({
  key: "Generate/debouncedSharedProportionState",
  environment: RelayEnvironment,
  query: graphql`
    query Generate_userConfigQuery {
      userConfig {
        sharedProportion
      }
    }
  `,
  variables: (): Generate_userConfigQuery$variables => ({}),
  mapResponse: (data: Generate_userConfigQuery$data) =>
    data.userConfig.sharedProportion / 100,
  mutations: {
    mutation: graphql`
      mutation Generate_userConfigMutation($input: UpdateUserConfigInput!) {
        updateUserConfig(input: $input) {
          userConfig {
            ...UserConfig_userConfig
            ...App_userConfig
          }
        }
      }
    `,
    variables: (
      sharedProportion: number
    ): Generate_userConfigMutation$variables => ({
      input: {
        sharedProportion: Math.round(sharedProportion * 100),
      },
    }),
  },
});

const enableUseSharedFigureRecordsState = selector<boolean>({
  key: "Generate/enableUseSharedFigureRecordsState",
  get: ({ get }) => {
    const debouncedSharedProportion = get(debouncedSharedProportionState);
    return debouncedSharedProportion > 0;
  },
});

const backgroundImageState = selector<{
  url: string;
  width: number;
  height: number;
  image: HTMLImageElement;
} | null>({
  key: "Generate/backgroundImageState",
  get: ({ get }) => {
    const backgroundImageUrl = get(backgroundImageUrlState);
    if (backgroundImageUrl === null) {
      return null;
    }

    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        const maxWidth = 1024;
        const maxHeight = 1024;
        const ratio = img.width / img.height;
        let width = img.width;
        let height = img.height;
        if (width > maxWidth) {
          width = maxWidth;
          height = width / ratio;
        }
        if (height > maxHeight) {
          height = maxHeight;
          width = height * ratio;
        }

        resolve({
          url: backgroundImageUrl,
          width,
          height,
          image: img,
        });
      };
      img.onerror = (error) => {
        reject(error);
      };
      img.crossOrigin = "anonymous";
      img.src = backgroundImageUrl;
    });
  },
});

const modeState = atom<"horizontal" | "vertical">({
  key: "Generate/modeState",
  default: "horizontal",
});

export default function Generate(): JSX.Element {
  const { userConfig } = useLazyLoadQuery<Generate_rootQuery>(
    graphql`
      query Generate_rootQuery {
        userConfig {
          randomLevel
          sharedProportion
        }
      }
    `,
    {},
    { fetchPolicy: "store-and-network" }
  );

  const [createFile, _createFileLoading] =
    useMutation<Generate_createFileMutation>(
      graphql`
        mutation Generate_createFileMutation($input: CreateFileInput!) {
          createFile(input: $input) {
            file {
              fileId
              uploadUrl
            }
            errors {
              message
            }
          }
        }
      `
    );

  const [verifyFile, _verifyFileLoading] =
    useMutation<Generate_verifyFileMutation>(
      graphql`
        mutation Generate_verifyFileMutation($input: VerifyFileInput!) {
          verifyFile(input: $input) {
            file {
              __typename
            }
            errors {
              message
            }
          }
        }
      `
    );

  const [createGenerateTemplate, _createGenerateTemplateLoading] =
    useMutation<Generate_createGenerateTemplateMutation>(
      graphql`
        mutation Generate_createGenerateTemplateMutation(
          $input: CreateGenerateTemplateInput!
        ) {
          createGenerateTemplate(input: $input) {
            generateTemplate {
              __typename
              generateTemplateId
            }
            errors {
              message
            }
          }
        }
      `
    );

  const [updateGenerateTemplate, _updateGenerateTemplateLoading] =
    useMutation<Generate_updateGenerateTemplateMutation>(
      graphql`
        mutation Generate_updateGenerateTemplateMutation(
          $input: UpdateGenerateTemplateInput!
        ) {
          updateGenerateTemplate(input: $input) {
            generateTemplate {
              __typename
            }
            errors {
              message
            }
          }
        }
      `
    );

  const randomLevelState = constSelector(userConfig.randomLevel / 100);

  const [isPending, startTransition] = React.useTransition();
  const [debouncedContent, setDebouncedContent] =
    useRecoilState_TRANSITION_SUPPORT_UNSTABLE(debouncedContentState);
  const [content, setContent] = React.useState<string>(debouncedContent);
  const [isReadyContent] = useDebounce(
    () => {
      startTransition(() => {
        setDebouncedContent(content);
      });
    },
    500,
    [content]
  );

  const [debouncedColor, setDebouncedColor] =
    useRecoilState_TRANSITION_SUPPORT_UNSTABLE(debouncedColorState);
  const [color, setColor] = React.useState(debouncedColor);

  const [isReadyColor] = useDebounce(
    () => {
      startTransition(() => {
        setDebouncedColor(color);
      });
    },
    500,
    [color]
  );

  const [debouncedFontSize, setDebouncedFontSize] =
    useRecoilState_TRANSITION_SUPPORT_UNSTABLE(debouncedFontSizeState);
  const [fontSize, setFontSize] = React.useState(debouncedFontSize);
  const [isReadyFontSize] = useDebounce(
    () => {
      startTransition(() => {
        setDebouncedFontSize(fontSize);
      });
    },
    500,
    [fontSize]
  );

  const [debouncedLeft, setDebouncedLeft] =
    useRecoilState_TRANSITION_SUPPORT_UNSTABLE(debouncedLeftState);
  const [left, setLeft] = React.useState(debouncedLeft);
  const [isReadyLeft] = useDebounce(
    () => {
      startTransition(() => {
        setDebouncedLeft(left);
      });
    },
    500,
    [left]
  );

  // changingFontSize || debouncedChangingFontSizeを使用することでスライダーから手を離してから1秒間は矢印を表示させる
  const [changingFontSize, setChangingFontSize] = React.useState(false);
  const [debouncedChangingFontSize, setDebouncedChangingFontSize] =
    React.useState(changingFontSize);
  useDebounce(
    () => {
      setDebouncedChangingFontSize(changingFontSize);
    },
    1000,
    [changingFontSize]
  );

  const [changingLeft, setChangingLeft] = React.useState(false);
  const [debouncedChangingLeft, setDebouncedChangingLeft] =
    React.useState(changingLeft);
  useDebounce(
    () => {
      setDebouncedChangingLeft(changingLeft);
    },
    1000,
    [changingLeft]
  );
  const [changingTop, setChangingTop] = React.useState(false);
  const [debouncedChangingTop, setDebouncedChangingTop] =
    React.useState(changingTop);
  useDebounce(
    () => {
      setDebouncedChangingTop(changingTop);
    },
    1000,
    [changingTop]
  );
  const [changingLineSpace, setChangingLineSpace] = React.useState(false);
  const [debouncedChangingLineSpace, setDebouncedChangingLineSpace] =
    React.useState(changingLineSpace);
  useDebounce(
    () => {
      setDebouncedChangingLineSpace(changingLineSpace);
    },
    1000,
    [changingLineSpace]
  );
  const [changingLetterSpace, setChangingLetterSpace] = React.useState(false);
  const [debouncedChangingLetterSpace, setDebouncedChangingLetterSpace] =
    React.useState(changingLetterSpace);
  useDebounce(
    () => {
      setDebouncedChangingLetterSpace(changingLetterSpace);
    },
    1000,
    [changingLetterSpace]
  );

  const [isOpenChat, setIsOpenChat] = React.useState(false);

  const [openGenerateTemplates, setOpenGenerateTemplates] =
    React.useState(false);

  const [debouncedTop, setDebouncedTop] =
    useRecoilState_TRANSITION_SUPPORT_UNSTABLE(debouncedTopState);

  const [top, setTop] = React.useState(debouncedTop);
  const [isReadyTop] = useDebounce(
    () => {
      startTransition(() => {
        setDebouncedTop(top);
      });
    },
    500,
    [top]
  );

  const [debouncedLineSpace, setDebouncedLineSpace] =
    useRecoilState_TRANSITION_SUPPORT_UNSTABLE(debouncedLineSpaceState);
  const [lineSpace, setLineSpace] = React.useState(debouncedLineSpace);
  const [isReadyLineSpace] = useDebounce(
    () => {
      startTransition(() => {
        setDebouncedLineSpace(lineSpace);
      });
    },
    500,
    [lineSpace]
  );

  const [debouncedLetterSpace, setDebouncedLetterSpace] =
    useRecoilState_TRANSITION_SUPPORT_UNSTABLE(debouncedLetterSpaceState);
  const [letterSpace, setLetterSpace] = React.useState(debouncedLetterSpace);

  const [isReadyLetterSpace] = useDebounce(
    () => {
      startTransition(() => {
        setDebouncedLetterSpace(letterSpace);
      });
    },
    500,
    [letterSpace]
  );

  const [debouncedWeight, setDebouncedWeight] =
    useRecoilState_TRANSITION_SUPPORT_UNSTABLE(debouncedWeightState);
  const [weight, setWeight] = React.useState(debouncedWeight);
  const [isReadyWeight] = useDebounce(
    () => {
      startTransition(() => {
        setDebouncedWeight(weight);
      });
    },
    500,
    [weight]
  );

  const [debouncedSharedProportion, setDebouncedSharedProportion] =
    useRecoilState_TRANSITION_SUPPORT_UNSTABLE(debouncedSharedProportionState);
  const [sharedProportion, setSharedProportion] = React.useState(
    debouncedSharedProportion
  );
  const [isReadySharedProportion] = useDebounce(
    () => {
      startTransition(() => {
        setDebouncedSharedProportion(sharedProportion);
      });
    },
    500,
    [sharedProportion]
  );

  const [backgroundImageUrl, setBackgroundImageUrl] =
    useRecoilState_TRANSITION_SUPPORT_UNSTABLE(backgroundImageUrlState);

  const [generateTemplateId, setGenerateTemplateId] =
    useRecoilState_TRANSITION_SUPPORT_UNSTABLE(generateTemplateIdState);

  const [mode, setMode] = useRecoilState_TRANSITION_SUPPORT_UNSTABLE(modeState);

  const isReady =
    isReadyContent() &&
    isReadyColor() &&
    isReadyFontSize() &&
    isReadyLeft() &&
    isReadyTop() &&
    isReadyLineSpace() &&
    isReadyLetterSpace() &&
    isReadyWeight() &&
    isReadySharedProportion();
  const [_seeds, setSeeds] =
    // setだけ返ってくるtransiton対応のhookがない
    useRecoilState_TRANSITION_SUPPORT_UNSTABLE(seedsState);

  const inputFileId = React.useId();
  const [colorPickerAnchorEl, setColorPickerAnchorEl] =
    React.useState<HTMLElement | null>(null);

  const averageTextState = averageTextStateFamily({
    contentState: debouncedContentState,
    randomLevelState,
    seedsState: seedsState,
    sharedProportionState: debouncedSharedProportionState,
    enableUseSharedFigureRecordsState,
    colorState: debouncedColorState,
    fontSizeState: debouncedFontSizeState,
    topState: debouncedTopState,
    leftState: debouncedLeftState,
    lineSpaceState: debouncedLineSpaceState,
    letterSpaceState: debouncedLetterSpaceState,
    backgroundImageState: backgroundImageState,
    weightState: debouncedWeightState,
    modeState,
  });

  const handleDownload = useRecoilCallback(
    ({ snapshot }) =>
      async () => {
        const averageText = await snapshot.getPromise(averageTextState);
        const a = document.createElement("a");
        a.href = await FigureRendererTypes.textToImageUrl(averageText);
        a.download = "figure.png";
        a.click();
      },
    []
  );

  const usingCharactersState = usingCharactersStateFamily({
    contentState: debouncedContentState,
    enableUseSharedFigureRecordsState: enableUseSharedFigureRecordsState,
  });

  const topText = `${mode === "horizontal" ? "上" : "右"}の余白`;
  const leftText = `${mode === "horizontal" ? "左" : "上"}の余白`;

  const { enqueueSnackbar } = useSnackbar();
  const selectedBackgroundImageFile = React.useRef<File | null>(null);

  const dragNodeRef = React.useRef<HTMLDivElement>(null);

  return (
    <div>
      <Stack spacing={2}>
        <Suspense>
          <SubscribeToInvalidationCharacters
            enableUseSharedFigureRecordsState={
              enableUseSharedFigureRecordsState
            }
            startTransition={startTransition}
          />
        </Suspense>
        <TextField
          fullWidth
          multiline
          value={content}
          label="生成したい文章を入力してください"
          onChange={(e) => {
            setContent(e.target.value);
          }}
        />
        <ErrorBoundary
          fallbackRender={() => {
            return <Alert severity="error">生成に失敗しました</Alert>;
          }}
        >
          <Suspense fallback={<CircularProgress />}>
            <div
              style={{
                contain: "content",
              }}
            >
              <AverageText
                averageTextState={averageTextState}
                updateSeed={(index) => {
                  startTransition(() => {
                    const seed = XorShift.randomSeed();
                    setSeeds((seeds) => {
                      const newSeeds = new Map(seeds);
                      newSeeds.set(index, seed);
                      return newSeeds;
                    });
                  });
                }}
                fontSize={fontSize}
                left={left}
                top={top}
                lineSpace={lineSpace}
                letterSpace={letterSpace}
                showTopArrow={changingTop || debouncedChangingTop}
                showLeftArrow={changingLeft || debouncedChangingLeft}
                showFontSizeArrow={
                  changingFontSize || debouncedChangingFontSize
                }
                showLetterSpaceArrow={
                  changingLetterSpace || debouncedChangingLetterSpace
                }
                showLineSpaceArrow={
                  changingLineSpace || debouncedChangingLineSpace
                }
                mode={mode}
              />

              {(!isReady || isPending) && (
                <CircularProgress
                  style={{ position: "absolute", top: 4, right: 4 }}
                  size={16}
                />
              )}
            </div>
          </Suspense>
        </ErrorBoundary>
        <Button
          variant="contained"
          disabled={!isReady || isPending}
          onClick={handleDownload}
        >
          画像としてダウンロード
        </Button>
        <Grid
          container
          spacing={1}
          columns={{ xs: 4, sm: 8, md: 12 }}
          style={{ width: "100%" }}
          alignItems="center"
        >
          <Grid item xs={2}>
            <Typography>文字サイズ: {fontSize}px</Typography>
            <Slider
              min={1}
              max={256}
              step={1}
              value={fontSize}
              onChange={(_e, value) => {
                setChangingFontSize(true);
                setFontSize(value as number);
              }}
              onChangeCommitted={() => {
                setChangingFontSize(false);
              }}
            ></Slider>
          </Grid>
          <Grid item xs={2}>
            <Typography>文字間: {letterSpace}px</Typography>
            <Slider
              min={-64}
              max={64}
              step={1}
              value={letterSpace}
              onChange={(_e, value) => {
                setLetterSpace(value as number);
                setChangingLetterSpace(true);
              }}
              onChangeCommitted={() => {
                setChangingLetterSpace(false);
              }}
            ></Slider>
          </Grid>
          <Grid item xs={2}>
            <Typography>行間: {lineSpace}px</Typography>
            <Slider
              min={-64}
              max={64}
              step={1}
              value={lineSpace}
              onChange={(_e, value) => {
                setLineSpace(value as number);
                setChangingLineSpace(true);
              }}
              onChangeCommitted={() => {
                setChangingLineSpace(false);
              }}
            ></Slider>
          </Grid>
          <Grid item xs={2}>
            <Typography>
              {topText}: {top}px
            </Typography>
            <Slider
              min={-256}
              max={256}
              step={1}
              value={top}
              onChange={(_e, value) => {
                setTop(value as number);
                setChangingTop(true);
              }}
              onChangeCommitted={() => {
                setChangingTop(false);
              }}
            ></Slider>
          </Grid>
          <Grid item xs={2}>
            <Typography>
              {leftText}: {left}px
            </Typography>
            <Slider
              min={-256}
              max={256}
              step={1}
              value={left}
              onChange={(_e, value) => {
                setLeft(value as number);
                setChangingLeft(true);
              }}
              onChangeCommitted={() => {
                setChangingLeft(false);
              }}
            ></Slider>
          </Grid>

          <Grid item xs={2}>
            <Typography>字の太さ: {weight.toFixed(1)}</Typography>
            <Slider
              min={0.1}
              max={10}
              step={0.1}
              value={weight}
              onChange={(_e, value) => {
                setWeight(value as number);
              }}
            ></Slider>
          </Grid>
          <Grid item xs={2}>
            <label htmlFor={inputFileId}>
              <input
                accept="image/png,image/jpeg,image/webp,image/gif"
                hidden
                id={inputFileId}
                type="file"
                onChange={(evt) => {
                  const files = evt.target.files;
                  if (files === null || files.length === 0) {
                    return;
                  }
                  const file = files[0];
                  selectedBackgroundImageFile.current = file;
                  const blobUrl = URL.createObjectURL(file);
                  startTransition(() => {
                    const prevBlobUrl = backgroundImageUrl;
                    setBackgroundImageUrl(blobUrl);
                    setGenerateTemplateId(null);
                    if (prevBlobUrl !== null) {
                      URL.revokeObjectURL(prevBlobUrl);
                    }
                  });
                }}
              />
              <Button variant="outlined" component="span" fullWidth>
                背景画像:
                <span
                  style={{
                    marginLeft: 4,
                  }}
                >
                  {backgroundImageUrl !== null ? (
                    <img
                      style={{
                        display: "inline-block",
                        borderRadius: 2,
                        verticalAlign: "middle",
                        border: "1px solid #333",
                      }}
                      src={backgroundImageUrl}
                      width={16}
                      height={16}
                    />
                  ) : (
                    "なし"
                  )}
                </span>
              </Button>
            </label>
          </Grid>
          <Grid item xs={2}>
            <Button
              variant="outlined"
              onClick={(evt) => {
                setColorPickerAnchorEl(evt.currentTarget);
              }}
              fullWidth
            >
              文字色:
              <span
                style={{
                  backgroundColor: color,
                  width: 16,
                  height: 16,
                  display: "inline-block",
                  borderRadius: 8,
                  marginLeft: 4,
                  border: "1px solid #333",
                }}
              />
            </Button>
            <Popover
              anchorEl={colorPickerAnchorEl}
              open={Boolean(colorPickerAnchorEl)}
              onClose={() => {
                setColorPickerAnchorEl(null);
              }}
              anchorOrigin={{
                vertical: "bottom",
                horizontal: "left",
              }}
            >
              <HexColorPicker color={color} onChange={setColor} />
            </Popover>
          </Grid>
          <Grid item xs={2}>
            <ToggleButtonGroup
              value={mode}
              exclusive
              onChange={(_evt, newMode) => {
                if (newMode === null) {
                  return;
                }
                startTransition(() => {
                  setMode(newMode);
                });
              }}
              fullWidth
            >
              <ToggleButton value="horizontal">横書き</ToggleButton>
              <ToggleButton value="vertical">縦書き</ToggleButton>
            </ToggleButtonGroup>
          </Grid>
          <Grid item xs={2}>
            <Typography>
              他人の字の割合: {(sharedProportion * 100).toFixed(0)}%
              <Tooltip title="他人が書いた字をどのくらいの割合で混ぜるかを指定できます。大きいほど自分の字らしさが消えますが字の形のバリエーションが増えます。">
                <icons.HelpOutline
                  style={{
                    fontSize: 18,
                    verticalAlign: "middle",
                    marginLeft: 4,
                  }}
                />
              </Tooltip>
            </Typography>

            <Slider
              min={0}
              max={1.0}
              step={0.01}
              value={sharedProportion}
              onChange={(_e, value) => {
                setSharedProportion(value as number);
              }}
            ></Slider>
          </Grid>
          <Grid item xs={12}>
            <Divider></Divider>
          </Grid>
          <Grid item xs={2}>
            <Button
              variant="outlined"
              fullWidth
              onClick={() => {
                setOpenGenerateTemplates(true);
              }}
            >
              テンプレート一覧
            </Button>
          </Grid>
          <Grid item xs={2}>
            <Button
              variant="outlined"
              fullWidth
              disabled={backgroundImageUrl === null}
              onClick={() => {
                if (backgroundImageUrl === null) {
                  return;
                }

                if (generateTemplateId === null) {
                  const file = selectedBackgroundImageFile.current;
                  if (file === null) {
                    // unreachable
                    enqueueSnackbar("アップロードに失敗しました", {
                      variant: "error",
                    });
                    return;
                  }
                  void (async () => {
                    try {
                      const { fileId, uploadUrl } = await new Promise<{
                        fileId: string;
                        uploadUrl: string;
                      }>((resolve, reject) => {
                        createFile({
                          variables: {
                            input: {
                              size: file.size,
                              mimeType: file.type,
                            },
                          },
                          onCompleted: ({ createFile }) => {
                            if (createFile.file && !createFile.errors) {
                              resolve(createFile.file);
                            } else {
                              for (const error of createFile.errors ?? []) {
                                enqueueSnackbar(error.message, {
                                  variant: "error",
                                });
                              }
                              reject(new Error());
                            }
                          },
                          onError: (error) => {
                            enqueueSnackbar(formatError(error), {
                              variant: "error",
                            });
                            reject(error);
                          },
                        });
                      });

                      const response = await fetch(uploadUrl, {
                        method: "PUT",
                        body: file,
                      });

                      if (!response.ok) {
                        enqueueSnackbar("アップロードに失敗しました", {
                          variant: "error",
                        });
                        return;
                      }

                      await new Promise<void>((resolve, reject) => {
                        verifyFile({
                          variables: {
                            input: {
                              id: fileId,
                            },
                          },
                          onCompleted: ({ verifyFile }) => {
                            if (verifyFile.file !== null) {
                              resolve();
                            } else {
                              enqueueSnackbar("アップロードに失敗しました", {
                                variant: "error",
                              });
                              reject(new Error());
                            }
                          },
                          onError: (error) => {
                            enqueueSnackbar(formatError(error), {
                              variant: "error",
                            });
                            reject(error);
                          },
                        });
                      });

                      createGenerateTemplate({
                        variables: {
                          input: {
                            backgroundImageFileId: fileId,
                            fontColor: hexColor.hexToNumber(color),
                            fontSize,
                            fontWeight: (weight * 10) | 0,
                            letterSpacing: letterSpace,
                            lineSpacing: lineSpace,
                            marginBlockStart: top,
                            marginInlineStart: left,
                            writingMode:
                              mode === "horizontal" ? "HORIZONTAL" : "VERTICAL",
                          },
                        },
                        onCompleted: ({ createGenerateTemplate }) => {
                          if (createGenerateTemplate.generateTemplate) {
                            enqueueSnackbar("テンプレートを保存しました", {
                              variant: "success",
                            });
                            setGenerateTemplateId(
                              createGenerateTemplate.generateTemplate
                                .generateTemplateId
                            );
                          } else {
                            for (const error of createGenerateTemplate.errors ??
                              []) {
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
                      });
                    } catch {
                      // eslint-disable-next-line no-empty
                    }
                  })();
                } else {
                  updateGenerateTemplate({
                    variables: {
                      input: {
                        generateTemplateId,
                        fontColor: hexColor.hexToNumber(color),
                        fontSize,
                        fontWeight: (weight * 10) | 0,
                        letterSpacing: letterSpace,
                        lineSpacing: lineSpace,
                        marginBlockStart: top,
                        marginInlineStart: left,
                        writingMode:
                          mode === "horizontal" ? "HORIZONTAL" : "VERTICAL",
                      },
                    },
                    onCompleted: ({ updateGenerateTemplate }) => {
                      if (!updateGenerateTemplate.errors) {
                        enqueueSnackbar("テンプレートを更新しました", {
                          variant: "success",
                        });
                      } else {
                        for (const error of updateGenerateTemplate.errors) {
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
                  });
                }
              }}
            >
              {generateTemplateId !== null
                ? "テンプレートを更新"
                : "テンプレートとして保存"}
            </Button>
          </Grid>
          {isChatSupported && (
            <>
              <Grid item xs={12}>
                <Divider></Divider>
              </Grid>
              <Grid item xs={2}>
                <Button
                  variant="outlined"
                  fullWidth
                  onClick={() => {
                    setIsOpenChat(true);
                  }}
                >
                  音声操作を利用する(alpha)
                </Button>
              </Grid>
            </>
          )}
        </Grid>
        <Box>
          <Typography variant="h6">使っている文字</Typography>
          <Suspense fallback={<CircularProgress />}>
            <UsingCharacters usingCharactersState={usingCharactersState} />
          </Suspense>
        </Box>
      </Stack>
      <Dialog
        open={openGenerateTemplates}
        onClose={() => {
          setOpenGenerateTemplates(false);
        }}
      >
        <DialogContent>
          <Suspense fallback={<CircularProgress />}>
            <ListGenerateTemplates
              onClick={(generateTemplate) => {
                startTransition(() => {
                  setBackgroundImageUrl(generateTemplate.backgroundImage.url);
                  setGenerateTemplateId(generateTemplate.id);
                  setColor(hexColor.numberToHex(generateTemplate.fontColor));
                  setFontSize(generateTemplate.fontSize);
                  setTop(generateTemplate.marginBlockStart);
                  setLeft(generateTemplate.marginInlineStart);
                  setLineSpace(generateTemplate.lineSpacing);
                  setLetterSpace(generateTemplate.letterSpacing);
                  setWeight(generateTemplate.fontWeight / 10);
                  setMode(generateTemplate.writingMode);
                });
                setOpenGenerateTemplates(false);
              }}
              onDelete={(deletedId) => {
                if (generateTemplateId === deletedId) {
                  startTransition(() => {
                    setGenerateTemplateId(null);
                  });
                }
              }}
            ></ListGenerateTemplates>
          </Suspense>
        </DialogContent>
      </Dialog>
      <Draggable
        nodeRef={dragNodeRef}
        handle="#generate-page-draggable-dialog-title"
        cancel={'[class*="MuiDialogContent-root"]'}
      >
        <Fade in={isOpenChat}>
          <Paper
            ref={dragNodeRef}
            style={{
              position: "fixed",
              top: 20,
              left: 20,
              width: "100%",
              maxWidth: 600,
              zIndex: 1300,
              backgroundColor: "#eee",
            }}
          >
            <DialogTitle
              style={{ cursor: "move" }}
              id="generate-page-draggable-dialog-title"
            >
              音声操作
            </DialogTitle>
            <IconButton
              onClick={() => {
                setIsOpenChat(false);
              }}
              sx={(theme) => ({
                position: "absolute",
                right: 8,
                top: 8,
                color: theme.palette.grey[500],
              })}
            >
              <icons.Close />
            </IconButton>
            <DialogContent>
              {isChatSupported && (
                <Chat
                  onCommand={(command) => {
                    switch (command.type) {
                      case "increaseFontSize":
                        setFontSize((size) => Math.min(size + 5, 256));
                        break;
                      case "decreaseFontSize":
                        setFontSize((size) => Math.max(size - 5, 1));
                        break;
                      case "increaseLineSpacing":
                        setLineSpace((space) => Math.min(space + 2, 64));
                        break;
                      case "decreaseLineSpacing":
                        setLineSpace((space) => Math.max(space - 2, -64));
                        break;
                      case "increaseLetterSpacing":
                        setLetterSpace((space) => Math.min(space + 2, 64));
                        break;
                      case "decreaseLetterSpacing":
                        setLetterSpace((space) => Math.max(space - 2, -64));
                        break;
                      case "increaseFontWeight":
                        setWeight((weight) => Math.min(weight + 0.5, 10));
                        break;
                      case "decreaseFontWeight":
                        setWeight((weight) => Math.max(weight - 0.5, 0.1));
                        break;
                      case "setVerticalWriting":
                        setMode("vertical");
                        break;
                      case "setHorizontalWriting":
                        setMode("horizontal");
                        break;
                      case "makeUp":
                        if (mode === "horizontal") {
                          setTop((top) => Math.max(top - 10, -256));
                        } else {
                          setLeft((left) => Math.max(left - 10, -256));
                        }
                        break;
                      case "makeDown":
                        if (mode === "horizontal") {
                          setTop((top) => Math.min(top + 10, 256));
                        } else {
                          setLeft((left) => Math.min(left + 10, 256));
                        }
                        break;
                      case "makeLeft":
                        if (mode === "horizontal") {
                          setLeft((left) => Math.max(left - 10, -256));
                        } else {
                          setTop((top) => Math.min(top + 10, 256));
                        }
                        break;
                      case "makeRight":
                        if (mode === "horizontal") {
                          setLeft((left) => Math.min(left + 10, 256));
                        } else {
                          setTop((top) => Math.max(top - 10, -256));
                        }
                        break;
                      case "content":
                        setContent(command.content);
                        break;
                    }
                  }}
                />
              )}
            </DialogContent>
          </Paper>
        </Fade>
      </Draggable>
    </div>
  );
}

function UsingCharacters({
  usingCharactersState,
}: {
  usingCharactersState: RecoilValue<
    {
      value: string;
      count: number;
    }[]
  >;
}) {
  const usingCharacters =
    useRecoilValue_TRANSITION_SUPPORT_UNSTABLE(usingCharactersState);
  const background = useBackground();

  return (
    <List>
      {usingCharacters.map(({ value, count }) => (
        <ListItem
          key={value}
          sx={{
            backgroundColor: count === 0 ? "#ffcccc" : undefined,
          }}
          divider={true}
        >
          <ListItemButton
            component={Link}
            to={`/figure-records/create/i/${utf8.toBase64(value)}`}
            state={{ background }}
          >
            <ListItemText> 「{value}」の形状を追加する</ListItemText>
            <ListItemText>(平均化に使われた数: {count}件)</ListItemText>
          </ListItemButton>
        </ListItem>
      ))}
    </List>
  );
}

function SubscribeToInvalidationCharacters({
  startTransition,
  enableUseSharedFigureRecordsState,
}: {
  startTransition: (callback: () => void) => void;
  enableUseSharedFigureRecordsState: RecoilValue<boolean>;
}) {
  const figureRecordsQuery = figureRecordsQueryFamily({
    contentState: debouncedContentState,
    enableUseSharedFigureRecordsState,
  });
  const figureRecords = useRecoilValue(figureRecordsQuery);
  const [_figureRecordsFetchKey, setFigureRecordsFetchKey] =
    useRecoilState_TRANSITION_SUPPORT_UNSTABLE(
      figureRecordsFetchKeyFamily({
        contentState: debouncedContentState,
        enableUseSharedFigureRecordsState,
      })
    );

  useSubscribeToInvalidationState(
    figureRecords.characters.map(({ id }) => id),
    () => {
      startTransition(() => {
        setFigureRecordsFetchKey((key) => key + 1);
      });
    }
  );
  return null;
}

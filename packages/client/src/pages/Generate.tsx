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
  Tooltip,
  ToggleButton,
  ToggleButtonGroup,
} from "@mui/material";
import AverageText from "../components/AverageText";
import { ErrorBoundary } from "react-error-boundary";
import { useDebounce } from "react-use";
import XorShift from "../domains/XorShift";
import * as icons from "@mui/icons-material";
import * as FigureRendererTypes from "../domains/FigureRendererTypes";
import { HexColorPicker } from "react-colorful";

import { Link } from "react-router-dom";
import * as utf8 from "../utils/utf8";
import { useBackground } from "../hooks/useBackground";
import { Box } from "@mui/system";
import {
  atom,
  type RecoilValue,
  selector,
  useRecoilCallback,
  useRecoilState_TRANSITION_SUPPORT_UNSTABLE,
  useRecoilValue_TRANSITION_SUPPORT_UNSTABLE,
  useRecoilValue,
} from "recoil";
import {
  averageTextStateFamily,
  figureRecordsFetchKeyFamily,
  figureRecordsQueryFamily,
  usingCharactersStateFamily,
} from "../store/averageText";
import { useSubscribeToInvalidationState } from "react-relay";

const debouncedContentState = atom({
  key: "Generate/debouncedContentState",
  default: "",
});

const debouncedRandomLevelState = atom({
  key: "Generate/debouncedRandomLevelState",
  default: 0.5,
});

const seedsState = atom({
  key: "Generate/seedsState",
  default: new Map<number, number>(),
});

const debouncedSharedProportionState = atom({
  key: "Generate/debouncedSharedProportionState",
  default: 0.5,
});

const enableUseSharedFigureRecordsState = selector({
  key: "Generate/enableUseSharedFigureRecordsState",
  get: ({ get }) => {
    const sharedProportion = get(debouncedSharedProportionState);
    return sharedProportion > 0;
  },
});

const debouncedColorState = atom({
  key: "Generate/debouncedColorState",
  default: "#000000",
});

const debouncedFontSizeState = atom({
  key: "Generate/debouncedFontSizeState",
  default: 32,
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

const backgroundImageState = atom<{
  url: string;
  width: number;
  height: number;
} | null>({
  key: "Generate/backgroundImageState",
  default: null,
});

const modeState = atom<"horizontal" | "vertical">({
  key: "Generate/modeState",
  default: "horizontal",
});

export default function Generate(): JSX.Element {
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
  const [isOpenFontSize, setIsOpenFontSize] = React.useState(false);

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
  const [isOpenLeft, setIsOpenLeft] = React.useState(false);

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
  const [isOpenTop, setIsOpenTop] = React.useState(false);

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
  const [isOpenLineSpace, setIsOpenLineSpace] = React.useState(false);

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
  const [isOpenLetterSpace, setIsOpenLetterSpace] = React.useState(false);

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

  const [backgroundImage, setBackgroundImage] =
    useRecoilState_TRANSITION_SUPPORT_UNSTABLE(backgroundImageState);

  const [mode, setMode] = useRecoilState_TRANSITION_SUPPORT_UNSTABLE(modeState);

  const isReady =
    isReadyContent() &&
    isReadyRandomLevel() &&
    isReadySharedProportion() &&
    isReadyColor() &&
    isReadyFontSize() &&
    isReadyLeft() &&
    isReadyTop() &&
    isReadyLineSpace() &&
    isReadyLetterSpace() &&
    isReadyWeight();
  const [_seeds, setSeeds] =
    // setだけ返ってくるtransiton対応のhookがない
    useRecoilState_TRANSITION_SUPPORT_UNSTABLE(seedsState);

  const inputFileId = React.useId();
  const [colorPickerAnchorEl, setColorPickerAnchorEl] =
    React.useState<HTMLElement | null>(null);

  const averageTextState = averageTextStateFamily({
    contentState: debouncedContentState,
    randomLevelState: debouncedRandomLevelState,
    seedsState: seedsState,
    sharedProportionState: debouncedSharedProportionState,
    enableUseSharedFigureRecordsState: enableUseSharedFigureRecordsState,
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

  return (
    <div>
      <Stack spacing={2}>
        <Suspense>
          <SubscribeToInvalidationCharacters
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
                fontSize={debouncedFontSize}
                left={debouncedLeft}
                top={debouncedTop}
                lineSpace={debouncedLineSpace}
                letterSpace={debouncedLetterSpace}
                showTopArrow={isOpenTop}
                showLeftArrow={isOpenLeft}
                showFontSizeArrow={isOpenFontSize}
                showLetterSpaceArrow={isOpenLetterSpace}
                showLineSpaceArrow={isOpenLineSpace}
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
        >
          <Grid item xs={2}>
            <div>
              <label htmlFor={inputFileId}>
                <input
                  accept="image/*"
                  hidden
                  id={inputFileId}
                  multiple
                  type="file"
                  onChange={(evt) => {
                    const files = evt.target.files;
                    if (files === null || files.length === 0) {
                      return;
                    }
                    const file = files[0];
                    const blobUrl = URL.createObjectURL(file);
                    const img = new Image();
                    img.onload = () => {
                      const maxWidth = 1000;
                      const maxHeight = 1000;
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
                      startTransition(() => {
                        const prevBlobUrl = backgroundImage?.url;
                        setBackgroundImage({
                          url: blobUrl,
                          width,
                          height,
                        });
                        if (prevBlobUrl !== undefined) {
                          URL.revokeObjectURL(prevBlobUrl);
                        }
                      });
                    };
                    img.src = blobUrl;
                  }}
                />
                <Button variant="outlined" component="span" fullWidth>
                  背景画像:
                  <span
                    style={{
                      marginLeft: 4,
                    }}
                  >
                    {backgroundImage !== null ? (
                      <img
                        style={{
                          display: "inline-block",
                          borderRadius: 2,
                          verticalAlign: "middle",
                          border: "1px solid #333",
                        }}
                        src={backgroundImage?.url}
                        width={16}
                        height={16}
                      />
                    ) : (
                      "なし"
                    )}
                  </span>
                </Button>
              </label>
            </div>
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
            <Button
              variant="outlined"
              onClick={() => {
                setIsOpenTop(true);
              }}
              fullWidth
              style={{
                textTransform: "none",
              }}
            >
              {topText}: {top}px
            </Button>
          </Grid>
          <Grid item xs={2}>
            <Button
              variant="outlined"
              onClick={() => {
                setIsOpenLeft(true);
              }}
              fullWidth
              style={{
                textTransform: "none",
              }}
            >
              {leftText}: {left}px
            </Button>
          </Grid>
          <Grid item xs={2}>
            <Button
              variant="outlined"
              onClick={() => {
                setIsOpenFontSize(true);
              }}
              fullWidth
              style={{
                textTransform: "none",
              }}
            >
              文字サイズ: {fontSize}px
            </Button>
          </Grid>
          <Grid item xs={2}>
            <Button
              variant="outlined"
              onClick={() => {
                setIsOpenLetterSpace(true);
              }}
              fullWidth
              style={{
                textTransform: "none",
              }}
            >
              文字間: {letterSpace}px
            </Button>
          </Grid>
          <Grid item xs={2}>
            <Button
              variant="outlined"
              onClick={() => {
                setIsOpenLineSpace(true);
              }}
              fullWidth
              style={{
                textTransform: "none",
              }}
            >
              行間: {lineSpace}px
            </Button>
          </Grid>
          <Grid item xs={4}>
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
          <Grid item xs={4}>
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
          <Grid item xs={4}>
            <Typography>
              ゆらぎ: {randomLevel}
              <Tooltip title="小さいほど綺麗な字に、大きいほど個性的な字になります。">
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
              value={randomLevel}
              onChange={(_e, value) => {
                setRandomLevel(value as number);
              }}
            ></Slider>
          </Grid>
        </Grid>
      </Stack>
      <Drawer
        open={isOpenTop}
        onClose={() => setIsOpenTop(false)}
        anchor="bottom"
      >
        <Box sx={{ p: 2 }}>
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
            }}
          ></Slider>
        </Box>
      </Drawer>
      <Drawer
        open={isOpenLeft}
        onClose={() => setIsOpenLeft(false)}
        anchor="bottom"
      >
        <Box sx={{ p: 2 }}>
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
            }}
          ></Slider>
        </Box>
      </Drawer>
      <Drawer
        open={isOpenFontSize}
        onClose={() => setIsOpenFontSize(false)}
        anchor="bottom"
      >
        <Box sx={{ p: 2 }}>
          <Typography>文字サイズ: {fontSize}px</Typography>
          <Slider
            min={1}
            max={256}
            step={1}
            value={fontSize}
            onChange={(_e, value) => {
              setFontSize(value as number);
            }}
          ></Slider>
        </Box>
      </Drawer>
      <Drawer
        open={isOpenLetterSpace}
        onClose={() => setIsOpenLetterSpace(false)}
        anchor="bottom"
      >
        <Box sx={{ p: 2 }}>
          <Typography>文字間: {letterSpace}px</Typography>
          <Slider
            min={-64}
            max={64}
            step={1}
            value={letterSpace}
            onChange={(_e, value) => {
              setLetterSpace(value as number);
            }}
          ></Slider>
        </Box>
      </Drawer>
      <Drawer
        open={isOpenLineSpace}
        onClose={() => setIsOpenLineSpace(false)}
        anchor="bottom"
      >
        <Box sx={{ p: 2 }}>
          <Typography>行間: {lineSpace}px</Typography>
          <Slider
            min={-64}
            max={64}
            step={1}
            value={lineSpace}
            onChange={(_e, value) => {
              setLineSpace(value as number);
            }}
          ></Slider>
        </Box>
      </Drawer>
      <Typography variant="h6">使っている文字</Typography>
      <Suspense fallback={<CircularProgress />}>
        <UsingCharacters usingCharactersState={usingCharactersState} />
      </Suspense>
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
            to={`/characters/character/${encodeURIComponent(
              utf8.toBase64(value)
            )}/figure-records/create`}
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
}: {
  startTransition: (callback: () => void) => void;
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

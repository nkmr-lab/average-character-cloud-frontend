import { Box } from "@mui/system";
import AverageFigureRecords from "./AverageFigureRecords";

import * as FigureRendererTypes from "../domains/FigureRendererTypes";
import { WidthArrow, HeightArrow } from "./Arrow";
import {
  type RecoilValue,
  useRecoilValue_TRANSITION_SUPPORT_UNSTABLE,
} from "recoil";

export type Props = {
  averageTextState: RecoilValue<FigureRendererTypes.Text>;
  updateSeed?: (index: number) => void;
  fontSize: number;
  top: number;
  left: number;
  lineSpace: number;
  letterSpace: number;
  showTopArrow?: boolean;
  showLeftArrow?: boolean;
  showFontSizeArrow?: boolean;
  showLetterSpaceArrow?: boolean;
  showLineSpaceArrow?: boolean;
  mode: "horizontal" | "vertical";
};

export default function AverageText({
  averageTextState,
  updateSeed,
  fontSize,
  top,
  left,
  lineSpace,
  letterSpace,
  showTopArrow = false,
  showLeftArrow = false,
  showFontSizeArrow = false,
  showLetterSpaceArrow = false,
  showLineSpaceArrow = false,
  mode,
}: Props): JSX.Element {
  const averageText =
    useRecoilValue_TRANSITION_SUPPORT_UNSTABLE(averageTextState);
  const firstFigure: FigureRendererTypes.TextFigure | undefined =
    averageText.figures[0];
  const firstLetterX =
    firstFigure === undefined
      ? left + fontSize / 2
      : firstFigure.x +
        FigureRendererTypes.Figure.left(firstFigure.figure) +
        FigureRendererTypes.Figure.width(firstFigure.figure) / 2;
  const firstLetterRight =
    firstFigure === undefined
      ? left + fontSize
      : firstFigure.x +
        FigureRendererTypes.Figure.left(firstFigure.figure) +
        FigureRendererTypes.Figure.width(firstFigure.figure);
  const firstLatterY =
    firstFigure === undefined
      ? left + fontSize / 2
      : firstFigure.y +
        FigureRendererTypes.Figure.top(firstFigure.figure) +
        FigureRendererTypes.Figure.height(firstFigure.figure) / 2;
  const firstLatterBottom =
    firstFigure === undefined
      ? left + fontSize
      : firstFigure.y +
        FigureRendererTypes.Figure.top(firstFigure.figure) +
        FigureRendererTypes.Figure.height(firstFigure.figure);

  return (
    <div>
      <Box
        sx={{
          border: "1px solid grey",
          minHeight: "32px",
          maxHeight: "300px",
          overflow: "auto",
        }}
      >
        <div
          style={{
            contain: "strict",
            height: averageText.height,
            width: averageText.width,
          }}
        >
          {averageText.backgroundImage && (
            <img
              src={averageText.backgroundImage.src}
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                width: averageText.width,
                height: averageText.height,
              }}
            />
          )}
          {averageText.figures.map((figure, i) => {
            return (
              <div
                key={i}
                style={{ position: "absolute", left: figure.x, top: figure.y }}
              >
                <AverageFigureRecords
                  updateSeed={() => updateSeed?.(i)}
                  figure={figure.figure}
                />
              </div>
            );
          })}
          {showTopArrow &&
            (mode === "horizontal" ? (
              <HeightArrow top={0} x={firstLetterX} height={Math.max(0, top)} />
            ) : (
              <WidthArrow
                left={averageText.width - top}
                y={firstLatterY}
                width={Math.max(0, top)}
              />
            ))}
          {showLeftArrow &&
            (mode === "horizontal" ? (
              <WidthArrow
                y={top + fontSize / 2}
                left={0}
                width={Math.max(0, left)}
              />
            ) : (
              <HeightArrow
                top={0}
                x={firstLetterX}
                height={Math.max(0, left)}
              />
            ))}
          {showFontSizeArrow &&
            (mode === "horizontal" ? (
              <HeightArrow top={top} x={firstLetterX} height={fontSize} />
            ) : (
              <WidthArrow
                y={top + fontSize / 2}
                left={averageText.width - top - fontSize}
                width={fontSize}
              />
            ))}
          {showLetterSpaceArrow &&
            (mode === "horizontal" ? (
              <WidthArrow
                y={top + fontSize / 2}
                left={firstLetterRight}
                width={Math.max(0, letterSpace)}
              />
            ) : (
              <HeightArrow
                top={firstLatterBottom}
                x={firstLetterX}
                height={Math.max(0, letterSpace)}
              />
            ))}
          {showLineSpaceArrow &&
            (mode === "horizontal" ? (
              <HeightArrow
                top={top + fontSize}
                x={firstLetterX}
                height={lineSpace}
              />
            ) : (
              <WidthArrow
                y={top + fontSize / 2}
                left={averageText.width - top - fontSize - lineSpace}
                width={lineSpace}
              />
            ))}
        </div>
      </Box>
    </div>
  );
}

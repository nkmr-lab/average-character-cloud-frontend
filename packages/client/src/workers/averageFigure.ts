import "../polyfills/global";
import "../polyfills/window";
import XorShift from "../domains/XorShift";
import shuffle from "../domains/shuffle";
import { figureToSvgPart, jsonToFigure } from "../domains/figure_drawer";
import { Figure, Point } from "@nkmr-lab/average-figure-drawer";
import isNotNull from "../utils/isNotNull";

function averageFigureInner(
  figureJsons: string[],
  rng: XorShift,
  randomLevel: number
): Figure | null {
  const figures = figureJsons
    .map((json) => jsonToFigure(json))
    .filter(isNotNull);

  if (figures.length === 0) {
    return null;
  }

  shuffle(figures, rng);
  const proportions = figures.map((_, i) =>
    Math.max(rng.nextStdNormal() * 0.5 + Math.pow(randomLevel, i), 0.01)
  );
  const avgFigure = Figure.average(figures, proportions);

  avgFigure.leftTop = figures[0].leftTop;
  avgFigure.rightBottom = figures[0].rightBottom;
  avgFigure.adapt();
  return avgFigure;
}

export type AverageFigureResult = {
  svgPart: string;
  left: number;
  top: number;
  right: number;
  bottom: number;
};

export function averageFigure(
  figureJsons: string[],
  sharedFigureJsons: string[],
  {
    seed,
    randomLevel,
    color,
    sharedProportion = 0,
    weight,
  }: {
    seed: number;
    randomLevel: number;
    color?: string;
    sharedProportion?: number;
    weight: number;
  }
): AverageFigureResult | null {
  const rng = new XorShift(seed);
  const avgFigure = averageFigureInner(figureJsons, rng, randomLevel);
  const sharedAvgFigure = averageFigureInner(
    sharedFigureJsons,
    rng,
    randomLevel
  );
  const resultFigure =
    avgFigure === null
      ? sharedAvgFigure
      : sharedAvgFigure === null
      ? avgFigure
      : (() => {
          const figures = [avgFigure, sharedAvgFigure];
          const resultFigure: Figure = Figure.average(figures, [
            1 - sharedProportion,
            sharedProportion,
          ]);
          resultFigure.leftTop = figures[0].leftTop;
          resultFigure.rightBottom = figures[0].rightBottom;
          resultFigure.adapt();
          return resultFigure;
        })();
  if (resultFigure === null) {
    return null;
  }

  const points = resultFigure.strokes.flatMap((stroke) =>
    stroke.DFT.pointsToDraw()
  );
  const left = Math.min(...points.map((point) => point.x));
  const top = Math.min(...points.map((point) => point.y));
  const right = Math.max(...points.map((point) => point.x));
  const bottom = Math.max(...points.map((point) => point.y));

  return {
    svgPart: figureToSvgPart(resultFigure, { color, weight }),
    left,
    top,
    right,
    bottom,
  };
}

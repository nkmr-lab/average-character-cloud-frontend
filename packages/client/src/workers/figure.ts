import "../polyfills/global";
import "../polyfills/window";
import { figureToSvgPart, jsonToFigure } from "../domains/figure_drawer";

export function svgPart(
  figureJson: string,
  { color, weight }: { color?: string; weight: number }
): string {
  const figure = jsonToFigure(figureJson);
  if (figure === null) {
    return "";
  }
  return figureToSvgPart(figure, { color, weight });
}

import {
  Figure,
  Point,
  Stroke,
  getPathString,
} from "@nkmr-lab/average-figure-drawer";

export function svgPartToImageUrl(
  inner: string,
  { width, height }: { width: number; height: number }
): string {
  const svg = `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">${inner}</svg>`;

  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

export function figureToSvgPart(
  figure: Figure,
  {
    color,
    weight,
  }: {
    color?: string;
    weight: number;
  }
): string {
  const strokes = figure.strokes.map((stroke: Stroke) =>
    stroke.DFT.pointsToDraw()
  );

  return strokesToPaths(strokes, { color, weight });
}

export function strokesToPaths(
  strokes: Point[][],
  { color, weight }: { color?: string; weight: number }
): string {
  return strokes
    .map((stroke) => pointToPath(stroke, { color, weight }))
    .join("");
}

function pointToPath(
  points: Point[],
  { color = "#000", weight }: { color?: string; weight: number }
): string {
  return `<path fill="${color}" d="${
    getPathString(points, 4 * weight) as string
  }" />`;
}

export type FigureJSON = {
  strokes: {
    points: { x: number; y: number; z: number }[];
  }[];
  width: number;
  height: number;
};

export function jsonToFigure(json: string): Figure | null {
  const figure: FigureJSON = JSON.parse(json);

  // 一点のみからなるストロークを含む場合は使わない
  if (
    figure.strokes.some((stroke) => {
      if (stroke.points.length === 0) {
        return true;
      }

      const p0 = stroke.points[0];
      if (
        stroke.points.every((p) => (p0.x - p.x) ** 2 + (p0.y - p.y) ** 2 < 1)
      ) {
        return true;
      }

      return false;
    })
  ) {
    return null;
  }
  const zs = figure.strokes.flatMap(({ points }) => points).map(({ z }) => z);
  const avgZ = zs.reduce((a, b) => a + b, 0) / zs.length;
  figure.strokes.forEach(({ points }) => {
    points.forEach((point) => {
      point.z = Math.min(Math.max((point.z / avgZ) * 0.7, 0), 1);
      point.x = (point.x / figure.width) * 256;
      point.y = (point.y / figure.height) * 256;
    });
  });

  const retFigure = new Figure();

  figure.strokes.forEach((stroke) => {
    const retStroke = new Stroke(
      stroke.points.map((point) => new Point(point.x, point.y, { z: point.z }))
    );
    retStroke.DFT.pointsToDraw();
    retFigure.add(retStroke);
  });

  retFigure.calculateRect();
  retFigure.normalize();
  retFigure.adapt();
  return retFigure;
}

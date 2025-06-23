import { graphql, readInlineData } from "react-relay";
import {
  averageFigureSelector_figureRecords$data,
  averageFigureSelector_figureRecords$key,
} from "./__generated__/averageFigureSelector_figureRecords.graphql";
import type * as averageFigure from "../workers/averageFigure";
import * as FigureRendererTypes from "../domains/FigureRendererTypes";

import { type RecoilValue, selectorFamily } from "recoil";
import WorkerPool from "../WorkerPool";

const averageFigureInstancePool = new WorkerPool(
  () =>
    new ComlinkWorker<typeof averageFigure>(
      new URL("../workers/averageFigure.ts", import.meta.url)
    )
);

export class FigureRecordsWrapper {
  readonly value: averageFigureSelector_figureRecords$data;
  constructor(public readonly key: averageFigureSelector_figureRecords$key) {
    this.value = readInlineData<averageFigureSelector_figureRecords$key>(
      graphql`
        fragment averageFigureSelector_figureRecords on FigureRecordConnection
        @inline {
          edges {
            node {
              id
              figure
            }
          }
        }
      `,
      key
    );
  }
  // for recoil equality check
  toJSON() {
    return this.value.edges.map(({ node: { id } }) => id).join(",");
  }
}

const averageFigureStateFamily = selectorFamily({
  key: "averageFigure/averageFigureStateFamily",
  get:
    ({
      seedState,
      randomLevelState,
      figureRecordsState,
      sharedFigureRecordsState,
      sharedProportionState,
      colorState,
      character,
      sizeState,
      weightState,
    }: {
      seedState: RecoilValue<number>;
      randomLevelState: RecoilValue<number>;
      figureRecordsState: RecoilValue<FigureRecordsWrapper | null>;
      sharedFigureRecordsState: RecoilValue<FigureRecordsWrapper | null>;
      sharedProportionState: RecoilValue<number>;
      colorState: RecoilValue<string>;
      character: string;
      sizeState: RecoilValue<number>;
      weightState: RecoilValue<number>;
    }) =>
    async ({ get }): Promise<FigureRendererTypes.Figure> => {
      const seed = get(seedState);
      const randomLevel = get(randomLevelState);
      const figureRecords = get(figureRecordsState);
      const sharedFigureRecords = get(sharedFigureRecordsState);
      const sharedProportion = get(sharedProportionState);
      const color = get(colorState);
      const size = get(sizeState);
      const weight = get(weightState);

      const averageFigureResult = await averageFigureInstancePool.run(
        (instance) =>
          instance.averageFigure(
            figureRecords?.value.edges.map(
              ({ node: { figure: json } }) => json
            ) ?? [],
            sharedFigureRecords?.value.edges.map(
              ({ node: { figure: json } }) => json
            ) ?? [],
            {
              seed,
              randomLevel,
              sharedProportion,
              color,
              weight,
            }
          )
      );
      return averageFigureResult === null
        ? { type: "not_registered", value: character, size }
        : {
            type: "image_url",
            svgPart: averageFigureResult.svgPart,
            size,
            left: (averageFigureResult.left / 256) * size,
            top: (averageFigureResult.top / 256) * size,
            right: (averageFigureResult.right / 256) * size,
            bottom: (averageFigureResult.bottom / 256) * size,
          };
    },
});

export default averageFigureStateFamily;

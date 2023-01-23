import { graphql, useFragment } from "react-relay";
import {
  FigureRecord_figureRecord$key,
  FigureRecord_figureRecord$data,
} from "./__generated__/FigureRecord_figureRecord.graphql";
import type * as figure from "../workers/figure";
import { svgPartToImageUrl } from "../domains/figure_drawer";
import { selectorFamily, useRecoilValue } from "recoil";
import WorkerPool from "../WorkerPool";

const figureInstancePool = new WorkerPool(
  () =>
    new ComlinkWorker<typeof figure>(
      new URL("../workers/figure.ts", import.meta.url)
    )
);

class FigureRecordWrapper {
  constructor(public readonly value: FigureRecord_figureRecord$data) {}
  toJSON() {
    return this.value.id;
  }
}

const figureRecordSvg = selectorFamily({
  key: "FigureRecord/figureRecordSvg",
  get:
    ({
      figureRecord,
      color,
    }: {
      figureRecord: FigureRecordWrapper;
      color: string;
    }) =>
    async () => {
      return figureInstancePool.run((instance) =>
        instance.svgPart(figureRecord.value.figure, {
          color,
          weight: 1,
        })
      );
    },
});

export type Props = {
  figureRecordKey: FigureRecord_figureRecord$key;
  size?: number;
  color?: string;
};

export default function FigureRecord({
  figureRecordKey,
  size = 256,
  color = "#000000",
}: Props): JSX.Element {
  const figureRecord = useFragment<FigureRecord_figureRecord$key>(
    graphql`
      fragment FigureRecord_figureRecord on FigureRecord {
        id
        figure
      }
    `,
    figureRecordKey
  );

  const svgPart = useRecoilValue(
    figureRecordSvg({
      figureRecord: new FigureRecordWrapper(figureRecord),
      color,
    })
  );

  return (
    <img
      src={svgPartToImageUrl(svgPart, {
        width: 256,
        height: 256,
      })}
      width={size}
      height={size}
    />
  );
}

import { graphql } from "react-relay";

import * as FigureRendererTypes from "../domains/FigureRendererTypes";
import isNotNull from "../utils/isNotNull";
import {
  type RecoilValue,
  selectorFamily,
  waitForAll,
  atomFamily,
} from "recoil";
import averageFigureStateFamily, {
  FigureRecordsWrapper,
} from "../store/averageFigure";
import {
  averageText_figureRecordsQuery$data,
  averageText_figureRecordsQuery$variables,
} from "./__generated__/averageText_figureRecordsQuery.graphql";
import { graphQLSelectorFamily } from "recoil-relay";
import RelayEnvironment from "../RelayEnvironment";
import XorShift from "../domains/XorShift";

type Token =
  | {
      type: "char";
      value: string;
    }
  | {
      type: "space";
    }
  | {
      type: "newline";
    };

function tokenize(content: string): Token[] {
  return [...content.replace(/\r/g, "")].map((char) => {
    if (char === " " || char === "　" || char === "\t") {
      return { type: "space" };
    } else if (char === "\n") {
      return { type: "newline" };
    } else {
      return { type: "char", value: char };
    }
  });
}

export const tokensStateFamily = selectorFamily({
  key: "averageText/tokensStateFamily",
  get:
    ({ contentState }: { contentState: RecoilValue<string> }) =>
    ({ get }) => {
      const content = get(contentState);
      return tokenize(content);
    },
});

// なぜかuseRecoilRefresher_UNSTABLEが効かないので
export const figureRecordsFetchKeyFamily = atomFamily({
  key: "averageText/figureRecordsFetchKeyFamily",
  default: (_: {
    contentState: RecoilValue<string>;
    enableUseSharedFigureRecordsState: RecoilValue<boolean>;
  }) => 0,
});

export const figureRecordsQueryFamily = graphQLSelectorFamily({
  key: "averageText/figureRecordsQueryFamily",
  environment: RelayEnvironment,
  query: graphql`
    query averageText_figureRecordsQuery(
      $characters: [CharacterValue!]!
      $enableUseSharedFigureRecords: Boolean!
    ) {
      characters(values: $characters) {
        id
        value
        characterConfigs {
          strokeCount
          ratio
          figureRecords(first: 10, userType: MYSELF) {
            ...averageFigureSelector_figureRecords
            edges {
              __typename
            }
          }
          sharedFigureRecords: figureRecords(first: 10, userType: OTHER)
            @include(if: $enableUseSharedFigureRecords) {
            ...averageFigureSelector_figureRecords
          }
        }
      }
    }
  `,
  variables:
    ({
      contentState,
      enableUseSharedFigureRecordsState,
    }: {
      contentState: RecoilValue<string>;
      enableUseSharedFigureRecordsState: RecoilValue<boolean>;
    }) =>
    ({ get }): averageText_figureRecordsQuery$variables => {
      const fetchKey = get(
        figureRecordsFetchKeyFamily({
          contentState,
          enableUseSharedFigureRecordsState,
        })
      );
      const tokens = get(tokensStateFamily({ contentState }));
      const chars = [
        ...new Set(
          tokens
            .map((token) => (token.type === "char" ? token.value : null))
            .filter(isNotNull)
        ),
      ].sort();
      const result: averageText_figureRecordsQuery$variables = {
        characters: chars,
        enableUseSharedFigureRecords: get(enableUseSharedFigureRecordsState),
      };

      // refetchするためのワークアラウンド
      return {
        ...result,
        fetchKey,
      } as any;
    },

  mapResponse: (data: averageText_figureRecordsQuery$data) => data,
});

export const usingCharactersStateFamily = selectorFamily({
  key: "averageText/usingCharactersStateFamily",
  get:
    ({
      contentState,
      enableUseSharedFigureRecordsState,
    }: {
      contentState: RecoilValue<string>;
      enableUseSharedFigureRecordsState: RecoilValue<boolean>;
    }) =>
    ({
      get,
    }): {
      value: string;
      count: number;
    }[] => {
      const tokens = get(tokensStateFamily({ contentState }));
      const figureRecords = get(
        figureRecordsQueryFamily({
          contentState,
          enableUseSharedFigureRecordsState,
        })
      );
      const figureRecordsMap = new Map(
        figureRecords.characters.map((character) => [
          character.value,
          character.characterConfigs.flatMap(
            (characterConfig) => characterConfig.figureRecords.edges
          ),
        ])
      );
      return [
        ...new Set(
          tokens
            .map((token) => (token.type === "char" ? token.value : null))
            .filter(isNotNull)
        ),
      ]
        .sort()
        .map((character) => ({
          value: character,
          count: figureRecordsMap.get(character)?.length ?? 0,
        }));
    },
});

const seedStateFamily = selectorFamily({
  key: "averageText/seedStateFamily",
  get:
    ({
      seedsState,
      index,
    }: {
      seedsState: RecoilValue<Map<number, number>>;
      index: number;
    }) =>
    ({ get }) => {
      const seeds = get(seedsState);
      return seeds.get(index) ?? XorShift.initSeed(index);
    },
});

const pickup2FigureRecordsFamily = selectorFamily({
  key: "averageText/pickup2FigureRecordsFamily",
  get:
    ({
      seedState,
      figureRecordsQueryState,
      character,
    }: {
      seedState: RecoilValue<number>;
      figureRecordsQueryState: RecoilValue<averageText_figureRecordsQuery$data>;
      character: string;
    }) =>
    ({
      get,
    }): {
      figureRecords: FigureRecordsWrapper | null;
      sharedFigureRecords: FigureRecordsWrapper | null;
    } => {
      const figureRecords = get(figureRecordsQueryState);

      // TODO: O(N)
      const characterConfigs = figureRecords.characters.find(
        ({ value }) => value === character
      )?.characterConfigs;

      if (characterConfigs === undefined) {
        return {
          figureRecords: null,
          sharedFigureRecords: null,
        };
      }

      const seed = get(seedState);
      const rng = new XorShift(seed);

      const nonEmpty = characterConfigs.filter(
        (config) => config.figureRecords.edges.length > 0
      );
      if (nonEmpty.length === 0) {
        return {
          figureRecords: null,
          sharedFigureRecords: null,
        };
      }
      let ratioSum = 0;
      const ratioSums: number[] = [];
      for (const item of nonEmpty) {
        ratioSum += item.ratio;
        ratioSums.push(ratioSum);
      }

      // ratioが全て0なら全て等確率で選択する
      if (ratioSum <= 0) {
        for (let i = 0; i < nonEmpty.length; i++) {
          ratioSums[i] = 1;
        }
        ratioSum = nonEmpty.length;
      }

      for (let i = 0; i < nonEmpty.length; i++) {
        ratioSums[i] /= ratioSum;
      }

      const randomValue = rng.nextFloat();
      let selectedIndex = 0;
      for (let i = 0; i < ratioSums.length; i++) {
        if (randomValue < ratioSums[i]) {
          selectedIndex = i;
          break;
        }
      }
      const characterConfig = nonEmpty[selectedIndex];
      return {
        figureRecords: new FigureRecordsWrapper(characterConfig.figureRecords),
        sharedFigureRecords: characterConfig.sharedFigureRecords
          ? new FigureRecordsWrapper(characterConfig.sharedFigureRecords)
          : null,
      };
    },
});

const pickupFigureRecordsFamily = selectorFamily({
  key: "averageText/pickupFigureRecordsFamily",
  get:
    ({
      seedState,
      figureRecordsQueryState,
      character,
    }: {
      seedState: RecoilValue<number>;
      figureRecordsQueryState: RecoilValue<averageText_figureRecordsQuery$data>;
      character: string;
    }) =>
    ({ get }) => {
      const { figureRecords } = get(
        pickup2FigureRecordsFamily({
          seedState,
          figureRecordsQueryState,
          character,
        })
      );
      return figureRecords;
    },
});

const pickupSharedFigureRecordsFamily = selectorFamily({
  key: "averageText/pickupSharedFigureRecordsFamily",
  get:
    ({
      seedState,
      figureRecordsQueryState,
      character,
    }: {
      seedState: RecoilValue<number>;
      figureRecordsQueryState: RecoilValue<averageText_figureRecordsQuery$data>;
      character: string;
    }) =>
    ({ get }) => {
      const { sharedFigureRecords } = get(
        pickup2FigureRecordsFamily({
          seedState,
          figureRecordsQueryState,
          character,
        })
      );
      return sharedFigureRecords;
    },
});

const innerWidth = window.innerWidth;

export const averageTextStateFamily = selectorFamily({
  key: "averageText/averageTextStateFamily",
  get:
    ({
      contentState,
      randomLevelState,
      seedsState,
      sharedProportionState,
      enableUseSharedFigureRecordsState,
      colorState,
      fontSizeState,
      // 縦書きの場合は右のスペース。TODO: rename
      topState,
      // 縦書きの場合は上のスペース。TODO: rename
      leftState,
      lineSpaceState,
      letterSpaceState,
      backgroundImageState,
      weightState,
      modeState,
    }: {
      contentState: RecoilValue<string>;
      randomLevelState: RecoilValue<number>;
      seedsState: RecoilValue<Map<number, number>>;
      sharedProportionState: RecoilValue<number>;
      enableUseSharedFigureRecordsState: RecoilValue<boolean>;
      colorState: RecoilValue<string>;
      fontSizeState: RecoilValue<number>;
      topState: RecoilValue<number>;
      leftState: RecoilValue<number>;
      lineSpaceState: RecoilValue<number>;
      letterSpaceState: RecoilValue<number>;
      backgroundImageState: RecoilValue<{
        url: string;
        width: number;
        height: number;
      } | null>;
      weightState: RecoilValue<number>;
      modeState: RecoilValue<"horizontal" | "vertical">;
    }) =>
    ({ get }): FigureRendererTypes.Text => {
      const mode = get(modeState);
      const tokens = get(tokensStateFamily({ contentState }));
      const figureRecordsQueryState = figureRecordsQueryFamily({
        contentState,
        enableUseSharedFigureRecordsState,
      });
      const fontSize = get(fontSizeState);
      const left = get(leftState);
      const top = get(topState);
      const lineSpace = get(lineSpaceState);
      const letterSpace = get(letterSpaceState);
      const backgroundImage = get(backgroundImageState);

      const averageFigures = get(
        waitForAll(
          tokens
            .map((token) => (token.type === "char" ? token : null))
            .filter(isNotNull)
            .map((token, i) => {
              return averageFigureStateFamily({
                figureRecordsState: pickupFigureRecordsFamily({
                  seedState: seedStateFamily({ seedsState, index: i }),
                  figureRecordsQueryState,
                  character: token.value,
                }),
                sharedFigureRecordsState: pickupSharedFigureRecordsFamily({
                  seedState: seedStateFamily({ seedsState, index: i }),
                  figureRecordsQueryState,
                  character: token.value,
                }),
                character: token.value,
                seedState: seedStateFamily({ seedsState, index: i }),
                randomLevelState,
                colorState,
                sizeState: fontSizeState,
                sharedProportionState,
                weightState,
              });
            })
        )
      );

      const width =
        backgroundImage === null
          ? Math.floor(innerWidth * 0.8)
          : backgroundImage.width;
      const { tokensLayout, height } = (() => {
        let x = mode === "horizontal" ? left : width - top;
        let y = mode === "horizontal" ? top : left;
        let i = 0;
        const tokensLayout = tokens
          .map((token) => {
            switch (token.type) {
              case "char": {
                const maybeFigure: FigureRendererTypes.Figure | undefined =
                  averageFigures[i];
                i += 1;
                const figure =
                  maybeFigure?.type === "image_url" ? maybeFigure : null;
                const left = figure?.left ?? 0;
                const right = figure?.right ?? fontSize;
                const width = right - left;
                const top = figure?.top ?? 0;
                const bottom = figure?.bottom ?? fontSize;
                const height = bottom - top;
                const rate = height / (width + height);
                if (mode === "horizontal") {
                  const result = {
                    value: token.value,
                    x: x - left,
                    y: y + (fontSize - bottom) * rate,
                  };

                  x += width + letterSpace;

                  return result;
                } else {
                  const result = {
                    value: token.value,
                    x: x - fontSize + (fontSize - left - right) / 2,
                    y: y - top,
                  };

                  y += height + letterSpace;

                  return result;
                }
              }
              case "space":
                if (mode === "horizontal") {
                  x += fontSize / 2 + letterSpace;
                } else {
                  y += fontSize / 2 + letterSpace;
                }
                return null;
              case "newline":
                if (mode === "horizontal") {
                  x = left;
                  y += fontSize + lineSpace;
                } else {
                  x -= fontSize + lineSpace;
                  y = left;
                }
                return null;
            }
          })
          .filter(isNotNull);
        return {
          tokensLayout,
          height:
            backgroundImage === null ? y + fontSize : backgroundImage.height,
        };
      })();
      const figures = averageFigures.map(
        (figure, i): FigureRendererTypes.TextFigure => {
          const token = tokensLayout[i];
          return {
            x: token.x,
            y: token.y,
            figure,
          };
        }
      );

      return {
        figures,
        width,
        height,
        backgroundImageUrl: backgroundImage?.url ?? null,
      };
    },
});

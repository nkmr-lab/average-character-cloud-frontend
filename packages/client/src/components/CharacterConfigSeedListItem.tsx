import { graphql, useFragment } from "react-relay";
import { CharacterConfigSeedListItem_characterConfigSeed$key } from "./__generated__/CharacterConfigSeedListItem_characterConfigSeed.graphql";
import { Button, ListItem } from "@mui/material";
import useUpdateCharacterConfig from "../hooks/useUpdateCharacterConfig";

type Props = {
  characterConfigSeedKey: CharacterConfigSeedListItem_characterConfigSeed$key;
};

export default function CharacterConfigSeedListItem({
  characterConfigSeedKey,
}: Props): JSX.Element {
  const characterConfigSeed =
    useFragment<CharacterConfigSeedListItem_characterConfigSeed$key>(
      graphql`
        fragment CharacterConfigSeedListItem_characterConfigSeed on CharacterConfigSeed {
          character {
            value
            characterConfigs {
              strokeCount
            }
          }
          strokeCount
        }
      `,
      characterConfigSeedKey
    );

  const [updateCharacterConfig, updateCharacterConfigLoading] =
    useUpdateCharacterConfig();

  return (
    <ListItem key={characterConfigSeed.character.value}>
      {characterConfigSeed.character.value} ({characterConfigSeed.strokeCount}
      画){" "}
      <Button
        disabled={updateCharacterConfigLoading}
        onClick={() => {
          updateCharacterConfig({
            input: {
              character: characterConfigSeed.character.value,
              strokeCount: characterConfigSeed.strokeCount,
              disabled: false,
            },
          });
        }}
      >
        この画数を登録{" "}
        {characterConfigSeed.character.characterConfigs.length === 0
          ? ""
          : `登録済みの別の画数: ${characterConfigSeed.character.characterConfigs
              .map((c) => String(c.strokeCount))
              .join(", ")}`}
      </Button>
    </ListItem>
  );
}

import { graphql, useFragment } from "react-relay";
import { CharacterConfigSeedListItem_characterConfigSeed$key } from "./__generated__/CharacterConfigSeedListItem_characterConfigSeed.graphql";
import { Button, ListItem } from "@mui/material";
import useCreateCharacterConfig from "../hooks/useCreateCharacterConfig";

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
            characterConfig {
              __typename
            }
          }
          strokeCount
        }
      `,
      characterConfigSeedKey
    );

  const [createCharacterConfig, createCharacterConfigLoading] =
    useCreateCharacterConfig();

  return (
    <ListItem key={characterConfigSeed.character.value}>
      {characterConfigSeed.character.value} ({characterConfigSeed.strokeCount}
      画){" "}
      <Button
        disabled={
          createCharacterConfigLoading ||
          characterConfigSeed.character.characterConfig !== null
        }
        onClick={() => {
          createCharacterConfig({
            input: {
              character: characterConfigSeed.character.value,
              strokeCount: characterConfigSeed.strokeCount,
            },
          });
        }}
      >
        {characterConfigSeed.character.characterConfig === null
          ? "文字設定を登録"
          : "登録済み"}
      </Button>
    </ListItem>
  );
}

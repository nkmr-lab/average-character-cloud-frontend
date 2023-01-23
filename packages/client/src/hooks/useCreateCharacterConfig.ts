import { useSnackbar } from "notistack";
import { graphql, useMutation } from "react-relay";
import { formatError } from "../domains/error";
import { useCreateCharacterConfig_createCharacterConfigMutation } from "./__generated__/useCreateCharacterConfig_createCharacterConfigMutation.graphql";

type Cb = (_: {
  input: { character: string; strokeCount: number };
  onSuccess?: () => void;
  onError?: () => void;
}) => void;

export default function useCreateCharacterConfig(): [Cb, boolean] {
  const [createCharacterConfig, createCharacterConfigLoading] =
    useMutation<useCreateCharacterConfig_createCharacterConfigMutation>(
      graphql`
        mutation useCreateCharacterConfig_createCharacterConfigMutation(
          $input: CreateCharacterConfigInput!
        ) {
          createCharacterConfig(input: $input) {
            characterConfig {
              ...CreateFigureRecord_characterConfig
              id
              character {
                id
                value
                characterConfigSeed {
                  ...CharacterConfigSeedListItem_characterConfigSeed
                }
              }
              strokeCount
              updatedAt
            }
            errors {
              message
            }
          }
        }
      `
    );

  const { enqueueSnackbar } = useSnackbar();

  return [
    ({ input, onSuccess, onError }) => {
      createCharacterConfig({
        variables: {
          input,
        },
        onCompleted: ({ createCharacterConfig }) => {
          if (createCharacterConfig.errors === null) {
            enqueueSnackbar("文字設定を作成しました", {
              variant: "success",
            });
            onSuccess?.();
          } else {
            for (const error of createCharacterConfig.errors) {
              enqueueSnackbar(error.message, {
                variant: "error",
              });
            }
            onError?.();
          }
        },
        onError: (error) => {
          enqueueSnackbar(formatError(error), {
            variant: "error",
          });
          onError?.();
        },
        updater: (store, data) => {
          if (data.createCharacterConfig.characterConfig !== null) {
            store
              .get(data.createCharacterConfig.characterConfig.character.id)!
              .invalidateRecord();
          }
        },
      });
    },
    createCharacterConfigLoading,
  ];
}

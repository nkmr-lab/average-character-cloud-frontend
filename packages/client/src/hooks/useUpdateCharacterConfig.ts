import { useSnackbar } from "notistack";
import { graphql, useMutation } from "react-relay";
import { formatError } from "../domains/error";
import { useUpdateCharacterConfig_updateCharacterConfigMutation } from "./__generated__/useUpdateCharacterConfig_updateCharacterConfigMutation.graphql";

type Cb = (_: {
  input: {
    character: string;
    strokeCount: number;
    ratio?: number;
    disabled?: boolean;
  };
  onSuccess?: () => void;
  onError?: () => void;
}) => void;

export default function useUpdateCharacterConfig(): [Cb, boolean] {
  const [updateCharacterConfig, updateCharacterConfigLoading] =
    useMutation<useUpdateCharacterConfig_updateCharacterConfigMutation>(
      graphql`
        mutation useUpdateCharacterConfig_updateCharacterConfigMutation(
          $input: UpdateCharacterConfigInput!
        ) {
          updateCharacterConfig(input: $input) {
            characterConfig {
              id
              character {
                id
                value
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
      updateCharacterConfig({
        variables: {
          input: {
            character: input.character,
            strokeCount: input.strokeCount,
            ratio: input.ratio,
            disabled: input.disabled,
          },
        },
        onCompleted: ({ updateCharacterConfig }) => {
          if (!updateCharacterConfig.errors) {
            enqueueSnackbar("文字設定を更新しました", {
              variant: "success",
            });
            onSuccess?.();
          } else {
            for (const error of updateCharacterConfig.errors) {
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
          if (data.updateCharacterConfig.characterConfig) {
            store
              .get(data.updateCharacterConfig.characterConfig.character.id)!
              .invalidateRecord();
          }
        },
      });
    },
    updateCharacterConfigLoading,
  ];
}

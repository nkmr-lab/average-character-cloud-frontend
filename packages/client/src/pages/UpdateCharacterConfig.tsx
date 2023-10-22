import { graphql, useLazyLoadQuery } from "react-relay";
import { UpdateCharacterConfig_rootQuery } from "./__generated__/UpdateCharacterConfig_rootQuery.graphql";
import { useForm } from "react-hook-form";
import { Button, TextField, Typography, Stack } from "@mui/material";
import { useNavigate, useParams } from "react-router-dom";
import { useSnackbar } from "notistack";
import ignoreResult from "../utils/ignoreResult";
import * as utf8 from "../utils/utf8";
import useUpdateCharacterConfig from "../hooks/useUpdateCharacterConfig";
import { useInDialog } from "../hooks/useBackground";

export default function UpdateCharacterConfig(): JSX.Element {
  const params = useParams();
  const characterValue = utf8.fromBase64(params.character!);
  const navigate = useNavigate();

  const { characters } = useLazyLoadQuery<UpdateCharacterConfig_rootQuery>(
    graphql`
      query UpdateCharacterConfig_rootQuery($character: CharacterValue!) {
        characters(values: [$character]) {
          characterConfig {
            character {
              value
            }
            strokeCount
          }
        }
      }
    `,
    { character: characterValue },
    { fetchPolicy: "store-and-network" }
  );

  if (characters.length === 0) {
    throw Error("character not found");
  }
  const character = characters[0];
  const characterConfig = character.characterConfig;
  if (characterConfig === null) {
    throw Error("character config not found");
  }

  const [updateCharacterConfig, updateCharacterConfigLoading] =
    useUpdateCharacterConfig();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<{ strokeCount: string }>({
    mode: "onChange",
    defaultValues: {
      strokeCount: characterConfig.strokeCount.toString(),
    },
  });

  const inDialog = useInDialog();

  return (
    <div>
      <Typography variant="h6">
        「{characterConfig.character.value}」文字設定変更
      </Typography>
      <Stack
        spacing={2}
        component="form"
        onSubmit={ignoreResult(
          handleSubmit(({ strokeCount }) => {
            updateCharacterConfig({
              input: {
                character: characterConfig.character.value,
                strokeCount: parseInt(strokeCount),
              },
              onSuccess: () => {
                if (inDialog) {
                  navigate(-1);
                }
              },
            });
          })
        )}
      >
        <TextField
          label="画数"
          type="number"
          error={!!errors.strokeCount}
          helperText={errors.strokeCount?.message}
          {...register("strokeCount", {
            required: { value: true, message: "必須項目です" },
            min: { value: 1, message: "1〜100にしてください" },
            max: { value: 100, message: "1〜100にしてください" },
          })}
        />
        <Button
          type="submit"
          variant="contained"
          disabled={updateCharacterConfigLoading}
        >
          更新
        </Button>
      </Stack>
    </div>
  );
}

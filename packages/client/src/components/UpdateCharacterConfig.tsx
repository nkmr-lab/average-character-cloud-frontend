import { graphql, useLazyLoadQuery } from "react-relay";
import { UpdateCharacterConfig_rootQuery } from "./__generated__/UpdateCharacterConfig_rootQuery.graphql";
import {
  Button,
  Typography,
  Stack,
  Slider,
  TextField,
  Box,
  FormControlLabel,
  Checkbox,
} from "@mui/material";
import { Link } from "react-router-dom";
import * as utf8 from "../utils/utf8";
import useUpdateCharacterConfig from "../hooks/useUpdateCharacterConfig";
import React from "react";
import { useForm } from "react-hook-form";
import ignoreResult from "../utils/ignoreResult";
import { CheckBox } from "@mui/icons-material";

export type Props = {
  characterValue: string;
  strokeCount: number;
};

export default function UpdateCharacterConfig({
  characterValue,
  strokeCount,
}: Props): JSX.Element {
  const { characters } = useLazyLoadQuery<UpdateCharacterConfig_rootQuery>(
    graphql`
      query UpdateCharacterConfig_rootQuery(
        $character: CharacterValue!
        $strokeCount: Int!
      ) {
        characters(values: [$character]) {
          characterConfig(strokeCount: $strokeCount) {
            character {
              value
            }
            ratio
            disabled
          }
        }
      }
    `,
    { character: characterValue, strokeCount },
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
  } = useForm<{ ratio: number; enabled: boolean }>({
    mode: "onChange",
    defaultValues: {
      ratio: characterConfig.ratio,
    },
  });

  return (
    <div>
      <Stack
        spacing={2}
        component="form"
        onSubmit={ignoreResult(
          handleSubmit(({ ratio, enabled }) => {
            updateCharacterConfig({
              input: {
                character: characterConfig.character.value,
                strokeCount,
                ratio,
                disabled: !enabled,
              },
            });
          })
        )}
      >
        <Typography variant="h6">
          「{characterConfig.character.value}」({strokeCount}画)の文字設定
        </Typography>
        <TextField
          label="この画数の採用割合(%)"
          error={!!errors.ratio}
          helperText={errors.ratio?.message}
          {...register("ratio", {
            required: { value: true, message: "必須項目です" },
            min: { value: 1, message: "1～100%の間で入力してください" },
            max: { value: 100, message: "1～100%の間で入力してください" },
          })}
        />
        <FormControlLabel
          control={
            <Checkbox
              {...register("enabled", {})}
              defaultChecked={!characterConfig.disabled}
            />
          }
          label="この画数の文字を利用する"
        />
        <Button
          variant="contained"
          disabled={updateCharacterConfigLoading}
          type="submit"
        >
          保存
        </Button>
        <Button
          component={Link}
          to={`/figure-records/create/i/${utf8.toBase64(characterValue)}`}
        >
          別の画数を登録する
        </Button>
      </Stack>
    </div>
  );
}

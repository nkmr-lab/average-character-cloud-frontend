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
  FormHelperText,
  FormGroup,
} from "@mui/material";
import { Link } from "react-router-dom";
import * as utf8 from "../utils/utf8";
import useUpdateCharacterConfig from "../hooks/useUpdateCharacterConfig";
import React from "react";
import { Controller, useForm } from "react-hook-form";
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

  const [updateCharacterConfig, updateCharacterConfigLoading] =
    useUpdateCharacterConfig();

  const {
    register,
    handleSubmit,
    formState: { errors },
    control,
  } = useForm<{ ratio: number; enabled: boolean }>({
    mode: "onChange",
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
        <FormGroup>
          <Typography variant="subtitle2">この画数の採用割合</Typography>
          <FormHelperText>
            「{characterConfig.character.value}
            」の別の画数の形状が登録されている時にどのくらいの割合で
            {strokeCount}
            画の形状を利用するかを設定します。通常は100%で問題ありません。
          </FormHelperText>
          <Controller
            name="ratio"
            control={control}
            defaultValue={characterConfig.ratio}
            render={({ field }) => (
              <Slider
                {...field}
                max={100}
                step={1}
                valueLabelDisplay="auto"
                valueLabelFormat={(value) => `${value}%`}
              />
            )}
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
          <FormHelperText>
            チェックを外すと「{characterConfig.character.value}」({strokeCount}
            画)の全ての文字形状は文章生成時に利用されなくなります。
          </FormHelperText>
        </FormGroup>
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

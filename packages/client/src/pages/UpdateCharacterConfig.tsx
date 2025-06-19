import { graphql, useLazyLoadQuery } from "react-relay";
import { UpdateCharacterConfig_rootQuery } from "./__generated__/UpdateCharacterConfig_rootQuery.graphql";
import { useForm } from "react-hook-form";
import { Button, TextField, Typography, Stack, Slider } from "@mui/material";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useSnackbar } from "notistack";
import ignoreResult from "../utils/ignoreResult";
import * as utf8 from "../utils/utf8";
import useUpdateCharacterConfig from "../hooks/useUpdateCharacterConfig";
import { useInDialog } from "../hooks/useBackground";
import React from "react";

export default function UpdateCharacterConfig(): JSX.Element {
  const params = useParams();
  const characterValue = utf8.fromBase64(params.character!);
  const strokeCount = Number(params.strokeCount!);
  const navigate = useNavigate();

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

  const [ratio, setRatio] = React.useState<number>(characterConfig.ratio);

  const inDialog = useInDialog();

  return (
    <div>
      <Typography variant="h6">
        「{characterConfig.character.value}」({strokeCount}画)の文字設定変更
      </Typography>
      <Stack
        spacing={2}
        component="form"
        onSubmit={() => {
          updateCharacterConfig({
            input: {
              character: characterConfig.character.value,
              strokeCount,
              ratio: Number(ratio),
            },
            onSuccess: () => {
              if (inDialog) {
                navigate(-1);
              }
            },
          });
        }}
      >
        <Typography>この画数の採用割合(%)</Typography>
        <Slider
          min={1}
          max={100}
          step={1}
          value={ratio}
          onChange={(_, value) => {
            setRatio(value as number);
          }}
        ></Slider>
        <Button
          type="submit"
          variant="contained"
          disabled={updateCharacterConfigLoading}
        >
          更新
        </Button>
        <Button
          component={Link}
          to={`/character-configs/create?${new URLSearchParams([
            ["character", utf8.toBase64(characterValue)],
          ]).toString()}`}
        >
          別の画数を登録する
        </Button>
      </Stack>
    </div>
  );
}

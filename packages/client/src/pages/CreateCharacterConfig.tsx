import { useForm } from "react-hook-form";
import {
  Box,
  Button,
  CircularProgress,
  TextField,
  Typography,
} from "@mui/material";
import { Stack } from "@mui/system";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import ListCharacterConfigSeeds from "../components/ListCharacterConfigSeeds";
import { Suspense } from "react";
import useCreateCharacterConfig from "../hooks/useCreateCharacterConfig";
import ignoreResult from "../utils/ignoreResult";
import * as utf8 from "../utils/utf8";

export default function CreateCharacterConfig(): JSX.Element {
  const [createCharacterConfig, createCharacterConfigLoading] =
    useCreateCharacterConfig();
  const navigate = useNavigate();
  const [queryParams] = useSearchParams();
  const characterValue = queryParams.get("character") ?? undefined;
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
  } = useForm<{ character: string; strokeCount: string }>({
    mode: "onChange",
    defaultValues: {
      character: characterValue,
    },
  });

  const character = watch("character") ?? "";

  return (
    <div>
      <Typography variant="h6">文字設定新規作成</Typography>
      <Box sx={{ mb: 2 }}>
        <Stack
          spacing={2}
          component="form"
          onSubmit={ignoreResult(
            handleSubmit(({ character, strokeCount }) => {
              createCharacterConfig({
                input: { character, strokeCount: parseInt(strokeCount) },
                onSuccess: () => {
                  reset();
                  if (characterValue !== undefined) {
                    navigate(-1);
                  }
                },
              });
            })
          )}
        >
          <TextField
            label="文字"
            error={!!errors.character}
            helperText={errors.character?.message}
            {...register("character", {
              required: { value: true, message: "必須項目です" },
              minLength: { value: 1, message: "1文字で入力してください" },
              maxLength: { value: 1, message: "1文字で入力してください" },
            })}
            disabled={characterValue !== undefined}
          />
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
            disabled={createCharacterConfigLoading}
          >
            登録
          </Button>
          <Button
            variant="contained"
            component={Link}
            disabled={character.length !== 1}
            to={`/characters/character/${encodeURIComponent(
              utf8.toBase64(character)
            )}/figure-records/create`}
          >
            字を書いて自動で画数を識別する
          </Button>
        </Stack>
      </Box>
      {characterValue === undefined && (
        <Box>
          <Typography variant="h6">他人の設定から文字設定を登録</Typography>
          <Suspense fallback={<CircularProgress />}>
            <ListCharacterConfigSeeds />
          </Suspense>
        </Box>
      )}
    </div>
  );
}

import { useForm } from "react-hook-form";
import {
  Box,
  Button,
  CircularProgress,
  TextField,
  Typography,
} from "@mui/material";
import { Stack } from "@mui/system";
import { Link, useSearchParams } from "react-router-dom";
import ListCharacterConfigSeeds from "../components/ListCharacterConfigSeeds";
import { Suspense } from "react";
import * as utf8 from "../utils/utf8";

export default function CreateCharacterConfig(): JSX.Element {
  const [queryParams] = useSearchParams();
  // TODO: base64
  const characterValue = queryParams.get("character") ?? undefined;
  const {
    register,
    formState: { errors },
    watch,
  } = useForm<{ character: string }>({
    mode: "onChange",
    defaultValues: {
      character: characterValue,
    },
  });

  const character = watch("character") ?? "";

  return (
    <div>
      <Typography variant="h6">文字新規作成</Typography>
      <Box sx={{ mb: 2 }}>
        <Stack spacing={2} component="form">
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
          <Button
            variant="contained"
            component={Link}
            disabled={character.length !== 1}
            to={`/figure-records/create/i/${utf8.toBase64(character)}`}
          >
            字を追加
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

import { Button, Stack, TextField, Typography } from "@mui/material";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import { ParamsJSON as BulkCreateFigureRecordsParamsJSON } from "./BulkCreateFigureRecords";
import * as utf8 from "../utils/utf8";

export default function CreateFormBulkCreateFigureRecords(): JSX.Element {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<{
    characters: string;
    number: number;
  }>({
    mode: "onChange",
    defaultValues: {
      characters: "",
      number: 3,
    },
  });

  return (
    <div>
      <Typography variant="h6">一括文字登録フォーム作成</Typography>
      <Stack
        spacing={2}
        component="form"
        onSubmit={handleSubmit(({ characters, number }) => {
          const paramsJSON: BulkCreateFigureRecordsParamsJSON = {
            characters: [...characters],
            number,
          };
          open(
            `/figure-records/bulk-create/id/${utf8.toBase64(
              JSON.stringify(paramsJSON)
            )}?hidden_app_bar=true`
          );
        })}
      >
        <TextField
          label="登録する文字"
          type="text"
          error={!!errors.characters}
          helperText={errors.characters?.message}
          {...register("characters", {
            required: { value: true, message: "必須項目です" },
            min: { value: 1, message: "1〜100文字にしてください" },
            max: { value: 100, message: "1〜100文字にしてください" }, // TODO: サロゲートペアを考慮する
          })}
        />
        <TextField
          label="1文字当たりの個数"
          type="number"
          error={!!errors.number}
          helperText={errors.number?.message}
          {...register("number", {
            required: { value: true, message: "必須項目です" },
            min: { value: 1, message: "1〜10にしてください" },
            max: { value: 10, message: "1〜10にしてください" },
          })}
        />
        <Button type="submit" variant="contained">
          フォームを作成
        </Button>
      </Stack>
    </div>
  );
}

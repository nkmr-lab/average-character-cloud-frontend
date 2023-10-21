import { Button, Stack, TextField, Typography } from "@mui/material";
import React from "react";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";

export default function CreateFormBulkCreateFigureRecords(): JSX.Element {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<{
    charactors: string;
    number: number;
  }>({
    mode: "onChange",
    defaultValues: {
      charactors: "",
      number: 3,
    },
  });

  const navigate = useNavigate();

  return (
    <div>
      <Typography variant="h6">一括文字登録フォーム作成</Typography>
      <Stack
        spacing={2}
        component="form"
        onSubmit={handleSubmit(({ charactors, number }) => {
          const searchParams = new URLSearchParams();
          searchParams.set("charactors", charactors);
          searchParams.set("number", number.toString());
          navigate(`/figure-records/bulk-create/?${searchParams.toString()}`);
        })}
      >
        <TextField
          label="登録する文字"
          type="text"
          error={!!errors.charactors}
          helperText={errors.charactors?.message}
          {...register("charactors", {
            required: { value: true, message: "必須項目です" },
            min: { value: 1, message: "1〜100文字にしてください" },
            max: { value: 100, message: "1〜100文字にしてください" },
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

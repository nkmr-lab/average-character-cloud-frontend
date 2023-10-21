import {
  graphql,
  useFragment,
  useLazyLoadQuery,
  useMutation,
  useSubscribeToInvalidationState,
} from "react-relay";
import React from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { CreateFigureRecord_rootQuery } from "./__generated__/CreateFigureRecord_rootQuery.graphql";
import { CreateFigureRecord_characterConfig$key } from "./__generated__/CreateFigureRecord_characterConfig.graphql";
import { CreateFigureRecord_createFigureRecordMutation } from "./__generated__/CreateFigureRecord_createFigureRecordMutation.graphql";
import Button from "@mui/material/Button";
import { formatError } from "../domains/error";
import { useSnackbar } from "notistack";
import { useBackground } from "../hooks/useBackground";
import {
  Alert,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  Typography,
} from "@mui/material";
import useCreateCharacterConfig from "../hooks/useCreateCharacterConfig";
import * as utf8 from "../utils/utf8";
import ignoreResult from "../utils/ignoreResult";
import useUpdateCharacterConfig from "../hooks/useUpdateCharacterConfig";
import CanvasIframe, { CanvasIframeClient } from "../components/CanvasIframe";

export default function BulkCreateFigureRecords(): JSX.Element {
  const [searchParams] = useSearchParams();
  const charactors = searchParams.get("charactors");
  const numberStr = searchParams.get("number");
  const number = numberStr !== null ? parseInt(numberStr, 10) : null;

  if (
    charactors === null ||
    number === null ||
    !Number.isInteger(number) ||
    charactors.length < 1 ||
    100 < charactors.length ||
    number < 1 ||
    10 < number
  ) {
    throw Error("invalid query params");
  }

  return (
    <div>
      <Typography variant="h6">一括文字登録</Typography>
    </div>
  );
}

import * as icons from "@mui/icons-material";
import { IconButton, Tooltip } from "@mui/material";
import { Link } from "react-router-dom";
import { useBackground } from "../hooks/useBackground";

import * as FigureRendererTypes from "../domains/FigureRendererTypes";
import * as utf8 from "../utils/utf8";
import { svgPartToImageUrl } from "../domains/figure_drawer";

export type Props = {
  updateSeed?: () => void;
  figure: FigureRendererTypes.Figure;
};

export default function AverageFigureRecords({
  updateSeed,
  figure,
}: Props): JSX.Element {
  const background = useBackground();

  return (
    <>
      {figure.type === "image_url" ? (
        <img
          src={svgPartToImageUrl(figure.svgPart, {
            width: 256,
            height: 256,
          })}
          width={figure.size}
          height={figure.size}
          onClick={() => {
            updateSeed?.();
          }}
        />
      ) : (
        <Tooltip title="登録されていない文字です">
          <IconButton
            component={Link}
            to={`/characters/character/${encodeURIComponent(
              utf8.toBase64(figure.value)
            )}/figure-records/create`}
            state={{ background }}
            sx={{
              width: figure.size,
              height: figure.size,
              verticalAlign: "unset",
            }}
            color="error"
          >
            <icons.ErrorOutline sx={{ fontSize: figure.size }} />
          </IconButton>
        </Tooltip>
      )}
    </>
  );
}

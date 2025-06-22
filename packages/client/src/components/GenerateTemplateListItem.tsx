import { graphql, useFragment, useMutation } from "react-relay";
import { GenerateTemplateListItem_generateTemplate$key } from "./__generated__/GenerateTemplateListItem_generateTemplate.graphql";
import {
  IconButton,
  ListItem,
  ListItemSecondaryAction,
  ListItemButton,
} from "@mui/material";
import { GenerateTemplateListItem_deleteGenerateTemplateMutation } from "./__generated__/GenerateTemplateListItem_deleteGenerateTemplateMutation.graphql";
import { formatError } from "../domains/error";
import { useSnackbar } from "notistack";
import * as icons from "@mui/icons-material";
import { GenerateTemplate } from "../domains/GenerateTemplate";

type Props = {
  generateTemplateKey: GenerateTemplateListItem_generateTemplate$key;
  onClick?: (generateTemplate: GenerateTemplate) => void;
  onDelete?: (generateTemplateId: string) => void;
};

export default function GenerateTemplateListItem({
  generateTemplateKey,
  onClick,
  onDelete,
}: Props): JSX.Element {
  const generateTemplate =
    useFragment<GenerateTemplateListItem_generateTemplate$key>(
      graphql`
        fragment GenerateTemplateListItem_generateTemplate on GenerateTemplate {
          generateTemplateId
          backgroundImageFile {
            downloadUrl
            size
            mimeType
          }
          fontColor
          writingMode
          marginBlockStart
          marginInlineStart
          lineSpacing
          letterSpacing
          fontSize
          fontWeight
        }
      `,
      generateTemplateKey
    );

  const [deleteGenerateTemplate, _deleteGenerateTemplateLoading] =
    useMutation<GenerateTemplateListItem_deleteGenerateTemplateMutation>(
      graphql`
        mutation GenerateTemplateListItem_deleteGenerateTemplateMutation(
          $input: DeleteGenerateTemplateInput!
        ) {
          deleteGenerateTemplate(input: $input) {
            id @deleteRecord
            errors {
              message
            }
          }
        }
      `
    );

  const { enqueueSnackbar } = useSnackbar();

  return (
    <ListItem>
      <img
        src={generateTemplate.backgroundImageFile.downloadUrl}
        alt="Template"
        style={{ width: "64px", height: "64px", objectFit: "cover" }}
      />
      <ListItemButton
        onClick={() => {
          const writingMode =
            generateTemplate.writingMode === "HORIZONTAL"
              ? "horizontal"
              : generateTemplate.writingMode === "VERTICAL"
              ? "vertical"
              : "horizontal";
          onClick?.({
            id: generateTemplate.generateTemplateId,
            backgroundImage: {
              url: generateTemplate.backgroundImageFile.downloadUrl,
              size: generateTemplate.backgroundImageFile.size,
              mimeType: generateTemplate.backgroundImageFile.mimeType,
            },
            fontColor: generateTemplate.fontColor,
            writingMode,
            marginBlockStart: generateTemplate.marginBlockStart,
            marginInlineStart: generateTemplate.marginInlineStart,
            lineSpacing: generateTemplate.lineSpacing,
            letterSpacing: generateTemplate.letterSpacing,
            fontSize: generateTemplate.fontSize,
            fontWeight: generateTemplate.fontWeight,
          });
        }}
      >
        このテンプレートを使用する
      </ListItemButton>
      <ListItemSecondaryAction>
        <IconButton
          onClick={() => {
            deleteGenerateTemplate({
              variables: {
                input: {
                  generateTemplateId: generateTemplate.generateTemplateId,
                },
              },
              onCompleted: ({ deleteGenerateTemplate }) => {
                if (
                  !deleteGenerateTemplate ||
                  /* deleteGenerateTemplateは型的にはnullになることはないはずだが、relayの@deleteRecordを使っている関係かなぜかnullになるのでworkaround */
                  !deleteGenerateTemplate.errors
                ) {
                  enqueueSnackbar("テンプレートを削除しました", {
                    variant: "success",
                  });
                  onDelete?.(generateTemplate.generateTemplateId);
                } else {
                  for (const error of deleteGenerateTemplate.errors) {
                    enqueueSnackbar(error.message, {
                      variant: "error",
                    });
                  }
                }
              },
              onError: (error) => {
                enqueueSnackbar(formatError(error), {
                  variant: "error",
                });
              },
            });
          }}
        >
          <icons.Delete />
        </IconButton>
      </ListItemSecondaryAction>
    </ListItem>
  );
}

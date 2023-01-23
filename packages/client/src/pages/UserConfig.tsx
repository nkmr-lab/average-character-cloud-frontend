import {
  graphql,
  useFragment,
  useLazyLoadQuery,
  useMutation,
} from "react-relay";
import { UserConfig_rootQuery } from "./__generated__/UserConfig_rootQuery.graphql";
import { UserConfig_userConfig$key } from "./__generated__/UserConfig_userConfig.graphql";
import { UserConfig_userConfigMutation } from "./__generated__/UserConfig_userConfigMutation.graphql";
import { useForm } from "react-hook-form";
import {
  Button,
  Typography,
  Stack,
  Checkbox,
  FormControlLabel,
  FormGroup,
  FormHelperText,
} from "@mui/material";
import { formatError } from "../domains/error";
import { useSnackbar } from "notistack";
import ignoreResult from "../utils/ignoreResult";

export default function UserConfig(): JSX.Element {
  const { userConfig: userConfigKey } = useLazyLoadQuery<UserConfig_rootQuery>(
    graphql`
      query UserConfig_rootQuery {
        userConfig {
          ...UserConfig_userConfig
        }
      }
    `,
    { fetchPolicy: "store-and-network" }
  );

  const userConfig = useFragment<UserConfig_userConfig$key>(
    graphql`
      fragment UserConfig_userConfig on UserConfig {
        allowSharingCharacterConfigs
        allowSharingFigureRecords
      }
    `,
    userConfigKey
  );

  const [updateUserConfig, updateUserConfigLoading] =
    useMutation<UserConfig_userConfigMutation>(
      graphql`
        mutation UserConfig_userConfigMutation($input: UpdateUserConfigInput!) {
          updateUserConfig(input: $input) {
            userConfig {
              ...UserConfig_userConfig
              ...App_userConfig
            }
            errors {
              message
            }
          }
        }
      `
    );

  const { register, handleSubmit, getValues } = useForm<{
    allowSharingCharacterConfigs: boolean;
    allowSharingFigureRecords: boolean;
  }>({
    mode: "onChange",
  });

  const { enqueueSnackbar } = useSnackbar();

  return (
    <div>
      <Typography variant="h6">ユーザ設定</Typography>
      <Stack
        spacing={2}
        component="form"
        onSubmit={ignoreResult(
          handleSubmit(
            ({ allowSharingCharacterConfigs, allowSharingFigureRecords }) => {
              updateUserConfig({
                variables: {
                  input: {
                    allowSharingCharacterConfigs,
                    allowSharingFigureRecords,
                  },
                },
                onCompleted: ({ updateUserConfig }) => {
                  if (updateUserConfig.errors === null) {
                    enqueueSnackbar("ユーザ設定を更新しました", {
                      variant: "success",
                    });
                  } else {
                    for (const error of updateUserConfig.errors) {
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
            }
          )
        )}
      >
        <FormGroup>
          <Typography variant="subtitle1">共有設定</Typography>
          <FormHelperText>
            共有するデータを選択できます。デフォルトでは全て無効になっていますが他のユーザの利便性のため、できるだけ有効化をお願いします。ユーザIDは公開されません。
          </FormHelperText>
          <FormControlLabel
            control={
              <Checkbox
                {...register("allowSharingCharacterConfigs", {})}
                defaultChecked={userConfig.allowSharingCharacterConfigs}
              />
            }
            label="文字の設定を他のユーザの共有することを許可する"
          />
          <FormHelperText>
            チェックすると登録している文字と画数の情報が他のユーザと共有されます。書いた文字の形は共有されません。
          </FormHelperText>
          <FormControlLabel
            control={
              <Checkbox
                {...register("allowSharingFigureRecords", {})}
                defaultChecked={userConfig.allowSharingFigureRecords}
              />
            }
            label="書いた文字の形を他のユーザの共有することを許可する"
          />
          <FormHelperText>
            チェックすると書いた文字の形が他のユーザと共有されます。
          </FormHelperText>
        </FormGroup>

        <Button
          type="submit"
          variant="contained"
          disabled={updateUserConfigLoading}
        >
          保存
        </Button>
      </Stack>
    </div>
  );
}

import { graphQLSelector } from "recoil-relay";
import RelayEnvironment from "../RelayEnvironment";
import { graphql } from "react-relay";
import {
  user_loginUserQuery$variables,
  user_loginUserQuery$data,
} from "./__generated__/user_loginUserQuery.graphql";

export const loginUserIdQuery = graphQLSelector({
  key: "user/loginUserId",
  environment: RelayEnvironment,
  query: graphql`
    query user_loginUserQuery {
      loginUser {
        userId
      }
    }
  `,
  variables: (): user_loginUserQuery$variables => ({}),
  mapResponse: (data: user_loginUserQuery$data) =>
    data.loginUser?.userId ?? null,
});

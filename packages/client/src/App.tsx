import React, { Suspense } from "react";
import {
  RelayEnvironmentProvider,
  useFragment,
  useLazyLoadQuery,
} from "react-relay/hooks";
import { graphql } from "react-relay";
import RelayEnvironment from "./RelayEnvironment";
import {
  BrowserRouter,
  Routes,
  Route,
  Outlet,
  Link,
  useLocation,
  useNavigate,
  useSearchParams,
} from "react-router-dom";
import Index from "./pages/Index";
import ListCharacterConfigs from "./pages/ListCharacterConfigs";
import CreateFigureRecord from "./pages/CreateFigureRecord";
import BulkCreateFigureRecords from "./pages/BulkCreateFigureRecords";
import CreateCharacterConfig from "./pages/CreateCharacterConfig";
import Generate from "./pages/Generate";
import CssBaseline from "@mui/material/CssBaseline";
import { ErrorBoundary } from "react-error-boundary";
import {
  Alert,
  AppBar,
  Badge,
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogTitle,
  IconButton,
  Toolbar,
  Typography,
} from "@mui/material";
import { appEnv } from "./AppEnv";
import ListFigureRecords from "./pages/ListFigureRecords";
import UpdateCharacterConfig from "./pages/UpdateCharacterConfig";
import CreateFormBulkCreateFigureRecords from "./pages/CreateFormBulkCreateFigureRecords";
import { RecoilRoot, useRecoilValue, useRecoilValueLoadable } from "recoil";
import { loginUserIdQuery } from "./store/user";
import { LocationState } from "./types/LocationState";
import { App_userConfigQuery } from "./__generated__/App_userConfigQuery.graphql";
import { App_userConfig$key } from "./__generated__/App_userConfig.graphql";
import UserConfig from "./pages/UserConfig";
import { type SnackbarKey, SnackbarProvider, useSnackbar } from "notistack";
import * as icons from "@mui/icons-material";

function LoginChecker({
  children,
}: {
  children?: React.ReactNode;
}): JSX.Element {
  const loginUserId = useRecoilValue(loginUserIdQuery);

  return <>{loginUserId !== null ? children : <GoogleLogin />}</>;
}

function GoogleLogin(): JSX.Element {
  const googleLoginButtonRef = React.useRef<HTMLDivElement | null>(null);
  React.useEffect(() => {
    (globalThis as any).google.accounts.id.initialize({
      client_id: appEnv.googleClientId,
      login_uri: `${appEnv.origin}/backend/google_login_callback`,
      ux_mode: "redirect",
    });
    (globalThis as any).google.accounts.id.renderButton(
      googleLoginButtonRef.current,
      {}
    );
  }, []);

  return (
    <div>
      <div ref={googleLoginButtonRef}></div>
    </div>
  );
}

function Handler({ children }: { children?: React.ReactNode }): JSX.Element {
  return (
    <ErrorBoundary
      fallbackRender={({ error }) => {
        return (
          <Alert severity="error">
            <div>エラーが発生しました. リロードして再度お試し下さい.</div>
            <pre>{String(error)}</pre>
          </Alert>
        );
      }}
    >
      <Suspense fallback={<CircularProgress />}>
        <LoginChecker>{children}</LoginChecker>
      </Suspense>
    </ErrorBoundary>
  );
}

function UserConfigButtonBadge({ children }: { children?: React.ReactNode }) {
  const { userConfig: userConfigKey } = useLazyLoadQuery<App_userConfigQuery>(
    graphql`
      query App_userConfigQuery {
        userConfig {
          ...App_userConfig
        }
      }
    `,
    {},
    { fetchPolicy: "store-and-network" }
  );

  const userConfig = useFragment<App_userConfig$key>(
    graphql`
      fragment App_userConfig on UserConfig {
        updatedAt
      }
    `,
    userConfigKey
  );

  return userConfig.updatedAt === null ? (
    <Badge variant="dot" color="secondary">
      {children}
    </Badge>
  ) : (
    <>{children}</>
  );
}

function AppContainer(): JSX.Element {
  const loginUserIdLoadable = useRecoilValueLoadable(loginUserIdQuery);
  const [searchParams] = useSearchParams();
  const hiddenAppBar =
    Boolean(loginUserIdLoadable.valueMaybe()) &&
    searchParams.get("hidden_app_bar") === "true";

  const userConfigButton = (
    <Button component={Link} to="/user-config" color="inherit">
      ユーザ設定
    </Button>
  );

  return (
    <div>
      {!hiddenAppBar && (
        <AppBar position="static">
          <Toolbar>
            <Typography
              variant="h6"
              sx={{ flexGrow: 1, display: { xs: "none", sm: "block" } }}
            >
              Average Character Cloud
            </Typography>
            {loginUserIdLoadable.valueMaybe() ? (
              <>
                <Box>
                  <Button component={Link} to="/generate" color="inherit">
                    文章生成
                  </Button>
                  <Button
                    component={Link}
                    to="/character-configs"
                    color="inherit"
                  >
                    文字設定一覧
                  </Button>
                  <Button
                    component={Link}
                    to="/figure-records/bulk-create/create-form"
                    color="inherit"
                  >
                    一括文字登録フォーム作成
                  </Button>

                  <ErrorBoundary
                    fallbackRender={() => {
                      return <>{userConfigButton}</>;
                    }}
                  >
                    <Suspense fallback={userConfigButton}>
                      <UserConfigButtonBadge>
                        {userConfigButton}
                      </UserConfigButtonBadge>
                    </Suspense>
                  </ErrorBoundary>
                </Box>
                <form method="post" action="/backend/logout">
                  <Button type="submit" color="inherit">
                    Logout
                  </Button>
                </form>
              </>
            ) : null}
          </Toolbar>
        </AppBar>
      )}
      <Box component="main" sx={{ p: 2 }}>
        <Handler>
          <Outlet />
        </Handler>
      </Box>
    </div>
  );
}

function AppInner() {
  const location = useLocation();
  const state = location.state as LocationState;
  const navigate = useNavigate();
  const routes = (
    <>
      <Route index element={<Index />} />
      <Route path="generate" element={<Generate />} />
      <Route path="character-configs">
        <Route index element={<ListCharacterConfigs />} />
        <Route path="create" element={<CreateCharacterConfig />} />
        <Route path="character/:character">
          <Route path="update" element={<UpdateCharacterConfig />} />
        </Route>
      </Route>
      <Route path="characters/character/:character/figure-records">
        <Route index element={<ListFigureRecords />} />
        <Route path="create" element={<CreateFigureRecord />} />
      </Route>
      <Route path="figure-records">
        <Route path="bulk-create">
          <Route path="id/:id" element={<BulkCreateFigureRecords />} />
          <Route
            path="create-form"
            element={<CreateFormBulkCreateFigureRecords />}
          />
        </Route>
      </Route>
      <Route path="user-config" element={<UserConfig />} />
      <Route path="*" element={<div>Not found</div>}></Route>
    </>
  );
  const handleOnClose = React.useCallback(() => {
    navigate(-1);
  }, [navigate]);

  return (
    <>
      <Routes location={state?.background ?? location}>
        <Route path="/" element={<AppContainer />}>
          {routes}
        </Route>
      </Routes>
      {state?.background && (
        <Dialog key={state.background.key} open={true} onClose={handleOnClose}>
          <DialogTitle sx={{ m: 0, p: 2 }}>
            <IconButton
              onClick={handleOnClose}
              sx={{
                position: "absolute",
                right: 8,
                top: 8,
              }}
            >
              <icons.Close />
            </IconButton>
          </DialogTitle>
          <Handler>
            <div style={{ padding: 16 }}>
              <Routes>{routes}</Routes>
            </div>
          </Handler>
        </Dialog>
      )}
    </>
  );
}

function SnackbarClose({ id }: { id: SnackbarKey }) {
  const { closeSnackbar } = useSnackbar();

  return (
    <IconButton color="inherit" onClick={() => closeSnackbar(id)}>
      <icons.Close />
    </IconButton>
  );
}

function App() {
  return (
    <RelayEnvironmentProvider environment={RelayEnvironment}>
      <RecoilRoot>
        <CssBaseline />
        <SnackbarProvider
          maxSnack={2}
          action={(id) => <SnackbarClose id={id} />}
        >
          <BrowserRouter>
            <AppInner />
          </BrowserRouter>
        </SnackbarProvider>
      </RecoilRoot>
    </RelayEnvironmentProvider>
  );
}

export default App;

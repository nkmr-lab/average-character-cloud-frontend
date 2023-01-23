import {
  AppEnv,
  getEnv,
  decodeAppEnv,
} from "@average-character-cloud-frontend/app-env";

export interface AppConfig {
  port: number;
  backendUrl: string;
  staticRootDir: string;
  appEnv: AppEnv;
}

export function AppConfig(): AppConfig {
  return {
    port: parseInt(getEnv("PORT", "3000")),
    backendUrl: getEnv("BACKEND_URL"),
    staticRootDir: getEnv("STATIC_ROOT_DIR"),
    appEnv: decodeAppEnv(),
  };
}

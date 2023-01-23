export interface AppEnv {
  googleClientId: string;
  origin: string;
}

export function getEnv(name: string, defaultVal?: string): string {
  const val = process.env[name] ?? defaultVal;
  if (val === undefined) {
    throw new Error(`env.${name} is not defined`);
  }
  return val;
}

export function decodeAppEnv(): AppEnv {
  return {
    googleClientId: getEnv("GOOGLE_CLIENT_ID"),
    origin: getEnv("ORIGIN"),
  };
}

export function htmlInject(appEnv: AppEnv, html: string): string {
  return html.replace(
    new RegExp(`__APP_ENV__`, "g"),
    JSON.stringify(appEnv).replace(/</g, "\\u003c")
  );
}

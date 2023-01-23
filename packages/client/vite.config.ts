import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import relay from "vite-plugin-relay";
import * as path from "path";
import {
  decodeAppEnv,
  htmlInject,
} from "@average-character-cloud-frontend/app-env";
import { comlink } from "vite-plugin-comlink";

export default defineConfig(({ command }) => {
  return {
    plugins: [
      react(),
      relay,
      comlink(),
      command === "serve"
        ? (() => {
            const appEnv = decodeAppEnv();
            return {
              name: "appEnv-inject",
              transformIndexHtml: (html) => htmlInject(appEnv, html),
            };
          })()
        : null,
    ],
    worker: {
      plugins: [comlink()],
    },
    server: {
      port: 3000,
      host: "0.0.0.0",
      proxy: {
        "/backend": {
          target: "http://localhost:8080",
          rewrite: (path) => path.replace(/^\/backend/, ""),
        },
      },
    },
    build: {
      rollupOptions: {
        input: {
          main: path.resolve(__dirname, "index.html"),
          canvas: path.resolve(__dirname, "canvas/index.html"),
        },
      },
    },
  };
});

import Koa from "koa";
import koaStatic from "koa-static";
import * as path from "path";
import { AppConfig } from "./AppConfig";
import * as fs from "fs/promises";
import proxy from "koa-proxies";
import { htmlInject } from "@average-character-cloud-frontend/app-env";
function main() {
  const app = new Koa();
  const appConfig = AppConfig();

  app.use(
    proxy("/backend", {
      target: appConfig.backendUrl,
      changeOrigin: true,
      rewrite: (path) => path.replace(/^\/backend/, "/"),
    })
  );

  app.use(
    koaStatic(appConfig.staticRootDir, {
      setHeaders(res, path) {
        if (path.startsWith("/assets/")) {
          res.setHeader(
            "cache-control",
            `public, max-age=${60 * 60 * 24 * 30}, immutable`
          );
        }
      },
      index: false,
    })
  );

  app.use(async (ctx) => {
    const body = await fs.readFile(
      path.join(appConfig.staticRootDir, ".index.html"),
      "utf8"
    );

    ctx.body = htmlInject(appConfig.appEnv, body);
  });

  app.listen(appConfig.port);
}

main();

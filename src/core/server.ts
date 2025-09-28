import http from "node:http";
import { ListenOptions } from "node:net";
import { StatusCodes, ReasonPhrases } from "http-status-codes";

import { logger } from "@/common/logger";

import { Handler, ServerRequest, ServerResponse } from "./types";
import { matchRouterHandler } from "./router";

export function createServer(
  serverOptions: http.ServerOptions,
  routerMap: Record<string, Handler>
): http.Server {
  const handler = async (
    req: http.IncomingMessage,
    res: http.ServerResponse
  ) => {
    const url = new URL(
      req.url ?? "/",
      `http://${req.headers.host ?? "localhost"}`
    );

    const reqObj: ServerRequest = {
      urlObj: url,
      headers: req.headers,
      method: req.method || "GET",
      query: Object.fromEntries(url.searchParams.entries()),
      url: url.pathname,
      params: {}, // Placeholder for route params
    };

    const resObj: ServerResponse = {
      statusCode: StatusCodes.OK,
      status: function status(code: number) {
        this.statusCode = code;
        return this;
      },
      send: function (body: Record<string, unknown> | string) {
        res.writeHead(this.statusCode, {
          "Content-Type": "text/json",
        });
        res.end(JSON.stringify(body));
        return this;
      },
    };

    const routeHandler = matchRouterHandler(routerMap, reqObj);

    try {
      await routeHandler(reqObj, resObj);
    } catch (err) {
      resObj.status(StatusCodes.INTERNAL_SERVER_ERROR).send({
        message: ReasonPhrases.INTERNAL_SERVER_ERROR,
      });
      errorHandler(err);
    }
  };

  return http.createServer(serverOptions, handler);
}

export async function listenWithGracefulShutdown(
  server: http.Server,
  options: ListenOptions,
  handleShutdown: () => void
) {
  server.listen(options, () => {
    logger.info(`SERVER: Server listening in ${JSON.stringify(options)}...`);
  });

  process.on("SIGINT", handleShutdown);
  process.on("SIGTERM", handleShutdown);

  process.on("uncaughtException", errorHandler);
  process.on("unhandledRejection", errorHandler);
  process.on("error", (err) => {
    errorHandler(err);
    process.exit(1);
  });
}

function errorHandler(err: unknown) {
  if (err instanceof Error) {
    logger.error(`${err.message}`);
    if (err.stack) {
      logger.error(`Stack trace: ${err.stack}`);
    }
  }
  try {
    logger.error(`${JSON.stringify(err)}`);
  } catch {
    logger.error("Non-error thrown and could not stringify.");
  }
}

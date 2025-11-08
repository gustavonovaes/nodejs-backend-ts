import http from "node:http";
import { ListenOptions } from "node:net";

import { ReasonPhrases, StatusCodes } from "http-status-codes";

import logger from "@/common/logger";

import { IHandler, IServerRequest, IServerResponse } from "./types";
import { matchRouterHandler } from "./router";

const logPrefix = `[PID: ${process.pid}]`;

export function startServerAndListen(
  serverOptions: http.ServerOptions,
  listenOptions: ListenOptions,
  routerMap: Record<string, IHandler>
) {
  const server = createServer(serverOptions, routerMap);
  listenWithGracefulShutdown(server, listenOptions);
}

export function createServer(
  serverOptions: http.ServerOptions,
  routerMap: Record<string, IHandler>
): http.Server {
  const handler = async (
    req: http.IncomingMessage,
    res: http.ServerResponse
  ) => {
    const url = new URL(
      req.url || "",
      `http://${req.headers.host ?? "localhost"}`
    );

    const reqObj: IServerRequest = {
      urlObject: url,
      method: req.method || "GET",
      headers: req.headers,
      query: Object.fromEntries(url.searchParams.entries()),
      url: url.pathname,
      params: {},
    };

    const resObj: IServerResponse = {
      statusCode: StatusCodes.OK,
      status: function status(code: number) {
        this.statusCode = code;
        return this;
      },
      send: function (body: Record<string, unknown> | string) {
        res.writeHead(this.statusCode, { "Content-Type": "application/json" });
        res.statusCode = this.statusCode;
        res.end(JSON.stringify(body));
        return this;
      },
    };

    try {
      const routeHandler = matchRouterHandler(routerMap, reqObj);
      await routeHandler(reqObj, resObj);
    } catch (error) {
      resObj
        .status(StatusCodes.INTERNAL_SERVER_ERROR)
        .send({ error: ReasonPhrases.INTERNAL_SERVER_ERROR });
      errorHandler(error);
    }
  };

  const server = http.createServer(serverOptions, handler);
  return server;
}

export function listenWithGracefulShutdown(
  server: http.Server,
  listenOptions: ListenOptions
) {
  server.listen(listenOptions, () => {
    logger.info(
      `${logPrefix} Worker started and listening on ${listenOptions?.host}:${listenOptions.port}`
    );
  });

  process.on("SIGINT", handleShutdown({ server }));
  process.on("SIGTERM", handleShutdown({ server }));
  process.on("uncaughtException", errorHandler);
  process.on("unhandledRejection", errorHandler);
}

function handleShutdown({ server }: { server: http.Server }) {
  return async () => {
    logger.info(`${logPrefix} Worker shutting down...`);

    server.close(() => {
      logger.info(`${logPrefix} Worker has closed all connections.`);
      process.exit(0);
    });
  };
}

function errorHandler(error: unknown) {
  if (error instanceof Error) {
    logger.error(error.message);
    if (error.stack) {
      logger.error(error.stack);
    }
    return;
  }

  try {
    logger.error(`${JSON.stringify(error)}`);
  } catch {
    logger.error("Non-error thrown and could not stringify.");
  }
}

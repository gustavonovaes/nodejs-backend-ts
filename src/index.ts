import "dotenv/config";
import cluster from "node:cluster";
import os from "node:os";
import http from "node:http";

import constants from "@/core/constants";
import { createServer, listenWithGracefulShutdown } from "@/core/server";
import { logger } from "@/common/logger";

import { createRoutes as createRoutesHealthcheck } from "@/modules/healthcheck/healthcheck.routes";

const numCPUs = Math.min(
  os.cpus().length,
  parseInt(process.env.MAX_NUM_CPUS ?? constants.MAX_NUM_CPUS.toString())
);

if (cluster.isPrimary) {
  logger.info(`SERVER: Primary ${process.pid} is running`);

  for (let i = 0; i < numCPUs; i++) {
    cluster.fork();
  }

  cluster.on("exit", (worker, code, signal) => {
    logger.info(
      `SERVER: Worker ${worker.process.pid} died, code: ${code}, signal: ${signal}`
    );
    logger.info(`SERVER: Starting a new worker, PID ${process.pid}`);
    cluster.fork();
  });
} else {
  (async () => {
    const routes = {
      ...createRoutesHealthcheck(),
    };

    const serverOptions = {
      requestTimeout: parseInt(
        process.env.SERVER_REQUEST_TIMEOUT ??
          constants.DEFAULT_SERVER_REQUEST_TIMEOUT_MS.toString()
      ),
    };

    const server = createServer(serverOptions, routes);

    const listenOptions = {
      port: parseInt(process.env.PORT ?? constants.DEFAULT_PORT.toString()),
      host: process.env.HOST ?? constants.DEFAULT_HOST,
    };

    await listenWithGracefulShutdown(
      server,
      listenOptions,
      handleShutdown({ server })
    );

    logger.info(`SERVER: Worker ${process.pid} started`);
  })();
}

function handleShutdown({ server }: { server: http.Server }) {
  return async () => {
    logger.info(`SERVER: Worker ${process.pid} shutting down...`);

    server.close(() => {
      logger.info(`SERVER: Worker ${process.pid} has closed all connections.`);
      process.exit(0);
    });
  };
}

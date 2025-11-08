import "dotenv/config";
import os from "node:os";
import cluster from "node:cluster";

import {
  DEFAULT_PORT,
  DEFAULT_HOST,
  MAX_WORKERS,
  SERVER_REQUEST_TIMEOUT_MS,
} from "@/constants";
import logger from "@/common/logger";
import { startServerAndListen } from "@/core/server";

import routes from "./routes";

const numCpus = os.cpus().length;
const maxWorkers = parseInt(process.env.MAX_WORKERS || MAX_WORKERS.toString());

if (cluster.isPrimary) {
  startWorkers();
} else {
  const serverOptions = {
    requestTimeout: parseInt(
      process.env.SERVER_REQUEST_TIMEOUT ??
        SERVER_REQUEST_TIMEOUT_MS.toString()
    ),
  };

  const listenOptions = {
    port: parseInt(process.env.PORT ?? DEFAULT_PORT.toString()),
    host: process.env.HOST ?? DEFAULT_HOST,
  };

  startServerAndListen(serverOptions, listenOptions, routes);
}

function startWorkers() {
  logger.info(
    `Primary cluster setting up ${Math.min(maxWorkers, numCpus)} workers...`
  );

  for (let i = 0; i < Math.min(maxWorkers, numCpus); i++) {
    cluster.fork();
  }

  cluster.on("exit", (worker, code, signal) => {
    logger.info(
      `Worker ${worker.process.pid} died with code: ${code}, and signal: ${signal}`
    );

    logger.info(`Starting a new worker ${process.pid}...`);
    cluster.fork();
  });
}

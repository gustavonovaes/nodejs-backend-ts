import { StatusCodes, ReasonPhrases } from "http-status-codes";

import { logger } from "@/common/logger";

import { Handler, Middleware } from "./types";
import constants from "./constants";

export function middlewareStack(...middlewares: Middleware[]) {
  return (handler: Handler): Handler => {
    return middlewares.reduceRight(
      (next, middleware) => middleware(next),
      handler
    );
  };
}

export function middlewareLogging(handler: Handler): Handler {
  return async (req, res) => {
    const start = performance.now();
    await handler(req, res);
    const duration = performance.now() - start;

    logger.info(
      `PID:${process.pid} - ${req.method} - ${req.url}${
        Object.keys(req.query).length > 0 ? "?" + JSON.stringify(req.query) : ""
      } - ${res.statusCode} - ${duration.toFixed(5)}ms`
    );
  };
}

export function middlewareEnsureSecretKey(secretKey: string): Middleware {
  return (handler: Handler): Handler => {
    return async (req, res) => {
      const reqSecretKey = req.headers["x-secret-key"];
      if (reqSecretKey !== secretKey) {
        res
          .status(StatusCodes.FORBIDDEN)
          .send({ message: ReasonPhrases.FORBIDDEN });
        return;
      }

      await handler(req, res);
    };
  };
}

export const withSecretKey = middlewareStack(
  middlewareLogging,
  middlewareEnsureSecretKey(process.env.SECRET_KEY ?? constants.SECRET_KEY)
);

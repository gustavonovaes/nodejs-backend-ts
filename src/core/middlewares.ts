import { StatusCodes, ReasonPhrases } from "http-status-codes";

import logger from "@/common/logger";

import { IHandler, IMiddleware } from "@/core/types";
import { DEFAULT_SECRET_KEY } from "@/constants";

export function middlewareStack(...middlewares: IMiddleware[]): IMiddleware {
  return (handler: IHandler): IHandler => {
    return middlewares.reduceRight(
      (next, middleware) => middleware(next),
      handler
    );
  };
}

export function middlewareLogging(handler: IHandler): IHandler {
  return async (req, res) => {
    const startTime = Date.now();

    try {
      await handler(req, res);
    } finally {
      const duration = Math.round(Date.now() - startTime);

      let url = req.url;
      if (Object.keys(req.query).length > 0) {
        url = `${url}?${JSON.stringify(req.query)}`;
      }
      logger.info(
        `[PID: ${process.pid}] ${
          req.method
        }: ${url} - Finished processing request in ${duration.toFixed(5)}ms.`
      );
    }
  };
}

export function middlewareEnsureSecretKey(secretKey: string): IMiddleware {
  return (handler: IHandler): IHandler => {
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
  middlewareEnsureSecretKey(process.env.SECRET_KEY ?? DEFAULT_SECRET_KEY)
);

import { StatusCodes } from "http-status-codes";
import { ServerRequest, ServerResponse } from "@/core/types";

export default class HealthcheckController {
  constructor() {}

  public get = async (_req: ServerRequest, res: ServerResponse) => {
    await new Promise<void>((resolve) => {
      setTimeout(() => {
        resolve();
      }, Math.random() * 200);
    });
    res.status(StatusCodes.OK).send({
      pid: process.pid,
    });
  };
}

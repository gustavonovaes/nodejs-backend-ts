import { StatusCodes } from "http-status-codes";

import { IServerRequest, IServerResponse } from "@/core/types";

export default class HealthcheckController {
  constructor() {}

  public get = async (_req: IServerRequest, res: IServerResponse) => {
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

import { ReasonPhrases, StatusCodes } from "http-status-codes";

import { IHandler, IServerRequest, IServerResponse } from "./types";

export function matchRouterHandler(
  routerMap: Record<string, IHandler>,
  req: IServerRequest
): IHandler {
  const reqUrlParts = req.urlObject.pathname.split("/");

  for (const route in routerMap) {
    const [routeMethod, routePath] = route.split(" ");
    if (routeMethod !== req.method) continue;

    const routeParts = routePath?.split("/") ?? [];
    if (routeParts.length !== reqUrlParts.length) continue;

    let isMatch = false;
    for (let i = 0; i < routeParts.length; i++) {
      const routePart = String(routeParts[i]);
      if (routePart.startsWith(":")) {
        req.params[routePart.substring(1)] = reqUrlParts[i] ?? "";
        continue;
      }

      isMatch = routePart === reqUrlParts[i];
    }

    if (isMatch) {
      return routerMap[route] ?? notFoundHandler;
    }
  }

  return notFoundHandler;
}

function notFoundHandler(_req: IServerRequest, res: IServerResponse): void {
  res.status(StatusCodes.NOT_FOUND).send({
    message: ReasonPhrases.NOT_FOUND,
  });
}

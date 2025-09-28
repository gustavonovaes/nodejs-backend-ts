import { ReasonPhrases, StatusCodes } from "http-status-codes";

import { Handler, ServerRequest, ServerResponse } from "./types";

export function matchRouterHandler(
  routerMap: Record<string, Handler>,
  req: ServerRequest
): Handler {
  const urlParts = req.urlObj.pathname.split("/");

  for (const route in routerMap) {
    const [method, path] = route.split(" ");
    if (method !== req.method) continue;

    const routeParts = path?.split("/") || [];
    if (routeParts.length !== urlParts.length) continue;

    let isMatch = false;

    for (let i = 0; i < routeParts.length; i++) {
      const param = String(routeParts[i]);
      if (param.startsWith(":")) {
        req.params[param.substring(1)] = urlParts[i] ?? "";
      } else {
        isMatch = routeParts[i] === urlParts[i];
      }
    }

    if (isMatch) {
      return routerMap[route] ?? notFoundHandler;
    }
  }

  return notFoundHandler;
}

function notFoundHandler(_req: ServerRequest, res: ServerResponse): void {
  res.status(StatusCodes.NOT_FOUND).send({
    message: ReasonPhrases.NOT_FOUND,
  });
}

import { describe, expect, it, beforeEach, vi } from "vitest";

import { mockResponseOkHandler } from "./server.test";
import { ServerRequest, ServerResponse } from "./types";

import { matchRouterHandler } from "./router";

const createRequestMock = (method: string, url: string) => {
  return {
    method,
    url,
    urlObj: new URL(`http://localhost${url}`),
    headers: {},
    query: {},
    params: {},
  } as unknown as ServerRequest;
};

describe("router", () => {
  let request: any;

  beforeEach(() => {
    request = createRequestMock("GET", "/test");
  });

  it("resolve corretamente um unico parametro de rota", async () => {
    matchRouterHandler(
      {
        "GET /foo/:foo": mockResponseOkHandler,
        "POST /foo/:foo": mockResponseOkHandler,
      },
      (request = createRequestMock("POST", "/foo/123"))
    );

    expect(request.params).toEqual({ foo: "123" });
  });

  it("resolve corretamente múltiplos parametro de rota", async () => {
    matchRouterHandler(
      {
        "PUT /foo/:foo/bar/:bar": mockResponseOkHandler,
      },
      (request = createRequestMock("PUT", "/foo/123/bar/456"))
    );

    expect(request.params).toEqual({ foo: "123", bar: "456" });
  });

  it("resolve o último valor informado para múltiplos parâmetros com o mesmo nome", async () => {
    matchRouterHandler(
      {
        "POST /foo/:foo/foo/:foo": mockResponseOkHandler,
      },
      (request = createRequestMock("POST", "/foo/123/foo/456"))
    );

    expect(request.params).toEqual({ foo: "456" });
  });

  it("retorna 404 para rota não encontrada", async () => {
    const res = {
      status: vi.fn().mockReturnThis(),
      send: vi.fn().mockReturnThis(),
    } as unknown as ServerResponse;

    const handler = matchRouterHandler(
      {},
      createRequestMock("POST", "/rota/nao/existe")
    );

    handler(request, res);
    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.send).toHaveBeenCalledWith({ message: "Not Found" });
  });
});

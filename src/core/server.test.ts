import { describe, expect, it, vi, beforeEach } from "vitest";
import supertest from "supertest";

import { createServer, listenWithGracefulShutdown } from "./server";
import { ServerRequest, ServerResponse } from "./types";

export const mockResponseOkHandler = async (
  req: ServerRequest,
  res: ServerResponse
) => {
  res.status(200).send({ status: "ok" });
};

export const createServerMock = (routes = {}) =>
  createServer({}, { ...routes });

describe("server", () => {
  let mockServer: any;

  beforeEach(() => {
    mockServer = createServerMock({
      "GET /test": mockResponseOkHandler,
    });
  });

  it("retorna 404 por padrão", async () => {
    await supertest(mockServer)
      .get("/nao-existe")
      .then((response) => {
        expect(response.status).toBe(404);
        expect(JSON.parse(response.text)).toEqual({ message: "Not Found" });
      });
  });

  it("por padrao retorna 200 em rota definida", async () => {
    await supertest(mockServer)
      .get("/test")
      .then((response) => {
        expect(response.status).toBe(200);
        expect(JSON.parse(response.text)).toEqual({ status: "ok" });
      });
  });

  it("campos do objeto de request", async () => {
    const server = createServerMock({
      "GET /test": async (req: ServerRequest, res: ServerResponse) => {
        res.send({
          method: req.method,
          url: req.url,
          headers: req.headers,
          query: req.query,
          params: req.params,
        });
      },
    });

    await supertest(server)
      .get("/test?foo=bar&baz=42")
      .set("X-Custom-Header", "Test")
      .then((response) => {
        expect(response.status).toBe(200);
        expect(JSON.parse(response.text)).toEqual({
          method: "GET",
          url: "/test",
          headers: expect.objectContaining({
            "x-custom-header": "Test",
          }),
          query: { foo: "bar", baz: "42" },
          params: {},
        });
      });
  });

  it("campos do objeto de response", async () => {
    const server = createServerMock({
      "GET /custom-response": async (
        req: ServerRequest,
        res: ServerResponse
      ) => {
        res
          .status(201)
          .send({ message: "Created", statusCode: res.statusCode });
      },
    });

    await supertest(server)
      .get("/custom-response")
      .then((response) => {
        expect(response.status).toBe(201);
        expect(JSON.parse(response.text)).toEqual({
          message: "Created",
          statusCode: 201,
        });
      });
  });

  it("retorna internal server error para exceptions não tratadas", async () => {
    const server = createServerMock({
      "GET /error": async (_req: ServerRequest, _res: ServerResponse) => {
        throw new Error("Unexpected error");
      },
    });

    await supertest(server)
      .get("/error")
      .then((response) => {
        expect(response.status).toBe(500);
        expect(JSON.parse(response.text)).toEqual({
          message: "Internal Server Error",
        });
      });
  });

  it("retorna internal server error para promises rejeitadas", async () => {
    const server = createServerMock({
      "GET /rejected": async (_req: ServerRequest, _res: ServerResponse) => {
        return Promise.reject(new Error("Promise rejected"));
      },
    });

    await supertest(server)
      .get("/rejected")
      .then((response) => {
        expect(response.status).toBe(500);
        expect(JSON.parse(response.text)).toEqual({
          message: "Internal Server Error",
        });
      });
  });

  it("resolve corretamente os query params", async () => {
    const server = createServerMock({
      "GET /test": async (req: ServerRequest, res: ServerResponse) => {
        res.send({ query: req.query });
      },
    });

    await supertest(server)
      .get("/test?term=nodejs&limit=10&sort=asc")
      .then((response) => {
        expect(response.status).toBe(200);
        expect(JSON.parse(response.text)).toEqual({
          query: { term: "nodejs", limit: "10", sort: "asc" },
        });
      });
  });

  it("encerra o servidor corretamente ao receber sinal SIGINT", async () => {
    const callback = vi.fn();

    const server = createServerMock({
      "GET /": async (_req: ServerRequest, res: ServerResponse) => {
        process.emit("SIGINT");
        res.send({ status: "ok" });
      },
    });

    await listenWithGracefulShutdown(
      mockServer,
      { port: 0, host: "localhost" },
      async () => {
        callback();
      }
    );

    await supertest(server)
      .get("/")
      .then((response) => {
        expect(response.status).toBe(200);
        expect(JSON.parse(response.text)).toEqual({ status: "ok" });
      });

    expect(callback).toHaveBeenCalled();
  });

  it("encerra o servidor corretamente ao receber sinal SIGTERM", async () => {
    const callback = vi.fn();

    const server = createServerMock({
      "GET /": async (_req: ServerRequest, res: ServerResponse) => {
        process.emit("SIGTERM");
        res.send({ status: "ok" });
      },
    });

    await listenWithGracefulShutdown(
      mockServer,
      { port: 0, host: "localhost" },
      async () => {
        callback();
      }
    );

    await supertest(server)
      .get("/")
      .then((response) => {
        expect(response.status).toBe(200);
        expect(JSON.parse(response.text)).toEqual({ status: "ok" });
      });

    expect(callback).toHaveBeenCalled();
  });

  it("errorHandler está configurado", async () => {
    const spyProcess = vi.spyOn(process, "on");

    await listenWithGracefulShutdown(
      mockServer,
      { port: 0, host: "localhost" },
      async () => {}
    );

    expect(spyProcess).toHaveBeenCalledWith(
      "uncaughtException",
      expect.any(Function)
    );
    expect(spyProcess).toHaveBeenCalledWith(
      "unhandledRejection",
      expect.any(Function)
    );
    expect(spyProcess).toHaveBeenCalledWith("error", expect.any(Function));
  });
});

import { describe, expect, it, beforeEach } from "vitest";
import supertest from "supertest";

import { createServerMock, mockResponseOkHandler } from "./server.test";
import constants from "./constants";

import { withSecretKey } from "./middlewares";

describe("middlewares", () => {
  let mockServer: any;

  beforeEach(() => {
    mockServer = createServerMock({
      "GET /test": withSecretKey(mockResponseOkHandler),
    });
  });

  it("retona 403 se não informar SECRET_KEY", async () => {
    await supertest(mockServer)
      .get("/test")
      .then((response) => {
        expect(response.status).toBe(403);
        expect(JSON.parse(response.text)).toEqual({ message: "Forbidden" });
      });
  });

  it("retona 403 se informar valor errado na SECRET_KEY", async () => {
    await supertest(mockServer)
      .get("/test")
      .set("x-secret-key", "invalid")
      .then((response) => {
        expect(response.status).toBe(403);
        expect(JSON.parse(response.text)).toEqual({ message: "Forbidden" });
      });
  });

  it("retorna 200 se informar SECRET_KEY correta", async () => {
    await supertest(mockServer)
      .get("/test")
      .set("x-secret-key", constants.SECRET_KEY)
      .then((response) => {
        expect(response.status).toBe(200);
        expect(JSON.parse(response.text)).toEqual({ status: "ok" });
      });
  });
});

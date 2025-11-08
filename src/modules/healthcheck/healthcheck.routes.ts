import { withSecretKey } from "@/core/middlewares";

import HealthcheckController from "./healthcheck.controller";

export function createRoutes() {
  const healthcheckController = new HealthcheckController();

  return {
    "GET /healthcheck": withSecretKey(healthcheckController.get),
  };
}

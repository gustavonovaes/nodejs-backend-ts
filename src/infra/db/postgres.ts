import { Client } from "pg";

import logger from "@/common/logger";
import { DATABASE_CONNECTION_TIMEOUT_MS, APP_NAME } from "@/constants";

let client: Client;

export async function createDatabaseConnection(
  uri: string,
  timeoutMS = DATABASE_CONNECTION_TIMEOUT_MS
): Promise<Client> {
  client = new Client({
    connectionString: uri,
    application_name: APP_NAME,
    client_encoding: "utf8",
    connectionTimeoutMillis: timeoutMS,
  });

  await client.connect();

  return client;
}

export async function closeDatabaseConnection(): Promise<void> {
  if (!client) {
    logger.warn("WARN: No database connection to close.");
    return;
  }

  return client.end();
}

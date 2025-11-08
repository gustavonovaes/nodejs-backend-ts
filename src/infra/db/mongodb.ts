import { MongoClient, Db } from "mongodb";
import constants from "@/core/constants";
import { logger } from "@/common/logger";

let client: MongoClient;

export async function createDatabaseConnection(
  uri: string,
  timeoutMS = constants.DEFAULT_DATABASE_TIMEOUT_MS
): Promise<Db> {
  if (client) {
    logger.info("INFO: Database connection already established.");
    return client.db(client.options.dbName);
  }

  client = new MongoClient(uri, {
    timeoutMS: timeoutMS,
    connectTimeoutMS: timeoutMS,
    socketTimeoutMS: timeoutMS,
  });
  await client.connect();
  return client.db(client.options.dbName);
}

export async function closeDatabaseConnection(): Promise<void> {
  if (!client) {
    logger.warn("WARN: No database connection to close.");
    return;
  }

  await client.close();
}

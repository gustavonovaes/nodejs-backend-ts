import { IncomingHttpHeaders } from "node:http";

export type IHandler = (
  req: IServerRequest,
  res: IServerResponse
) => Promise<void> | void;

export interface IServerRequest {
  urlObject: URL;
  method: string;
  headers: IncomingHttpHeaders;
  query: Record<string, string>;
  url: string;
  params: Record<string, string>;
}

export interface IServerResponse {
  statusCode: number;
  status: (code: number) => IServerResponse;
  send: (body: Record<string, unknown> | string) => IServerResponse;
}

export type IMiddleware = (handler: IHandler) => IHandler;

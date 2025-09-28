import http from "node:http";

export type ServerRequest = {
  method: string;
  urlObj: URL;
  headers: http.IncomingHttpHeaders;
  params: Record<string, string>;
  query: Record<string, string>;
  url: string;
};

export type ServerResponse = {
  statusCode: number;
  status: (code: number) => ServerResponse;
  send: (body: Record<string, unknown> | string) => ServerResponse;
};

export type Handler = (
  req: ServerRequest,
  res: ServerResponse
) => Promise<void> | void;

export type Middleware = (handler: Handler) => Handler;

import type { RequestHandler } from 'express';

export function createCorsMiddleware(allowedOrigins: readonly string[]): RequestHandler {
  const allowlist = new Set(allowedOrigins);

  return (request, response, next) => {
    const origin = request.headers.origin;

    if (!origin || !allowlist.has(origin)) {
      next();
      return;
    }

    response.vary('Origin');
    response.setHeader('Access-Control-Allow-Origin', origin);

    if (request.method === 'OPTIONS') {
      response.setHeader('Access-Control-Allow-Methods', 'GET');
      response.setHeader('Access-Control-Allow-Headers', 'Authorization');
      response.status(204).end();
      return;
    }

    next();
  };
}

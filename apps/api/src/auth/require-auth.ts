import type { RequestHandler, Response } from 'express';

import type { TokenVerifier } from './token-verifier.js';

const INVALID_TOKEN_ERROR_CODES = new Set([
  'auth/argument-error',
  'auth/id-token-expired',
  'auth/id-token-revoked',
  'auth/invalid-id-token',
  'auth/invalid-argument',
  'auth/user-not-found',
]);

function readErrorCode(error: unknown): string | null {
  if (typeof error !== 'object' || error === null) {
    return null;
  }

  const code = (error as { code?: unknown }).code;
  return typeof code === 'string' ? code : null;
}

function sendUnauthorized(response: Response, message: string): void {
  response.status(401).json({
    error: {
      code: 'UNAUTHORIZED',
      message,
    },
  });
}

export function createRequireAuth(tokenVerifier: TokenVerifier): RequestHandler {
  return async (request, response, next) => {
    const authorization = request.headers.authorization;

    if (!authorization) {
      sendUnauthorized(response, 'Authentication required.');
      return;
    }

    const match = /^Bearer\s+(\S+)$/i.exec(authorization.trim());
    const token = match?.[1];

    if (!token) {
      sendUnauthorized(response, 'Authentication required.');
      return;
    }

    try {
      request.auth = await tokenVerifier.verifyIdToken(token);
      next();
    } catch (error: unknown) {
      const code = readErrorCode(error);

      if (code !== null && INVALID_TOKEN_ERROR_CODES.has(code)) {
        sendUnauthorized(response, 'Invalid or expired authentication token.');
        return;
      }

      next(error);
    }
  };
}

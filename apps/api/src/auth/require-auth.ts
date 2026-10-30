import type { RequestHandler, Response } from 'express';

import type { TokenVerifier } from './token-verifier.js';

const INVALID_TOKEN_ERROR_CODES = new Set([
  'auth/id-token-expired',
  'auth/id-token-revoked',
  'auth/invalid-id-token',
  'auth/invalid-argument',
  'auth/user-not-found',
]);

// firebase-admin 14.5.0 reports both malformed/invalid JWTs and certificate-fetch
// failures as auth/argument-error. Its public error has no structured nested cause,
// so only the SDK's specific token-validation messages are treated as credentials.
// Unknown argument errors fail closed as infrastructure errors instead of blaming a token.
const INVALID_ARGUMENT_TOKEN_PREFIXES = [
  'Decoding Firebase ID token failed.',
  'verifyIdToken() expects a Firebase ID token, but was given a custom token.',
  'verifyIdToken() expects a Firebase ID token, but was given a legacy custom token.',
  'Firebase ID token has no "kid" claim.',
  'Firebase ID token has incorrect algorithm.',
  'Firebase ID token has incorrect "aud" (audience) claim.',
  'Firebase ID token has incorrect "iss" (issuer) claim.',
  'Firebase ID token has no "sub" (subject) claim.',
  'Firebase ID token has an empty "sub" (subject) claim.',
  'Firebase ID token has a "sub" (subject) claim longer than 128 characters.',
  'Firebase ID token has invalid signature.',
  'Firebase ID token has "kid" claim which does not correspond to a known public key.',
];

function readErrorCode(error: unknown): string | null {
  if (typeof error !== 'object' || error === null) {
    return null;
  }

  const code = (error as { code?: unknown }).code;
  return typeof code === 'string' ? code : null;
}

function isInvalidTokenError(error: unknown): boolean {
  const code = readErrorCode(error);

  if (code !== 'auth/argument-error') {
    return code !== null && INVALID_TOKEN_ERROR_CODES.has(code);
  }

  if (!(error instanceof Error)) {
    return false;
  }

  return INVALID_ARGUMENT_TOKEN_PREFIXES.some((prefix) => error.message.startsWith(prefix));
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
      if (isInvalidTokenError(error)) {
        sendUnauthorized(response, 'Invalid or expired authentication token.');
        return;
      }

      next(error);
    }
  };
}

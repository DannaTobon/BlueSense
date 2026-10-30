import express, { type Express } from 'express';

import { createRequireAuth } from './auth/require-auth.js';
import { defaultTokenVerifier, type TokenVerifier } from './auth/token-verifier.js';
import { notFoundHandler, unexpectedErrorHandler } from './error-handlers.js';
import { meHandler } from './routes/me.js';

export interface AppDependencies {
  tokenVerifier?: TokenVerifier;
}

export function createApp(dependencies: AppDependencies = {}): Express {
  const tokenVerifier = dependencies.tokenVerifier ?? defaultTokenVerifier;
  const app = express();

  app.get('/health', (_request, response) => {
    response.status(200).json({ status: 'ok' });
  });

  app.get('/me', createRequireAuth(tokenVerifier), meHandler);

  app.use(notFoundHandler);
  app.use(unexpectedErrorHandler);

  return app;
}

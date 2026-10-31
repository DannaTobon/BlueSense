import express, { type Express } from 'express';

import { createRequireAuth } from './auth/require-auth.js';
import { defaultTokenVerifier, type TokenVerifier } from './auth/token-verifier.js';
import { DEFAULT_CORS_ALLOWED_ORIGINS } from './config.js';
import { createCorsMiddleware } from './cors.js';
import { notFoundHandler, unexpectedErrorHandler } from './error-handlers.js';
import { meHandler } from './routes/me.js';

export interface AppDependencies {
  tokenVerifier?: TokenVerifier;
  corsAllowedOrigins?: string[];
}

export function createApp(dependencies: AppDependencies = {}): Express {
  const tokenVerifier = dependencies.tokenVerifier ?? defaultTokenVerifier;
  const corsAllowedOrigins = dependencies.corsAllowedOrigins ?? DEFAULT_CORS_ALLOWED_ORIGINS;
  const app = express();

  app.use(createCorsMiddleware(corsAllowedOrigins));

  app.get('/health', (_request, response) => {
    response.status(200).json({ status: 'ok' });
  });

  app.get('/me', createRequireAuth(tokenVerifier), meHandler);

  app.use(notFoundHandler);
  app.use(unexpectedErrorHandler);

  return app;
}

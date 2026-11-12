import express, { type Express } from 'express';

import { createRequireAuth } from './auth/require-auth.js';
import { defaultTokenVerifier, type TokenVerifier } from './auth/token-verifier.js';
import { DEFAULT_CORS_ALLOWED_ORIGINS } from './config.js';
import { createCorsMiddleware } from './cors.js';
import {
  invalidJsonErrorHandler,
  notFoundHandler,
  unexpectedErrorHandler,
} from './error-handlers.js';
import { FirestoreWaterContainerRepository } from './repositories/firestore-water-container-repository.js';
import type { WaterContainerRepository } from './repositories/water-container-repository.js';
import { meHandler } from './routes/me.js';
import {
  createGetWaterContainerHandler,
  createPutWaterContainerHandler,
} from './routes/water-container.js';
import { createWaterContainerService } from './services/water-container-service.js';

export interface AppDependencies {
  tokenVerifier?: TokenVerifier;
  corsAllowedOrigins?: string[];
  waterContainerRepository?: WaterContainerRepository;
}

export function createApp(dependencies: AppDependencies = {}): Express {
  const tokenVerifier = dependencies.tokenVerifier ?? defaultTokenVerifier;
  const corsAllowedOrigins = dependencies.corsAllowedOrigins ?? DEFAULT_CORS_ALLOWED_ORIGINS;
  const waterContainerRepository =
    dependencies.waterContainerRepository ?? new FirestoreWaterContainerRepository();
  const waterContainerService = createWaterContainerService(waterContainerRepository);
  const requireAuth = createRequireAuth(tokenVerifier);
  const app = express();

  app.use(createCorsMiddleware(corsAllowedOrigins));
  app.use(express.json({ limit: '16kb', strict: true }));

  app.get('/health', (_request, response) => {
    response.status(200).json({ status: 'ok' });
  });

  app.get('/me', requireAuth, meHandler);
  app.get('/water-container', requireAuth, createGetWaterContainerHandler(waterContainerService));
  app.put('/water-container', requireAuth, createPutWaterContainerHandler(waterContainerService));

  app.use(notFoundHandler);
  app.use(invalidJsonErrorHandler);
  app.use(unexpectedErrorHandler);

  return app;
}

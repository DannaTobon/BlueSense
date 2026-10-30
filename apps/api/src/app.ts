import express, { type Express } from 'express';

import { notFoundHandler, unexpectedErrorHandler } from './error-handlers.js';

export function createApp(): Express {
  const app = express();

  app.get('/health', (_request, response) => {
    response.status(200).json({ status: 'ok' });
  });

  app.use(notFoundHandler);
  app.use(unexpectedErrorHandler);

  return app;
}

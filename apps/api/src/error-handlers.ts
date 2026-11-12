import type { ErrorRequestHandler, RequestHandler } from 'express';

function readErrorType(error: unknown): string | null {
  if (typeof error !== 'object' || error === null) {
    return null;
  }

  const type = (error as { type?: unknown }).type;
  return typeof type === 'string' ? type : null;
}

export const invalidJsonErrorHandler: ErrorRequestHandler = (error, _request, response, next) => {
  const type = readErrorType(error);

  if (type !== 'entity.parse.failed' && type !== 'entity.too.large') {
    next(error);
    return;
  }

  response.status(400).json({
    error: {
      code: 'INVALID_WATER_CONTAINER_CONFIG',
      message: 'Invalid water container configuration.',
    },
  });
};

export const notFoundHandler: RequestHandler = (_request, response) => {
  response.status(404).json({
    error: {
      code: 'NOT_FOUND',
      message: 'Route not found.',
    },
  });
};

export const unexpectedErrorHandler: ErrorRequestHandler = (error, _request, response, next) => {
  if (response.headersSent) {
    next(error);
    return;
  }

  console.error('Unexpected API error.');
  response.status(500).json({
    error: {
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Internal server error.',
    },
  });
};

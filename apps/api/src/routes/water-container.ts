import type { RequestHandler, Response } from 'express';

import { validateWaterContainerInput } from '../domain/water-container.js';
import { WaterContainerPersistenceUnavailableError } from '../repositories/water-container-repository.js';
import {
  WaterContainerNotFoundError,
  type WaterContainerService,
} from '../services/water-container-service.js';

function sendUnauthorized(response: Response): void {
  response.status(401).json({
    error: {
      code: 'UNAUTHORIZED',
      message: 'Authentication required.',
    },
  });
}

function handleKnownError(error: unknown, response: Response): boolean {
  if (error instanceof WaterContainerNotFoundError) {
    response.status(404).json({
      error: {
        code: 'WATER_CONTAINER_NOT_FOUND',
        message: 'Water container configuration not found.',
      },
    });
    return true;
  }

  if (error instanceof WaterContainerPersistenceUnavailableError) {
    response.status(503).json({
      error: {
        code: 'PERSISTENCE_UNAVAILABLE',
        message: 'Water container persistence is temporarily unavailable.',
      },
    });
    return true;
  }

  return false;
}

export function createGetWaterContainerHandler(service: WaterContainerService): RequestHandler {
  return async (request, response, next) => {
    const identity = request.auth;

    if (!identity) {
      sendUnauthorized(response);
      return;
    }

    try {
      response.status(200).json(await service.getDraft(identity.uid));
    } catch (error: unknown) {
      if (!handleKnownError(error, response)) {
        next(error);
      }
    }
  };
}

export function createPutWaterContainerHandler(service: WaterContainerService): RequestHandler {
  return async (request, response, next) => {
    const identity = request.auth;

    if (!identity) {
      sendUnauthorized(response);
      return;
    }

    const validation = validateWaterContainerInput(request.body as unknown);

    if (!validation.valid) {
      response.status(400).json({
        error: {
          code: 'INVALID_WATER_CONTAINER_CONFIG',
          message: 'Invalid water container configuration.',
        },
      });
      return;
    }

    try {
      response.status(200).json(await service.saveDraft(identity.uid, validation.value));
    } catch (error: unknown) {
      if (!handleKnownError(error, response)) {
        next(error);
      }
    }
  };
}

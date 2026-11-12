import {
  WATER_CONTAINER_SAFETY_DISTANCE_CM,
  type WaterContainerDraft,
  type WaterContainerInput,
} from '../domain/water-container.js';
import type {
  WaterContainerRecord,
  WaterContainerRepository,
} from '../repositories/water-container-repository.js';

export class WaterContainerNotFoundError extends Error {
  constructor() {
    super('Water container configuration not found.');
    this.name = 'WaterContainerNotFoundError';
  }
}

function toRecord(ownerUid: string, input: WaterContainerInput): WaterContainerRecord {
  const base = {
    ownerUid,
    capacityLiters: input.capacityLiters,
    heightCm: input.heightCm,
    safetyDistanceCm: WATER_CONTAINER_SAFETY_DISTANCE_CM,
  } as const;

  if (input.geometry === 'vertical-cylinder') {
    return {
      ...base,
      type: 'VERTICAL_CYLINDER',
      dimensions: { radiusCm: input.radiusCm },
    };
  }

  return {
    ...base,
    type: 'RECTANGULAR',
    dimensions: { lengthCm: input.lengthCm, widthCm: input.widthCm },
  };
}

function toDraft(record: WaterContainerRecord): WaterContainerDraft {
  const base = {
    configurationStatus: 'draft',
    capacityLiters: record.capacityLiters,
    heightCm: record.heightCm,
    safetyDistanceCm: WATER_CONTAINER_SAFETY_DISTANCE_CM,
  } as const;

  if (record.type === 'VERTICAL_CYLINDER') {
    return {
      ...base,
      geometry: 'vertical-cylinder',
      radiusCm: record.dimensions.radiusCm,
    };
  }

  return {
    ...base,
    geometry: 'rectangular',
    lengthCm: record.dimensions.lengthCm,
    widthCm: record.dimensions.widthCm,
  };
}

export interface WaterContainerService {
  getDraft(ownerUid: string): Promise<WaterContainerDraft>;
  saveDraft(ownerUid: string, input: WaterContainerInput): Promise<WaterContainerDraft>;
}

export function createWaterContainerService(
  repository: WaterContainerRepository,
): WaterContainerService {
  return {
    async getDraft(ownerUid) {
      const record = await repository.findByOwnerUid(ownerUid);

      if (!record) {
        throw new WaterContainerNotFoundError();
      }

      return toDraft(record);
    },

    async saveDraft(ownerUid, input) {
      const record = toRecord(ownerUid, input);
      await repository.save(record);
      return toDraft(record);
    },
  };
}

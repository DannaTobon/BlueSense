export interface VerticalCylinderRecord {
  readonly ownerUid: string;
  readonly type: 'VERTICAL_CYLINDER';
  readonly capacityLiters: number;
  readonly heightCm: number;
  readonly safetyDistanceCm: 10;
  readonly dimensions: {
    readonly radiusCm: number;
  };
}

export interface RectangularRecord {
  readonly ownerUid: string;
  readonly type: 'RECTANGULAR';
  readonly capacityLiters: number;
  readonly heightCm: number;
  readonly safetyDistanceCm: 10;
  readonly dimensions: {
    readonly lengthCm: number;
    readonly widthCm: number;
  };
}

export type WaterContainerRecord = VerticalCylinderRecord | RectangularRecord;

export interface WaterContainerRepository {
  findByOwnerUid(ownerUid: string): Promise<WaterContainerRecord | null>;
  save(record: WaterContainerRecord): Promise<void>;
}

export class WaterContainerPersistenceUnavailableError extends Error {
  constructor(options?: ErrorOptions) {
    super('Water container persistence is unavailable.', options);
    this.name = 'WaterContainerPersistenceUnavailableError';
  }
}

export class WaterContainerDataIntegrityError extends Error {
  constructor() {
    super('Stored water container data is invalid.');
    this.name = 'WaterContainerDataIntegrityError';
  }
}

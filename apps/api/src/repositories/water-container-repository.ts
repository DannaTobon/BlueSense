interface WaterContainerRecordBase {
  readonly ownerUid: string;
  readonly capacityLiters: number | null;
  readonly heightCm: number;
  readonly calibration: {
    readonly emptyDistanceCm: number;
    readonly fullDistanceCm: number;
  };
}

export interface VerticalCylinderRecord extends WaterContainerRecordBase {
  readonly type: 'VERTICAL_CYLINDER';
  readonly dimensions: { readonly radiusCm: number };
}

export interface RectangularRecord extends WaterContainerRecordBase {
  readonly type: 'RECTANGULAR';
  readonly dimensions: { readonly lengthCm: number; readonly widthCm: number };
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

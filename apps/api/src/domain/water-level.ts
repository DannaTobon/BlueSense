/** Converts a calibrated sensor distance into level and estimated volume. */

export type WaterGeometry = 'VERTICAL_CYLINDER' | 'RECTANGULAR';

interface VerticalCylinderConfig {
  readonly kind: 'VERTICAL_CYLINDER';
  readonly radiusCm: number;
}

interface RectangularConfig {
  readonly kind: 'RECTANGULAR';
  readonly lengthCm: number;
  readonly widthCm: number;
}

export type DepositConfig = VerticalCylinderConfig | RectangularConfig;

export interface WaterLevelInput {
  readonly emptyDistanceCm: number;
  readonly fullDistanceCm: number;
  readonly distanceCm: number;
  readonly capacityLiters: number | null;
  readonly config: DepositConfig;
}

export interface WaterLevelResult {
  readonly waterHeightCm: number;
  readonly levelPercent: number;
  readonly liters: number;
  readonly volumeSource: 'nominal-capacity' | 'geometry-estimate';
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

function validateInput(input: WaterLevelInput): void {
  const { emptyDistanceCm, fullDistanceCm, distanceCm, capacityLiters, config } = input;
  for (const [name, value] of [
    ['emptyDistanceCm', emptyDistanceCm],
    ['fullDistanceCm', fullDistanceCm],
    ['distanceCm', distanceCm],
  ] as const) {
    if (!isFiniteNumber(value)) throw new Error(`Invalid ${name}: expected a finite number.`);
  }
  if (emptyDistanceCm <= 0 || fullDistanceCm <= 0) {
    throw new Error('Invalid calibration: distances must be positive.');
  }
  if (fullDistanceCm >= emptyDistanceCm) {
    throw new Error('Invalid calibration: fullDistanceCm must be lower than emptyDistanceCm.');
  }
  if (capacityLiters !== null && (!isFiniteNumber(capacityLiters) || capacityLiters <= 0)) {
    throw new Error('Invalid capacityLiters: expected null or a positive finite number.');
  }
  if (config.kind === 'VERTICAL_CYLINDER') {
    if (!isFiniteNumber(config.radiusCm) || config.radiusCm <= 0) {
      throw new Error('Invalid radiusCm: expected a positive finite number.');
    }
  } else if (
    !isFiniteNumber(config.lengthCm) ||
    config.lengthCm <= 0 ||
    !isFiniteNumber(config.widthCm) ||
    config.widthCm <= 0
  ) {
    throw new Error('Invalid rectangular dimensions: expected positive finite numbers.');
  }
}

export function computeWaterLevel(input: WaterLevelInput): WaterLevelResult {
  validateInput(input);
  const { emptyDistanceCm, fullDistanceCm, distanceCm, capacityLiters, config } = input;
  const calibratedHeightCm = emptyDistanceCm - fullDistanceCm;
  const waterHeightCm = Math.min(Math.max(emptyDistanceCm - distanceCm, 0), calibratedHeightCm);
  const levelPercent = (waterHeightCm / calibratedHeightCm) * 100;
  const geometricLiters =
    config.kind === 'VERTICAL_CYLINDER'
      ? (Math.PI * config.radiusCm * config.radiusCm * waterHeightCm) / 1000
      : (config.lengthCm * config.widthCm * waterHeightCm) / 1000;

  return {
    waterHeightCm,
    levelPercent,
    liters: capacityLiters === null ? geometricLiters : capacityLiters * (levelPercent / 100),
    volumeSource: capacityLiters === null ? 'geometry-estimate' : 'nominal-capacity',
  };
}

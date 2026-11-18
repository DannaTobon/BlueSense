import { computeWaterLevel, type DepositConfig, type WaterLevelResult } from './water-level.js';

export interface MeasurementPipelineConfig {
  readonly capacityLiters: number | null;
  readonly emptyDistanceCm: number;
  readonly fullDistanceCm: number;
  readonly geometry: DepositConfig;
  readonly minimumSamples?: number;
}

export type MeasurementPipelineResult =
  | {
      readonly status: 'valid';
      readonly stabilizedDistanceCm: number;
      readonly acceptedSamples: number;
      readonly rejectedSamples: number;
      readonly measurement: WaterLevelResult;
    }
  | {
      readonly status: 'insufficient-data' | 'invalid-reading' | 'out-of-range';
      readonly acceptedSamples: number;
      readonly rejectedSamples: number;
    };

function median(values: readonly number[]): number {
  const sorted = [...values].sort((left, right) => left - right);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0 ? (sorted[middle - 1]! + sorted[middle]!) / 2 : sorted[middle]!;
}

/**
 * Stabilizes a short sensor window with its median. No sensor-specific noise
 * threshold is guessed: those limits must be validated with the real module.
 */
export function processMeasurementWindow(
  readings: readonly number[],
  config: MeasurementPipelineConfig,
): MeasurementPipelineResult {
  const minimumSamples = config.minimumSamples ?? 3;
  if (!Number.isInteger(minimumSamples) || minimumSamples <= 0) {
    throw new Error('Invalid minimumSamples: expected a positive integer.');
  }

  const accepted = readings.filter(
    (reading) => typeof reading === 'number' && Number.isFinite(reading) && reading > 0,
  );
  const counts = {
    acceptedSamples: accepted.length,
    rejectedSamples: readings.length - accepted.length,
  } as const;

  if (accepted.length === 0 && readings.length > 0) {
    return { status: 'invalid-reading', ...counts };
  }
  if (accepted.length < minimumSamples) {
    return { status: 'insufficient-data', ...counts };
  }

  const stabilizedDistanceCm = median(accepted);
  if (
    stabilizedDistanceCm < config.fullDistanceCm ||
    stabilizedDistanceCm > config.emptyDistanceCm
  ) {
    return { status: 'out-of-range', ...counts };
  }

  return {
    status: 'valid',
    stabilizedDistanceCm,
    ...counts,
    measurement: computeWaterLevel({
      capacityLiters: config.capacityLiters,
      emptyDistanceCm: config.emptyDistanceCm,
      fullDistanceCm: config.fullDistanceCm,
      distanceCm: stabilizedDistanceCm,
      config: config.geometry,
    }),
  };
}

/**
 * Cálculos de dominio para convertir una medida física `distanceCm` en altura
 * de agua, porcentaje de nivel y litros estimados.
 *
 * `distanceCm` se mide desde la parte superior del depósito (sensor hacia
 * abajo). La distancia de seguridad es la separación superior mínima desde el
 * sensor, por lo que la altura operativa es `heightCm - safetyDistanceCm`. La
 * altura de agua se clampea a [0, alturaOperativa] y el porcentaje nunca sale
 * de [0, 100]. La capacidad del usuario es un límite superior de litros, nunca
 * un sustituto de la geometría.
 */

const PI = Math.PI;

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
  readonly heightCm: number;
  readonly safetyDistanceCm: number;
  readonly distanceCm: number;
  readonly capacityLiters: number;
  readonly config: DepositConfig;
}

export interface WaterLevelResult {
  readonly waterHeightCm: number;
  readonly levelPercent: number;
  readonly liters: number;
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

function validateInput(input: WaterLevelInput): void {
  const { heightCm, safetyDistanceCm, distanceCm, capacityLiters, config } = input;

  const numericFields: Array<{ name: string; value: unknown }> = [
    { name: 'heightCm', value: heightCm },
    { name: 'safetyDistanceCm', value: safetyDistanceCm },
    { name: 'distanceCm', value: distanceCm },
    { name: 'capacityLiters', value: capacityLiters },
  ];

  for (const { name, value } of numericFields) {
    if (!isFiniteNumber(value)) {
      throw new Error(`Invalid ${name}: expected a finite number.`);
    }
  }

  if (heightCm <= 0) {
    throw new Error('Invalid heightCm: expected a positive number.');
  }

  if (safetyDistanceCm <= 0) {
    throw new Error('Invalid safetyDistanceCm: expected a positive number.');
  }

  if (capacityLiters <= 0) {
    throw new Error('Invalid capacityLiters: expected a positive number.');
  }

  if (safetyDistanceCm >= heightCm) {
    throw new Error('Invalid safetyDistanceCm: must be lower than heightCm.');
  }

  if (config.kind === 'VERTICAL_CYLINDER') {
    if (!isFiniteNumber(config.radiusCm) || config.radiusCm <= 0) {
      throw new Error('Invalid radiusCm: expected a positive finite number.');
    }
    return;
  }

  if (!isFiniteNumber(config.lengthCm) || config.lengthCm <= 0) {
    throw new Error('Invalid lengthCm: expected a positive finite number.');
  }

  if (!isFiniteNumber(config.widthCm) || config.widthCm <= 0) {
    throw new Error('Invalid widthCm: expected a positive finite number.');
  }
}

export function computeWaterLevel(input: WaterLevelInput): WaterLevelResult {
  validateInput(input);

  const { heightCm, safetyDistanceCm, distanceCm, capacityLiters, config } = input;

  const operatingHeightCm = heightCm - safetyDistanceCm;
  const waterHeightCm = Math.min(Math.max(heightCm - distanceCm, 0), operatingHeightCm);
  const levelPercent = (waterHeightCm / operatingHeightCm) * 100;

  const volumeCm3 =
    config.kind === 'VERTICAL_CYLINDER'
      ? PI * config.radiusCm * config.radiusCm * waterHeightCm
      : config.lengthCm * config.widthCm * waterHeightCm;

  const liters = Math.min(volumeCm3 / 1000, capacityLiters);

  return { waterHeightCm, levelPercent, liters };
}

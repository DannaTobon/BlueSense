interface WaterContainerInputBase {
  readonly capacityLiters: number | null;
  readonly heightCm: number;
  readonly emptyDistanceCm: number;
  readonly fullDistanceCm: number;
}

export interface VerticalCylinderInput extends WaterContainerInputBase {
  readonly geometry: 'vertical-cylinder';
  readonly radiusCm: number;
}

export interface RectangularInput extends WaterContainerInputBase {
  readonly geometry: 'rectangular';
  readonly lengthCm: number;
  readonly widthCm: number;
}

export type WaterContainerInput = VerticalCylinderInput | RectangularInput;

interface WaterContainerDraftBase extends WaterContainerInputBase {
  readonly configurationStatus: 'draft';
}

export interface VerticalCylinderDraft extends WaterContainerDraftBase {
  readonly geometry: 'vertical-cylinder';
  readonly radiusCm: number;
}

export interface RectangularDraft extends WaterContainerDraftBase {
  readonly geometry: 'rectangular';
  readonly lengthCm: number;
  readonly widthCm: number;
}

export type WaterContainerDraft = VerticalCylinderDraft | RectangularDraft;

export type WaterContainerValidationResult =
  { readonly valid: true; readonly value: WaterContainerInput } | { readonly valid: false };

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function hasExactlyKeys(value: Record<string, unknown>, expectedKeys: readonly string[]): boolean {
  const keys = Object.keys(value);
  return keys.length === expectedKeys.length && keys.every((key) => expectedKeys.includes(key));
}

function isPositiveFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value) && value > 0;
}

export function validateWaterContainerInput(value: unknown): WaterContainerValidationResult {
  if (!isRecord(value)) {
    return { valid: false };
  }

  const { geometry, capacityLiters, heightCm, emptyDistanceCm, fullDistanceCm } = value;
  if (
    (capacityLiters !== null && !isPositiveFiniteNumber(capacityLiters)) ||
    !isPositiveFiniteNumber(heightCm) ||
    !isPositiveFiniteNumber(emptyDistanceCm) ||
    !isPositiveFiniteNumber(fullDistanceCm) ||
    fullDistanceCm >= emptyDistanceCm ||
    emptyDistanceCm - fullDistanceCm > heightCm
  ) {
    return { valid: false };
  }
  const commonKeys = [
    'geometry',
    'capacityLiters',
    'heightCm',
    'emptyDistanceCm',
    'fullDistanceCm',
  ] as const;

  if (geometry === 'vertical-cylinder') {
    if (
      !hasExactlyKeys(value, [...commonKeys, 'radiusCm']) ||
      !isPositiveFiniteNumber(value.radiusCm)
    ) {
      return { valid: false };
    }

    return {
      valid: true,
      value: {
        geometry,
        capacityLiters,
        heightCm,
        emptyDistanceCm,
        fullDistanceCm,
        radiusCm: value.radiusCm,
      },
    };
  }

  if (geometry === 'rectangular') {
    if (
      !hasExactlyKeys(value, [...commonKeys, 'lengthCm', 'widthCm']) ||
      !isPositiveFiniteNumber(value.lengthCm) ||
      !isPositiveFiniteNumber(value.widthCm)
    ) {
      return { valid: false };
    }

    return {
      valid: true,
      value: {
        geometry,
        capacityLiters,
        heightCm,
        emptyDistanceCm,
        fullDistanceCm,
        lengthCm: value.lengthCm,
        widthCm: value.widthCm,
      },
    };
  }

  return { valid: false };
}

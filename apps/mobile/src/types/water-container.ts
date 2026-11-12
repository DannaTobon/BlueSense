export type WaterContainerGeometry = 'vertical-cylinder' | 'rectangular';

interface WaterContainerInputBase {
  capacityLiters: number;
  heightCm: number;
}

export interface VerticalCylinderInput extends WaterContainerInputBase {
  geometry: 'vertical-cylinder';
  radiusCm: number;
}

export interface RectangularInput extends WaterContainerInputBase {
  geometry: 'rectangular';
  lengthCm: number;
  widthCm: number;
}

export type WaterContainerInput = VerticalCylinderInput | RectangularInput;

interface WaterContainerDraftBase {
  configurationStatus: 'draft';
  safetyDistanceCm: 10;
}

export type WaterContainerDraft =
  | (VerticalCylinderInput & WaterContainerDraftBase)
  | (RectangularInput & WaterContainerDraftBase);

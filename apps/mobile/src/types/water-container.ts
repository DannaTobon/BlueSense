export type WaterContainerGeometry = 'vertical-cylinder' | 'rectangular';

interface WaterContainerInputBase {
  capacityLiters: number | null;
  heightCm: number;
  emptyDistanceCm: number;
  fullDistanceCm: number;
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
}

export type WaterContainerDraft = (VerticalCylinderInput | RectangularInput) &
  WaterContainerDraftBase;

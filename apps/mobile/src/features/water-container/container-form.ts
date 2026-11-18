import type {
  WaterContainerDraft,
  WaterContainerGeometry,
  WaterContainerInput,
} from '@/types/water-container';

export type ContainerGeometry = WaterContainerGeometry;

export const GEOMETRY_LABELS: Record<ContainerGeometry, string> = {
  'vertical-cylinder': 'Cilindro vertical',
  rectangular: 'Rectangular o cuadrado',
};

export interface ContainerFormInput {
  geometry: ContainerGeometry;
  capacityLiters: string;
  heightCm: string;
  emptyDistanceCm: string;
  fullDistanceCm: string;
  radiusCm: string;
  lengthCm: string;
  widthCm: string;
}

export type ContainerFieldName =
  | 'capacityLiters'
  | 'heightCm'
  | 'emptyDistanceCm'
  | 'fullDistanceCm'
  | 'radiusCm'
  | 'lengthCm'
  | 'widthCm';

export type ContainerFieldErrors = Partial<Record<ContainerFieldName, string>>;
export type ContainerConfig = WaterContainerInput;
export type ContainerValidationResult =
  { valid: true; config: ContainerConfig } | { valid: false; errors: ContainerFieldErrors };

export const EMPTY_CONTAINER_FORM: ContainerFormInput = {
  geometry: 'vertical-cylinder',
  capacityLiters: '',
  heightCm: '',
  emptyDistanceCm: '',
  fullDistanceCm: '',
  radiusCm: '',
  lengthCm: '',
  widthCm: '',
};

export function containerDraftToFormInput(draft: WaterContainerDraft): ContainerFormInput {
  const base = {
    geometry: draft.geometry,
    capacityLiters: draft.capacityLiters === null ? '' : String(draft.capacityLiters),
    heightCm: String(draft.heightCm),
    emptyDistanceCm: String(draft.emptyDistanceCm),
    fullDistanceCm: String(draft.fullDistanceCm),
  };

  return draft.geometry === 'vertical-cylinder'
    ? {
        ...base,
        radiusCm: String(draft.radiusCm),
        lengthCm: '',
        widthCm: '',
      }
    : {
        ...base,
        radiusCm: '',
        lengthCm: String(draft.lengthCm),
        widthCm: String(draft.widthCm),
      };
}

type ParsedNumber = { ok: true; value: number } | { ok: false; error: string };

function parsePositive(raw: string, fieldLabel: string): ParsedNumber {
  const text = raw.trim().replace(',', '.');
  if (text === '') return { ok: false, error: `Introduce ${fieldLabel}.` };

  const value = Number(text);
  if (!/^[+-]?(\d+\.?\d*|\.\d+)(e[+-]?\d+)?$/i.test(text)) {
    return { ok: false, error: `${capitalize(fieldLabel)} debe ser un número.` };
  }
  if (!Number.isFinite(value)) {
    return { ok: false, error: `${capitalize(fieldLabel)} debe ser un número finito.` };
  }
  if (value <= 0) {
    return { ok: false, error: `${capitalize(fieldLabel)} debe ser mayor que cero.` };
  }
  return { ok: true, value };
}

function capitalize(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

export function changeGeometry(
  input: ContainerFormInput,
  geometry: ContainerGeometry,
): ContainerFormInput {
  if (geometry === input.geometry) return input;
  return { ...input, geometry, radiusCm: '', lengthCm: '', widthCm: '' };
}

export function validateContainerForm(input: ContainerFormInput): ContainerValidationResult {
  const errors: ContainerFieldErrors = {};
  const capacityText = input.capacityLiters.trim();
  const capacity = capacityText === '' ? null : parsePositive(input.capacityLiters, 'la capacidad');
  let capacityValue: number | null = null;
  const height = parsePositive(input.heightCm, 'la altura interior en centímetros');
  const emptyDistance = parsePositive(
    input.emptyDistanceCm,
    'la distancia del sensor al nivel vacío',
  );
  const fullDistance = parsePositive(
    input.fullDistanceCm,
    'la distancia del sensor al nivel lleno',
  );

  if (capacity !== null) {
    if (capacity.ok) capacityValue = capacity.value;
    else errors.capacityLiters = capacity.error;
  }
  if (!height.ok) errors.heightCm = height.error;
  if (!emptyDistance.ok) errors.emptyDistanceCm = emptyDistance.error;
  if (!fullDistance.ok) errors.fullDistanceCm = fullDistance.error;

  if (emptyDistance.ok && fullDistance.ok && fullDistance.value >= emptyDistance.value) {
    errors.fullDistanceCm = 'La distancia al nivel lleno debe ser menor que la distancia al vacío.';
  }
  if (
    height.ok &&
    emptyDistance.ok &&
    fullDistance.ok &&
    emptyDistance.value - fullDistance.value > height.value
  ) {
    errors.emptyDistanceCm = 'El recorrido calibrado no puede superar la altura interior.';
  }

  const common =
    height.ok && emptyDistance.ok && fullDistance.ok && Object.keys(errors).length === 0
      ? {
          capacityLiters: capacityValue,
          heightCm: height.value,
          emptyDistanceCm: emptyDistance.value,
          fullDistanceCm: fullDistance.value,
        }
      : null;

  if (input.geometry === 'vertical-cylinder') {
    const radius = parsePositive(input.radiusCm, 'el radio interior en centímetros');
    if (!radius.ok) errors.radiusCm = radius.error;
    if (common && radius.ok && Object.keys(errors).length === 0) {
      return {
        valid: true,
        config: { geometry: input.geometry, ...common, radiusCm: radius.value },
      };
    }
  } else {
    const length = parsePositive(input.lengthCm, 'el largo interior en centímetros');
    const width = parsePositive(input.widthCm, 'el ancho interior en centímetros');
    if (!length.ok) errors.lengthCm = length.error;
    if (!width.ok) errors.widthCm = width.error;
    if (common && length.ok && width.ok && Object.keys(errors).length === 0) {
      return {
        valid: true,
        config: {
          geometry: input.geometry,
          ...common,
          lengthCm: length.value,
          widthCm: width.value,
        },
      };
    }
  }

  return { valid: false, errors };
}

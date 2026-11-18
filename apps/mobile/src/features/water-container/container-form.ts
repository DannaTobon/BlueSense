export type ContainerGeometry = 'vertical-cylinder' | 'rectangular';

/** Safety distance applied by the system in the MVP; not entered by the user. */
export const SAFETY_DISTANCE_CM = 10;

export const GEOMETRY_LABELS: Record<ContainerGeometry, string> = {
  'vertical-cylinder': 'Cilindro vertical',
  rectangular: 'Rectangular o cuadrado',
};

export interface ContainerFormInput {
  geometry: ContainerGeometry;
  capacityLiters: string;
  heightCm: string;
  radiusCm: string;
  lengthCm: string;
  widthCm: string;
}

export type ContainerFieldName =
  'capacityLiters' | 'heightCm' | 'radiusCm' | 'lengthCm' | 'widthCm';

export type ContainerFieldErrors = Partial<Record<ContainerFieldName, string>>;

interface ContainerConfigBase {
  capacityLiters: number;
  heightCm: number;
}

export interface VerticalCylinderConfig extends ContainerConfigBase {
  geometry: 'vertical-cylinder';
  radiusCm: number;
}

export interface RectangularConfig extends ContainerConfigBase {
  geometry: 'rectangular';
  lengthCm: number;
  widthCm: number;
}

export type ContainerConfig = VerticalCylinderConfig | RectangularConfig;

export type ContainerValidationResult =
  { valid: true; config: ContainerConfig } | { valid: false; errors: ContainerFieldErrors };

export const EMPTY_CONTAINER_FORM: ContainerFormInput = {
  geometry: 'vertical-cylinder',
  capacityLiters: '',
  heightCm: '',
  radiusCm: '',
  lengthCm: '',
  widthCm: '',
};

type ParsedNumber = { ok: true; value: number } | { ok: false; error: string };

function parsePositive(raw: string, fieldLabel: string): ParsedNumber {
  const text = raw.trim().replace(',', '.');

  if (text === '') {
    return { ok: false, error: `Introduce ${fieldLabel}.` };
  }

  // Number('') and Number(' ') are 0, so emptiness is handled above; reject hex/exponent-free junk.
  const value = Number(text);

  if (!/^[+-]?(\d+\.?\d*|\.\d+)(e[+-]?\d+)?$/i.test(text) && !/^[+-]?infinity$/i.test(text)) {
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

/** Drops fields that belong only to a geometry other than the selected one. */
export function changeGeometry(
  input: ContainerFormInput,
  geometry: ContainerGeometry,
): ContainerFormInput {
  if (geometry === input.geometry) {
    return input;
  }

  return {
    ...input,
    geometry,
    radiusCm: '',
    lengthCm: '',
    widthCm: '',
  };
}

export function validateContainerForm(input: ContainerFormInput): ContainerValidationResult {
  const errors: ContainerFieldErrors = {};

  const capacity = parsePositive(input.capacityLiters, 'la capacidad en litros');
  if (!capacity.ok) {
    errors.capacityLiters = capacity.error;
  }

  const height = parsePositive(input.heightCm, 'la altura en centímetros');
  if (!height.ok) {
    errors.heightCm = height.error;
  } else if (height.value <= SAFETY_DISTANCE_CM) {
    errors.heightCm = `La altura debe ser mayor que ${SAFETY_DISTANCE_CM} cm, la distancia de seguridad que aplica el sistema.`;
  }

  if (input.geometry === 'vertical-cylinder') {
    const radius = parsePositive(input.radiusCm, 'el radio en centímetros');
    if (!radius.ok) {
      errors.radiusCm = radius.error;
    }

    if (capacity.ok && height.ok && radius.ok && Object.keys(errors).length === 0) {
      return {
        valid: true,
        config: {
          geometry: 'vertical-cylinder',
          capacityLiters: capacity.value,
          heightCm: height.value,
          radiusCm: radius.value,
        },
      };
    }
  } else {
    const length = parsePositive(input.lengthCm, 'el largo en centímetros');
    if (!length.ok) {
      errors.lengthCm = length.error;
    }

    const width = parsePositive(input.widthCm, 'el ancho en centímetros');
    if (!width.ok) {
      errors.widthCm = width.error;
    }

    if (capacity.ok && height.ok && length.ok && width.ok && Object.keys(errors).length === 0) {
      return {
        valid: true,
        config: {
          geometry: 'rectangular',
          capacityLiters: capacity.value,
          heightCm: height.value,
          lengthCm: length.value,
          widthCm: width.value,
        },
      };
    }
  }

  return { valid: false, errors };
}

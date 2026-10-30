import type { PasswordRequirements } from './auth-service';

export interface RegistrationInput {
  name: string;
  email: string;
  password: string;
}

export interface SignInInput {
  email: string;
  password: string;
}

export interface FieldErrors {
  name?: string;
  email?: string;
  password?: string;
}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validateEmail(email: string): string | undefined {
  if (!email) {
    return 'Introduce tu correo.';
  }

  if (!EMAIL_PATTERN.test(email)) {
    return 'Introduce un correo válido.';
  }

  return undefined;
}

export function validateSignInInput(input: SignInInput): FieldErrors {
  const errors: FieldErrors = {};
  const emailError = validateEmail(input.email.trim());

  if (emailError) {
    errors.email = emailError;
  }

  if (!input.password) {
    errors.password = 'Introduce tu contraseña.';
  }

  return errors;
}

export function validateRegistrationInput(input: RegistrationInput): FieldErrors {
  const errors = validateSignInInput(input);
  const name = input.name.trim();

  if (!name) {
    errors.name = 'Introduce tu nombre.';
  } else if (name.length > 80) {
    errors.name = 'El nombre no puede superar los 80 caracteres.';
  }

  return errors;
}

export function hasFieldErrors(errors: FieldErrors): boolean {
  return Object.keys(errors).length > 0;
}

function joinRequirements(parts: string[]): string {
  if (parts.length <= 1) {
    return parts.join('');
  }

  return `${parts.slice(0, -1).join(', ')} y ${parts.at(-1)}`;
}

export function describePasswordRequirements(requirements: PasswordRequirements): string {
  const parts: string[] = [];

  if (requirements.minimumLength !== undefined) {
    parts.push(`al menos ${requirements.minimumLength} caracteres`);
  }

  if (requirements.maximumLength !== undefined) {
    parts.push(`como máximo ${requirements.maximumLength} caracteres`);
  }

  if (requirements.lowercaseRequired) {
    parts.push('una letra minúscula');
  }

  if (requirements.uppercaseRequired) {
    parts.push('una letra mayúscula');
  }

  if (requirements.numberRequired) {
    parts.push('un número');
  }

  if (requirements.nonAlphanumericRequired) {
    parts.push('un carácter especial');
  }

  if (parts.length === 0) {
    return 'La contraseña no cumple la política de Firebase.';
  }

  return `La contraseña debe incluir ${joinRequirements(parts)}.`;
}

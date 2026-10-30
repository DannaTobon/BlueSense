import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  describePasswordRequirements,
  hasFieldErrors,
  validateRegistrationInput,
  validateSignInInput,
} from '../src/features/auth/auth-form';

void test('sign-in validation accepts a valid email and any non-empty password', () => {
  assert.deepEqual(
    validateSignInInput({ email: 'person@example.com', password: '  spaces  ' }),
    {},
  );
  assert.equal(hasFieldErrors(validateSignInInput({ email: 'a@b.co', password: 'x' })), false);
});

void test('sign-in validation reports missing or malformed fields', () => {
  assert.deepEqual(validateSignInInput({ email: '', password: '' }), {
    email: 'Introduce tu correo.',
    password: 'Introduce tu contraseña.',
  });

  assert.deepEqual(validateSignInInput({ email: 'not-an-email', password: 'x' }), {
    email: 'Introduce un correo válido.',
  });
});

void test('registration validation requires a name and keeps the password untouched', () => {
  assert.deepEqual(
    validateRegistrationInput({
      name: '   ',
      email: 'person@example.com',
      password: '  ',
    }),
    { name: 'Introduce tu nombre.' },
  );

  assert.deepEqual(
    validateRegistrationInput({
      name: 'Ana',
      email: 'person@example.com',
      password: '  ',
    }),
    {},
  );

  assert.deepEqual(
    validateRegistrationInput({
      name: 'a'.repeat(81),
      email: 'person@example.com',
      password: 'secret',
    }),
    { name: 'El nombre no puede superar los 80 caracteres.' },
  );
});

void test('password requirements are described from the effective Firebase policy', () => {
  assert.equal(
    describePasswordRequirements({
      minimumLength: 8,
      maximumLength: 64,
      lowercaseRequired: true,
      uppercaseRequired: true,
      numberRequired: true,
      nonAlphanumericRequired: true,
    }),
    'La contraseña debe incluir al menos 8 caracteres, como máximo 64 caracteres, una letra minúscula, una letra mayúscula, un número y un carácter especial.',
  );

  assert.equal(
    describePasswordRequirements({
      lowercaseRequired: false,
      uppercaseRequired: false,
      numberRequired: false,
      nonAlphanumericRequired: false,
    }),
    'La contraseña no cumple la política de Firebase.',
  );
});

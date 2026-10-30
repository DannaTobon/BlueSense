import assert from 'node:assert/strict';
import { test } from 'node:test';

import { toAuthErrorMessage } from '../src/features/auth/auth-errors';

void test('auth errors map to understandable Spanish messages', () => {
  assert.equal(
    toAuthErrorMessage({ code: 'auth/invalid-credential' }),
    'Correo o contraseña incorrectos.',
  );
  assert.equal(
    toAuthErrorMessage({ code: 'auth/email-already-in-use' }),
    'No se pudo crear la cuenta con esos datos. Si ya tienes una, inicia sesión.',
  );
  assert.equal(
    toAuthErrorMessage({ code: 'auth/user-disabled' }),
    'Correo o contraseña incorrectos.',
  );
  assert.equal(
    toAuthErrorMessage({ code: 'auth/network-request-failed' }),
    'No se pudo conectar. Revisa tu conexión e inténtalo de nuevo.',
  );
});

void test('unknown and malformed auth errors use a generic message', () => {
  const fallback = 'No se pudo completar la operación. Inténtalo de nuevo.';

  assert.equal(toAuthErrorMessage({ code: 'auth/something-new' }), fallback);
  assert.equal(toAuthErrorMessage(new Error('internal detail')), fallback);
  assert.equal(toAuthErrorMessage(null), fallback);
  assert.equal(toAuthErrorMessage('auth/invalid-credential'), fallback);
});

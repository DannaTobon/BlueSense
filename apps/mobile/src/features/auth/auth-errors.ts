const AUTH_ERROR_MESSAGES: Record<string, string> = {
  'auth/email-already-in-use':
    'No se pudo crear la cuenta con esos datos. Si ya tienes una, inicia sesión.',
  'auth/invalid-email': 'El correo no tiene un formato válido.',
  'auth/weak-password': 'La contraseña no cumple los requisitos de seguridad.',
  'auth/invalid-credential': 'Correo o contraseña incorrectos.',
  'auth/wrong-password': 'Correo o contraseña incorrectos.',
  'auth/user-not-found': 'Correo o contraseña incorrectos.',
  'auth/user-disabled': 'Correo o contraseña incorrectos.',
  'auth/too-many-requests': 'Demasiados intentos. Espera un momento e inténtalo de nuevo.',
  'auth/network-request-failed': 'No se pudo conectar. Revisa tu conexión e inténtalo de nuevo.',
  'auth/operation-not-allowed': 'El acceso con correo y contraseña no está habilitado.',
  'auth/missing-password': 'Introduce tu contraseña.',
};

const FALLBACK_MESSAGE = 'No se pudo completar la operación. Inténtalo de nuevo.';

function readErrorCode(error: unknown): string | null {
  if (typeof error !== 'object' || error === null) {
    return null;
  }

  const code = (error as { code?: unknown }).code;
  return typeof code === 'string' ? code : null;
}

export function toAuthErrorMessage(error: unknown): string {
  const code = readErrorCode(error);

  if (code && code in AUTH_ERROR_MESSAGES) {
    return AUTH_ERROR_MESSAGES[code] ?? FALLBACK_MESSAGE;
  }

  return FALLBACK_MESSAGE;
}

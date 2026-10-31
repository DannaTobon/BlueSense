export const DEFAULT_PORT = 3000;
export const DEFAULT_CORS_ALLOWED_ORIGINS = ['http://localhost:8081', 'http://127.0.0.1:8081'];

export interface ApiConfig {
  port: number;
  corsAllowedOrigins: string[];
}

function readCorsAllowedOrigins(value: string | undefined): string[] {
  const origins = value === undefined ? DEFAULT_CORS_ALLOWED_ORIGINS : value.split(',');

  return origins.map((origin) => {
    const trimmedOrigin = origin.trim();

    if (!trimmedOrigin || trimmedOrigin === '*') {
      throw new Error('Invalid CORS_ALLOWED_ORIGINS: expected comma-separated HTTP(S) origins.');
    }

    let url: URL;
    try {
      url = new URL(trimmedOrigin);
    } catch {
      throw new Error('Invalid CORS_ALLOWED_ORIGINS: expected comma-separated HTTP(S) origins.');
    }

    if (
      (url.protocol !== 'http:' && url.protocol !== 'https:') ||
      url.origin !== trimmedOrigin ||
      url.username !== '' ||
      url.password !== ''
    ) {
      throw new Error('Invalid CORS_ALLOWED_ORIGINS: expected comma-separated HTTP(S) origins.');
    }

    return trimmedOrigin;
  });
}

export function readConfig(env: NodeJS.ProcessEnv = process.env): ApiConfig {
  if (env.NODE_ENV === 'production' && env.FIREBASE_AUTH_EMULATOR_HOST) {
    throw new Error('FIREBASE_AUTH_EMULATOR_HOST must not be set in production.');
  }

  const value = env.PORT;
  const corsAllowedOrigins = readCorsAllowedOrigins(env.CORS_ALLOWED_ORIGINS);

  if (value === undefined) {
    return { port: DEFAULT_PORT, corsAllowedOrigins };
  }

  if (!/^\d+$/.test(value)) {
    throw new Error('Invalid PORT: expected an integer from 1 to 65535.');
  }

  const port = Number(value);

  if (!Number.isSafeInteger(port) || port < 1 || port > 65535) {
    throw new Error('Invalid PORT: expected an integer from 1 to 65535.');
  }

  return { port, corsAllowedOrigins };
}

export const DEFAULT_PORT = 3000;

export interface ApiConfig {
  port: number;
}

export function readConfig(env: NodeJS.ProcessEnv = process.env): ApiConfig {
  const value = env.PORT;

  if (value === undefined) {
    return { port: DEFAULT_PORT };
  }

  if (!/^\d+$/.test(value)) {
    throw new Error('Invalid PORT: expected an integer from 1 to 65535.');
  }

  const port = Number(value);

  if (!Number.isSafeInteger(port) || port < 1 || port > 65535) {
    throw new Error('Invalid PORT: expected an integer from 1 to 65535.');
  }

  return { port };
}

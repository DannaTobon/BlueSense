export type ApiConfig = { ok: true; baseUrl: string } | { ok: false; message: string };

export function readApiConfig(): ApiConfig {
  const rawValue = process.env.EXPO_PUBLIC_API_URL?.trim();

  if (!rawValue) {
    return {
      ok: false,
      message:
        'EXPO_PUBLIC_API_URL no está configurada. Copia apps/mobile/.env.example como apps/mobile/.env y define una URL accesible desde el dispositivo.',
    };
  }

  let parsed: URL;

  try {
    parsed = new URL(rawValue);
  } catch {
    return {
      ok: false,
      message: 'EXPO_PUBLIC_API_URL no es una URL válida.',
    };
  }

  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    return {
      ok: false,
      message: 'EXPO_PUBLIC_API_URL debe usar http o https.',
    };
  }

  return { ok: true, baseUrl: rawValue.replace(/\/+$/, '') };
}

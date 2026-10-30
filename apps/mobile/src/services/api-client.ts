export interface ApiIdentity {
  uid: string;
  email: string | null;
}

export type ApiIdentityResult =
  | { status: 'success'; identity: ApiIdentity }
  | { status: 'unauthorized' }
  | { status: 'network-error' }
  | { status: 'server-error'; httpStatus: number }
  | { status: 'invalid-response' };

export interface FetchIdentityOptions {
  baseUrl: string;
  token: string;
  signal?: AbortSignal;
  fetchImpl?: typeof fetch;
}

function isAbortError(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    (error as { name?: unknown }).name === 'AbortError'
  );
}

function isApiIdentity(value: unknown): value is ApiIdentity {
  if (typeof value !== 'object' || value === null) {
    return false;
  }

  const candidate = value as { uid?: unknown; email?: unknown };

  return (
    typeof candidate.uid === 'string' &&
    (candidate.email === null || typeof candidate.email === 'string')
  );
}

export async function fetchCurrentIdentity({
  baseUrl,
  token,
  signal,
  fetchImpl = fetch,
}: FetchIdentityOptions): Promise<ApiIdentityResult> {
  let response: Response;

  try {
    response = await fetchImpl(`${baseUrl}/me`, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
        Authorization: `Bearer ${token}`,
      },
      signal,
    });
  } catch (error: unknown) {
    if (isAbortError(error)) {
      throw error;
    }

    return { status: 'network-error' };
  }

  if (response.status === 401) {
    return { status: 'unauthorized' };
  }

  if (!response.ok) {
    return { status: 'server-error', httpStatus: response.status };
  }

  let body: unknown;

  try {
    body = await response.json();
  } catch {
    return { status: 'invalid-response' };
  }

  if (!isApiIdentity(body)) {
    return { status: 'invalid-response' };
  }

  return { status: 'success', identity: body };
}

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

function isPositiveFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value) && value > 0;
}

function hasExactlyKeys(value: Record<string, unknown>, expectedKeys: string[]): boolean {
  const actualKeys = Object.keys(value).sort();
  return actualKeys.length === expectedKeys.length && expectedKeys.sort().every((key, index) => key === actualKeys[index]);
}

function isWaterContainerDraft(value: unknown): value is WaterContainerDraft {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    return false;
  }

  const candidate = value as Record<string, unknown>;
  const commonValid =
    candidate.configurationStatus === 'draft' &&
    candidate.safetyDistanceCm === 10 &&
    isPositiveFiniteNumber(candidate.capacityLiters) &&
    isPositiveFiniteNumber(candidate.heightCm) &&
    candidate.heightCm > 10;

  if (!commonValid) {
    return false;
  }

  if (candidate.geometry === 'vertical-cylinder') {
    return (
      hasExactlyKeys(candidate, [
        'configurationStatus',
        'geometry',
        'capacityLiters',
        'heightCm',
        'safetyDistanceCm',
        'radiusCm',
      ]) && isPositiveFiniteNumber(candidate.radiusCm)
    );
  }

  if (candidate.geometry === 'rectangular') {
    return (
      hasExactlyKeys(candidate, [
        'configurationStatus',
        'geometry',
        'capacityLiters',
        'heightCm',
        'safetyDistanceCm',
        'lengthCm',
        'widthCm',
      ]) &&
      isPositiveFiniteNumber(candidate.lengthCm) &&
      isPositiveFiniteNumber(candidate.widthCm)
    );
  }

  return false;
}

export type WaterContainerResult =
  | { status: 'success'; draft: WaterContainerDraft }
  | { status: 'not-found' }
  | { status: 'invalid-config' }
  | { status: 'unauthorized' }
  | { status: 'network-error' }
  | { status: 'server-error'; httpStatus: number }
  | { status: 'invalid-response' };

interface WaterContainerRequestOptions {
  baseUrl: string;
  token: string;
  signal?: AbortSignal;
  fetchImpl?: typeof fetch;
}

export interface SaveWaterContainerOptions extends WaterContainerRequestOptions {
  input: WaterContainerInput;
}

async function readWaterContainerResponse(response: Response): Promise<WaterContainerResult> {
  if (response.status === 401) {
    return { status: 'unauthorized' };
  }

  if (response.status === 404) {
    return { status: 'not-found' };
  }

  if (response.status === 400) {
    return { status: 'invalid-config' };
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

  return isWaterContainerDraft(body)
    ? { status: 'success', draft: body }
    : { status: 'invalid-response' };
}

export async function fetchWaterContainer({
  baseUrl,
  token,
  signal,
  fetchImpl = fetch,
}: WaterContainerRequestOptions): Promise<WaterContainerResult> {
  try {
    const response = await fetchImpl(`${baseUrl}/water-container`, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
        Authorization: `Bearer ${token}`,
      },
      signal,
    });

    return await readWaterContainerResponse(response);
  } catch (error: unknown) {
    if (isAbortError(error)) {
      throw error;
    }

    return { status: 'network-error' };
  }
}

export async function saveWaterContainer({
  baseUrl,
  token,
  input,
  signal,
  fetchImpl = fetch,
}: SaveWaterContainerOptions): Promise<WaterContainerResult> {
  try {
    const response = await fetchImpl(`${baseUrl}/water-container`, {
      method: 'PUT',
      headers: {
        Accept: 'application/json',
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(input),
      signal,
    });

    return await readWaterContainerResponse(response);
  } catch (error: unknown) {
    if (isAbortError(error)) {
      throw error;
    }

    return { status: 'network-error' };
  }
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
import type { WaterContainerDraft, WaterContainerInput } from '@/types/water-container';


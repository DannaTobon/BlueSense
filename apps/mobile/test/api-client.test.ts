import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  fetchCurrentIdentity,
  fetchWaterContainer,
  saveWaterContainer,
} from '../src/services/api-client';

function asFetch(
  implementation: (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>,
): typeof fetch {
  return implementation as typeof fetch;
}

void test('GET /me sends the bearer token and returns the verified identity', async () => {
  let receivedUrl: string | null = null;
  let receivedAuthorization: string | null = null;

  const fetchImpl = asFetch(async (input, init) => {
    receivedUrl = String(input);
    receivedAuthorization = new Headers(init?.headers).get('Authorization');
    return new Response(JSON.stringify({ uid: 'user-1', email: 'ana@example.com' }), {
      status: 200,
      headers: { 'content-type': 'application/json' },
    });
  });

  const result = await fetchCurrentIdentity({
    baseUrl: 'http://192.168.1.10:3000',
    token: 'id-token',
    fetchImpl,
  });

  assert.deepEqual(result, {
    status: 'success',
    identity: { uid: 'user-1', email: 'ana@example.com' },
  });
  assert.equal(receivedUrl, 'http://192.168.1.10:3000/me');
  assert.equal(receivedAuthorization, 'Bearer id-token');
});

void test('HTTP 401 is reported without discarding the session', async () => {
  const fetchImpl = asFetch(async () => new Response(null, { status: 401 }));

  assert.deepEqual(
    await fetchCurrentIdentity({ baseUrl: 'http://localhost:3000', token: 'token', fetchImpl }),
    { status: 'unauthorized' },
  );
});

void test('network failures and server errors are distinguished', async () => {
  const networkFetch = asFetch(async () => {
    throw new TypeError('fetch failed');
  });
  const serverFetch = asFetch(async () => new Response(null, { status: 503 }));

  assert.deepEqual(
    await fetchCurrentIdentity({
      baseUrl: 'http://localhost:3000',
      token: 'token',
      fetchImpl: networkFetch,
    }),
    { status: 'network-error' },
  );

  assert.deepEqual(
    await fetchCurrentIdentity({
      baseUrl: 'http://localhost:3000',
      token: 'token',
      fetchImpl: serverFetch,
    }),
    { status: 'server-error', httpStatus: 503 },
  );
});

void test('unexpected or invalid JSON responses are rejected safely', async () => {
  const invalidJson = asFetch(
    async () =>
      new Response('not json', {
        status: 200,
        headers: { 'content-type': 'application/json' },
      }),
  );
  const invalidShape = asFetch(
    async () =>
      new Response(JSON.stringify({ uid: 123 }), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      }),
  );

  assert.deepEqual(
    await fetchCurrentIdentity({
      baseUrl: 'http://localhost:3000',
      token: 'token',
      fetchImpl: invalidJson,
    }),
    { status: 'invalid-response' },
  );

  assert.deepEqual(
    await fetchCurrentIdentity({
      baseUrl: 'http://localhost:3000',
      token: 'token',
      fetchImpl: invalidShape,
    }),
    { status: 'invalid-response' },
  );
});

void test('aborted requests surface the abort instead of a network error', async () => {
  const fetchImpl = asFetch(async () => {
    throw Object.assign(new Error('aborted'), { name: 'AbortError' });
  });

  await assert.rejects(
    fetchCurrentIdentity({
      baseUrl: 'http://localhost:3000',
      token: 'token',
      fetchImpl,
    }),
    /aborted/,
  );
});

void test('GET /water-container treats 404 as an empty configuration', async () => {
  const fetchImpl = asFetch(async () => new Response(null, { status: 404 }));
  assert.deepEqual(
    await fetchWaterContainer({
      baseUrl: 'http://localhost:3000',
      token: 'token',
      fetchImpl,
    }),
    { status: 'not-found' },
  );
});

void test('PUT /water-container sends and validates calibrated input', async () => {
  const input = {
    geometry: 'rectangular' as const,
    capacityLiters: null,
    heightCm: 150,
    emptyDistanceCm: 145,
    fullDistanceCm: 10,
    lengthCm: 100,
    widthCm: 80,
  };
  let receivedBody: unknown;
  const fetchImpl = asFetch(async (_url, init) => {
    receivedBody = JSON.parse(String(init?.body)) as unknown;
    return new Response(JSON.stringify({ configurationStatus: 'draft', ...input }), {
      status: 200,
      headers: { 'content-type': 'application/json' },
    });
  });
  const result = await saveWaterContainer({
    baseUrl: 'http://localhost:3000',
    token: 'token',
    input,
    fetchImpl,
  });
  assert.deepEqual(receivedBody, input);
  assert.deepEqual(result, {
    status: 'success',
    draft: { configurationStatus: 'draft', ...input },
  });
});

void test('rejects an inconsistent calibrated response', async () => {
  const fetchImpl = asFetch(
    async () =>
      new Response(
        JSON.stringify({
          configurationStatus: 'draft',
          geometry: 'vertical-cylinder',
          capacityLiters: 1100,
          heightCm: 150,
          emptyDistanceCm: 10,
          fullDistanceCm: 145,
          radiusCm: 50,
        }),
        { status: 200, headers: { 'content-type': 'application/json' } },
      ),
  );
  assert.deepEqual(
    await fetchWaterContainer({
      baseUrl: 'http://localhost:3000',
      token: 'token',
      fetchImpl,
    }),
    { status: 'invalid-response' },
  );
});

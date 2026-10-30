import assert from 'node:assert/strict';
import { test } from 'node:test';

import { fetchCurrentIdentity } from '../src/services/api-client';

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

import assert from 'node:assert/strict';
import { test } from 'node:test';

import { createApp } from '../src/app.js';
import type { TokenVerifier, VerifiedIdentity } from '../src/auth/token-verifier.js';

import { withServer } from './helpers.js';

function createVerifier(identity: VerifiedIdentity): TokenVerifier {
  return {
    verifyIdToken(): Promise<VerifiedIdentity> {
      return Promise.resolve(identity);
    },
  };
}

function createFailingVerifier(error: Error): TokenVerifier {
  return {
    verifyIdToken(): Promise<VerifiedIdentity> {
      return Promise.reject(error);
    },
  };
}

function createCodedError(code: string): Error {
  return Object.assign(new Error('Token validation failed.'), { code });
}

void test('GET /me rejects missing and malformed authorization headers', async () => {
  let calls = 0;
  const verifier: TokenVerifier = {
    verifyIdToken(): Promise<VerifiedIdentity> {
      calls += 1;
      return Promise.resolve({ uid: 'unused', email: null });
    },
  };

  await withServer(createApp({ tokenVerifier: verifier }), async (baseUrl) => {
    const headersToTest = [undefined, 'Basic abc', 'Bearer', 'Bearer ', 'Bearer two tokens'];

    for (const authorization of headersToTest) {
      const response = await fetch(`${baseUrl}/me`, {
        headers: authorization ? { Authorization: authorization } : {},
      });

      assert.equal(response.status, 401);
      assert.deepEqual(await response.json(), {
        error: {
          code: 'UNAUTHORIZED',
          message: 'Authentication required.',
        },
      });
    }
  });

  assert.equal(calls, 0);
});

void test('GET /me rejects invalid and expired tokens', async () => {
  const verifier: TokenVerifier = {
    verifyIdToken(token: string): Promise<VerifiedIdentity> {
      return Promise.reject(createCodedError(token));
    },
  };

  await withServer(createApp({ tokenVerifier: verifier }), async (baseUrl) => {
    const errorCodes = [
      'auth/argument-error',
      'auth/id-token-expired',
      'auth/id-token-revoked',
      'auth/invalid-id-token',
    ];

    for (const code of errorCodes) {
      const response = await fetch(`${baseUrl}/me`, {
        headers: { Authorization: `Bearer ${code}` },
      });

      assert.equal(response.status, 401);
      assert.deepEqual(await response.json(), {
        error: {
          code: 'UNAUTHORIZED',
          message: 'Invalid or expired authentication token.',
        },
      });
    }
  });
});

void test('GET /me returns only the identity produced by the verified token', async () => {
  let receivedToken: string | null = null;
  const verifier: TokenVerifier = {
    verifyIdToken(token: string): Promise<VerifiedIdentity> {
      receivedToken = token;
      return Promise.resolve({ uid: 'firebase-user-1', email: 'person@example.com' });
    },
  };

  await withServer(createApp({ tokenVerifier: verifier }), async (baseUrl) => {
    const response = await fetch(`${baseUrl}/me`, {
      headers: { Authorization: 'Bearer valid-id-token' },
    });

    assert.equal(response.status, 200);
    assert.deepEqual(await response.json(), {
      uid: 'firebase-user-1',
      email: 'person@example.com',
    });
  });

  assert.equal(receivedToken, 'valid-id-token');
});

void test('GET /me preserves a missing email as null', async () => {
  const verifier = createVerifier({ uid: 'firebase-user-2', email: null });

  await withServer(createApp({ tokenVerifier: verifier }), async (baseUrl) => {
    const response = await fetch(`${baseUrl}/me`, {
      headers: { Authorization: 'Bearer valid-id-token' },
    });

    assert.equal(response.status, 200);
    assert.deepEqual(await response.json(), {
      uid: 'firebase-user-2',
      email: null,
    });
  });
});

void test('verifier failures become generic internal errors without leaking details', async (context) => {
  const loggedMessages: unknown[][] = [];
  context.mock.method(console, 'error', (...arguments_: unknown[]) => {
    loggedMessages.push(arguments_);
  });

  const verifier = createFailingVerifier(new Error('sensitive verifier detail'));
  const token = 'secret-token-value';

  await withServer(createApp({ tokenVerifier: verifier }), async (baseUrl) => {
    const response = await fetch(`${baseUrl}/me`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    assert.equal(response.status, 500);
    const bodyText = await response.text();
    assert.equal(bodyText.includes('sensitive'), false);
    assert.deepEqual(JSON.parse(bodyText) as unknown, {
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Internal server error.',
      },
    });
  });

  assert.deepEqual(loggedMessages, [['Unexpected API error.']]);
  assert.equal(JSON.stringify(loggedMessages).includes(token), false);
});

void test('GET /health remains public and does not verify tokens', async () => {
  const verifier = createFailingVerifier(new Error('should not be called'));

  await withServer(createApp({ tokenVerifier: verifier }), async (baseUrl) => {
    const response = await fetch(`${baseUrl}/health`);

    assert.equal(response.status, 200);
    assert.deepEqual(await response.json(), { status: 'ok' });
  });
});

import assert from 'node:assert/strict';
import { test } from 'node:test';

import express from 'express';

import { createApp } from '../src/app.js';
import { DEFAULT_CORS_ALLOWED_ORIGINS, DEFAULT_PORT, readConfig } from '../src/config.js';
import { unexpectedErrorHandler } from '../src/error-handlers.js';

import { withServer } from './helpers.js';

void test('configuration uses the default port and validates explicit values', () => {
  assert.deepEqual(readConfig({}), {
    port: DEFAULT_PORT,
    corsAllowedOrigins: DEFAULT_CORS_ALLOWED_ORIGINS,
  });
  assert.deepEqual(readConfig({ PORT: '8080', CORS_ALLOWED_ORIGINS: 'https://app.example.com' }), {
    port: 8080,
    corsAllowedOrigins: ['https://app.example.com'],
  });

  for (const value of ['', '0', '65536', '3000.5', 'not-a-port']) {
    assert.throws(
      () => readConfig({ PORT: value }),
      new Error('Invalid PORT: expected an integer from 1 to 65535.'),
    );
  }

  for (const value of ['', '*', 'not-an-origin', 'https://app.example.com/path']) {
    assert.throws(
      () => readConfig({ CORS_ALLOWED_ORIGINS: value }),
      new Error('Invalid CORS_ALLOWED_ORIGINS: expected comma-separated HTTP(S) origins.'),
    );
  }
});

void test('production configuration rejects the Firebase Auth emulator', () => {
  assert.throws(
    () =>
      readConfig({
        NODE_ENV: 'production',
        FIREBASE_AUTH_EMULATOR_HOST: '127.0.0.1:9099',
      }),
    new Error('FIREBASE_AUTH_EMULATOR_HOST must not be set in production.'),
  );

  assert.doesNotThrow(() =>
    readConfig({ NODE_ENV: 'development', FIREBASE_AUTH_EMULATOR_HOST: '127.0.0.1:9099' }),
  );
});

void test('API returns documented health and not-found responses', async () => {
  await withServer(createApp(), async (baseUrl) => {
    const healthResponse = await fetch(`${baseUrl}/health`);
    assert.equal(healthResponse.status, 200);
    assert.deepEqual(await healthResponse.json(), { status: 'ok' });

    const notFoundResponse = await fetch(`${baseUrl}/missing`);
    assert.equal(notFoundResponse.status, 404);
    assert.deepEqual(await notFoundResponse.json(), {
      error: {
        code: 'NOT_FOUND',
        message: 'Route not found.',
      },
    });
  });
});

void test('unexpected errors return a generic response without exposing details', async (context) => {
  const app = express();
  const loggedMessages: unknown[][] = [];
  context.mock.method(console, 'error', (...arguments_: unknown[]) => {
    loggedMessages.push(arguments_);
  });

  app.get('/test-only-error', () => {
    throw new Error('sensitive internal detail');
  });
  app.use(unexpectedErrorHandler);

  await withServer(app, async (baseUrl) => {
    const response = await fetch(`${baseUrl}/test-only-error`);
    assert.equal(response.status, 500);
    assert.deepEqual(await response.json(), {
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Internal server error.',
      },
    });
  });

  assert.deepEqual(loggedMessages, [['Unexpected API error.']]);
});

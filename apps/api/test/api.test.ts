import assert from 'node:assert/strict';
import type { AddressInfo } from 'node:net';
import { test } from 'node:test';

import express, { type Express } from 'express';

import { createApp } from '../src/app.js';
import { DEFAULT_PORT, readConfig } from '../src/config.js';
import { unexpectedErrorHandler } from '../src/error-handlers.js';

async function withServer(app: Express, run: (baseUrl: string) => Promise<void>): Promise<void> {
  const server = app.listen(0, '127.0.0.1');
  await new Promise<void>((resolve, reject) => {
    server.once('listening', resolve);
    server.once('error', reject);
  });

  const { port } = server.address() as AddressInfo;

  try {
    await run(`http://127.0.0.1:${port}`);
  } finally {
    await new Promise<void>((resolve, reject) => {
      server.close((error) => {
        if (error) {
          reject(error);
          return;
        }

        resolve();
      });
    });
  }
}

void test('configuration uses the default port and validates explicit values', () => {
  assert.deepEqual(readConfig({}), { port: DEFAULT_PORT });
  assert.deepEqual(readConfig({ PORT: '8080' }), { port: 8080 });

  for (const value of ['', '0', '65536', '3000.5', 'not-a-port']) {
    assert.throws(
      () => readConfig({ PORT: value }),
      new Error('Invalid PORT: expected an integer from 1 to 65535.'),
    );
  }
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

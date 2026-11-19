import assert from 'node:assert/strict';
import { test } from 'node:test';

import { createApp } from '../src/app.js';
import type { TokenVerifier } from '../src/auth/token-verifier.js';
import { validateWaterContainerInput } from '../src/domain/water-container.js';
import { fromFirestoreWaterContainerDocument } from '../src/repositories/firestore-water-container-repository.js';
import {
  WaterContainerDataIntegrityError,
  type WaterContainerRecord,
  type WaterContainerRepository,
} from '../src/repositories/water-container-repository.js';

import { withServer } from './helpers.js';

const verifier: TokenVerifier = {
  verifyIdToken: () => Promise.resolve({ uid: 'account-1', email: 'person@example.com' }),
};

class MemoryRepository implements WaterContainerRepository {
  readonly records = new Map<string, WaterContainerRecord>();
  findByOwnerUid(uid: string): Promise<WaterContainerRecord | null> {
    return Promise.resolve(this.records.get(uid) ?? null);
  }
  save(record: WaterContainerRecord): Promise<void> {
    this.records.set(record.ownerUid, record);
    return Promise.resolve();
  }
}

const headers = { Authorization: 'Bearer valid', 'Content-Type': 'application/json' };

void test('GET and PUT require authentication', async () => {
  const repository = new MemoryRepository();
  await withServer(
    createApp({ tokenVerifier: verifier, waterContainerRepository: repository }),
    async (url) => {
      assert.equal((await fetch(`${url}/water-container`)).status, 401);
      assert.equal(
        (
          await fetch(`${url}/water-container`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: '{}',
          })
        ).status,
        401,
      );
    },
  );
});

void test('persists calibrated configuration with optional nominal capacity', async () => {
  const repository = new MemoryRepository();
  const input = {
    geometry: 'rectangular',
    capacityLiters: null,
    heightCm: 150,
    emptyDistanceCm: 145,
    fullDistanceCm: 10,
    lengthCm: 100,
    widthCm: 80,
  } as const;

  await withServer(
    createApp({ tokenVerifier: verifier, waterContainerRepository: repository }),
    async (url) => {
      const empty = await fetch(`${url}/water-container`, { headers });
      assert.equal(empty.status, 404);

      const saved = await fetch(`${url}/water-container`, {
        method: 'PUT',
        headers,
        body: JSON.stringify(input),
      });
      assert.equal(saved.status, 200);
      assert.deepEqual(await saved.json(), { configurationStatus: 'draft', ...input });
      assert.deepEqual(repository.records.get('account-1'), {
        ownerUid: 'account-1',
        type: 'RECTANGULAR',
        capacityLiters: null,
        heightCm: 150,
        calibration: { emptyDistanceCm: 145, fullDistanceCm: 10 },
        dimensions: { lengthCm: 100, widthCm: 80 },
      });
    },
  );
});

void test('strict validation rejects inconsistent calibration and client-owned fields', () => {
  const valid = {
    geometry: 'vertical-cylinder',
    capacityLiters: 1100,
    heightCm: 150,
    emptyDistanceCm: 145,
    fullDistanceCm: 10,
    radiusCm: 50,
  };
  assert.equal(validateWaterContainerInput(valid).valid, true);
  assert.equal(validateWaterContainerInput({ ...valid, fullDistanceCm: 145 }).valid, false);
  assert.equal(validateWaterContainerInput({ ...valid, emptyDistanceCm: 200 }).valid, false);
  assert.equal(validateWaterContainerInput({ ...valid, ownerUid: 'attacker' }).valid, false);
  assert.equal(validateWaterContainerInput({ ...valid, capacityLiters: 0 }).valid, false);
});

void test('Firestore decoding validates ownership and calibration', () => {
  const document = {
    ownerUid: 'account-1',
    type: 'VERTICAL_CYLINDER',
    capacityLiters: 1100,
    heightCm: 150,
    calibration: { emptyDistanceCm: 145, fullDistanceCm: 10 },
    dimensions: { radiusCm: 50 },
  } as const;
  assert.deepEqual(fromFirestoreWaterContainerDocument(document, 'account-1'), document);
  assert.throws(
    () => fromFirestoreWaterContainerDocument(document, 'another-account'),
    WaterContainerDataIntegrityError,
  );
});

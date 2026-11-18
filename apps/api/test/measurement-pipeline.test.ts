import assert from 'node:assert/strict';
import { test } from 'node:test';

import { processMeasurementWindow } from '../src/domain/measurement-pipeline.js';

const baseConfig = {
  capacityLiters: 1000,
  emptyDistanceCm: 110,
  fullDistanceCm: 10,
  geometry: { kind: 'RECTANGULAR' as const, lengthCm: 100, widthCm: 100 },
};

void test('stabilizes a noisy window with the median before calculating level', () => {
  const result = processMeasurementWindow([61, 59, 60, 95, Number.NaN], baseConfig);
  assert.equal(result.status, 'valid');
  if (result.status !== 'valid') return;
  assert.equal(result.stabilizedDistanceCm, 60.5);
  assert.equal(result.acceptedSamples, 4);
  assert.equal(result.rejectedSamples, 1);
  assert.equal(result.measurement.levelPercent, 49.5);
  assert.equal(result.measurement.liters, 495);
});

void test('distinguishes invalid, insufficient, and out-of-range windows', () => {
  assert.deepEqual(processMeasurementWindow([Number.NaN, -1, 0], baseConfig), {
    status: 'invalid-reading',
    acceptedSamples: 0,
    rejectedSamples: 3,
  });
  assert.deepEqual(processMeasurementWindow([60, 61], baseConfig), {
    status: 'insufficient-data',
    acceptedSamples: 2,
    rejectedSamples: 0,
  });
  assert.deepEqual(processMeasurementWindow([120, 121, 122], baseConfig), {
    status: 'out-of-range',
    acceptedSamples: 3,
    rejectedSamples: 0,
  });
});

void test('does not guess a sensor-specific jump threshold', () => {
  const result = processMeasurementWindow([10, 60, 110], baseConfig);
  assert.equal(result.status, 'valid');
  if (result.status !== 'valid') return;
  assert.equal(result.stabilizedDistanceCm, 60);
  assert.equal(result.measurement.levelPercent, 50);
});

void test('validates the requested minimum sample count', () => {
  assert.throws(
    () => processMeasurementWindow([60], { ...baseConfig, minimumSamples: 0 }),
    /positive integer/,
  );
});

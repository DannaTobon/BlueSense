import assert from 'node:assert/strict';
import { test } from 'node:test';

import { computeWaterLevel, type WaterLevelInput } from '../src/domain/water-level.js';

function baseInput(): WaterLevelInput {
  return {
    emptyDistanceCm: 110,
    fullDistanceCm: 10,
    distanceCm: 60,
    capacityLiters: 1000,
    config: { kind: 'RECTANGULAR', lengthCm: 100, widthCm: 100 },
  };
}

void test('calibrated distances map to 0, 50 and 100 percent', () => {
  const input = baseInput();
  assert.deepEqual(computeWaterLevel({ ...input, distanceCm: 110 }), {
    waterHeightCm: 0,
    levelPercent: 0,
    liters: 0,
    volumeSource: 'nominal-capacity',
  });
  assert.deepEqual(computeWaterLevel(input), {
    waterHeightCm: 50,
    levelPercent: 50,
    liters: 500,
    volumeSource: 'nominal-capacity',
  });
  assert.deepEqual(computeWaterLevel({ ...input, distanceCm: 10 }), {
    waterHeightCm: 100,
    levelPercent: 100,
    liters: 1000,
    volumeSource: 'nominal-capacity',
  });
});

void test('uses measured geometry when nominal capacity is unknown', () => {
  assert.deepEqual(computeWaterLevel({ ...baseInput(), capacityLiters: null }), {
    waterHeightCm: 50,
    levelPercent: 50,
    liters: 500,
    volumeSource: 'geometry-estimate',
  });
});

void test('uses cylinder geometry and clamps readings beyond calibrated references', () => {
  const input: WaterLevelInput = {
    ...baseInput(),
    capacityLiters: null,
    config: { kind: 'VERTICAL_CYLINDER', radiusCm: 10 },
  };
  assert.equal(computeWaterLevel({ ...input, distanceCm: 150 }).levelPercent, 0);
  const full = computeWaterLevel({ ...input, distanceCm: 1 });
  assert.equal(full.levelPercent, 100);
  assert.ok(Math.abs(full.liters - 10 * Math.PI) < 1e-9);
});

void test('rejects invalid calibration, capacity, and geometry', () => {
  const input = baseInput();
  assert.throws(
    () => computeWaterLevel({ ...input, fullDistanceCm: 110 }),
    /fullDistanceCm must be lower/,
  );
  assert.throws(() => computeWaterLevel({ ...input, capacityLiters: 0 }), /capacityLiters/);
  assert.throws(
    () =>
      computeWaterLevel({
        ...input,
        config: { kind: 'VERTICAL_CYLINDER', radiusCm: Number.NaN },
      }),
    /radiusCm/,
  );
});

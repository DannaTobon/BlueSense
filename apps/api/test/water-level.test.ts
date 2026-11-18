import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  computeWaterLevel,
  type DepositConfig,
  type WaterLevelInput,
} from '../src/domain/water-level.js';

function verticalCylinder(radiusCm: number): DepositConfig {
  return { kind: 'VERTICAL_CYLINDER', radiusCm };
}

function rectangular(lengthCm: number, widthCm: number): DepositConfig {
  return { kind: 'RECTANGULAR', lengthCm, widthCm };
}

function overrideInput<T extends keyof WaterLevelInput>(
  input: WaterLevelInput,
  key: T,
  value: WaterLevelInput[T],
): WaterLevelInput {
  return { ...input, [key]: value };
}

function assertClose(actual: number, expected: number, tolerance = 1e-6): void {
  assert.ok(
    Math.abs(actual - expected) <= tolerance,
    `expected ${actual} to be close to ${expected}`,
  );
}

function baseConfig(): DepositConfig {
  return verticalCylinder(10);
}

function baseInput(): WaterLevelInput {
  return {
    heightCm: 100,
    safetyDistanceCm: 10,
    distanceCm: 55,
    capacityLiters: 1000,
    config: baseConfig(),
  };
}

void test('vertical cylinder: 0 %, 50 % and 100 %', () => {
  const input = baseInput();

  const empty = computeWaterLevel(overrideInput(input, 'distanceCm', 100));
  assert.equal(empty.waterHeightCm, 0);
  assert.equal(empty.levelPercent, 0);
  assert.equal(empty.liters, 0);

  const half = computeWaterLevel(overrideInput(input, 'distanceCm', 55));
  assert.equal(half.waterHeightCm, 45);
  assert.equal(half.levelPercent, 50);
  assertClose(half.liters, 4.5 * Math.PI);

  const full = computeWaterLevel(overrideInput(input, 'distanceCm', 10));
  assert.equal(full.waterHeightCm, 90);
  assert.equal(full.levelPercent, 100);
  assertClose(full.liters, 9 * Math.PI);
});

void test('rectangular: 0 %, 50 % and 100 %', () => {
  const input = { ...baseInput(), config: rectangular(10, 10) };

  const empty = computeWaterLevel(overrideInput(input, 'distanceCm', 100));
  assert.equal(empty.waterHeightCm, 0);
  assert.equal(empty.levelPercent, 0);
  assert.equal(empty.liters, 0);

  const half = computeWaterLevel(overrideInput(input, 'distanceCm', 55));
  assert.equal(half.waterHeightCm, 45);
  assert.equal(half.levelPercent, 50);
  assert.equal(half.liters, 4.5);

  const full = computeWaterLevel(overrideInput(input, 'distanceCm', 10));
  assert.equal(full.waterHeightCm, 90);
  assert.equal(full.levelPercent, 100);
  assert.equal(full.liters, 9);
});

void test('saturation clamps level to 0 % and 100 %', () => {
  const input = { ...baseInput(), config: rectangular(10, 10) };

  const below = computeWaterLevel(overrideInput(input, 'distanceCm', 0));
  assert.equal(below.waterHeightCm, 90);
  assert.equal(below.levelPercent, 100);

  const above = computeWaterLevel(overrideInput(input, 'distanceCm', 150));
  assert.equal(above.waterHeightCm, 0);
  assert.equal(above.levelPercent, 0);
});

void test('capacityLiters caps estimated liters without substituting geometry', () => {
  const input = { ...baseInput(), config: rectangular(10, 10), capacityLiters: 5 };
  const result = computeWaterLevel(overrideInput(input, 'distanceCm', 10));

  assert.equal(result.waterHeightCm, 90);
  assert.equal(result.levelPercent, 100);
  assert.equal(result.liters, 5);
});

void test('rejects non-finite numbers', () => {
  const input = baseInput();

  for (const field of ['heightCm', 'safetyDistanceCm', 'distanceCm', 'capacityLiters'] as const) {
    assert.throws(
      () => computeWaterLevel(overrideInput(input, field, NaN)),
      new Error(`Invalid ${field}: expected a finite number.`),
    );
    assert.throws(
      () => computeWaterLevel(overrideInput(input, field, Infinity)),
      new Error(`Invalid ${field}: expected a finite number.`),
    );
  }
});

void test('rejects non-positive dimensions and capacity', () => {
  const input = baseInput();

  assert.throws(
    () => computeWaterLevel(overrideInput(input, 'heightCm', 0)),
    new Error('Invalid heightCm: expected a positive number.'),
  );
  assert.throws(
    () => computeWaterLevel(overrideInput(input, 'heightCm', -5)),
    new Error('Invalid heightCm: expected a positive number.'),
  );
  assert.throws(
    () => computeWaterLevel(overrideInput(input, 'safetyDistanceCm', 0)),
    new Error('Invalid safetyDistanceCm: expected a positive number.'),
  );
  assert.throws(
    () => computeWaterLevel(overrideInput(input, 'capacityLiters', 0)),
    new Error('Invalid capacityLiters: expected a positive number.'),
  );
  assert.throws(
    () => computeWaterLevel(overrideInput(input, 'capacityLiters', -1)),
    new Error('Invalid capacityLiters: expected a positive number.'),
  );
});

void test('rejects safety distance greater than or equal to height', () => {
  const input = baseInput();

  assert.throws(
    () => computeWaterLevel(overrideInput(input, 'safetyDistanceCm', 100)),
    new Error('Invalid safetyDistanceCm: must be lower than heightCm.'),
  );
  assert.throws(
    () => computeWaterLevel(overrideInput(input, 'safetyDistanceCm', 101)),
    new Error('Invalid safetyDistanceCm: must be lower than heightCm.'),
  );
});

void test('rejects non-positive deposit dimensions', () => {
  const base = { ...baseInput() };

  assert.throws(
    () => computeWaterLevel({ ...base, config: verticalCylinder(0) }),
    new Error('Invalid radiusCm: expected a positive finite number.'),
  );
  assert.throws(
    () => computeWaterLevel({ ...base, config: verticalCylinder(-3) }),
    new Error('Invalid radiusCm: expected a positive finite number.'),
  );
  assert.throws(
    () => computeWaterLevel({ ...base, config: rectangular(0, 10) }),
    new Error('Invalid lengthCm: expected a positive finite number.'),
  );
  assert.throws(
    () => computeWaterLevel({ ...base, config: rectangular(10, -5) }),
    new Error('Invalid widthCm: expected a positive finite number.'),
  );
});

void test('does not mutate the input object', () => {
  const input = baseInput();
  const before: WaterLevelInput = { ...input };

  const result = computeWaterLevel(input);

  assert.deepEqual(input, before);
  assert.notStrictEqual(result, input);
});

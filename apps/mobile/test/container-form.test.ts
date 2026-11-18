import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  EMPTY_CONTAINER_FORM,
  changeGeometry,
  validateContainerForm,
  type ContainerFormInput,
} from '../src/features/water-container/container-form';

const cylinder: ContainerFormInput = {
  ...EMPTY_CONTAINER_FORM,
  geometry: 'vertical-cylinder',
  capacityLiters: '1100',
  heightCm: '140',
  emptyDistanceCm: '135',
  fullDistanceCm: '10',
  radiusCm: '55',
};

const rectangular: ContainerFormInput = {
  ...EMPTY_CONTAINER_FORM,
  geometry: 'rectangular',
  capacityLiters: '',
  heightCm: '120.5',
  emptyDistanceCm: '118',
  fullDistanceCm: '8',
  lengthCm: '150',
  widthCm: '100',
};

function errorsOf(input: ContainerFormInput) {
  const result = validateContainerForm(input);
  assert.equal(result.valid, false);
  return result.valid ? {} : result.errors;
}

void test('accepts known capacity and unknown capacity configurations', () => {
  assert.deepEqual(validateContainerForm(cylinder), {
    valid: true,
    config: {
      geometry: 'vertical-cylinder',
      capacityLiters: 1100,
      heightCm: 140,
      emptyDistanceCm: 135,
      fullDistanceCm: 10,
      radiusCm: 55,
    },
  });
  const result = validateContainerForm(rectangular);
  assert.ok(result.valid);
  assert.equal(result.valid && result.config.capacityLiters, null);
});

void test('requires geometry, height, and both calibration references', () => {
  assert.deepEqual(Object.keys(errorsOf(EMPTY_CONTAINER_FORM)).sort(), [
    'emptyDistanceCm',
    'fullDistanceCm',
    'heightCm',
    'radiusCm',
  ]);
});

void test('rejects reversed or physically inconsistent calibration', () => {
  assert.match(
    errorsOf({ ...cylinder, fullDistanceCm: '135' }).fullDistanceCm ?? '',
    /menor que la distancia al vacío/,
  );
  assert.match(
    errorsOf({ ...cylinder, heightCm: '100', emptyDistanceCm: '140' }).emptyDistanceCm ?? '',
    /no puede superar la altura/,
  );
});

void test('rejects invalid optional capacity when it is provided', () => {
  for (const value of ['abc', 'Infinity', '0', '-5']) {
    assert.ok(errorsOf({ ...cylinder, capacityLiters: value }).capacityLiters, value);
  }
});

void test('changing geometry drops dimensions from the previous geometry', () => {
  const switched = changeGeometry(cylinder, 'rectangular');
  assert.equal(switched.radiusCm, '');
  const result = validateContainerForm({ ...switched, lengthCm: '100', widthCm: '80' });
  assert.ok(result.valid && !('radiusCm' in result.config));
});

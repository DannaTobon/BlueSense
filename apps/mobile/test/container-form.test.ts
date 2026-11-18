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
  radiusCm: '55',
};

const rectangular: ContainerFormInput = {
  ...EMPTY_CONTAINER_FORM,
  geometry: 'rectangular',
  capacityLiters: '2500',
  heightCm: '120.5',
  lengthCm: '150',
  widthCm: '100',
};

function errorsOf(input: ContainerFormInput) {
  const result = validateContainerForm(input);
  assert.equal(result.valid, false);
  return result.valid ? {} : result.errors;
}

void test('accepts a valid vertical cylinder', () => {
  assert.deepEqual(validateContainerForm(cylinder), {
    valid: true,
    config: { geometry: 'vertical-cylinder', capacityLiters: 1100, heightCm: 140, radiusCm: 55 },
  });
});

void test('accepts a valid rectangular container', () => {
  assert.deepEqual(validateContainerForm(rectangular), {
    valid: true,
    config: {
      geometry: 'rectangular',
      capacityLiters: 2500,
      heightCm: 120.5,
      lengthCm: 150,
      widthCm: 100,
    },
  });
});

void test('rejects empty fields', () => {
  assert.deepEqual(Object.keys(errorsOf(EMPTY_CONTAINER_FORM)).sort(), [
    'capacityLiters',
    'heightCm',
    'radiusCm',
  ]);
  assert.deepEqual(
    Object.keys(errorsOf({ ...EMPTY_CONTAINER_FORM, geometry: 'rectangular' })).sort(),
    ['capacityLiters', 'heightCm', 'lengthCm', 'widthCm'],
  );
  assert.ok(errorsOf({ ...cylinder, radiusCm: '   ' }).radiusCm);
});

void test('rejects non-numeric, infinite, zero and negative values', () => {
  for (const bad of ['abc', '12abc', '0x10', 'Infinity', '-Infinity', '1e999', '0', '-5']) {
    assert.ok(errorsOf({ ...cylinder, capacityLiters: bad }).capacityLiters, bad);
    assert.ok(errorsOf({ ...cylinder, radiusCm: bad }).radiusCm, bad);
  }
});

void test('rejects height less than or equal to the safety distance', () => {
  assert.ok(errorsOf({ ...cylinder, heightCm: '10' }).heightCm);
  assert.ok(errorsOf({ ...cylinder, heightCm: '4' }).heightCm);
  assert.equal(validateContainerForm({ ...cylinder, heightCm: '10.5' }).valid, true);
});

void test('result has no residual dimensions from another geometry', () => {
  const switched = changeGeometry({ ...cylinder }, 'rectangular');
  assert.equal(switched.radiusCm, '');

  const filled = { ...switched, lengthCm: '100', widthCm: '80' };
  const result = validateContainerForm(filled);
  assert.ok(result.valid);
  assert.ok(result.valid && !('radiusCm' in result.config));

  const back = validateContainerForm({
    ...changeGeometry(filled, 'vertical-cylinder'),
    radiusCm: '40',
  });
  assert.ok(back.valid);
  assert.ok(back.valid && !('lengthCm' in back.config) && !('widthCm' in back.config));

  // Stale values from another geometry never leak, even if the input still holds them.
  const stale = validateContainerForm({ ...cylinder, lengthCm: '99', widthCm: '99' });
  assert.ok(stale.valid && !('lengthCm' in stale.config));
});

void test('validation messages are in Spanish', () => {
  const messages = Object.values(errorsOf(EMPTY_CONTAINER_FORM));
  assert.ok(messages.every((message) => /^Introduce /.test(message)));
  assert.match(errorsOf({ ...cylinder, heightCm: '5' }).heightCm ?? '', /mayor que 10 cm/);
  assert.match(errorsOf({ ...cylinder, radiusCm: 'abc' }).radiusCm ?? '', /debe ser un número/);
  assert.match(errorsOf({ ...cylinder, radiusCm: '-1' }).radiusCm ?? '', /mayor que cero/);
  assert.match(errorsOf({ ...cylinder, radiusCm: 'Infinity' }).radiusCm ?? '', /finito/);
});

import test from 'node:test';
import assert from 'node:assert/strict';
import { getRequiredCPCount, getCPCompensationReference } from '../lib/utils/cpRequirements.ts';

test('three required positions produce an $83.33 offer for every invitee', () => {
  const required = getRequiredCPCount({ photographer: 1, videographer: 1, hybrid: 1 }, 12);
  const reference = getCPCompensationReference(1000, required);
  assert.equal(required, 3);
  assert.deepEqual(reference, { budget: 250, perCreator: 83.33 });
  assert.deepEqual(Array.from({ length: 12 }, () => reference.perCreator), Array(12).fill(83.33));
});

test('split follows required crew count and never assumes the invitation count', () => {
  assert.equal(getCPCompensationReference(1000, 4).perCreator, 62.5);
  assert.equal(getCPCompensationReference(1000, 0).perCreator, 0);
  assert.equal(getRequiredCPCount('[]', 3), 3);
  assert.equal(getRequiredCPCount(null), 0);
});

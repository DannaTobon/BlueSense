import assert from 'node:assert/strict';
import { test } from 'node:test';

import { sessionStateFromUser } from '../src/features/auth/auth-session-state';

void test('a restored Firebase user becomes an authenticated session', () => {
  const user = { uid: 'user-1', name: 'Ana', email: 'ana@example.com' };

  assert.deepEqual(sessionStateFromUser(user), {
    status: 'authenticated',
    user,
  });
});

void test('a missing Firebase user becomes an unauthenticated session', () => {
  assert.deepEqual(sessionStateFromUser(null), {
    status: 'unauthenticated',
    user: null,
  });
});

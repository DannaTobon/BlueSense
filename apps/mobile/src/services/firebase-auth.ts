import { FirebaseError } from 'firebase/app';
import { browserLocalPersistence, getAuth, initializeAuth, type Auth } from 'firebase/auth';

import { firebaseApp } from './firebase-app';

function getOrInitializeAuth(): Auth {
  try {
    return initializeAuth(firebaseApp, {
      persistence: browserLocalPersistence,
    });
  } catch (error: unknown) {
    if (error instanceof FirebaseError && error.code === 'auth/already-initialized') {
      return getAuth(firebaseApp);
    }

    throw error;
  }
}

export const firebaseAuth = getOrInitializeAuth();

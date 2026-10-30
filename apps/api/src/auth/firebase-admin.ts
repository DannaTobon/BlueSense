import { applicationDefault, getApps, initializeApp, type App } from 'firebase-admin/app';
import { getAuth, type Auth } from 'firebase-admin/auth';

export const FIREBASE_PROJECT_ID = 'bluesense-347f0';

let adminApp: App | null = null;

export function getFirebaseAdminApp(): App {
  if (adminApp) {
    return adminApp;
  }

  const existingApp = getApps()[0];

  if (existingApp) {
    adminApp = existingApp;
    return existingApp;
  }

  adminApp = initializeApp({
    projectId: FIREBASE_PROJECT_ID,
    credential: applicationDefault(),
  });

  return adminApp;
}

export function getFirebaseAdminAuth(): Auth {
  return getAuth(getFirebaseAdminApp());
}

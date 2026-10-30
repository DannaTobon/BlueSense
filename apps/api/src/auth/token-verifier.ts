import { getFirebaseAdminAuth } from './firebase-admin.js';

export interface VerifiedIdentity {
  uid: string;
  email: string | null;
}

export interface TokenVerifier {
  verifyIdToken(token: string): Promise<VerifiedIdentity>;
}

export const defaultTokenVerifier: TokenVerifier = {
  async verifyIdToken(token: string): Promise<VerifiedIdentity> {
    const decodedToken = await getFirebaseAdminAuth().verifyIdToken(token);

    return {
      uid: decodedToken.uid,
      email: decodedToken.email ?? null,
    };
  },
};

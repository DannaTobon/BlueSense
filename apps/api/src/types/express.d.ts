import type { VerifiedIdentity } from '../auth/token-verifier.js';

declare global {
  namespace Express {
    interface Request {
      auth?: VerifiedIdentity;
    }
  }
}

export {};

import type { AuthUser } from './auth-service';

export type AuthStatus = 'loading' | 'authenticated' | 'unauthenticated';

export interface SessionState {
  status: AuthStatus;
  user: AuthUser | null;
}

export function sessionStateFromUser(user: AuthUser | null): SessionState {
  return {
    status: user ? 'authenticated' : 'unauthenticated',
    user,
  };
}

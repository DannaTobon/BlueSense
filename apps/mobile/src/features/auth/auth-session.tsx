import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type PropsWithChildren,
} from 'react';

import {
  PartialRegistrationError,
  type AuthUser,
  type RegisterInput,
  type SignInInput,
} from './auth-service';
import { sessionStateFromUser, type AuthStatus, type SessionState } from './auth-session-state';

import { firebaseAuthService } from '@/services/firebase-auth-service';

export interface AuthSessionValue {
  status: AuthStatus;
  user: AuthUser | null;
  notice: string | null;
  dismissNotice: () => void;
  signIn: (input: SignInInput) => Promise<void>;
  register: (input: RegisterInput) => Promise<void>;
  signOut: () => Promise<void>;
  getIdToken: () => Promise<string>;
  getSessionVersion: () => number;
}

const AuthSessionContext = createContext<AuthSessionValue | null>(null);

const PARTIAL_REGISTRATION_NOTICE =
  'Tu cuenta se creó, pero no se pudo guardar tu nombre en el perfil de Firebase. La sesión sigue activa; el nombre se podrá actualizar más adelante.';

export function AuthSessionProvider({ children }: PropsWithChildren) {
  const [state, setState] = useState<SessionState>({ status: 'loading', user: null });
  const [notice, setNotice] = useState<string | null>(null);
  const versionRef = useRef(0);

  const invalidateSession = useCallback(() => {
    versionRef.current += 1;
  }, []);

  useEffect(() => {
    const unsubscribe = firebaseAuthService.observeAuthState((user) => {
      invalidateSession();
      const nextState = sessionStateFromUser(user);

      if (!nextState.user) {
        setNotice(null);
      }

      setState(nextState);
    });

    return unsubscribe;
  }, [invalidateSession]);

  const signIn = useCallback(async (input: SignInInput) => {
    await firebaseAuthService.signIn(input);
  }, []);

  const register = useCallback(async (input: RegisterInput) => {
    try {
      await firebaseAuthService.register(input);
    } catch (error: unknown) {
      if (error instanceof PartialRegistrationError) {
        setNotice(PARTIAL_REGISTRATION_NOTICE);
        return;
      }

      throw error;
    }
  }, []);

  const signOut = useCallback(async () => {
    await firebaseAuthService.signOut();
    invalidateSession();
    setNotice(null);
    setState(sessionStateFromUser(null));
  }, [invalidateSession]);

  const getIdToken = useCallback(() => firebaseAuthService.getIdToken(), []);
  const getSessionVersion = useCallback(() => versionRef.current, []);
  const dismissNotice = useCallback(() => setNotice(null), []);

  const value = useMemo<AuthSessionValue>(
    () => ({
      status: state.status,
      user: state.user,
      notice,
      dismissNotice,
      signIn,
      register,
      signOut,
      getIdToken,
      getSessionVersion,
    }),
    [
      state.status,
      state.user,
      notice,
      dismissNotice,
      signIn,
      register,
      signOut,
      getIdToken,
      getSessionVersion,
    ],
  );

  return <AuthSessionContext.Provider value={value}>{children}</AuthSessionContext.Provider>;
}

export function useAuthSession(): AuthSessionValue {
  const value = useContext(AuthSessionContext);

  if (!value) {
    throw new Error('useAuthSession must be used inside AuthSessionProvider.');
  }

  return value;
}

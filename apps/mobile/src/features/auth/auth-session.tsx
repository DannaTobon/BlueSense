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
  type AuthService,
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

interface AuthSessionProviderProps extends PropsWithChildren {
  authService?: AuthService;
}

export function AuthSessionProvider({
  children,
  authService = firebaseAuthService,
}: AuthSessionProviderProps) {
  const [state, setState] = useState<SessionState>({ status: 'loading', user: null });
  const [notice, setNotice] = useState<string | null>(null);
  const versionRef = useRef(0);
  const operationRef = useRef(0);
  const currentUserRef = useRef<AuthUser | null>(null);
  const signedOutOperationRef = useRef<number | null>(null);
  const suppressAuthenticatedObserversRef = useRef(false);

  const invalidateSession = useCallback(() => {
    versionRef.current += 1;
  }, []);

  useEffect(() => {
    const unsubscribe = authService.observeAuthState((user) => {
      if (user && suppressAuthenticatedObserversRef.current) {
        return;
      }

      invalidateSession();
      const nextState = sessionStateFromUser(user);
      currentUserRef.current = user;

      if (!nextState.user) {
        setNotice(null);
      }

      setState(nextState);
    });

    return unsubscribe;
  }, [authService, invalidateSession]);

  const signIn = useCallback(
    async (input: SignInInput) => {
      const operation = ++operationRef.current;
      signedOutOperationRef.current = null;
      suppressAuthenticatedObserversRef.current = false;
      const user = await authService.signIn(input);

      if (
        operation === operationRef.current &&
        (currentUserRef.current === null || currentUserRef.current.uid === user.uid)
      ) {
        currentUserRef.current = user;
        setState(sessionStateFromUser(user));
      }
    },
    [authService],
  );

  const register = useCallback(
    async (input: RegisterInput) => {
      const operation = ++operationRef.current;
      signedOutOperationRef.current = null;
      suppressAuthenticatedObserversRef.current = false;

      try {
        const user = await authService.register(input);

        if (operation !== operationRef.current) {
          if (signedOutOperationRef.current === operationRef.current) {
            await authService.signOut();
          }
          return;
        }

        if (currentUserRef.current === null || currentUserRef.current.uid === user.uid) {
          currentUserRef.current = user;
          setState(sessionStateFromUser(user));
        }
      } catch (error: unknown) {
        if (error instanceof PartialRegistrationError) {
          if (operation !== operationRef.current) {
            if (signedOutOperationRef.current === operationRef.current) {
              await authService.signOut();
            }
            return;
          }

          if (currentUserRef.current === null || currentUserRef.current.uid === error.user.uid) {
            currentUserRef.current = error.user;
            setState(sessionStateFromUser(error.user));
            setNotice(PARTIAL_REGISTRATION_NOTICE);
          }
          return;
        }

        throw error;
      }
    },
    [authService],
  );

  const signOut = useCallback(async () => {
    const operation = ++operationRef.current;
    signedOutOperationRef.current = operation;
    suppressAuthenticatedObserversRef.current = true;
    invalidateSession();
    await authService.signOut();

    if (operation !== operationRef.current) {
      return;
    }

    currentUserRef.current = null;
    setNotice(null);
    setState(sessionStateFromUser(null));
  }, [authService, invalidateSession]);

  const getIdToken = useCallback(() => authService.getIdToken(), [authService]);
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

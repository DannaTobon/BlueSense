import { act, render, screen } from '@testing-library/react-native';
import { useEffect } from 'react';
import { Text, View } from 'react-native';

import {
  AuthSessionProvider,
  useAuthSession,
  type AuthSessionValue,
} from '@/features/auth/auth-session';
import {
  PartialRegistrationError,
  type AuthService,
  type AuthStateListener,
  type AuthUser,
} from '@/features/auth/auth-service';

const registrationInput = {
  name: 'Ada Lovelace',
  email: 'ada@example.com',
  password: 'exact-password',
};

function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((promiseResolve) => {
    resolve = promiseResolve;
  });

  return { promise, resolve };
}

function createService(register: AuthService['register']) {
  let listener: AuthStateListener | null = null;
  let signOutCalls = 0;
  const service: AuthService = {
    observeAuthState(nextListener) {
      listener = nextListener;
      nextListener(null);
      return () => {
        listener = null;
      };
    },
    register,
    async signIn() {
      throw new Error('Not used by this test.');
    },
    async signOut() {
      signOutCalls += 1;
    },
    async getIdToken() {
      return 'unused-token';
    },
  };

  return {
    service,
    emit(user: AuthUser | null) {
      listener?.(user);
    },
    getSignOutCalls() {
      return signOutCalls;
    },
  };
}

function SessionProbe({ onSession }: { onSession: (session: AuthSessionValue) => void }) {
  const session = useAuthSession();

  useEffect(() => {
    onSession(session);
  }, [onSession, session]);

  return (
    <View>
      <Text testID="status">{session.status}</Text>
      <Text testID="uid">{session.user?.uid ?? 'none'}</Text>
      <Text testID="name">{session.user?.name ?? 'none'}</Text>
      <Text testID="notice">{session.notice ?? 'none'}</Text>
    </View>
  );
}

async function renderSession(service: AuthService) {
  let currentSession: AuthSessionValue | null = null;
  const captureSession = (session: AuthSessionValue) => {
    currentSession = session;
  };

  const result = await render(
    <AuthSessionProvider authService={service}>
      <SessionProbe onSession={captureSession} />
    </AuthSessionProvider>,
  );

  return {
    ...result,
    getSession() {
      if (!currentSession) {
        throw new Error('The session probe has not received context yet.');
      }
      return currentSession;
    },
  };
}

describe('registration session updates', () => {
  test('shows the saved display name immediately after complete registration', async () => {
    const user = { uid: 'new-user', name: 'Ada Lovelace', email: 'ada@example.com' };
    const { service } = createService(async () => user);
    const { getSession } = await renderSession(service);

    await act(async () => getSession().register(registrationInput));

    expect(screen.getByTestId('name')).toHaveTextContent('Ada Lovelace');
    expect(screen.getByTestId('uid')).toHaveTextContent('new-user');
    expect(screen.getByTestId('status')).toHaveTextContent('authenticated');
  });

  test('keeps the created session and notice when saving the name fails', async () => {
    const user = { uid: 'partial-user', name: null, email: 'ada@example.com' };
    const { service } = createService(async () => {
      throw new PartialRegistrationError(user);
    });
    const { getSession } = await renderSession(service);

    await act(async () => getSession().register(registrationInput));

    expect(screen.getByTestId('uid')).toHaveTextContent('partial-user');
    expect(screen.getByTestId('status')).toHaveTextContent('authenticated');
    expect(screen.getByTestId('notice')).not.toHaveTextContent('none');
  });

  test('ignores a completed registration after sign-out starts', async () => {
    const pending = deferred<AuthUser>();
    const { service, emit, getSignOutCalls } = createService(() => pending.promise);
    const { getSession } = await renderSession(service);

    let registrationPromise!: Promise<void>;
    await act(() => {
      registrationPromise = getSession().register(registrationInput);
    });
    await act(async () => getSession().signOut());
    await act(() => emit({ uid: 'stale-user', name: null, email: 'stale@example.com' }));
    pending.resolve({
      uid: 'stale-user',
      name: 'Stale Name',
      email: 'stale@example.com',
    });
    await act(async () => registrationPromise);

    expect(screen.getByTestId('status')).toHaveTextContent('unauthenticated');
    expect(screen.getByTestId('uid')).toHaveTextContent('none');
    expect(screen.getByTestId('name')).toHaveTextContent('none');
    expect(getSignOutCalls()).toBe(2);
  });

  test('does not replace a newer observed session with an older registration result', async () => {
    const pending = deferred<AuthUser>();
    const { service, emit } = createService(() => pending.promise);
    const { getSession } = await renderSession(service);

    let registrationPromise!: Promise<void>;
    await act(() => {
      registrationPromise = getSession().register(registrationInput);
    });
    await act(() => emit({ uid: 'newer-user', name: 'Grace Hopper', email: 'grace@example.com' }));
    pending.resolve({
      uid: 'older-user',
      name: 'Ada Lovelace',
      email: 'ada@example.com',
    });
    await act(async () => registrationPromise);

    expect(screen.getByTestId('uid')).toHaveTextContent('newer-user');
    expect(screen.getByTestId('name')).toHaveTextContent('Grace Hopper');
  });
});

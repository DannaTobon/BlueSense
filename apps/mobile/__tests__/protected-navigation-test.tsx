import { renderRouter, screen } from 'expo-router/testing-library';
import { Slot } from 'expo-router';

import { ProtectedRootNavigator } from '@/app/_layout';
import type { AuthStatus } from '@/features/auth/auth-session-state';

function routesFor(status: AuthStatus) {
  return {
    _layout: () => <ProtectedRootNavigator sessionStatus={status} />,
    '(app)/_layout': Slot,
    '(app)/index': () => null,
    '(auth)/_layout': Slot,
    '(auth)/sign-in': () => null,
  };
}

describe('protected root navigation', () => {
  test('redirects a signed-out user from the private route to sign-in', async () => {
    await renderRouter(routesFor('unauthenticated'), { initialUrl: '/' });

    expect(screen).toHavePathname('/sign-in');
  });

  test('redirects an authenticated user from sign-in to the private area', async () => {
    await renderRouter(routesFor('authenticated'), { initialUrl: '/sign-in' });

    expect(screen).toHavePathname('/');
  });

  test('shows session restoration without mounting either protected group', async () => {
    await renderRouter(routesFor('loading'), { initialUrl: '/' });

    expect(screen.getByLabelText('Cargando sesión')).toBeOnTheScreen();
    expect(screen).toHavePathname('/');
  });
});

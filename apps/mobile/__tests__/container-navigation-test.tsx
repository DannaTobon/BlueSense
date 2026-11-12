import { fireEvent, screen, waitFor } from '@testing-library/react-native';
import { renderRouter } from 'expo-router/testing-library';
import { Text } from 'react-native';

import AppLayout from '@/app/(app)/_layout';

jest.mock('@/components/app-tabs', () => {
  const React = require('react');
  const { Slot } = require('expo-router');

  return {
    __esModule: true,
    default: function MockAppTabs() {
      return React.createElement(Slot);
    },
  };
});

const routes = {
  '(app)/_layout': AppLayout,
  '(app)/index': () => <Text>Pantalla de inicio</Text>,
  '(app)/explore': () => <Text>Pantalla de estado</Text>,
  '(app)/container': () => <Text>Pantalla de configuración</Text>,
};

describe('water container navigation', () => {
  test('opens the container route and returns through the layout link', async () => {
    await renderRouter(routes, { initialUrl: '/' });

    await fireEvent.press(screen.getByLabelText('Configurar depósito'));

    await waitFor(() => expect(screen).toHavePathname('/container'));
    expect(screen.getByText('Pantalla de configuración')).toBeOnTheScreen();

    await fireEvent.press(screen.getByLabelText('Volver al inicio'));

    await waitFor(() => expect(screen).toHavePathname('/'));
    expect(screen.getByText('Pantalla de inicio')).toBeOnTheScreen();
  });
});

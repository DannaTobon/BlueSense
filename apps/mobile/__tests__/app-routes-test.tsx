import { renderRouter, screen } from 'expo-router/testing-library';
import { Slot } from 'expo-router';

import ContainerScreen from '@/app/(app)/container';
import MonitoringHistoryScreen from '@/app/(app)/history';

const routes = {
  '(app)/_layout': Slot,
  '(app)/container': ContainerScreen,
  '(app)/history': MonitoringHistoryScreen,
};

describe('app routes', () => {
  test('opens the water container form route', async () => {
    await renderRouter(routes, { initialUrl: '/container' });

    expect(screen).toHavePathname('/container');
    expect(screen.getByText('Configurar depósito')).toBeOnTheScreen();
  });

  test('opens the monitoring history route', async () => {
    await renderRouter(routes, { initialUrl: '/history' });

    expect(screen).toHavePathname('/history');
    expect(screen.getByText('Historial')).toBeOnTheScreen();
  });
});

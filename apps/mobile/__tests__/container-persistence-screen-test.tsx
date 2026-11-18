import { fireEvent, render } from '@testing-library/react-native';

import ContainerScreen from '@/app/(app)/container';
import { useWaterContainerDraft } from '@/features/water-container/use-water-container-draft';

jest.mock('@/features/water-container/use-water-container-draft', () => ({
  useWaterContainerDraft: jest.fn(),
}));

const mockedHook = jest.mocked(useWaterContainerDraft);

function state(overrides: Partial<ReturnType<typeof useWaterContainerDraft>> = {}) {
  return {
    loadState: { status: 'loading' } as const,
    saveState: { status: 'idle' } as const,
    retry: jest.fn(),
    save: jest.fn(),
    clearSaveFeedback: jest.fn(),
    ...overrides,
  };
}

describe('water container persistence screen', () => {
  test('does not allow editing before the remote draft is known', async () => {
    mockedHook.mockReturnValue(state());
    const view = await render(<ContainerScreen />);
    expect(view.getByLabelText('Cargando configuración')).toBeOnTheScreen();
    expect(view.queryByLabelText('Altura interior (cm)')).not.toBeOnTheScreen();
  });

  test('offers retry on load failure', async () => {
    const retry = jest.fn();
    mockedHook.mockReturnValue(
      state({ loadState: { status: 'error', message: 'No se pudo cargar.' }, retry }),
    );
    const view = await render(<ContainerScreen />);
    await fireEvent.press(view.getByRole('button', { name: 'Reintentar' }));
    expect(retry).toHaveBeenCalledTimes(1);
  });

  test('shows the form after a successful empty load', async () => {
    mockedHook.mockReturnValue(state({ loadState: { status: 'ready', draft: null } }));
    const view = await render(<ContainerScreen />);
    expect(view.getByLabelText('Capacidad nominal (litros, opcional)')).toBeOnTheScreen();
    expect(view.getByRole('button', { name: 'Guardar configuración' })).toBeEnabled();
  });
});

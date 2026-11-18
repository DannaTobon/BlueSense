import { fireEvent, render } from '@testing-library/react-native';

import { FormField } from '@/components/form-field';
import { WaterContainerForm } from '@/components/water-container-form';

describe('water container form accessibility', () => {
  test('exposes a field error to assistive technologies', async () => {
    const view = await render(
      <FormField
        label="Capacidad (litros)"
        value=""
        onChangeText={() => {}}
        error="Introduce la capacidad en litros."
      />,
    );

    expect(view.getByLabelText('Capacidad (litros)')).toHaveProp(
      'accessibilityHint',
      'Error: Introduce la capacidad en litros.',
    );
    expect(view.getByRole('alert')).toHaveTextContent('Introduce la capacidad en litros.');
    expect(view.getByRole('alert')).toHaveProp('accessibilityLiveRegion', 'polite');
  });

  test('clears only the error for the field being edited', async () => {
    const view = await render(<WaterContainerForm />);

    await fireEvent.press(view.getByText('Validar configuración'));

    expect(view.getByText('Introduce la capacidad en litros.')).toBeOnTheScreen();
    expect(view.getByText('Introduce la altura en centímetros.')).toBeOnTheScreen();
    expect(view.getByText('Introduce el radio en centímetros.')).toBeOnTheScreen();

    await fireEvent.changeText(view.getByLabelText('Capacidad (litros)'), '1000');

    expect(view.queryByText('Introduce la capacidad en litros.')).not.toBeOnTheScreen();
    expect(view.getByText('Introduce la altura en centímetros.')).toBeOnTheScreen();
    expect(view.getByText('Introduce el radio en centímetros.')).toBeOnTheScreen();
  });
});

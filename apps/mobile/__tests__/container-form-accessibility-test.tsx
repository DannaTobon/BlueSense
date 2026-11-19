import { fireEvent, render } from '@testing-library/react-native';

import { FormField } from '@/components/form-field';
import { WaterContainerForm } from '@/components/water-container-form';

describe('water container form accessibility', () => {
  const defaultProps = {
    initialDraft: null,
    isSaving: false,
    feedback: null,
    onSave: jest.fn(),
    onEdit: jest.fn(),
  };

  test('exposes a field error to assistive technologies', async () => {
    const view = await render(
      <FormField
        label="Altura interior (cm)"
        value=""
        onChangeText={() => {}}
        error="Introduce la altura interior."
      />,
    );
    expect(view.getByLabelText('Altura interior (cm)')).toHaveProp(
      'accessibilityHint',
      'Error: Introduce la altura interior.',
    );
    expect(view.getByRole('alert')).toHaveTextContent('Introduce la altura interior.');
  });

  test('shows the 0–100 percent calibration fields', async () => {
    const view = await render(<WaterContainerForm {...defaultProps} />);
    expect(view.getByLabelText('Distancia al vacío, 0 % (cm)')).toBeOnTheScreen();
    expect(view.getByLabelText('Distancia al lleno seguro, 100 % (cm)')).toBeOnTheScreen();
    expect(view.getByLabelText('Capacidad nominal (litros, opcional)')).toBeOnTheScreen();
  });

  test('prefills and submits a calibrated draft', async () => {
    const onSave = jest.fn();
    const draft = {
      configurationStatus: 'draft' as const,
      geometry: 'rectangular' as const,
      capacityLiters: null,
      heightCm: 150,
      emptyDistanceCm: 145,
      fullDistanceCm: 10,
      lengthCm: 100,
      widthCm: 80,
    };
    const view = await render(
      <WaterContainerForm {...defaultProps} initialDraft={draft} onSave={onSave} />,
    );
    expect(view.getByLabelText('Capacidad nominal (litros, opcional)')).toHaveProp('value', '');
    expect(view.getByLabelText('Distancia al vacío, 0 % (cm)')).toHaveProp('value', '145');
    await fireEvent.press(view.getByText('Guardar configuración'));
    expect(onSave).toHaveBeenCalledWith({
      geometry: 'rectangular',
      capacityLiters: null,
      heightCm: 150,
      emptyDistanceCm: 145,
      fullDistanceCm: 10,
      lengthCm: 100,
      widthCm: 80,
    });
  });

  test('locks every field and geometry option while saving', async () => {
    const onSave = jest.fn();
    const onEdit = jest.fn();
    const view = await render(
      <WaterContainerForm {...defaultProps} isSaving onSave={onSave} onEdit={onEdit} />,
    );

    const capacityField = view.getByLabelText('Capacidad nominal (litros, opcional)');
    expect(capacityField).toHaveProp('editable', false);
    await fireEvent.changeText(capacityField, '1200');
    expect(capacityField).toHaveProp('value', '');

    const rectangularOption = view.getByRole('radio', { name: 'Rectangular o cuadrado' });
    expect(rectangularOption).toBeDisabled();
    await fireEvent.press(rectangularOption);

    expect(view.getByLabelText('Radio interior (cm)')).toBeOnTheScreen();
    expect(view.queryByLabelText('Largo interior (cm)')).not.toBeOnTheScreen();
    expect(view.getByRole('button', { name: 'Guardar configuración' })).toBeDisabled();
    expect(onEdit).not.toHaveBeenCalled();
    expect(onSave).not.toHaveBeenCalled();
  });
});

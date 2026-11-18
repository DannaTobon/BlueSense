import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { FormField } from './form-field';
import { PrimaryButton } from './primary-button';
import { ThemedText } from './themed-text';

import { Spacing } from '@/constants/theme';
import {
  EMPTY_CONTAINER_FORM,
  GEOMETRY_LABELS,
  changeGeometry,
  containerDraftToFormInput,
  validateContainerForm,
  type ContainerFieldErrors,
  type ContainerFieldName,
  type ContainerFormInput,
  type ContainerGeometry,
} from '@/features/water-container/container-form';
import { useTheme } from '@/hooks/use-theme';
import type { WaterContainerDraft, WaterContainerInput } from '@/types/water-container';

const GEOMETRIES: ContainerGeometry[] = ['vertical-cylinder', 'rectangular'];

interface WaterContainerFormProps {
  initialDraft: WaterContainerDraft | null;
  isSaving: boolean;
  feedback: { type: 'success' | 'error'; message: string } | null;
  onSave: (input: WaterContainerInput) => void;
  onEdit: () => void;
}

export function WaterContainerForm({
  initialDraft,
  isSaving,
  feedback,
  onSave,
  onEdit,
}: WaterContainerFormProps) {
  const theme = useTheme();
  const [input, setInput] = useState<ContainerFormInput>(() =>
    initialDraft ? containerDraftToFormInput(initialDraft) : EMPTY_CONTAINER_FORM,
  );
  const [errors, setErrors] = useState<ContainerFieldErrors>({});

  function update(field: ContainerFieldName, value: string) {
    setInput((current) => ({ ...current, [field]: value }));
    setErrors((current) => {
      if (!current[field]) return current;
      const next = { ...current };
      delete next[field];
      return next;
    });
    onEdit();
  }

  function selectGeometry(geometry: ContainerGeometry) {
    setInput((current) => changeGeometry(current, geometry));
    setErrors({});
    onEdit();
  }

  function submit() {
    const result = validateContainerForm(input);
    if (result.valid) {
      setErrors({});
      onSave(result.config);
    } else {
      setErrors(result.errors);
    }
  }

  return (
    <View style={styles.container}>
      <View style={styles.group} accessibilityRole="radiogroup">
        <ThemedText type="smallBold">Tipo de depósito</ThemedText>
        {GEOMETRIES.map((geometry) => {
          const selected = input.geometry === geometry;
          return (
            <Pressable
              key={geometry}
              accessibilityRole="radio"
              accessibilityLabel={GEOMETRY_LABELS[geometry]}
              accessibilityState={{ selected, checked: selected }}
              onPress={() => selectGeometry(geometry)}
              style={[
                styles.option,
                {
                  backgroundColor: theme.backgroundElement,
                  borderColor: selected ? theme.text : theme.backgroundSelected,
                },
              ]}
            >
              <ThemedText type={selected ? 'smallBold' : 'small'}>
                {selected ? '● ' : '○ '}
                {GEOMETRY_LABELS[geometry]}
              </ThemedText>
            </Pressable>
          );
        })}
      </View>

      <FormField
        label="Capacidad nominal (litros, opcional)"
        keyboardType="decimal-pad"
        value={input.capacityLiters}
        onChangeText={(value) => update('capacityLiters', value)}
        error={errors.capacityLiters}
      />
      <FormField
        label="Altura interior (cm)"
        keyboardType="decimal-pad"
        value={input.heightCm}
        onChangeText={(value) => update('heightCm', value)}
        error={errors.heightCm}
      />

      {input.geometry === 'vertical-cylinder' ? (
        <FormField
          label="Radio interior (cm)"
          keyboardType="decimal-pad"
          value={input.radiusCm}
          onChangeText={(value) => update('radiusCm', value)}
          error={errors.radiusCm}
        />
      ) : (
        <>
          <FormField
            label="Largo interior (cm)"
            keyboardType="decimal-pad"
            value={input.lengthCm}
            onChangeText={(value) => update('lengthCm', value)}
            error={errors.lengthCm}
          />
          <FormField
            label="Ancho interior (cm)"
            keyboardType="decimal-pad"
            value={input.widthCm}
            onChangeText={(value) => update('widthCm', value)}
            error={errors.widthCm}
          />
        </>
      )}

      <ThemedText type="smallBold">Calibración del sensor</ThemedText>
      <ThemedText type="small" themeColor="textSecondary">
        Mide desde la cara del sensor hasta el agua en los puntos vacío (0 %) y lleno seguro (100
        %).
      </ThemedText>
      <FormField
        label="Distancia al vacío, 0 % (cm)"
        keyboardType="decimal-pad"
        value={input.emptyDistanceCm}
        onChangeText={(value) => update('emptyDistanceCm', value)}
        error={errors.emptyDistanceCm}
      />
      <FormField
        label="Distancia al lleno seguro, 100 % (cm)"
        keyboardType="decimal-pad"
        value={input.fullDistanceCm}
        onChangeText={(value) => update('fullDistanceCm', value)}
        error={errors.fullDistanceCm}
      />

      <PrimaryButton
        label="Guardar configuración"
        loading={isSaving}
        disabled={isSaving}
        onPress={submit}
      />

      {feedback ? (
        <View
          accessibilityRole="alert"
          accessibilityLiveRegion="polite"
          style={[styles.notice, { backgroundColor: theme.backgroundElement }]}
        >
          <ThemedText type="smallBold">
            {feedback.type === 'success' ? 'Borrador guardado' : 'No se pudo guardar'}
          </ThemedText>
          <ThemedText type="small">{feedback.message}</ThemedText>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: Spacing.three, width: '100%' },
  group: { gap: Spacing.two },
  option: {
    minHeight: 48,
    justifyContent: 'center',
    borderWidth: 1,
    borderRadius: Spacing.two,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
  },
  notice: { gap: Spacing.one, borderRadius: Spacing.two, padding: Spacing.three },
});

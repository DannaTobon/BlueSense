import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { FormField } from './form-field';
import { PrimaryButton } from './primary-button';
import { ThemedText } from './themed-text';

import { Spacing } from '@/constants/theme';
import {
  EMPTY_CONTAINER_FORM,
  GEOMETRY_LABELS,
  SAFETY_DISTANCE_CM,
  changeGeometry,
  validateContainerForm,
  type ContainerConfig,
  type ContainerFieldErrors,
  type ContainerFieldName,
  type ContainerFormInput,
  type ContainerGeometry,
} from '@/features/water-container/container-form';
import { useTheme } from '@/hooks/use-theme';

const GEOMETRIES: ContainerGeometry[] = ['vertical-cylinder', 'rectangular'];

export function WaterContainerForm() {
  const theme = useTheme();
  const [input, setInput] = useState<ContainerFormInput>(EMPTY_CONTAINER_FORM);
  const [errors, setErrors] = useState<ContainerFieldErrors>({});
  const [readyConfig, setReadyConfig] = useState<ContainerConfig | null>(null);

  function update(field: ContainerFieldName, value: string) {
    setInput((current) => ({ ...current, [field]: value }));
    setErrors((current) => {
      if (!current[field]) {
        return current;
      }

      const next = { ...current };
      delete next[field];
      return next;
    });
    setReadyConfig(null);
  }

  function selectGeometry(geometry: ContainerGeometry) {
    setInput((current) => changeGeometry(current, geometry));
    setErrors({});
    setReadyConfig(null);
  }

  function submit() {
    const result = validateContainerForm(input);

    if (result.valid) {
      setErrors({});
      setReadyConfig(result.config);
    } else {
      setErrors(result.errors);
      setReadyConfig(null);
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
        label="Capacidad (litros)"
        keyboardType="decimal-pad"
        value={input.capacityLiters}
        onChangeText={(value) => update('capacityLiters', value)}
        error={errors.capacityLiters}
      />
      <FormField
        label="Altura física (cm)"
        keyboardType="decimal-pad"
        value={input.heightCm}
        onChangeText={(value) => update('heightCm', value)}
        error={errors.heightCm}
      />

      {input.geometry === 'vertical-cylinder' ? (
        <FormField
          label="Radio (cm)"
          keyboardType="decimal-pad"
          value={input.radiusCm}
          onChangeText={(value) => update('radiusCm', value)}
          error={errors.radiusCm}
        />
      ) : (
        <>
          <FormField
            label="Largo (cm)"
            keyboardType="decimal-pad"
            value={input.lengthCm}
            onChangeText={(value) => update('lengthCm', value)}
            error={errors.lengthCm}
          />
          <FormField
            label="Ancho (cm)"
            keyboardType="decimal-pad"
            value={input.widthCm}
            onChangeText={(value) => update('widthCm', value)}
            error={errors.widthCm}
          />
        </>
      )}

      <ThemedText type="small" themeColor="textSecondary">
        Distancia de seguridad: {SAFETY_DISTANCE_CM} cm. Es un valor inicial que aplica el sistema
        automáticamente.
      </ThemedText>

      <PrimaryButton label="Validar configuración" onPress={submit} />

      {readyConfig ? (
        <View
          accessibilityRole="alert"
          accessibilityLiveRegion="polite"
          style={[styles.notice, { backgroundColor: theme.backgroundElement }]}
        >
          <ThemedText type="smallBold">Configuración lista</ThemedText>
          <ThemedText type="small">
            Los datos son válidos, pero todavía no se han guardado en el servidor.
          </ThemedText>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: Spacing.three,
    width: '100%',
  },
  group: {
    gap: Spacing.two,
  },
  option: {
    minHeight: 48,
    justifyContent: 'center',
    borderWidth: 1,
    borderRadius: Spacing.two,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
  },
  notice: {
    gap: Spacing.one,
    borderRadius: Spacing.two,
    padding: Spacing.three,
  },
});

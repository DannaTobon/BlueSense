import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { PrimaryButton } from '@/components/primary-button';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { WaterContainerForm } from '@/components/water-container-form';
import { BottomTabInset, MaxContentWidth, Spacing } from '@/constants/theme';
import { useWaterContainerDraft } from '@/features/water-container/use-water-container-draft';

export default function ContainerScreen() {
  const { loadState, saveState, retry, save, clearSaveFeedback } = useWaterContainerDraft();
  const feedback =
    saveState.status === 'success' || saveState.status === 'error'
      ? { type: saveState.status, message: saveState.message }
      : null;

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.flex}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.flex}
        >
          <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
            <ThemedText type="subtitle">Configurar depósito</ThemedText>
            <ThemedText themeColor="textSecondary">
              Indica las medidas interiores y las referencias 0–100 % del sensor. La capacidad
              nominal es opcional y los litros siempre serán una estimación.
            </ThemedText>
            {loadState.status === 'loading' ? (
              <ActivityIndicator accessibilityLabel="Cargando configuración" />
            ) : null}
            {loadState.status === 'error' ? (
              <>
                <ThemedText accessibilityRole="alert">{loadState.message}</ThemedText>
                <PrimaryButton
                  label="Reintentar"
                  variant="secondary"
                  onPress={() => void retry()}
                />
              </>
            ) : null}
            {loadState.status === 'ready' ? (
              <WaterContainerForm
                initialDraft={loadState.draft}
                isSaving={saveState.status === 'saving'}
                feedback={feedback}
                onEdit={clearSaveFeedback}
                onSave={(input) => void save(input)}
              />
            ) : null}
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  flex: { flex: 1 },
  content: {
    alignSelf: 'center',
    width: '100%',
    maxWidth: MaxContentWidth,
    gap: Spacing.three,
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.five,
    paddingBottom: BottomTabInset + Spacing.four,
  },
});

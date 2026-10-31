import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { PrimaryButton } from './primary-button';
import { ThemedText } from './themed-text';
import { ThemedView } from './themed-view';

import { Spacing } from '@/constants/theme';
import { useApiIdentityCheck } from '@/features/auth/use-api-identity-check';
import { useTheme } from '@/hooks/use-theme';
import { readApiConfig } from '@/services/api-config';

export function ApiConnectionCard() {
  const theme = useTheme();
  const apiConfig = readApiConfig();
  const { state, check } = useApiIdentityCheck();
  const isChecking = state.status === 'checking';

  return (
    <ThemedView type="backgroundElement" style={styles.card}>
      <ThemedText type="subtitle">Conexión con la API</ThemedText>
      <ThemedText type="small" themeColor="textSecondary">
        Destino: {apiConfig.ok ? apiConfig.baseUrl : 'sin configurar'}
      </ThemedText>

      {state.status === 'idle' ? (
        <ThemedText themeColor="textSecondary">
          Comprueba que el backend verifica tu identidad con el token de Firebase.
        </ThemedText>
      ) : null}

      {state.status === 'checking' ? (
        <View style={styles.row}>
          <ActivityIndicator color={theme.text} />
          <ThemedText>Consultando GET /me…</ThemedText>
        </View>
      ) : null}

      {state.status === 'success' ? (
        <View style={styles.result}>
          <ThemedText type="smallBold">Identidad verificada por la API</ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            UID: {state.identity.uid}
          </ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            Correo: {state.identity.email ?? 'no incluido en el token'}
          </ThemedText>
        </View>
      ) : null}

      {state.status === 'error' ? (
        <View style={styles.result}>
          <ThemedText type="smallBold" style={{ color: theme.danger }}>
            La comprobación falló
          </ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            {state.message}
          </ThemedText>
        </View>
      ) : null}

      <PrimaryButton
        label="Comprobar conexión con la API"
        variant="secondary"
        loading={isChecking}
        onPress={() => {
          void check();
        }}
      />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  card: {
    width: '100%',
    gap: Spacing.two,
    borderRadius: Spacing.three,
    padding: Spacing.three,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  result: {
    gap: Spacing.one,
  },
});

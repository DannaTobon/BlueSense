import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ApiConnectionCard } from '@/components/api-connection-card';
import { PrimaryButton } from '@/components/primary-button';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BottomTabInset, MaxContentWidth, Spacing } from '@/constants/theme';
import { toAuthErrorMessage } from '@/features/auth/auth-errors';
import { useAuthSession } from '@/features/auth/auth-session';
import { useTheme } from '@/hooks/use-theme';

export default function HomeScreen() {
  const theme = useTheme();
  const { user, notice, dismissNotice, signOut } = useAuthSession();
  const [signingOut, setSigningOut] = useState(false);
  const [signOutError, setSignOutError] = useState<string | null>(null);

  async function handleSignOut() {
    if (signingOut) {
      return;
    }

    setSigningOut(true);
    setSignOutError(null);

    try {
      await signOut();
    } catch (error: unknown) {
      setSignOutError(toAuthErrorMessage(error));
      setSigningOut(false);
    }
  }

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.content}>
          <ThemedText type="title">BlueSense</ThemedText>
          <ThemedText themeColor="textSecondary">
            Monitoreo del nivel de agua de tu depósito
          </ThemedText>

          {notice ? (
            <ThemedView type="backgroundSelected" style={styles.notice}>
              <ThemedText type="smallBold">Registro parcial</ThemedText>
              <ThemedText type="small">{notice}</ThemedText>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Descartar aviso de registro parcial"
                onPress={dismissNotice}
              >
                <ThemedText type="linkPrimary">Descartar</ThemedText>
              </Pressable>
            </ThemedView>
          ) : null}

          <ThemedView type="backgroundElement" style={styles.card}>
            <ThemedText type="subtitle">Sesión</ThemedText>
            <ThemedText type="smallBold">Sesión de Firebase activa</ThemedText>
            <View style={styles.details}>
              <ThemedText type="small" themeColor="textSecondary">
                Nombre: {user?.name?.trim() || 'no guardado'}
              </ThemedText>
              <ThemedText type="small" themeColor="textSecondary">
                Correo: {user?.email ?? 'no disponible'}
              </ThemedText>
              <ThemedText type="small" themeColor="textSecondary">
                UID: {user?.uid ?? 'no disponible'}
              </ThemedText>
            </View>
          </ThemedView>

          <ApiConnectionCard />

          <ThemedText type="small" themeColor="textSecondary">
            El monitoreo del depósito, los dispositivos y el historial se implementarán en las
            próximas iteraciones.
          </ThemedText>

          <PrimaryButton
            label="Cerrar sesión"
            variant="secondary"
            loading={signingOut}
            onPress={() => {
              void handleSignOut();
            }}
          />

          {signOutError ? (
            <ThemedText type="small" style={{ color: theme.danger }}>
              {signOutError}
            </ThemedText>
          ) : null}
        </ScrollView>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  content: {
    flexGrow: 1,
    alignSelf: 'center',
    width: '100%',
    maxWidth: MaxContentWidth,
    gap: Spacing.three,
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.five,
    paddingBottom: BottomTabInset + Spacing.four,
  },
  notice: {
    gap: Spacing.two,
    borderRadius: Spacing.three,
    padding: Spacing.three,
  },
  card: {
    gap: Spacing.two,
    borderRadius: Spacing.three,
    padding: Spacing.three,
  },
  details: {
    gap: Spacing.one,
  },
});

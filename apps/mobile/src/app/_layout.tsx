import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import { ActivityIndicator, StyleSheet, useColorScheme } from 'react-native';

import { SplashScreenController } from '@/components/splash-screen-controller';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { AuthSessionProvider, useAuthSession } from '@/features/auth/auth-session';
import type { AuthStatus } from '@/features/auth/auth-session-state';

export default function RootLayout() {
  const colorScheme = useColorScheme();

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <AuthSessionProvider>
        <SplashScreenController />
        <RootNavigator />
      </AuthSessionProvider>
    </ThemeProvider>
  );
}

function RootNavigator() {
  const { status } = useAuthSession();

  return <ProtectedRootNavigator sessionStatus={status} />;
}

export function ProtectedRootNavigator({ sessionStatus }: { sessionStatus: AuthStatus }) {
  if (sessionStatus === 'loading') {
    return (
      <ThemedView style={styles.loadingContainer}>
        <ActivityIndicator accessibilityLabel="Cargando sesión" size="large" />
        <ThemedText themeColor="textSecondary">Cargando sesión…</ThemedText>
      </ThemedView>
    );
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Protected guard={sessionStatus === 'authenticated'} redirectTo="/sign-in">
        <Stack.Screen name="(app)" />
      </Stack.Protected>

      <Stack.Protected guard={sessionStatus === 'unauthenticated'} redirectTo="/">
        <Stack.Screen name="(auth)" />
      </Stack.Protected>
    </Stack>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.three,
  },
});

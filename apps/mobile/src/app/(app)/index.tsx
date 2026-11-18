import { Link } from 'expo-router';
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
import { DEMO_MONITORING_SNAPSHOT } from '@/features/monitoring/demo-monitoring';
import { useTheme } from '@/hooks/use-theme';

const QUICK_ACTIONS = [
  { href: '/explore' as const, title: 'Ver estado', description: 'Nivel y recomendación actual' },
  {
    href: '/history' as const,
    title: 'Abrir historial',
    description: 'Lecturas recientes del depósito',
  },
  {
    href: '/container' as const,
    title: 'Configurar depósito',
    description: 'Capacidad y dimensiones',
  },
];

export default function HomeScreen() {
  const theme = useTheme();
  const { user, notice, dismissNotice, signOut } = useAuthSession();
  const [signingOut, setSigningOut] = useState(false);
  const [signOutError, setSignOutError] = useState<string | null>(null);

  async function handleSignOut() {
    if (signingOut) return;
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
          <View style={styles.header}>
            <View style={styles.headerCopy}>
              <ThemedText type="title">BlueSense</ThemedText>
              <ThemedText themeColor="textSecondary">
                Hola, {user?.name?.trim() || user?.email || 'bienvenido'}
              </ThemedText>
            </View>
            <ThemedView type="backgroundSelected" style={styles.demoBadge}>
              <ThemedText type="smallBold">Vista demo</ThemedText>
            </ThemedView>
          </View>

          {notice ? (
            <ThemedView type="backgroundSelected" style={styles.notice}>
              <ThemedText type="smallBold">Aviso de cuenta</ThemedText>
              <ThemedText type="small">{notice}</ThemedText>
              <Pressable accessibilityRole="button" onPress={dismissNotice}>
                <ThemedText type="linkPrimary">Descartar</ThemedText>
              </Pressable>
            </ThemedView>
          ) : null}

          <Link href="/explore" asChild>
            <Pressable accessibilityRole="button" accessibilityLabel="Ver estado del depósito">
              {({ pressed }) => (
                <ThemedView
                  type="backgroundElement"
                  style={[styles.heroCard, pressed && styles.pressed]}
                >
                  <View style={styles.rowBetween}>
                    <ThemedText type="smallBold">Nivel actual</ThemedText>
                    <ThemedText type="small" themeColor="textSecondary">
                      {DEMO_MONITORING_SNAPSHOT.lastSeenLabel}
                    </ThemedText>
                  </View>
                  <View style={styles.levelRow}>
                    <ThemedText style={styles.levelValue}>
                      {DEMO_MONITORING_SNAPSHOT.levelPercentage}%
                    </ThemedText>
                    <View>
                      <ThemedText type="smallBold">
                        {DEMO_MONITORING_SNAPSHOT.estimatedLiters} L disponibles
                      </ThemedText>
                      <ThemedText type="small" themeColor="textSecondary">
                        de {DEMO_MONITORING_SNAPSHOT.capacityLiters} L
                      </ThemedText>
                    </View>
                  </View>
                  <View style={styles.progressTrack}>
                    <View
                      style={[
                        styles.progressFill,
                        { width: `${DEMO_MONITORING_SNAPSHOT.levelPercentage}%` },
                      ]}
                    />
                  </View>
                  <ThemedText type="small">Toca para consultar el estado completo</ThemedText>
                </ThemedView>
              )}
            </Pressable>
          </Link>

          <View style={styles.section}>
            <ThemedText type="subtitle">Accesos rápidos</ThemedText>
            {QUICK_ACTIONS.map((action) => (
              <Link key={action.href} href={action.href} asChild>
                <Pressable accessibilityRole="button">
                  {({ pressed }) => (
                    <ThemedView
                      type="backgroundElement"
                      style={[styles.actionCard, pressed && styles.pressed]}
                    >
                      <View style={styles.actionCopy}>
                        <ThemedText type="smallBold">{action.title}</ThemedText>
                        <ThemedText type="small" themeColor="textSecondary">
                          {action.description}
                        </ThemedText>
                      </View>
                      <ThemedText accessibilityElementsHidden>›</ThemedText>
                    </ThemedView>
                  )}
                </Pressable>
              </Link>
            ))}
          </View>

          <ThemedView type="backgroundElement" style={styles.recommendationCard}>
            <ThemedText type="smallBold">Recomendación</ThemedText>
            <ThemedText>{DEMO_MONITORING_SNAPSHOT.recommendation}</ThemedText>
          </ThemedView>

          <View style={styles.section}>
            <ThemedText type="subtitle">Diagnóstico</ThemedText>
            <ApiConnectionCard />
          </View>

          <PrimaryButton
            label="Cerrar sesión"
            variant="secondary"
            loading={signingOut}
            onPress={() => void handleSignOut()}
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
  container: { flex: 1 },
  safeArea: { flex: 1 },
  content: {
    alignSelf: 'center',
    width: '100%',
    maxWidth: MaxContentWidth,
    gap: Spacing.four,
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.four,
    paddingBottom: BottomTabInset + Spacing.four,
  },
  header: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.two },
  headerCopy: { flex: 1, gap: Spacing.one },
  demoBadge: {
    borderRadius: Spacing.three,
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.one,
  },
  notice: { gap: Spacing.two, borderRadius: Spacing.three, padding: Spacing.three },
  heroCard: { gap: Spacing.three, borderRadius: Spacing.four, padding: Spacing.four },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', gap: Spacing.two },
  levelRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.three },
  levelValue: { fontSize: 52, lineHeight: 58, fontWeight: '700' },
  progressTrack: { height: 12, borderRadius: 6, backgroundColor: '#C9CDD4', overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 6, backgroundColor: '#3C87F7' },
  section: { gap: Spacing.two },
  actionCard: {
    minHeight: 72,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    borderRadius: Spacing.three,
    padding: Spacing.three,
  },
  actionCopy: { flex: 1, gap: Spacing.half },
  recommendationCard: { gap: Spacing.two, borderRadius: Spacing.three, padding: Spacing.three },
  pressed: { opacity: 0.72 },
});

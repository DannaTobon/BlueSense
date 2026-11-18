import { Link } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BottomTabInset, MaxContentWidth, Spacing } from '@/constants/theme';
import { DEMO_MONITORING_SNAPSHOT } from '@/features/monitoring/demo-monitoring';
import { useTheme } from '@/hooks/use-theme';

export default function MonitoringStatusScreen() {
  const snapshot = DEMO_MONITORING_SNAPSHOT;
  const theme = useTheme();
  const isOnline = snapshot.connectionStatus === 'online';

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.content}>
          <View style={styles.headingRow}>
            <View style={styles.headingCopy}>
              <ThemedText type="subtitle">Estado del depósito</ThemedText>
              <ThemedText themeColor="textSecondary">Lectura y disponibilidad de agua</ThemedText>
            </View>
            <ThemedView type="backgroundSelected" style={styles.demoBadge}>
              <ThemedText type="smallBold">Demo</ThemedText>
            </ThemedView>
          </View>

          <ThemedView type="backgroundElement" style={styles.levelCard}>
            <View style={styles.rowBetween}>
              <ThemedText type="smallBold">Nivel disponible</ThemedText>
              <ThemedText
                type="smallBold"
                style={{ color: isOnline ? styles.onlineText.color : theme.danger }}
              >
                ● {isOnline ? 'En línea' : 'Desconectado'}
              </ThemedText>
            </View>
            <ThemedText style={styles.levelValue}>{snapshot.levelPercentage}%</ThemedText>
            <View style={styles.progressTrack}>
              <View style={[styles.progressFill, { width: `${snapshot.levelPercentage}%` }]} />
            </View>
            <ThemedText themeColor="textSecondary">
              {snapshot.estimatedLiters} de {snapshot.capacityLiters} litros estimados
            </ThemedText>
          </ThemedView>

          <View style={styles.metricsRow}>
            <ThemedView type="backgroundElement" style={styles.metricCard}>
              <ThemedText type="small" themeColor="textSecondary">
                Distancia
              </ThemedText>
              <ThemedText type="subtitle">{snapshot.distanceCm} cm</ThemedText>
              <ThemedText type="small">Lectura del sensor</ThemedText>
            </ThemedView>
            <ThemedView type="backgroundElement" style={styles.metricCard}>
              <ThemedText type="small" themeColor="textSecondary">
                Actualización
              </ThemedText>
              <ThemedText type="smallBold">{snapshot.lastSeenLabel}</ThemedText>
              <ThemedText type="small">Intervalo esperado: 5 min</ThemedText>
            </ThemedView>
          </View>

          <ThemedView type="backgroundElement" style={styles.card}>
            <ThemedText type="smallBold">Recomendación actual</ThemedText>
            <ThemedText>{snapshot.recommendation}</ThemedText>
          </ThemedView>

          <ThemedView type="backgroundElement" style={styles.card}>
            <ThemedText type="smallBold">Actividad reciente</ThemedText>
            <ThemedText themeColor="textSecondary">
              El nivel bajó 2 puntos porcentuales durante los últimos 20 minutos.
            </ThemedText>
            <Link href="/history" asChild>
              <Pressable accessibilityRole="button" accessibilityLabel="Ver historial completo">
                <ThemedText type="linkPrimary">Ver historial completo</ThemedText>
              </Pressable>
            </Link>
          </ThemedView>

          <ThemedText type="small" themeColor="textSecondary">
            Los valores de esta pantalla son demostrativos hasta conectar la telemetría del backend.
          </ThemedText>
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
    gap: Spacing.three,
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.four,
    paddingBottom: BottomTabInset + Spacing.four,
  },
  headingRow: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.two },
  headingCopy: { flex: 1, gap: Spacing.one },
  demoBadge: {
    borderRadius: Spacing.three,
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.one,
  },
  levelCard: { gap: Spacing.three, borderRadius: Spacing.four, padding: Spacing.four },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', gap: Spacing.two },
  onlineText: { color: '#198754' },
  levelValue: { fontSize: 64, lineHeight: 70, fontWeight: '700' },
  progressTrack: { height: 16, borderRadius: 8, backgroundColor: '#C9CDD4', overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 8, backgroundColor: '#3C87F7' },
  metricsRow: { flexDirection: 'row', gap: Spacing.two },
  metricCard: { flex: 1, gap: Spacing.one, borderRadius: Spacing.three, padding: Spacing.three },
  card: { gap: Spacing.two, borderRadius: Spacing.three, padding: Spacing.three },
});

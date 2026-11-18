import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BottomTabInset, MaxContentWidth, Spacing } from '@/constants/theme';
import { DEMO_MONITORING_READINGS } from '@/features/monitoring/demo-monitoring';

export default function MonitoringHistoryScreen() {
  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.content}>
          <View style={styles.headingRow}>
            <View style={styles.headingCopy}>
              <ThemedText type="subtitle">Historial</ThemedText>
              <ThemedText themeColor="textSecondary">
                Lecturas recientes cada cinco minutos
              </ThemedText>
            </View>
            <ThemedView type="backgroundSelected" style={styles.demoBadge}>
              <ThemedText type="smallBold">Demo</ThemedText>
            </ThemedView>
          </View>

          <ThemedView type="backgroundElement" style={styles.summaryCard}>
            <ThemedText type="small" themeColor="textSecondary">
              Tendencia reciente
            </ThemedText>
            <ThemedText type="subtitle">-2%</ThemedText>
            <ThemedText>Disminuyó aproximadamente 24 litros en 20 minutos.</ThemedText>
          </ThemedView>

          <View style={styles.list}>
            {DEMO_MONITORING_READINGS.map((reading) => (
              <ThemedView key={reading.id} type="backgroundElement" style={styles.readingCard}>
                <View style={styles.readingMain}>
                  <ThemedText type="smallBold">{reading.timeLabel}</ThemedText>
                  <ThemedText type="small" themeColor="textSecondary">
                    {reading.changeLabel}
                  </ThemedText>
                </View>
                <View style={styles.readingValues}>
                  <ThemedText type="smallBold">{reading.levelPercentage}%</ThemedText>
                  <ThemedText type="small" themeColor="textSecondary">
                    {reading.estimatedLiters} L
                  </ThemedText>
                </View>
              </ThemedView>
            ))}
          </View>

          <ThemedText type="small" themeColor="textSecondary">
            El historial real aparecerá aquí cuando el backend exponga las lecturas almacenadas.
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
  summaryCard: { gap: Spacing.one, borderRadius: Spacing.three, padding: Spacing.three },
  list: { gap: Spacing.two },
  readingCard: {
    minHeight: 72,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    borderRadius: Spacing.three,
    padding: Spacing.three,
  },
  readingMain: { flex: 1, gap: Spacing.half },
  readingValues: { alignItems: 'flex-end', gap: Spacing.half },
});

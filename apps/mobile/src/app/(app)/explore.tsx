import { StyleSheet } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { MaxContentWidth, Spacing } from '@/constants/theme';

const BASELINE_ITEMS = [
  'Expo SDK 58 + React Native + TypeScript strict',
  'Expo Router: file-based routing, typed routes, native tabs',
  'ESLint y Prettier configurados',
  'Identificadores de app: com.bluesense.app',
  'Autenticación con correo y contraseña mediante Firebase Authentication',
  'Consulta autenticada GET /me contra la API',
];

export default function ProjectStatusScreen() {
  return (
    <ThemedView style={styles.container}>
      <ThemedView style={styles.card}>
        <ThemedText type="subtitle">Estado del proyecto</ThemedText>
        <ThemedText themeColor="textSecondary">Baseline técnico configurado</ThemedText>
        {BASELINE_ITEMS.map((item) => (
          <ThemedText key={item} style={styles.item}>
            • {item}
          </ThemedText>
        ))}
      </ThemedView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.six,
  },
  card: {
    width: '100%',
    maxWidth: MaxContentWidth,
    gap: Spacing.two,
  },
  item: {
    alignSelf: 'flex-start',
  },
});

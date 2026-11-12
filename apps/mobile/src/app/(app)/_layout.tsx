import { Link, usePathname } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

import AppTabs from '@/components/app-tabs';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { MaxContentWidth, Spacing } from '@/constants/theme';

export const unstable_settings = {
  anchor: 'index',
};

export default function AppLayout() {
  const pathname = usePathname();
  const onContainerRoute = pathname === '/container';

  return (
    <ThemedView style={styles.container}>
      <ThemedView type="backgroundElement" style={styles.banner}>
        <View style={styles.bannerContent}>
          <ThemedText type="smallBold">Depósito</ThemedText>
          <Link href={onContainerRoute ? '/' : '/container'} asChild>
            <Pressable
              accessibilityRole="link"
              accessibilityLabel={onContainerRoute ? 'Volver al inicio' : 'Configurar depósito'}
              style={styles.linkTouchTarget}
            >
              <ThemedText type="linkPrimary">
                {onContainerRoute ? 'Volver al inicio' : 'Configurar depósito'}
              </ThemedText>
            </Pressable>
          </Link>
        </View>
      </ThemedView>
      <View style={styles.content}>
        <AppTabs />
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  banner: {
    width: '100%',
    paddingHorizontal: Spacing.four,
  },
  bannerContent: {
    alignSelf: 'center',
    width: '100%',
    maxWidth: MaxContentWidth,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.two,
  },
  linkTouchTarget: {
    minHeight: 48,
    justifyContent: 'center',
    paddingHorizontal: Spacing.two,
  },
  content: {
    flex: 1,
  },
});

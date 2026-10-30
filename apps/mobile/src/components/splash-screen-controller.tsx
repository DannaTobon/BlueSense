import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';

import { useAuthSession } from '@/features/auth/auth-session';

void SplashScreen.preventAutoHideAsync().catch(() => {
  // The splash screen may already be hidden on web or during fast refresh.
});

export function SplashScreenController() {
  const { status } = useAuthSession();

  useEffect(() => {
    if (status !== 'loading') {
      void SplashScreen.hideAsync().catch(() => {
        // Hiding an already hidden splash screen is harmless.
      });
    }
  }, [status]);

  return null;
}

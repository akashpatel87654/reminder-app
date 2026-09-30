import { BricolageGrotesque_500Medium, BricolageGrotesque_600SemiBold, BricolageGrotesque_700Bold, BricolageGrotesque_800ExtraBold } from '@expo-google-fonts/bricolage-grotesque';
import { DMMono_400Regular, DMMono_500Medium } from '@expo-google-fonts/dm-mono';
import { useFonts } from 'expo-font';
import * as Notifications from 'expo-notifications';
import { router, Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { Platform } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { FxProvider } from '../components/overlays';
import { Splash } from '../components/Splash';
import { AuthProvider, useAuth } from '../lib/auth';
import { StoreProvider } from '../lib/store';
import { C } from '../theme';

SplashScreen.preventAutoHideAsync();

// Notification responses don't exist in the web preview.
const useLastNotificationResponse = Platform.OS === 'web' ? () => null : Notifications.useLastNotificationResponse;

function RootStack() {
  const { session, loading } = useAuth();
  const tapped = useLastNotificationResponse();

  // Tapping a reminder opens that subscription.
  useEffect(() => {
    const subId = tapped?.notification.request.content.data?.subId;
    if (session && typeof subId === 'string' && tapped?.actionIdentifier === Notifications.DEFAULT_ACTION_IDENTIFIER) {
      router.push({ pathname: '/sub/[id]', params: { id: subId } });
      Notifications.clearLastNotificationResponse();
    }
  }, [tapped, session]);

  if (loading) return null;
  return (
    <StoreProvider key={session?.user.id ?? 'anon'}>
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: C.cream }, animation: 'slide_from_right' }}>
        <Stack.Protected guard={!!session}>
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="sub/form" options={{ animation: 'slide_from_bottom' }} />
          <Stack.Screen name="sub/[id]" />
          <Stack.Screen name="stats" />
          <Stack.Screen name="mail" />
        </Stack.Protected>
        <Stack.Protected guard={!session}>
          <Stack.Screen name="login" />
          <Stack.Screen name="onboard" options={{ animation: 'fade' }} />
        </Stack.Protected>
        <Stack.Screen name="privacy" />
      </Stack>
    </StoreProvider>
  );
}

export default function RootLayout() {
  const [fonts] = useFonts({
    BricolageGrotesque_500Medium, BricolageGrotesque_600SemiBold, BricolageGrotesque_700Bold, BricolageGrotesque_800ExtraBold,
    DMMono_400Regular, DMMono_500Medium,
  });
  useEffect(() => {
    if (fonts) SplashScreen.hideAsync();
  }, [fonts]);
  if (!fonts) return null;

  return (
    <SafeAreaProvider>
      <AuthProvider>
        <FxProvider>
          <RootStack />
          <Splash />
        </FxProvider>
      </AuthProvider>
      <StatusBar style="dark" />
    </SafeAreaProvider>
  );
}

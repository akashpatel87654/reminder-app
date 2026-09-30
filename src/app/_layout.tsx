import * as Notifications from 'expo-notifications';
import { router, Stack } from 'expo-router';
import { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { AuthProvider, useAuth } from '../lib/auth';

function RootStack() {
  const { session, loading } = useAuth();
  const tapped = Notifications.useLastNotificationResponse();

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
    <Stack>
      <Stack.Protected guard={!!session}>
        <Stack.Screen name="index" options={{ title: 'SubTrack' }} />
        <Stack.Screen name="sub/[id]" />
        <Stack.Screen name="settings" options={{ title: 'Settings' }} />
      </Stack.Protected>
      <Stack.Protected guard={!session}>
        <Stack.Screen name="login" options={{ headerShown: false }} />
      </Stack.Protected>
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <RootStack />
      <StatusBar style="auto" />
    </AuthProvider>
  );
}

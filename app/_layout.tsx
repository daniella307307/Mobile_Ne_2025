import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SplashScreen } from 'expo-router';
import { useFonts } from 'expo-font';
import { AuthProvider, useAuthContext } from './AuthContext';
import { useFrameworkReady } from '@/hooks/useFrameworkReady';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  useFrameworkReady();

  const [fontsLoaded, fontError] = useFonts({
    'NunitoRegular': require('@/assets/fonts/Nunito-Regular.ttf'),
    'NunitoSemiBold': require('@/assets/fonts/Nunito-SemiBold.ttf'),
  });

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) return null;

  return (
    <AuthProvider>
      <AppRoutes />
      <StatusBar style="auto" />
    </AuthProvider>
  );
}

// Moved into separate component to access auth context cleanly
function AppRoutes() {
  const { isAuthenticated } = useAuthContext();

  return (
    <Stack screenOptions={{ headerShown: false }}>
      {isAuthenticated ? (
        <Stack.Screen name="(tabs)" />
      ) : (
        <Stack.Screen name="(auth)/login" />
      )}
      <Stack.Screen name="+not-found" />
    </Stack>
  );
}

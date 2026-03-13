import "../global.css";
import { DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack, useRouter, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import 'react-native-reanimated';

import { AuthProvider, useAuth } from '@/src/auth/AuthContext';
import { initializeDatabase } from '@/src/db/database';
import { PowerSyncProvider } from '@/src/providers/PowerSyncProvider';

export {
  // Catch any errors thrown by the Layout component.
  ErrorBoundary,
} from 'expo-router';

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded, error] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });
  const [dbReady, setDbReady] = useState(false);

  // Expo Router uses Error Boundaries to catch errors in the navigation tree.
  useEffect(() => {
    if (error) throw error;
  }, [error]);

  useEffect(() => {
    if (!loaded) return;
    let cancelled = false;
    initializeDatabase()
      .then(() => {
        if (!cancelled) setDbReady(true);
      })
      .catch((err) => {
        if (!cancelled) throw err;
      });
    return () => {
      cancelled = true;
    };
  }, [loaded]);

  useEffect(() => {
    if (loaded && dbReady) {
      SplashScreen.hideAsync();
    }
  }, [loaded, dbReady]);

  if (!loaded || !dbReady) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <ActivityIndicator size="large" color="#14B8A6" />
      </View>
    );
  }

  return (
    <ThemeProvider value={DefaultTheme}>
      <AuthProvider>
        <PowerSyncProvider>
          <RootLayoutNav />
        </PowerSyncProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

function RootLayoutNav() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const segments = useSegments();

  // Redirect: unauthenticated -> sign-in; signed in on sign-in screen -> tabs
  const path = segments.join('/');
  useEffect(() => {
    if (isLoading) return;
    const inSignIn = path === 'sign-in';
    if (!user && !inSignIn) {
      router.replace('/sign-in');
    } else if (user && inSignIn) {
      router.replace('/');
    }
  }, [user, isLoading, path, router]);

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <ActivityIndicator size="large" color="#14B8A6" />
      </View>
    );
  }

  return (
    <Stack
      screenOptions={{
        headerShown: false,
      }}
    />
  );
}

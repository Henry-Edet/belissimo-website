import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { AuthProvider } from '@/lib/auth-context';
import { ThemeProvider as BellissimoThemeProvider, useTheme } from '@/lib/theme-context';

function InnerLayout() {
  const colorScheme = useColorScheme();
  const { mode } = useTheme();
  const scheme = mode === 'System' ? colorScheme : mode === 'Dark' ? 'dark' : 'light';

  return (
    <ThemeProvider value={scheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack>
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="auth" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="modal" options={{ presentation: 'modal', headerShown: false }} />
        <Stack.Screen name="profile" options={{ presentation: 'modal', headerShown: false }} />
        <Stack.Screen name="services/index" options={{ headerShown: false }} />
        <Stack.Screen name="services/[id]/index" options={{ headerShown: false }} />
        <Stack.Screen name="services/[id]/booking" options={{ headerShown: false }} />
        <Stack.Screen name="payment/checkout" options={{ headerShown: false }} />
        <Stack.Screen name="payment/webview" options={{ headerShown: false }} />
        <Stack.Screen name="payment/confirmation" options={{ headerShown: false }} />
        <Stack.Screen name="payment/cancel" options={{ headerShown: false }} />
        <Stack.Screen name="settings" options={{ headerShown: false }} />
        <Stack.Screen name="terms" options={{ headerShown: false }} />
      </Stack>
      <StatusBar style={scheme === 'dark' ? 'light' : 'dark'} />
    </ThemeProvider>
  );
}

export default function RootLayout() {
  return (
    <BellissimoThemeProvider>
      <AuthProvider>
        <InnerLayout />
      </AuthProvider>
    </BellissimoThemeProvider>
  );
}
import { DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import 'react-native-reanimated';

import { AnalysisFlowProvider } from '@/context/analysis-flow-context';
import { AuthProvider } from '@/context/auth-context';

export const unstable_settings = {
  anchor: '(tabs)',
};

export default function RootLayout() {
  return (
    <AuthProvider>
      <AnalysisFlowProvider>
        <SafeAreaProvider>
          <ThemeProvider value={DefaultTheme}>
            <Stack
              screenOptions={{
                gestureEnabled: true,
                fullScreenGestureEnabled: true,
              }}>
              <Stack.Screen name="login" options={{ headerShown: false }} />
              <Stack.Screen name="register" options={{ headerShown: false }} />
              <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
              <Stack.Screen
                name="history-report/[id]"
                options={{
                  headerShown: false,
                }}
              />
              <Stack.Screen
                name="analysis-result"
                options={{
                  title: 'Результат аналізу',
                  headerBackTitle: 'Назад',
                }}
              />
              <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
            </Stack>
            <StatusBar style="dark" />
          </ThemeProvider>
        </SafeAreaProvider>
      </AnalysisFlowProvider>
    </AuthProvider>
  );
}

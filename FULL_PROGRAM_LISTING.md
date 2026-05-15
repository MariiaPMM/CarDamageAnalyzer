
## app/_layout.tsx
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
## app/index.tsx
import { Redirect } from 'expo-router';

import { useAuth } from '@/context/auth-context';

export default function IndexScreen() {
  const { isLoading, session } = useAuth();

  if (isLoading) {
    return null;
  }

  return <Redirect href={session ? '/(tabs)' : '/login'} />;
}
## app/login.tsx
import { Link, Redirect, router } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { useAuth } from '@/context/auth-context';

function BackgroundGlow() {
  return (
    <>
      <View style={styles.glowTop} />
      <View style={styles.glowSide} />
    </>
  );
}

export default function LoginScreen() {
  const { session, login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  if (session) {
    return <Redirect href="/(tabs)" />;
  }

  async function handleLogin() {
    setError('');
    setIsLoading(true);

    try {
      await login({ email, password });
      router.replace('/(tabs)');
    } catch (loginError) {
      setError(loginError instanceof Error ? loginError.message : 'Не вдалося увійти.');
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <SafeAreaView style={styles.screen} edges={['top', 'left', 'right']}>
      <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
        <BackgroundGlow />

        <View style={styles.header}>
          <ThemedText type="title" style={styles.title}>
            Увійти в акаунт
          </ThemedText>
        </View>

        <View style={styles.formCard}>
          <View style={styles.fieldGroup}>
            <ThemedText style={styles.label}>Email</ThemedText>
            <TextInput
              value={email}
              onChangeText={setEmail}
              placeholder="example@email.com"
              autoCapitalize="none"
              keyboardType="email-address"
              placeholderTextColor="#B2A493"
              style={styles.input}
            />
          </View>

          <View style={styles.fieldGroup}>
            <ThemedText style={styles.label}>Пароль</ThemedText>
            <TextInput
              value={password}
              onChangeText={setPassword}
              placeholder="Введи пароль"
              secureTextEntry
              placeholderTextColor="#B2A493"
              style={styles.input}
            />
          </View>

          {error ? <ThemedText style={styles.errorText}>{error}</ThemedText> : null}

          <Pressable onPress={handleLogin} style={styles.primaryButton} disabled={isLoading}>
            <ThemedText style={styles.primaryButtonText}>
              {isLoading ? 'Вхід...' : 'Увійти'}
            </ThemedText>
          </Pressable>
        </View>

        <Link href="/register" asChild>
          <Pressable style={styles.secondaryButton}>
            <ThemedText style={styles.secondaryButtonText}>Створити акаунт</ThemedText>
          </Pressable>
        </Link>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#F7F0E4',
  },
  content: {
    flexGrow: 1,
    paddingHorizontal: 18,
    paddingTop: 12,
    paddingBottom: 32,
    gap: 18,
    justifyContent: 'center',
  },
  glowTop: {
    position: 'absolute',
    top: -100,
    right: -40,
    width: 240,
    height: 240,
    borderRadius: 120,
    backgroundColor: '#F3C980',
    opacity: 0.22,
  },
  glowSide: {
    position: 'absolute',
    top: 240,
    left: -80,
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: '#D7E4C0',
    opacity: 0.35,
  },
  header: {
    paddingTop: 18,
    gap: 6,
  },
  title: {
    color: '#1E1C19',
    fontSize: 34,
    lineHeight: 36,
  },
  formCard: {
    backgroundColor: 'rgba(255, 250, 241, 0.9)',
    borderRadius: 28,
    padding: 18,
    gap: 14,
    borderWidth: 1,
    borderColor: '#E9DECC',
  },
  fieldGroup: {
    gap: 8,
  },
  label: {
    color: '#645749',
    fontSize: 13,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  input: {
    minHeight: 56,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E0D3BF',
    backgroundColor: '#FFFDF8',
    paddingHorizontal: 16,
    fontSize: 16,
    color: '#1F1D1A',
  },
  errorText: {
    color: '#8F2D2D',
    lineHeight: 21,
  },
  primaryButton: {
    minHeight: 56,
    borderRadius: 22,
    backgroundColor: '#1F1D1A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButtonText: {
    color: '#FFF9EF',
    fontWeight: '700',
    fontSize: 16,
  },
  secondaryButton: {
    minHeight: 54,
    borderRadius: 22,
    backgroundColor: '#E7D7BC',
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryButtonText: {
    color: '#2F2922',
    fontWeight: '700',
    fontSize: 15,
  },
});
## app/register.tsx
import { Link, Redirect, router } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { useAuth } from '@/context/auth-context';

function BackgroundGlow() {
  return (
    <>
      <View style={styles.glowTop} />
      <View style={styles.glowSide} />
    </>
  );
}

export default function RegisterScreen() {
  const { session, register } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  if (session) {
    return <Redirect href="/(tabs)" />;
  }

  async function handleRegister() {
    if (!name.trim() || !email.trim() || !password.trim()) {
      setError('Заповни всі поля.');
      return;
    }

    if (password.length < 6) {
      setError('Пароль має містити щонайменше 6 символів.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Паролі не співпадають.');
      return;
    }

    setError('');
    setIsLoading(true);

    try {
      await register({ name, email, password });
      router.replace('/(tabs)');
    } catch (registerError) {
      setError(registerError instanceof Error ? registerError.message : 'Не вдалося зареєструватися.');
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <SafeAreaView style={styles.screen} edges={['top', 'left', 'right']}>
      <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
        <BackgroundGlow />

        <View style={styles.header}>
          <ThemedText type="title" style={styles.title}>
            Створити акаунт
          </ThemedText>
        </View>

        <View style={styles.formCard}>
          <View style={styles.fieldGroup}>
            <ThemedText style={styles.label}>Імʼя</ThemedText>
            <TextInput
              value={name}
              onChangeText={setName}
              placeholder="Як до тебе звертатися"
              placeholderTextColor="#B2A493"
              style={styles.input}
            />
          </View>

          <View style={styles.fieldGroup}>
            <ThemedText style={styles.label}>Email</ThemedText>
            <TextInput
              value={email}
              onChangeText={setEmail}
              placeholder="example@email.com"
              autoCapitalize="none"
              keyboardType="email-address"
              placeholderTextColor="#B2A493"
              style={styles.input}
            />
          </View>

          <View style={styles.fieldGroup}>
            <ThemedText style={styles.label}>Пароль</ThemedText>
            <TextInput
              value={password}
              onChangeText={setPassword}
              placeholder="Мінімум 6 символів"
              secureTextEntry
              placeholderTextColor="#B2A493"
              style={styles.input}
            />
          </View>

          <View style={styles.fieldGroup}>
            <ThemedText style={styles.label}>Підтвердження</ThemedText>
            <TextInput
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              placeholder="Повтори пароль"
              secureTextEntry
              placeholderTextColor="#B2A493"
              style={styles.input}
            />
          </View>

          {error ? <ThemedText style={styles.errorText}>{error}</ThemedText> : null}

          <Pressable onPress={handleRegister} style={styles.primaryButton} disabled={isLoading}>
            <ThemedText style={styles.primaryButtonText}>
              {isLoading ? 'Створення...' : 'Зареєструватися'}
            </ThemedText>
          </Pressable>
        </View>

        <Link href="/login" asChild>
          <Pressable style={styles.secondaryButton}>
            <ThemedText style={styles.secondaryButtonText}>Увійти</ThemedText>
          </Pressable>
        </Link>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#F7F0E4',
  },
  content: {
    flexGrow: 1,
    paddingHorizontal: 18,
    paddingTop: 12,
    paddingBottom: 32,
    gap: 18,
    justifyContent: 'center',
  },
  glowTop: {
    position: 'absolute',
    top: -100,
    left: -60,
    width: 240,
    height: 240,
    borderRadius: 120,
    backgroundColor: '#D7E4C0',
    opacity: 0.34,
  },
  glowSide: {
    position: 'absolute',
    top: 180,
    right: -50,
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: '#F3C980',
    opacity: 0.22,
  },
  header: {
    paddingTop: 18,
    gap: 6,
  },
  title: {
    color: '#1E1C19',
    fontSize: 34,
    lineHeight: 36,
  },
  formCard: {
    backgroundColor: 'rgba(255, 250, 241, 0.9)',
    borderRadius: 28,
    padding: 18,
    gap: 14,
    borderWidth: 1,
    borderColor: '#E9DECC',
  },
  fieldGroup: {
    gap: 8,
  },
  label: {
    color: '#645749',
    fontSize: 13,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  input: {
    minHeight: 56,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E0D3BF',
    backgroundColor: '#FFFDF8',
    paddingHorizontal: 16,
    fontSize: 16,
    color: '#1F1D1A',
  },
  errorText: {
    color: '#8F2D2D',
    lineHeight: 21,
  },
  primaryButton: {
    minHeight: 56,
    borderRadius: 22,
    backgroundColor: '#1F1D1A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButtonText: {
    color: '#FFF9EF',
    fontWeight: '700',
    fontSize: 16,
  },
  secondaryButton: {
    minHeight: 54,
    borderRadius: 22,
    backgroundColor: '#E7D7BC',
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryButtonText: {
    color: '#2F2922',
    fontWeight: '700',
    fontSize: 15,
  },
});

## app/modal.tsx
import { Link } from 'expo-router';
import { StyleSheet } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';

export default function ModalScreen() {
  return (
    <ThemedView style={styles.container}>
      <ThemedText type="title">This is a modal</ThemedText>
      <Link href="/" dismissTo style={styles.link}>
        <ThemedText type="link">Go to home screen</ThemedText>
      </Link>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  link: {
    marginTop: 15,
    paddingVertical: 15,
  },
});
## app/analysis-result.tsx
import { useEffect } from 'react';
import { router } from 'expo-router';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useAnalysisFlow } from '@/context/analysis-flow-context';
import { useAuth } from '@/context/auth-context';

export default function AnalysisResultScreen() {
  const { session } = useAuth();
  const { draft, result, error, isAnalyzing, runAnalysis } = useAnalysisFlow();

  useEffect(() => {
    if (!draft) {
      router.replace('/(tabs)');
      return;
    }

    if (!result && !error && !isAnalyzing) {
      runAnalysis(session?.email);
    }
  }, [draft, error, isAnalyzing, result, runAnalysis, session?.email]);

  if (!draft) {
    return null;
  }

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <ThemedText type="title" style={styles.title}>
          Результат аналізу
        </ThemedText>
        <ThemedText style={styles.subtitle}>
          Дані авто і фото вже передані в обробку. Результат показується окремо від форми введення.
        </ThemedText>
      </View>

      <ThemedView style={styles.card}>
        <ThemedText type="defaultSemiBold">Передано в аналіз</ThemedText>
        <ThemedText style={styles.text}>
          Авто: {[draft.brand, draft.model, draft.year].filter(Boolean).join(' ') || 'не вказано'}
        </ThemedText>
        <ThemedText style={styles.text}>Фото: {draft.photos.length}</ThemedText>
      </ThemedView>

      {isAnalyzing ? (
        <ThemedView style={styles.loaderCard}>
          <ActivityIndicator size="large" color="#1D4ED8" />
          <ThemedText type="defaultSemiBold" style={styles.loaderTitle}>
            Обробка фото...
          </ThemedText>
          <ThemedText style={styles.loaderText}>
            AI перевіряє, чи є на фото авто, визначає пошкоджені зони і формує кошторис.
          </ThemedText>
        </ThemedView>
      ) : null}

      {!isAnalyzing && error ? (
        <ThemedView style={styles.card}>
          <ThemedText type="defaultSemiBold">Помилка аналізу</ThemedText>
          <ThemedText style={styles.errorText}>{error}</ThemedText>
          <View style={styles.actionsRow}>
            <Pressable onPress={() => runAnalysis(session?.email)} style={styles.primaryButton}>
              <ThemedText style={styles.buttonText}>Спробувати ще раз</ThemedText>
            </Pressable>
            <Pressable onPress={() => router.back()} style={styles.secondaryButton}>
              <ThemedText style={styles.buttonText}>Назад до форми</ThemedText>
            </Pressable>
          </View>
        </ThemedView>
      ) : null}

      {!isAnalyzing && result ? (
        <ThemedView style={styles.card}>
          <View style={styles.resultSection}>
            <ThemedText type="defaultSemiBold" style={styles.sectionTitle}>
              Авто
            </ThemedText>
            <ThemedText style={styles.text}>{result.vehicle.makeModel}</ThemedText>
            <ThemedText style={styles.subtext}>
              Джерело: {result.vehicle.source === 'user_input' ? 'ввід користувача' : 'AI'} {'• '}
              Впевненість: {result.vehicle.confidence}
            </ThemedText>
          </View>

          <View style={styles.resultSection}>
            <ThemedText type="defaultSemiBold" style={styles.sectionTitle}>
              Пошкоджені зони
            </ThemedText>
            {result.damagedZones.length ? (
              result.damagedZones.map((zone) => (
                <ThemedText key={zone} style={styles.text}>
                  - {zone}
                </ThemedText>
              ))
            ) : (
              <ThemedText style={styles.text}>Не вдалося чітко визначити зони.</ThemedText>
            )}
          </View>

          <View style={styles.resultSection}>
            <ThemedText type="defaultSemiBold" style={styles.sectionTitle}>
              Опис пошкодження
            </ThemedText>
            <ThemedText style={styles.text}>{result.damageSummary}</ThemedText>
          </View>

          <View style={styles.resultSection}>
            <ThemedText type="defaultSemiBold" style={styles.sectionTitle}>
              Які роботи потрібні
            </ThemedText>
            {result.repairActions.length ? (
              result.repairActions.map((action) => (
                <ThemedText key={action} style={styles.text}>
                  - {action}
                </ThemedText>
              ))
            ) : (
              <ThemedText style={styles.text}>Список робіт не повернувся.</ThemedText>
            )}
          </View>

          <View style={styles.resultSection}>
            <ThemedText type="defaultSemiBold" style={styles.sectionTitle}>
              Кошторис по деталях
            </ThemedText>
            {result.lineItems.length ? (
              result.lineItems.map((item, index) => (
                <View key={`${item.part}-${index}`} style={styles.lineItemCard}>
                  <ThemedText type="defaultSemiBold" style={styles.lineItemTitle}>
                    {item.part}
                  </ThemedText>
                  <ThemedText style={styles.text}>Зона: {item.zone}</ThemedText>
                  <ThemedText style={styles.text}>Пошкодження: {item.damage}</ThemedText>
                  <ThemedText style={styles.text}>Операція: {item.work}</ThemedText>
                  <ThemedText style={styles.text}>
                    Запчастина: {item.partPrice} {item.currency}
                  </ThemedText>
                  <ThemedText style={styles.text}>
                    Робота: {item.laborPrice} {item.currency}
                  </ThemedText>
                  <ThemedText style={styles.subtext}>Примітка: {item.note}</ThemedText>
                </View>
              ))
            ) : (
              <ThemedText style={styles.text}>Деталізований кошторис відсутній.</ThemedText>
            )}
          </View>

          <View style={styles.resultSection}>
            <ThemedText type="defaultSemiBold" style={styles.sectionTitle}>
              Загальна орієнтовна сума
            </ThemedText>
            <ThemedText style={styles.totalPrice}>
              {result.estimatedCost.amount} {result.estimatedCost.currency}
            </ThemedText>
            <ThemedText style={styles.subtext}>{result.estimatedCost.note}</ThemedText>
          </View>
        </ThemedView>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  content: {
    padding: 20,
    gap: 12,
  },
  header: {
    gap: 4,
    paddingTop: 8,
  },
  title: {
    fontSize: 28,
    lineHeight: 32,
  },
  subtitle: {
    color: '#475569',
  },
  card: {
    borderRadius: 14,
    padding: 16,
    gap: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#FFFFFF',
  },
  loaderCard: {
    borderRadius: 14,
    padding: 20,
    gap: 12,
    borderWidth: 1,
    borderColor: '#BFDBFE',
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
  },
  loaderTitle: {
    color: '#0F172A',
  },
  loaderText: {
    color: '#334155',
    textAlign: 'center',
    lineHeight: 22,
  },
  text: {
    color: '#000000',
    lineHeight: 23,
  },
  subtext: {
    color: '#475569',
    lineHeight: 22,
  },
  errorText: {
    color: '#B91C1C',
    lineHeight: 24,
  },
  actionsRow: {
    gap: 10,
  },
  primaryButton: {
    backgroundColor: '#0F172A',
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
  },
  secondaryButton: {
    backgroundColor: '#475569',
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
  },
  buttonText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  resultSection: {
    gap: 6,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  sectionTitle: {
    color: '#0F172A',
  },
  lineItemCard: {
    gap: 4,
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#F8FAFC',
  },
  lineItemTitle: {
    color: '#0F172A',
  },
  totalPrice: {
    color: '#000000',
    fontSize: 24,
    lineHeight: 30,
    fontWeight: '700',
  },
});
## app/history-report/[id].tsx
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { Image } from 'expo-image';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { useAuth } from '@/context/auth-context';
import { getAnalysisHistoryItem, type AnalysisHistoryItem } from '@/lib/history';

function formatDate(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleString('uk-UA', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function HistoryReportScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { session } = useAuth();
  const [item, setItem] = useState<AnalysisHistoryItem | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    async function loadItem() {
      if (!session?.email || !id) {
        if (isMounted) {
          setItem(null);
          setIsLoading(false);
        }
        return;
      }

      const nextItem = await getAnalysisHistoryItem(session.email, id);

      if (isMounted) {
        setItem(nextItem);
        setIsLoading(false);
      }
    }

    loadItem();

    return () => {
      isMounted = false;
    };
  }, [id, session?.email]);

  return (
    <SafeAreaView style={styles.screen} edges={['top', 'left', 'right']}>
      <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
        <View style={styles.glowTop} />

        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <MaterialIcons name="arrow-back-ios-new" size={18} color="#1E1C19" />
          <ThemedText style={styles.backButtonText}>Назад</ThemedText>
        </Pressable>

        {isLoading ? (
          <View style={styles.card}>
            <ThemedText style={styles.noteText}>Завантаження звіту...</ThemedText>
          </View>
        ) : item ? (
          <View style={styles.card}>
            <View style={styles.header}>
              <View style={styles.headerCopy}>
                <ThemedText style={styles.eyebrow}>Звіт</ThemedText>
                <ThemedText type="title" style={styles.title}>
                  {item.vehicleLabel}
                </ThemedText>
                <ThemedText style={styles.meta}>{formatDate(item.createdAt)}</ThemedText>
              </View>

              <ThemedText style={styles.totalValue}>
                {item.totalAmount} {item.currency}
              </ThemedText>
            </View>

            {item.photos.length ? (
              <View style={styles.photoGrid}>
                {item.photos.map((photo, index) => (
                  <View key={`${item.id}-${photo.uri}-${index}`} style={styles.photoCard}>
                    <Image source={{ uri: photo.uri }} style={styles.photo} contentFit="cover" />
                    <ThemedText style={styles.photoLabel}>{photo.fileName || `Фото ${index + 1}`}</ThemedText>
                  </View>
                ))}
              </View>
            ) : null}

            <View style={styles.summaryCard}>
              <ThemedText style={styles.summaryText}>{item.summary}</ThemedText>
            </View>

            {item.damagedZones.length ? (
              <View style={styles.zoneWrap}>
                {item.damagedZones.map((zone) => (
                  <View key={`${item.id}-${zone}`} style={styles.zoneTag}>
                    <ThemedText style={styles.zoneTagText}>{zone}</ThemedText>
                  </View>
                ))}
              </View>
            ) : null}

            <View style={styles.estimateBlock}>
              <ThemedText style={styles.sectionTitle}>Кошторис</ThemedText>

              {item.lineItems.length ? (
                item.lineItems.map((lineItem, index) => (
                  <View key={`${item.id}-${lineItem.part}-${index}`} style={styles.lineItemCard}>
                    <View style={styles.lineItemTop}>
                      <View style={styles.lineItemCopy}>
                        <ThemedText style={styles.lineItemTitle}>{lineItem.part}</ThemedText>
                        <ThemedText style={styles.lineItemMeta}>
                          {lineItem.zone} · {lineItem.damage}
                        </ThemedText>
                      </View>

                      <ThemedText style={styles.operationText}>{lineItem.work}</ThemedText>
                    </View>

                    <View style={styles.priceRow}>
                      <View style={styles.priceCell}>
                        <ThemedText style={styles.priceLabel}>Деталь</ThemedText>
                        <ThemedText style={styles.priceValue}>
                          {lineItem.partPrice} {lineItem.currency}
                        </ThemedText>
                      </View>
                      <View style={styles.priceCell}>
                        <ThemedText style={styles.priceLabel}>Робота</ThemedText>
                        <ThemedText style={styles.priceValue}>
                          {lineItem.laborPrice} {lineItem.currency}
                        </ThemedText>
                      </View>
                    </View>
                  </View>
                ))
              ) : (
                <ThemedText style={styles.noteText}>Деталізований кошторис відсутній.</ThemedText>
              )}
            </View>
          </View>
        ) : (
          <View style={styles.card}>
            <ThemedText style={styles.noteText}>Не вдалося знайти цей запис в історії.</ThemedText>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#F7F0E4',
  },
  content: {
    paddingHorizontal: 18,
    paddingTop: 12,
    paddingBottom: 32,
    gap: 14,
  },
  glowTop: {
    position: 'absolute',
    top: -70,
    right: -50,
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: '#F2D49C',
    opacity: 0.35,
  },
  backButton: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FFF9EF',
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: '#E8DECE',
    marginTop: 8,
  },
  backButtonText: {
    color: '#1E1C19',
    fontWeight: '700',
  },
  card: {
    backgroundColor: '#FFF9EF',
    borderRadius: 28,
    borderWidth: 1,
    borderColor: '#E8DECE',
    padding: 18,
    gap: 16,
  },
  header: {
    gap: 8,
  },
  headerCopy: {
    gap: 4,
  },
  eyebrow: {
    color: '#7B6E61',
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  title: {
    color: '#1E1C19',
    fontSize: 30,
    lineHeight: 34,
  },
  meta: {
    color: '#6E645A',
    lineHeight: 21,
  },
  totalValue: {
    color: '#1E1C19',
    fontSize: 28,
    lineHeight: 32,
    fontWeight: '700',
  },
  photoGrid: {
    gap: 12,
  },
  photoCard: {
    gap: 8,
  },
  photo: {
    width: '100%',
    height: 220,
    borderRadius: 22,
    backgroundColor: '#E8DECE',
  },
  photoLabel: {
    color: '#5D5145',
    fontWeight: '600',
  },
  summaryCard: {
    backgroundColor: '#F6EEE2',
    borderRadius: 20,
    padding: 16,
  },
  summaryText: {
    color: '#2E2923',
    fontSize: 17,
    lineHeight: 26,
    fontWeight: '600',
  },
  zoneWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  zoneTag: {
    backgroundColor: '#F2E4CF',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  zoneTagText: {
    color: '#5D5145',
    fontWeight: '600',
  },
  estimateBlock: {
    gap: 12,
  },
  sectionTitle: {
    color: '#1E1C19',
    fontSize: 20,
    lineHeight: 24,
    fontWeight: '700',
  },
  lineItemCard: {
    backgroundColor: '#F8F1E6',
    borderRadius: 20,
    padding: 14,
    gap: 10,
  },
  lineItemTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 12,
  },
  lineItemCopy: {
    flex: 1,
    gap: 4,
  },
  lineItemTitle: {
    color: '#1E1C19',
    fontSize: 18,
    lineHeight: 22,
    fontWeight: '700',
  },
  lineItemMeta: {
    color: '#6E645A',
    lineHeight: 21,
  },
  operationText: {
    color: '#5E5144',
    fontSize: 12,
    fontWeight: '700',
    textAlign: 'right',
  },
  priceRow: {
    flexDirection: 'row',
    gap: 10,
  },
  priceCell: {
    flex: 1,
    backgroundColor: '#FFF9EF',
    borderRadius: 16,
    padding: 12,
    gap: 2,
  },
  priceLabel: {
    color: '#7B6E61',
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  priceValue: {
    color: '#1E1C19',
    fontWeight: '700',
  },
  noteText: {
    color: '#6E645A',
    lineHeight: 22,
  },
});
## app/(tabs)/_layout.tsx
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { Redirect, Tabs, usePathname } from 'expo-router';
import React from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useAnalysisFlow } from '@/context/analysis-flow-context';
import { useAuth } from '@/context/auth-context';

export default function TabLayout() {
	const { isLoading, session } = useAuth();
	const { isAnalyzing } = useAnalysisFlow();
	const insets = useSafeAreaInsets();
	const pathname = usePathname();
	const hideTabBar = isAnalyzing && pathname === '/';

	if (isLoading) {
		return null;
	}

	if (!session) {
		return <Redirect href="/login" />;
	}

	return (
		<Tabs
			screenOptions={{
				headerShown: false,
				tabBarActiveTintColor: '#191919',
				tabBarInactiveTintColor: '#8F8A7B',
				tabBarStyle: {
					display: hideTabBar ? 'none' : 'flex',
					position: 'absolute',
					left: 12,
					right: 12,
					bottom: Math.max(insets.bottom, 8),
					height: 63,
					paddingTop: 4,
					paddingBottom: 8,
					backgroundColor: '#FFF9EF',
					borderTopColor: '#E7DDCC',
					borderTopWidth: 1,
					borderRadius: 22,
					elevation: 10,
					shadowColor: '#3E3324',
					shadowOpacity: 0.12,
					shadowRadius: 18,
					shadowOffset: { width: 0, height: 8 },
				},
				tabBarLabelStyle: {
					fontSize: 12,
					fontWeight: '600',
				},
			}}
		>
			<Tabs.Screen
				name="index"
				options={{
					title: 'Аналіз',
					tabBarIcon: ({ color, size, focused }) => (
						<MaterialIcons
							name={focused ? 'auto-awesome' : 'camera-enhance'}
							size={size}
							color={color}
						/>
					),
				}}
			/>
			<Tabs.Screen
				name="history"
				options={{
					title: 'Історія',
					tabBarIcon: ({ color, size, focused }) => (
						<MaterialIcons
							name={focused ? 'schedule' : 'history'}
							size={size}
							color={color}
						/>
					),
				}}
			/>
			<Tabs.Screen
				name="explore"
				options={{
					title: 'Профіль',
					tabBarIcon: ({ color, size, focused }) => (
						<MaterialIcons
							name={focused ? 'account-circle' : 'person-outline'}
							size={size}
							color={color}
						/>
					),
				}}
			/>
		</Tabs>
	);
}
## app/(tabs)/index.tsx
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { useAnalysisFlow, type PickedPhoto } from '@/context/analysis-flow-context';
import { useAuth } from '@/context/auth-context';
import {
  VEHICLE_BRANDS,
  VEHICLE_OPTIONS,
  VEHICLE_YEARS,
  type VehicleBrand,
} from '@/data/vehicle-options';

type DropdownKey = 'brand' | 'model' | 'year' | null;

const MAX_PHOTOS = 6;
const SHOOTING_HINTS = ['Перед', 'Зад', 'Лівий бік', 'Правий бік', 'Крупний план', 'Салон'];

type DropdownFieldProps = {
  label: string;
  value: string;
  placeholder: string;
  isOpen: boolean;
  onToggle: () => void;
  options: string[];
  onSelect: (value: string) => void;
  disabled?: boolean;
};

function BackgroundGlow() {
  return (
    <>
      <View style={styles.glowTop} />
      <View style={styles.glowSide} />
    </>
  );
}

function DropdownField({
  label,
  value,
  placeholder,
  isOpen,
  onToggle,
  options,
  onSelect,
  disabled = false,
}: DropdownFieldProps) {
  return (
    <View style={styles.inputGroup}>
      <ThemedText style={styles.inputLabel}>{label}</ThemedText>
      <Pressable
        onPress={onToggle}
        disabled={disabled}
        style={[styles.selectTrigger, disabled ? styles.selectTriggerDisabled : undefined]}>
        <ThemedText style={value ? styles.selectValue : styles.selectPlaceholder}>
          {value || placeholder}
        </ThemedText>
        <ThemedText style={styles.selectArrow}>{isOpen ? '▲' : '▼'}</ThemedText>
      </Pressable>

      {isOpen ? (
        <View style={styles.selectMenu}>
          <ScrollView nestedScrollEnabled style={styles.selectScroll}>
            {options.map((option) => (
              <Pressable
                key={option}
                onPress={() => onSelect(option)}
                style={({ pressed }) => [
                  styles.selectOption,
                  pressed ? styles.selectOptionPressed : undefined,
                ]}>
                <ThemedText style={styles.selectOptionText}>{option}</ThemedText>
              </Pressable>
            ))}
          </ScrollView>
        </View>
      ) : null}
    </View>
  );
}

export default function AnalyzeScreen() {
  const insets = useSafeAreaInsets();
  const { session } = useAuth();
  const { result, error, isAnalyzing, submitDraft, resetFlow } = useAnalysisFlow();
  const [brand, setBrand] = useState('');
  const [model, setModel] = useState('');
  const [year, setYear] = useState('');
  const [photos, setPhotos] = useState<PickedPhoto[]>([]);
  const [openDropdown, setOpenDropdown] = useState<DropdownKey>(null);
  const [formError, setFormError] = useState('');

  const availableModels = useMemo(() => {
    if (!brand || !(brand in VEHICLE_OPTIONS)) {
      return [];
    }

    return VEHICLE_OPTIONS[brand as VehicleBrand];
  }, [brand]);

  function toggleDropdown(key: DropdownKey) {
    setOpenDropdown((current) => (current === key ? null : key));
  }

  function applyPickedAsset(asset: ImagePicker.ImagePickerAsset) {
    if (!asset.base64) {
      setFormError('Не вдалося прочитати файл. Спробуй інше фото.');
      return;
    }

    if (photos.length >= MAX_PHOTOS) {
      setFormError(`Можна додати до ${MAX_PHOTOS} фото на один аналіз.`);
      return;
    }

    setPhotos((current) => [
      ...current,
      {
        uri: asset.uri,
        mimeType: asset.mimeType || 'image/jpeg',
        base64: asset.base64,
        fileName: asset.fileName,
      },
    ]);
    setFormError('');
  }

  async function handlePickPhoto() {
    setFormError('');

    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Немає доступу', 'Дозволь доступ до фото, щоб вибирати зображення для аналізу.');
      return;
    }

    const pickerResult = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.8,
      base64: true,
      allowsEditing: false,
      selectionLimit: 1,
    });

    if (pickerResult.canceled || !pickerResult.assets.length) {
      return;
    }

    applyPickedAsset(pickerResult.assets[0]);
  }

  async function handleTakePhoto() {
    setFormError('');

    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Немає доступу', 'Дозволь доступ до камери, щоб сфотографувати авто.');
      return;
    }

    const cameraResult = await ImagePicker.launchCameraAsync({
      cameraType: ImagePicker.CameraType.back,
      quality: 0.8,
      base64: true,
      allowsEditing: false,
    });

    if (cameraResult.canceled || !cameraResult.assets.length) {
      return;
    }

    applyPickedAsset(cameraResult.assets[0]);
  }

  function handleRemovePhoto(index: number) {
    setPhotos((current) => current.filter((_, currentIndex) => currentIndex !== index));
  }

  async function handleAnalyze() {
    if (!photos.length) {
      setFormError('Додай хоча б одне фото авто перед запуском аналізу.');
      return;
    }

    setFormError('');
    await submitDraft(
      {
        brand,
        model,
        year,
        photos,
      },
      session?.email
    );
  }

  function handleStartNew() {
    resetFlow();
    setBrand('');
    setModel('');
    setYear('');
    setPhotos([]);
    setOpenDropdown(null);
    setFormError('');
  }

  if (isAnalyzing) {
    return (
      <SafeAreaView style={styles.loadingScreen} edges={['top', 'left', 'right', 'bottom']}>
        <BackgroundGlow />
        <View style={styles.loadingBadge}>
          <ThemedText style={styles.loadingBadgeText}>AI processing</ThemedText>
        </View>
        <ActivityIndicator size="large" color="#FFF8EE" />
        <ThemedText style={styles.loadingTitle}>Збираємо ідеальний звіт</ThemedText>
        <ThemedText style={styles.loadingText}>
          Модель перевіряє всі фото, порівнює пошкоджені зони та готує охайний кошторис.
        </ThemedText>
      </SafeAreaView>
    );
  }

  if (result) {
    return (
      <SafeAreaView style={styles.screen} edges={['top', 'left', 'right']}>
        <ScrollView
          style={styles.screen}
          contentContainerStyle={[styles.resultContent, { paddingBottom: 112 + Math.max(insets.bottom, 12) }]}>
          <BackgroundGlow />

          <View style={styles.resultHero}>
            <View style={styles.pill}>
              <ThemedText style={styles.pillText}>готово</ThemedText>
            </View>
            <ThemedText type="title" style={styles.heroTitle}>
              Звіт по авто
            </ThemedText>
            <ThemedText style={styles.heroSubtitle}>{result.vehicle.makeModel}</ThemedText>
          </View>

          <View style={styles.resultPhotoList}>
            {photos.map((photo, index) => (
              <Image
                key={`${photo.uri}-${index}`}
                source={{ uri: photo.uri }}
                style={styles.resultPhoto}
                contentFit="cover"
              />
            ))}
          </View>

          <View style={styles.statementCard}>
            <ThemedText style={styles.statementEyebrow}>Короткий висновок</ThemedText>
            <ThemedText style={styles.statementText}>{result.damageSummary}</ThemedText>
          </View>

          <View style={styles.dualCardRow}>
            <View style={[styles.infoCard, styles.infoCardWarm]}>
              <ThemedText style={styles.infoLabel}>Зони</ThemedText>
              <ThemedText style={styles.infoValue}>{result.damagedZones.length || 0}</ThemedText>
            </View>
            <View style={[styles.infoCard, styles.infoCardDark]}>
              <ThemedText style={styles.infoLabelDark}>Сума</ThemedText>
              <ThemedText style={styles.infoValueDark}>
                {result.estimatedCost.amount} {result.estimatedCost.currency}
              </ThemedText>
            </View>
          </View>

          <View style={styles.sectionCard}>
            <ThemedText style={styles.sectionTitle}>Пошкоджені зони</ThemedText>
            <View style={styles.tagWrap}>
              {result.damagedZones.length ? (
                result.damagedZones.map((zone) => (
                  <View key={zone} style={styles.zoneTag}>
                    <ThemedText style={styles.zoneTagText}>{zone}</ThemedText>
                  </View>
                ))
              ) : (
                <ThemedText style={styles.bodyText}>Не вдалося чітко визначити зони.</ThemedText>
              )}
            </View>
          </View>

          <View style={styles.sectionCard}>
            <ThemedText style={styles.sectionTitle}>Ремонтні дії</ThemedText>
            {result.repairActions.length ? (
              result.repairActions.map((action) => (
                <View key={action} style={styles.bulletRow}>
                  <View style={styles.bulletDot} />
                  <ThemedText style={styles.bodyText}>{action}</ThemedText>
                </View>
              ))
            ) : (
              <ThemedText style={styles.bodyText}>Список робіт не повернувся.</ThemedText>
            )}
          </View>

          <View style={styles.sectionCard}>
            <ThemedText style={styles.sectionTitle}>Кошторис по деталях</ThemedText>
            {result.lineItems.length ? (
              result.lineItems.map((item, index) => (
                <View key={`${item.part}-${index}`} style={styles.lineItemCard}>
                  <View style={styles.lineItemHeader}>
                    <ThemedText style={styles.lineItemTitle}>{item.part}</ThemedText>
                    <View style={styles.miniPill}>
                      <ThemedText style={styles.miniPillText}>{item.work}</ThemedText>
                    </View>
                  </View>
                  <ThemedText style={styles.lineMeta}>Зона: {item.zone}</ThemedText>
                  <ThemedText style={styles.lineMeta}>Пошкодження: {item.damage}</ThemedText>
                  <View style={styles.priceRow}>
                    <View style={styles.priceChip}>
                      <ThemedText style={styles.priceChipLabel}>Деталь</ThemedText>
                      <ThemedText style={styles.priceChipValue}>
                        {item.partPrice} {item.currency}
                      </ThemedText>
                    </View>
                    <View style={styles.priceChip}>
                      <ThemedText style={styles.priceChipLabel}>Робота</ThemedText>
                      <ThemedText style={styles.priceChipValue}>
                        {item.laborPrice} {item.currency}
                      </ThemedText>
                    </View>
                  </View>
                  <ThemedText style={styles.lineNote}>{item.note}</ThemedText>
                </View>
              ))
            ) : (
              <ThemedText style={styles.bodyText}>Деталізований кошторис відсутній.</ThemedText>
            )}
          </View>

          <View style={styles.footerCard}>
            <ThemedText style={styles.footerNote}>{result.estimatedCost.note}</ThemedText>
            <Pressable onPress={handleStartNew} style={styles.primaryButton}>
              <ThemedText style={styles.primaryButtonText}>Створити новий аналіз</ThemedText>
            </Pressable>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.screen} edges={['top', 'left', 'right']}>
      <ScrollView
        style={styles.screen}
        contentContainerStyle={[styles.content, { paddingBottom: 112 + Math.max(insets.bottom, 12) }]}>
        <BackgroundGlow />

        <View style={styles.heroBlock}>
          <View style={styles.heroCard}>
            <View style={styles.pill}>
              <ThemedText style={styles.pillText}>car damage studio</ThemedText>
            </View>
            <ThemedText type="title" style={styles.heroTitle}>
              Розумний аналіз фото авто
            </ThemedText>
            <ThemedText style={styles.heroSubtitle}>
              Сфотографуй авто красиво, а ми перетворимо це на читабельний звіт із вартістю ремонту.
            </ThemedText>
          </View>
        </View>

        <View style={styles.sheet}>
          <View style={styles.sheetHeader}>
            <ThemedText style={styles.sheetTitle}>Автомобіль</ThemedText>
            <ThemedText style={styles.sheetSubtitle}>Необовʼязково, але це підвищує точність.</ThemedText>
          </View>

          <DropdownField
            label="Марка"
            value={brand}
            placeholder="Обери марку"
            isOpen={openDropdown === 'brand'}
            onToggle={() => toggleDropdown('brand')}
            options={VEHICLE_BRANDS}
            onSelect={(value) => {
              setBrand(value);
              setModel('');
              setOpenDropdown(null);
            }}
          />

          <DropdownField
            label="Модель"
            value={model}
            placeholder={brand ? 'Обери модель' : 'Спочатку обери марку'}
            isOpen={openDropdown === 'model'}
            onToggle={() => toggleDropdown('model')}
            options={availableModels}
            onSelect={(value) => {
              setModel(value);
              setOpenDropdown(null);
            }}
            disabled={!brand}
          />

          <DropdownField
            label="Рік"
            value={year}
            placeholder="Обери рік"
            isOpen={openDropdown === 'year'}
            onToggle={() => toggleDropdown('year')}
            options={VEHICLE_YEARS}
            onSelect={(value) => {
              setYear(value);
              setOpenDropdown(null);
            }}
          />
        </View>

        <View style={styles.sheet}>
          <View style={styles.sheetHeaderRow}>
            <View style={styles.sheetHeaderText}>
              <ThemedText style={styles.sheetTitle}>Фото</ThemedText>
              <ThemedText style={styles.sheetSubtitle}>Додай кілька ракурсів для кращого результату.</ThemedText>
            </View>
            <View style={styles.counterBubble}>
              <ThemedText style={styles.counterText}>
                {photos.length}/{MAX_PHOTOS}
              </ThemedText>
            </View>
          </View>

          <View style={styles.hintChips}>
            {SHOOTING_HINTS.map((hint) => (
              <View key={hint} style={styles.hintChip}>
                <ThemedText style={styles.hintChipText}>{hint}</ThemedText>
              </View>
            ))}
          </View>

          <View style={styles.actionRow}>
            <Pressable onPress={handleTakePhoto} style={[styles.mediaButton, styles.mediaButtonDark]}>
              <ThemedText style={styles.mediaButtonText}>Камера</ThemedText>
            </Pressable>
            <Pressable onPress={handlePickPhoto} style={[styles.mediaButton, styles.mediaButtonSoft]}>
              <ThemedText style={styles.mediaButtonTextDark}>Галерея</ThemedText>
            </Pressable>
          </View>

          {photos.length ? (
            <View style={styles.photoGrid}>
              {photos.map((photo, index) => (
                <View key={`${photo.uri}-${index}`} style={styles.photoTile}>
                  <Image source={{ uri: photo.uri }} style={styles.photoPreview} contentFit="cover" />
                  <View style={styles.photoOverlay}>
                    <ThemedText style={styles.photoName}>{photo.fileName || `Фото ${index + 1}`}</ThemedText>
                    <Pressable onPress={() => handleRemovePhoto(index)} style={styles.removePill}>
                      <ThemedText style={styles.removePillText}>Прибрати</ThemedText>
                    </Pressable>
                  </View>
                </View>
              ))}
            </View>
          ) : (
            <View style={styles.emptyState}>
              <ThemedText style={styles.emptyStateTitle}>Тут зʼявляться твої фото</ThemedText>
              <ThemedText style={styles.emptyStateText}>
                Почни з головного ракурсу, а потім додай боки та крупний план ушкодження.
              </ThemedText>
            </View>
          )}
        </View>

        {formError ? <ThemedText style={styles.errorText}>{formError}</ThemedText> : null}
        {error ? <ThemedText style={styles.errorText}>{error}</ThemedText> : null}

        <Pressable onPress={handleAnalyze} style={styles.analyzeButton}>
          <ThemedText style={styles.analyzeButtonText}>Запустити AI-аналіз</ThemedText>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#F7F0E4',
  },
  glowTop: {
    position: 'absolute',
    top: -120,
    right: -30,
    width: 240,
    height: 240,
    borderRadius: 120,
    backgroundColor: '#F3C980',
    opacity: 0.22,
  },
  glowSide: {
    position: 'absolute',
    top: 210,
    left: -80,
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: '#D7E4C0',
    opacity: 0.35,
  },
  content: {
    paddingHorizontal: 18,
    paddingTop: 12,
    gap: 16,
  },
  heroBlock: {
    display: 'none',
  },
  heroCard: {
    backgroundColor: 'rgba(255, 250, 241, 0.92)',
    borderRadius: 30,
    padding: 22,
    gap: 8,
    borderWidth: 1,
    borderColor: '#E7DDCC',
  },
  pill: {
    display: 'none',
  },
  pillText: {
    color: '#52463B',
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  heroTitle: {
    color: '#1F1D1A',
    fontSize: 34,
    lineHeight: 36,
  },
  heroSubtitle: {
    color: '#5F5449',
    lineHeight: 22,
    fontSize: 15,
  },
  sheet: {
    backgroundColor: 'transparent',
    borderRadius: 0,
    paddingHorizontal: 2,
    paddingVertical: 0,
    gap: 14,
  },
  sheetHeader: {
    gap: 4,
    paddingBottom: 2,
  },
  sheetHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 12,
    flexWrap: 'wrap',
  },
  sheetHeaderText: {
    flex: 1,
    minWidth: 0,
  },
  sheetTitle: {
    color: '#1E1C19',
    fontSize: 22,
    lineHeight: 26,
    fontWeight: '700',
  },
  sheetSubtitle: {
    color: '#7A6F63',
    lineHeight: 20,
  },
  counterBubble: {
    backgroundColor: '#1F1D1A',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
    flexShrink: 0,
    alignSelf: 'flex-start',
    maxWidth: '100%',
  },
  counterText: {
    color: '#FFF9EF',
    fontWeight: '700',
    fontSize: 13,
  },
  inputGroup: {
    gap: 8,
  },
  inputLabel: {
    color: '#645749',
    fontSize: 13,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  selectTrigger: {
    minHeight: 56,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#DDD1BF',
    backgroundColor: '#FFFDF8',
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  selectTriggerDisabled: {
    opacity: 0.45,
  },
  selectValue: {
    color: '#1F1D1A',
    flex: 1,
    fontSize: 16,
  },
  selectPlaceholder: {
    color: '#B2A493',
    flex: 1,
    fontSize: 16,
  },
  selectArrow: {
    color: '#6E6257',
    marginLeft: 12,
    fontSize: 12,
  },
  selectMenu: {
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#DDD1BF',
    backgroundColor: '#FFFDF8',
    overflow: 'hidden',
  },
  selectScroll: {
    maxHeight: 220,
  },
  selectOption: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F0E7DB',
  },
  selectOptionPressed: {
    backgroundColor: '#F8EFE0',
  },
  selectOptionText: {
    color: '#1F1D1A',
  },
  hintChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  hintChip: {
    backgroundColor: '#F2E8D9',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
  },
  hintChipText: {
    color: '#5F5145',
    fontSize: 13,
    fontWeight: '600',
  },
  actionRow: {
    flexDirection: 'row',
    gap: 10,
  },
  mediaButton: {
    flex: 1,
    minHeight: 52,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mediaButtonDark: {
    backgroundColor: '#1F1D1A',
  },
  mediaButtonSoft: {
    backgroundColor: '#E7D7BC',
  },
  mediaButtonText: {
    color: '#FFF9EF',
    fontWeight: '700',
  },
  mediaButtonTextDark: {
    color: '#312A22',
    fontWeight: '700',
  },
  photoGrid: {
    gap: 12,
  },
  photoTile: {
    position: 'relative',
    borderRadius: 26,
    overflow: 'hidden',
  },
  photoPreview: {
    width: '100%',
    height: 230,
    backgroundColor: '#D9D0C2',
  },
  photoOverlay: {
    position: 'absolute',
    left: 12,
    right: 12,
    bottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
  },
  photoName: {
    color: '#FFF9EF',
    flex: 1,
    fontWeight: '600',
    textShadowColor: 'rgba(0,0,0,0.28)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 6,
  },
  removePill: {
    backgroundColor: 'rgba(24, 22, 19, 0.72)',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  removePillText: {
    color: '#FFF9EF',
    fontSize: 12,
    fontWeight: '700',
  },
  emptyState: {
    borderRadius: 20,
    paddingHorizontal: 18,
    paddingVertical: 22,
    backgroundColor: '#FCF6EC',
    borderWidth: 1,
    borderColor: '#E4D8C7',
    gap: 6,
  },
  emptyStateTitle: {
    color: '#1F1D1A',
    fontWeight: '700',
  },
  emptyStateText: {
    color: '#7A6F63',
    lineHeight: 21,
  },
  errorText: {
    color: '#8F2D2D',
    lineHeight: 21,
    paddingHorizontal: 4,
  },
  analyzeButton: {
    minHeight: 58,
    borderRadius: 22,
    backgroundColor: '#1F1D1A',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#3E3324',
    shadowOpacity: 0.2,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 12 },
    elevation: 6,
    marginTop: 4,
  },
  analyzeButtonText: {
    color: '#FFF9EF',
    fontWeight: '700',
    fontSize: 16,
  },
  loadingScreen: {
    flex: 1,
    backgroundColor: '#1F1D1A',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 30,
    gap: 16,
  },
  loadingBadge: {
    backgroundColor: 'rgba(255, 248, 238, 0.14)',
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  loadingBadgeText: {
    color: '#F3E7D2',
    fontWeight: '700',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    fontSize: 12,
  },
  loadingTitle: {
    color: '#FFF8EE',
    fontSize: 28,
    lineHeight: 32,
    fontWeight: '700',
    textAlign: 'center',
  },
  loadingText: {
    color: '#CFC2B0',
    lineHeight: 22,
    textAlign: 'center',
  },
  resultContent: {
    paddingHorizontal: 18,
    paddingTop: 12,
    gap: 16,
  },
  resultHero: {
    gap: 8,
    paddingTop: 4,
  },
  statementCard: {
    backgroundColor: '#1F1D1A',
    borderRadius: 28,
    padding: 20,
    gap: 8,
  },
  statementEyebrow: {
    color: '#E6D4B4',
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  statementText: {
    color: '#FFF8EE',
    fontSize: 20,
    lineHeight: 28,
    fontWeight: '600',
  },
  resultPhotoList: {
    gap: 12,
  },
  resultPhoto: {
    width: '100%',
    height: 230,
    borderRadius: 26,
    backgroundColor: '#D9D0C2',
  },
  dualCardRow: {
    flexDirection: 'row',
    gap: 12,
  },
  infoCard: {
    flex: 1,
    borderRadius: 24,
    padding: 18,
    minHeight: 122,
    justifyContent: 'space-between',
  },
  infoCardWarm: {
    backgroundColor: '#E7D7BC',
  },
  infoCardDark: {
    backgroundColor: '#34312C',
  },
  infoLabel: {
    color: '#625547',
    textTransform: 'uppercase',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  infoValue: {
    color: '#1E1C19',
    fontSize: 34,
    lineHeight: 36,
    fontWeight: '700',
  },
  infoLabelDark: {
    color: '#D0C2AE',
    textTransform: 'uppercase',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  infoValueDark: {
    color: '#FFF8EE',
    fontSize: 22,
    lineHeight: 26,
    fontWeight: '700',
  },
  sectionCard: {
    backgroundColor: 'rgba(255, 250, 241, 0.88)',
    borderRadius: 28,
    padding: 18,
    gap: 12,
    borderWidth: 1,
    borderColor: '#E9DECC',
  },
  sectionTitle: {
    color: '#1F1D1A',
    fontSize: 22,
    lineHeight: 26,
    fontWeight: '700',
  },
  tagWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  zoneTag: {
    backgroundColor: '#F1E5D2',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 9,
  },
  zoneTagText: {
    color: '#5B4F44',
    fontWeight: '600',
  },
  bulletRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  bulletDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#D79043',
    marginTop: 8,
  },
  bodyText: {
    color: '#2B2925',
    lineHeight: 23,
    flex: 1,
  },
  lineItemCard: {
    backgroundColor: '#FFFDF8',
    borderRadius: 22,
    padding: 16,
    gap: 8,
    borderWidth: 1,
    borderColor: '#EFE2D0',
  },
  lineItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
  },
  lineItemTitle: {
    color: '#1F1D1A',
    fontSize: 18,
    lineHeight: 22,
    fontWeight: '700',
    flex: 1,
  },
  miniPill: {
    backgroundColor: '#F3E6D1',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  miniPillText: {
    color: '#5F5348',
    fontSize: 12,
    fontWeight: '700',
  },
  lineMeta: {
    color: '#4A4138',
    lineHeight: 21,
  },
  priceRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 4,
  },
  priceChip: {
    flex: 1,
    backgroundColor: '#F8F1E6',
    borderRadius: 18,
    padding: 12,
    gap: 2,
  },
  priceChipLabel: {
    color: '#7B6E61',
    fontSize: 12,
    textTransform: 'uppercase',
    fontWeight: '700',
  },
  priceChipValue: {
    color: '#1F1D1A',
    fontSize: 16,
    fontWeight: '700',
  },
  lineNote: {
    color: '#7A6F63',
    lineHeight: 21,
  },
  footerCard: {
    gap: 12,
    paddingBottom: 8,
  },
  footerNote: {
    color: '#6F655C',
    lineHeight: 22,
  },
  primaryButton: {
    minHeight: 56,
    borderRadius: 22,
    backgroundColor: '#1F1D1A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButtonText: {
    color: '#FFF9EF',
    fontWeight: '700',
    fontSize: 16,
  },
});

## app/(tabs)/history.tsx

import { useIsFocused } from '@react-navigation/native';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { useAuth } from '@/context/auth-context';
import {
  deleteAnalysisHistoryItem,
  getAnalysisHistory,
  type AnalysisHistoryItem,
} from '@/lib/history';

function formatDate(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleString('uk-UA', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function HistoryScreen() {
  const { session } = useAuth();
  const isFocused = useIsFocused();
  const [history, setHistory] = useState<AnalysisHistoryItem[]>([]);
  const [isHistoryLoading, setIsHistoryLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    async function loadHistory() {
      if (!session?.email) {
        if (isMounted) {
          setHistory([]);
          setIsHistoryLoading(false);
        }
        return;
      }

      if (isMounted) {
        setIsHistoryLoading(true);
      }

      const nextHistory = await getAnalysisHistory(session.email);

      if (isMounted) {
        setHistory(nextHistory);
        setIsHistoryLoading(false);
      }
    }

    if (isFocused) {
      loadHistory();
    }

    return () => {
      isMounted = false;
    };
  }, [isFocused, session?.email]);

  function openReport(itemId: string) {
    router.push(`/history-report/${itemId}`);
  }

  function handleDelete(item: AnalysisHistoryItem) {
    if (!session?.email) {
      return;
    }

    Alert.alert(
      'Видалити звіт?',
      `Звіт для ${item.vehicleLabel} буде видалено з історії.`,
      [
        { text: 'Скасувати', style: 'cancel' },
        {
          text: 'Видалити',
          style: 'destructive',
          onPress: async () => {
            await deleteAnalysisHistoryItem(session.email, item.id);
            setHistory((current) => current.filter((entry) => entry.id !== item.id));
          },
        },
      ]
    );
  }

  return (
    <SafeAreaView style={styles.screen} edges={['top', 'left', 'right']}>
      <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
        <View style={styles.glowTop} />

        <View style={styles.hero}>
          <View style={styles.heroPill}>
            <ThemedText style={styles.heroPillText}>saved reports</ThemedText>
          </View>
          <ThemedText type="title" style={styles.title}>
            Історія аналізів
          </ThemedText>
          <ThemedText style={styles.subtitle}>
            Збережені звіти відображаються короткими картками. Натисни на картку, щоб відкрити повний
            звіт, або видали непотрібний запис окремою кнопкою.
          </ThemedText>
        </View>

        {isHistoryLoading ? (
          <View style={styles.loadingCard}>
            <ThemedText style={styles.loadingText}>Завантаження історії...</ThemedText>
          </View>
        ) : history.length ? (
          history.map((item, index) => (
            <View key={item.id} style={styles.reportCard}>
              <View style={[styles.cardAccent, index % 2 === 0 ? styles.cardAccentWarm : styles.cardAccentMint]} />

              <Pressable onPress={() => openReport(item.id)} style={styles.reportContent}>
                <View style={styles.reportHeader}>
                  <View style={styles.reportMeta}>
                    <ThemedText style={styles.reportDate}>{formatDate(item.createdAt)}</ThemedText>
                    <ThemedText style={styles.reportVehicle}>{item.vehicleLabel}</ThemedText>
                  </View>
                  <ThemedText style={styles.reportArrow}>→</ThemedText>
                </View>

                <View style={styles.metricsRow}>
                  <View style={styles.metricBubble}>
                    <ThemedText style={styles.metricLabel}>Зони</ThemedText>
                    <ThemedText style={styles.metricValue}>{item.damagedZones.length}</ThemedText>
                  </View>
                  <View style={styles.metricBubble}>
                    <ThemedText style={styles.metricLabel}>Сума</ThemedText>
                    <ThemedText style={styles.metricValue}>
                      {item.totalAmount} {item.currency}
                    </ThemedText>
                  </View>
                </View>

                <ThemedText style={styles.reportSummary} numberOfLines={2}>
                  {item.summary}
                </ThemedText>
              </Pressable>

              <Pressable onPress={() => handleDelete(item)} style={styles.deleteButton}>
                <ThemedText style={styles.deleteButtonText}>Видалити</ThemedText>
              </Pressable>
            </View>
          ))
        ) : (
          <View style={styles.emptyCard}>
            <ThemedText style={styles.emptyTitle}>Поки що тихо</ThemedText>
            <ThemedText style={styles.emptyText}>
              Після першого успішного аналізу тут з’являться картки зі збереженими звітами.
            </ThemedText>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#F7F0E4',
  },
  content: {
    paddingHorizontal: 18,
    paddingTop: 12,
    paddingBottom: 120,
    gap: 14,
  },
  glowTop: {
    position: 'absolute',
    top: -60,
    left: -50,
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: '#D5E0C1',
    opacity: 0.4,
  },
  hero: {
    gap: 8,
    paddingTop: 10,
  },
  heroPill: {
    alignSelf: 'flex-start',
    backgroundColor: '#ECE2D2',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  heroPillText: {
    color: '#645749',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  title: {
    color: '#1E1C19',
    fontSize: 34,
    lineHeight: 36,
  },
  subtitle: {
    color: '#6E645A',
    lineHeight: 22,
  },
  loadingCard: {
    borderRadius: 28,
    padding: 22,
    backgroundColor: '#FFF9EF',
    borderWidth: 1,
    borderColor: '#E8DECE',
  },
  loadingText: {
    color: '#6E645A',
  },
  reportCard: {
    borderRadius: 28,
    padding: 18,
    backgroundColor: '#FFF9EF',
    borderWidth: 1,
    borderColor: '#E8DECE',
    gap: 14,
    overflow: 'hidden',
  },
  reportContent: {
    gap: 14,
  },
  cardAccent: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 110,
    height: 110,
    borderBottomLeftRadius: 30,
    opacity: 0.45,
  },
  cardAccentWarm: {
    backgroundColor: '#F2D49C',
  },
  cardAccentMint: {
    backgroundColor: '#D8E4C5',
  },
  reportHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 12,
  },
  reportMeta: {
    gap: 6,
    flex: 1,
  },
  reportDate: {
    color: '#7A6F63',
    fontSize: 13,
  },
  reportVehicle: {
    color: '#1E1C19',
    fontSize: 24,
    lineHeight: 28,
    fontWeight: '700',
  },
  reportArrow: {
    color: '#5B5148',
    fontSize: 24,
    lineHeight: 24,
  },
  metricsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  metricBubble: {
    flex: 1,
    backgroundColor: '#F5ECDF',
    borderRadius: 18,
    padding: 12,
    gap: 4,
  },
  metricLabel: {
    color: '#8B7D6C',
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  metricValue: {
    color: '#1E1C19',
    fontWeight: '700',
  },
  reportSummary: {
    color: '#4B433B',
    lineHeight: 22,
  },
  deleteButton: {
    alignSelf: 'flex-start',
    backgroundColor: '#F3E2DD',
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 9,
  },
  deleteButtonText: {
    color: '#8A3E33',
    fontSize: 13,
    fontWeight: '700',
  },
  emptyCard: {
    borderRadius: 28,
    padding: 22,
    backgroundColor: '#FFF9EF',
    borderWidth: 1,
    borderColor: '#E8DECE',
    gap: 8,
  },
  emptyTitle: {
    color: '#1E1C19',
    fontSize: 22,
    fontWeight: '700',
  },
  emptyText: {
    color: '#6E645A',
    lineHeight: 22,
  },
});

## app/(tabs)/explore.tsx

import { router } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { useAuth } from '@/context/auth-context';

export default function ProfileScreen() {
  const { session, logout } = useAuth();

  async function handleLogout() {
    await logout();
    router.replace('/login');
  }

  return (
    <SafeAreaView style={styles.screen} edges={['top', 'left', 'right']}>
      <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
        <View style={styles.glowTop} />

        <View style={styles.hero}>
          <View style={styles.profileOrb}>
            <ThemedText style={styles.profileInitial}>
              {(session?.name || session?.email || 'A').trim().charAt(0).toUpperCase()}
            </ThemedText>
          </View>
          <ThemedText type="title" style={styles.title}>
            Профіль
          </ThemedText>
          <ThemedText style={styles.subtitle}>
            Особистий кабінет для поточного акаунта та керування сесією.
          </ThemedText>
        </View>

        <View style={styles.card}>
          <ThemedText style={styles.cardLabel}>Користувач</ThemedText>
          <ThemedText style={styles.cardValue}>{session?.name || 'Без імені'}</ThemedText>
          <ThemedText style={styles.cardNote}>{session?.email || '-'}</ThemedText>
        </View>

        <View style={styles.cardRow}>
          <View style={[styles.miniCard, styles.miniCardWarm]}>
            <ThemedText style={styles.miniLabel}>Статус</ThemedText>
            <ThemedText style={styles.miniValue}>Активна сесія</ThemedText>
          </View>
          <View style={[styles.miniCard, styles.miniCardDark]}>
            <ThemedText style={styles.miniLabelDark}>Безпека</ThemedText>
            <ThemedText style={styles.miniValueDark}>Локальне сховище</ThemedText>
          </View>
        </View>

        <View style={styles.noteCard}>
          <ThemedText style={styles.noteTitle}>Про цей режим</ThemedText>
          <ThemedText style={styles.noteText}>
            Для цього MVP акаунт і сесія зберігаються локально на пристрої. Історія аналізів доступна в окремій вкладці.
          </ThemedText>
        </View>

        <Pressable onPress={handleLogout} style={styles.logoutButton}>
          <ThemedText style={styles.logoutButtonText}>Вийти з акаунта</ThemedText>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#F7F0E4',
  },
  content: {
    paddingHorizontal: 18,
    paddingTop: 12,
    paddingBottom: 120,
    gap: 16,
  },
  glowTop: {
    position: 'absolute',
    top: -50,
    right: -60,
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: '#F2D49C',
    opacity: 0.35,
  },
  hero: {
    alignItems: 'center',
    gap: 10,
    paddingTop: 8,
  },
  profileOrb: {
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: '#1F1D1A',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#3E3324',
    shadowOpacity: 0.18,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 10 },
    elevation: 8,
  },
  profileInitial: {
    color: '#FFF9EF',
    fontSize: 42,
    lineHeight: 42,
    fontWeight: '700',
  },
  title: {
    color: '#1E1C19',
    fontSize: 34,
    lineHeight: 36,
    textAlign: 'center',
  },
  subtitle: {
    color: '#6E645A',
    lineHeight: 22,
    textAlign: 'center',
  },
  card: {
    borderRadius: 28,
    padding: 22,
    backgroundColor: '#FFF9EF',
    borderWidth: 1,
    borderColor: '#E8DECE',
    gap: 6,
  },
  cardLabel: {
    color: '#8A7C6B',
    fontSize: 12,
    textTransform: 'uppercase',
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  cardValue: {
    color: '#1E1C19',
    fontSize: 26,
    lineHeight: 30,
    fontWeight: '700',
  },
  cardNote: {
    color: '#5C544B',
    lineHeight: 22,
  },
  cardRow: {
    flexDirection: 'row',
    gap: 12,
  },
  miniCard: {
    flex: 1,
    borderRadius: 24,
    padding: 18,
    minHeight: 118,
    justifyContent: 'space-between',
  },
  miniCardWarm: {
    backgroundColor: '#E7D7BC',
  },
  miniCardDark: {
    backgroundColor: '#2C2925',
  },
  miniLabel: {
    color: '#746556',
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  miniValue: {
    color: '#1E1C19',
    fontSize: 22,
    lineHeight: 26,
    fontWeight: '700',
  },
  miniLabelDark: {
    color: '#CDBEA8',
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  miniValueDark: {
    color: '#FFF8EE',
    fontSize: 22,
    lineHeight: 26,
    fontWeight: '700',
  },
  noteCard: {
    borderRadius: 28,
    padding: 20,
    backgroundColor: '#F5ECDF',
    gap: 8,
  },
  noteTitle: {
    color: '#1E1C19',
    fontSize: 20,
    fontWeight: '700',
  },
  noteText: {
    color: '#62584F',
    lineHeight: 22,
  },
  logoutButton: {
    minHeight: 56,
    borderRadius: 22,
    backgroundColor: '#8E3B36',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 6,
  },
  logoutButtonText: {
    color: '#FFF9EF',
    fontWeight: '700',
    fontSize: 16,
  },
});

## components/external-link.tsx

import { Href, Link } from 'expo-router';
import { openBrowserAsync, WebBrowserPresentationStyle } from 'expo-web-browser';
import { type ComponentProps } from 'react';

type Props = Omit<ComponentProps<typeof Link>, 'href'> & { href: Href & string };

export function ExternalLink({ href, ...rest }: Props) {
  return (
    <Link
      target="_blank"
      {...rest}
      href={href}
      onPress={async (event) => {
        if (process.env.EXPO_OS !== 'web') {
          // Prevent the default behavior of linking to the default browser on native.
          event.preventDefault();
          // Open the link in an in-app browser.
          await openBrowserAsync(href, {
            presentationStyle: WebBrowserPresentationStyle.AUTOMATIC,
          });
        }
      }}
    />
  );
}

## components/haptic-tab.tsx

import { BottomTabBarButtonProps } from '@react-navigation/bottom-tabs';
import { PlatformPressable } from '@react-navigation/elements';
import * as Haptics from 'expo-haptics';

export function HapticTab(props: BottomTabBarButtonProps) {
  return (
    <PlatformPressable
      {...props}
      onPressIn={(ev) => {
        if (process.env.EXPO_OS === 'ios') {
          // Add a soft haptic feedback when pressing down on the tabs.
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }
        props.onPressIn?.(ev);
      }}
    />
  );
}

## components/hello-wave.tsx

import Animated from 'react-native-reanimated';

export function HelloWave() {
	return (
		<Animated.Text
			style={{
				fontSize: 28,
				lineHeight: 32,
				marginTop: -6,
				animationName: {
					'50%': { transform: [{ rotate: '25deg' }] },
				},
				animationIterationCount: 4,
				animationDuration: '300ms',
			}}
		>
			👋
		</Animated.Text>
	);
}

## components/parallax-scroll-view.tsx

import type { PropsWithChildren, ReactElement } from 'react';
import { StyleSheet } from 'react-native';
import Animated, {
  interpolate,
  useAnimatedRef,
  useAnimatedStyle,
  useScrollOffset,
} from 'react-native-reanimated';

import { ThemedView } from '@/components/themed-view';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useThemeColor } from '@/hooks/use-theme-color';

const HEADER_HEIGHT = 250;

type Props = PropsWithChildren<{
  headerImage: ReactElement;
  headerBackgroundColor: { dark: string; light: string };
}>;

export default function ParallaxScrollView({
  children,
  headerImage,
  headerBackgroundColor,
}: Props) {
  const backgroundColor = useThemeColor({}, 'background');
  const colorScheme = useColorScheme() ?? 'light';
  const scrollRef = useAnimatedRef<Animated.ScrollView>();
  const scrollOffset = useScrollOffset(scrollRef);
  const headerAnimatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        {
          translateY: interpolate(
            scrollOffset.value,
            [-HEADER_HEIGHT, 0, HEADER_HEIGHT],
            [-HEADER_HEIGHT / 2, 0, HEADER_HEIGHT * 0.75]
          ),
        },
        {
          scale: interpolate(scrollOffset.value, [-HEADER_HEIGHT, 0, HEADER_HEIGHT], [2, 1, 1]),
        },
      ],
    };
  });

  return (
    <Animated.ScrollView
      ref={scrollRef}
      style={{ backgroundColor, flex: 1 }}
      scrollEventThrottle={16}>
      <Animated.View
        style={[
          styles.header,
          { backgroundColor: headerBackgroundColor[colorScheme] },
          headerAnimatedStyle,
        ]}>
        {headerImage}
      </Animated.View>
      <ThemedView style={styles.content}>{children}</ThemedView>
    </Animated.ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    height: HEADER_HEIGHT,
    overflow: 'hidden',
  },
  content: {
    flex: 1,
    padding: 32,
    gap: 16,
    overflow: 'hidden',
  },
});

## components/themed-text.tsx

import { StyleSheet, Text, type TextProps } from 'react-native';

import { useThemeColor } from '@/hooks/use-theme-color';

export type ThemedTextProps = TextProps & {
  lightColor?: string;
  darkColor?: string;
  type?: 'default' | 'title' | 'defaultSemiBold' | 'subtitle' | 'link';
};

export function ThemedText({
  style,
  lightColor,
  darkColor,
  type = 'default',
  ...rest
}: ThemedTextProps) {
  const color = useThemeColor({ light: lightColor, dark: darkColor }, 'text');

  return (
    <Text
      style={[
        { color },
        type === 'default' ? styles.default : undefined,
        type === 'title' ? styles.title : undefined,
        type === 'defaultSemiBold' ? styles.defaultSemiBold : undefined,
        type === 'subtitle' ? styles.subtitle : undefined,
        type === 'link' ? styles.link : undefined,
        style,
      ]}
      {...rest}
    />
  );
}

const styles = StyleSheet.create({
  default: {
    fontSize: 16,
    lineHeight: 24,
  },
  defaultSemiBold: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: '600',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    lineHeight: 32,
  },
  subtitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  link: {
    lineHeight: 30,
    fontSize: 16,
    color: '#0a7ea4',
  },
});

## components/themed-view.tsx

import { View, type ViewProps } from 'react-native';

import { useThemeColor } from '@/hooks/use-theme-color';

export type ThemedViewProps = ViewProps & {
  lightColor?: string;
  darkColor?: string;
};

export function ThemedView({ style, lightColor, darkColor, ...otherProps }: ThemedViewProps) {
  const backgroundColor = useThemeColor({ light: lightColor, dark: darkColor }, 'background');

  return <View style={[{ backgroundColor }, style]} {...otherProps} />;
}

## components/ui/collapsible.tsx

import { PropsWithChildren, useState } from 'react';
import { StyleSheet, TouchableOpacity } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

export function Collapsible({ children, title }: PropsWithChildren & { title: string }) {
  const [isOpen, setIsOpen] = useState(false);
  const theme = useColorScheme() ?? 'light';

  return (
    <ThemedView>
      <TouchableOpacity
        style={styles.heading}
        onPress={() => setIsOpen((value) => !value)}
        activeOpacity={0.8}>
        <IconSymbol
          name="chevron.right"
          size={18}
          weight="medium"
          color={theme === 'light' ? Colors.light.icon : Colors.dark.icon}
          style={{ transform: [{ rotate: isOpen ? '90deg' : '0deg' }] }}
        />

        <ThemedText type="defaultSemiBold">{title}</ThemedText>
      </TouchableOpacity>
      {isOpen && <ThemedView style={styles.content}>{children}</ThemedView>}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  heading: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  content: {
    marginTop: 6,
    marginLeft: 24,
  },
});

## components/ui/icon-symbol.ios.tsx

import { SymbolView, SymbolViewProps, SymbolWeight } from 'expo-symbols';
import { StyleProp, ViewStyle } from 'react-native';

export function IconSymbol({
  name,
  size = 24,
  color,
  style,
  weight = 'regular',
}: {
  name: SymbolViewProps['name'];
  size?: number;
  color: string;
  style?: StyleProp<ViewStyle>;
  weight?: SymbolWeight;
}) {
  return (
    <SymbolView
      weight={weight}
      tintColor={color}
      resizeMode="scaleAspectFit"
      name={name}
      style={[
        {
          width: size,
          height: size,
        },
        style,
      ]}
    />
  );
}


## components/ui/icon-symbol.tsx

import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { SymbolWeight, SymbolViewProps } from 'expo-symbols';
import { ComponentProps } from 'react';
import { OpaqueColorValue, type StyleProp, type TextStyle } from 'react-native';

type IconMapping = Record<SymbolViewProps['name'], ComponentProps<typeof MaterialIcons>['name']>;
type IconSymbolName = keyof typeof MAPPING;


const MAPPING = {
  'house.fill': 'home',
  'paperplane.fill': 'send',
  'chevron.left.forwardslash.chevron.right': 'code',
  'chevron.right': 'chevron-right',
  'camera.aperture': 'camera-alt',
  'checkmark.circle.fill': 'check-circle',
  'car.front.waves.up': 'directions-car',
  'door.left.hand.open': 'meeting-room',
  sparkles: 'auto-awesome',
  'clock.fill': 'schedule',
  'wrench.and.screwdriver.fill': 'build',
  'doc.text.magnifyingglass': 'find-in-page',
} as IconMapping;

/**
 * An icon component that uses native SF Symbols on iOS, and Material Icons on Android and web.
 * This ensures a consistent look across platforms, and optimal resource usage.
 * Icon `name`s are based on SF Symbols and require manual mapping to Material Icons.
 */
export function IconSymbol({
  name,
  size = 24,
  color,
  style,
}: {
  name: IconSymbolName;
  size?: number;
  color: string | OpaqueColorValue;
  style?: StyleProp<TextStyle>;
  weight?: SymbolWeight;
}) {
  return <MaterialIcons color={color} size={size} name={MAPPING[name]} style={style} />;
}

## constants/theme.ts

import { Platform } from 'react-native';

const tintColorLight = '#0a7ea4';
const tintColorDark = '#fff';

export const Colors = {
  light: {
    text: '#11181C',
    background: '#fff',
    tint: tintColorLight,
    icon: '#687076',
    tabIconDefault: '#687076',
    tabIconSelected: tintColorLight,
  },
  dark: {
    text: '#ECEDEE',
    background: '#151718',
    tint: tintColorDark,
    icon: '#9BA1A6',
    tabIconDefault: '#9BA1A6',
    tabIconSelected: tintColorDark,
  },
};

export const Fonts = Platform.select({
  ios: {
    /** iOS `UIFontDescriptorSystemDesignDefault` */
    sans: 'system-ui',
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: 'ui-serif',
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: 'ui-rounded',
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded: "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});

## context/analysis-flow-context.tsx

import { createContext, type PropsWithChildren, useContext, useMemo, useState } from 'react';

import { saveAnalysisHistory } from '@/lib/history';
import { analyzeCarDamagePhotos, type DamageAnalysis } from '@/lib/openai';

export type PickedPhoto = {
  uri: string;
  mimeType: string;
  base64: string;
  fileName?: string | null;
};

export type AnalysisDraft = {
  brand: string;
  model: string;
  year: string;
  photos: PickedPhoto[];
};

type AnalysisFlowContextValue = {
  draft: AnalysisDraft | null;
  result: DamageAnalysis | null;
  error: string;
  isAnalyzing: boolean;
  setDraft: (draft: AnalysisDraft) => void;
  submitDraft: (draft: AnalysisDraft, email?: string | null) => Promise<void>;
  runAnalysis: (email?: string | null) => Promise<void>;
  resetFlow: () => void;
  clearResult: () => void;
};

const AnalysisFlowContext = createContext<AnalysisFlowContextValue | null>(null);

export function AnalysisFlowProvider({ children }: PropsWithChildren) {
  const [draft, setDraftState] = useState<AnalysisDraft | null>(null);
  const [result, setResult] = useState<DamageAnalysis | null>(null);
  const [error, setError] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  async function executeAnalysis(targetDraft: AnalysisDraft, email?: string | null) {
    if (!targetDraft.photos.length) {
      setError('Спочатку додай хоча б одне фото авто.');
      return;
    }

    const vehicleContext = [targetDraft.brand.trim(), targetDraft.model.trim(), targetDraft.year.trim()]
      .filter(Boolean)
      .join(' ');

    setIsAnalyzing(true);
    setError('');
    setResult(null);

    try {
      const response = await analyzeCarDamagePhotos({
        photos: targetDraft.photos.map((photo) => ({
          base64Data: photo.base64,
          mimeType: photo.mimeType,
        })),
        vehicleModelInput: vehicleContext,
      });

      setResult(response);

      if (email) {
        await saveAnalysisHistory({
          email,
          analysis: response,
          photos: targetDraft.photos.map((photo) => ({
            uri: photo.uri,
            fileName: photo.fileName,
          })),
        });
      }
    } catch (requestError) {
      const message =
        requestError instanceof Error ? requestError.message : 'Не вдалося виконати аналіз.';
      setError(message);
    } finally {
      setIsAnalyzing(false);
    }
  }

  const value = useMemo<AnalysisFlowContextValue>(
    () => ({
      draft,
      result,
      error,
      isAnalyzing,
      setDraft(nextDraft) {
        setDraftState(nextDraft);
        setResult(null);
        setError('');
      },
      async submitDraft(nextDraft, email) {
        setDraftState(nextDraft);
        await executeAnalysis(nextDraft, email);
      },
      async runAnalysis(email) {
        if (!draft) {
          setError('Спочатку додай дані для аналізу.');
          return;
        }

        await executeAnalysis(draft, email);
      },
      resetFlow() {
        setDraftState(null);
        setResult(null);
        setError('');
        setIsAnalyzing(false);
      },
      clearResult() {
        setResult(null);
        setError('');
      },
    }),
    [draft, error, isAnalyzing, result]
  );

  return <AnalysisFlowContext.Provider value={value}>{children}</AnalysisFlowContext.Provider>;
}

export function useAnalysisFlow() {
  const context = useContext(AnalysisFlowContext);
  if (!context) {
    throw new Error('useAnalysisFlow must be used inside AnalysisFlowProvider');
  }

  return context;
}

## context/auth-context.tsx

import * as SecureStore from 'expo-secure-store';
import {
  createContext,
  type PropsWithChildren,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';

const ACCOUNT_STORAGE_KEY = 'cardamageanalyzer.account';
const SESSION_STORAGE_KEY = 'cardamageanalyzer.session';

let memoryAccount: string | null = null;
let memorySession: string | null = null;

type StoredAccount = {
  name: string;
  email: string;
  password: string;
};

type Session = {
  name: string;
  email: string;
};

type RegisterInput = {
  name: string;
  email: string;
  password: string;
};

type LoginInput = {
  email: string;
  password: string;
};

type AuthContextValue = {
  isLoading: boolean;
  session: Session | null;
  register: (input: RegisterInput) => Promise<void>;
  login: (input: LoginInput) => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

async function safeGetItem(key: string): Promise<string | null> {
  try {
    return await SecureStore.getItemAsync(key);
  } catch {
    return key === ACCOUNT_STORAGE_KEY ? memoryAccount : memorySession;
  }
}

async function safeSetItem(key: string, value: string) {
  try {
    await SecureStore.setItemAsync(key, value);
  } catch {
    if (key === ACCOUNT_STORAGE_KEY) {
      memoryAccount = value;
    } else {
      memorySession = value;
    }
  }
}

async function safeDeleteItem(key: string) {
  try {
    await SecureStore.deleteItemAsync(key);
  } catch {
    if (key === ACCOUNT_STORAGE_KEY) {
      memoryAccount = null;
    } else {
      memorySession = null;
    }
  }
}

async function readJson<T>(key: string): Promise<T | null> {
  const raw = await safeGetItem(key);
  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

async function writeJson(key: string, value: unknown) {
  await safeSetItem(key, JSON.stringify(value));
}

export function AuthProvider({ children }: PropsWithChildren) {
  const [isLoading, setIsLoading] = useState(true);
  const [session, setSession] = useState<Session | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function loadSession() {
      try {
        const storedSession = await readJson<Session>(SESSION_STORAGE_KEY);
        if (isMounted) {
          setSession(storedSession);
        }
      } catch {
        if (isMounted) {
          setSession(null);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    loadSession();

    return () => {
      isMounted = false;
    };
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      isLoading,
      session,
      async register(input) {
        const normalizedEmail = input.email.trim().toLowerCase();
        const account: StoredAccount = {
          name: input.name.trim(),
          email: normalizedEmail,
          password: input.password,
        };
        const nextSession: Session = {
          name: account.name,
          email: account.email,
        };

        await writeJson(ACCOUNT_STORAGE_KEY, account);
        await writeJson(SESSION_STORAGE_KEY, nextSession);
        setSession(nextSession);
      },
      async login(input) {
        const account = await readJson<StoredAccount>(ACCOUNT_STORAGE_KEY);
        if (!account) {
          throw new Error('Акаунт ще не створено. Спочатку зареєструйся.');
        }

        const normalizedEmail = input.email.trim().toLowerCase();
        if (account.email !== normalizedEmail || account.password !== input.password) {
          throw new Error('Невірний email або пароль.');
        }

        const nextSession: Session = {
          name: account.name,
          email: account.email,
        };

        await writeJson(SESSION_STORAGE_KEY, nextSession);
        setSession(nextSession);
      },
      async logout() {
        await safeDeleteItem(SESSION_STORAGE_KEY);
        setSession(null);
      },
    }),
    [isLoading, session]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used inside AuthProvider');
  }

  return context;
}

## data/pricing-catalog.ts

export type PartCode =
  | 'front_bumper'
  | 'rear_bumper'
  | 'bumper_grille'
  | 'hood'
  | 'left_headlight'
  | 'right_headlight'
  | 'left_fender'
  | 'right_fender'
  | 'left_front_door'
  | 'right_front_door'
  | 'left_rear_door'
  | 'right_rear_door'
  | 'left_mirror'
  | 'right_mirror'
  | 'radiator_support'
  | 'left_quarter_panel'
  | 'right_quarter_panel'
  | 'trunk_lid'
  | 'wheel_rim'
  | 'parking_sensor'
  | 'unknown_part';

export type OperationCode =
  | 'replace'
  | 'repair'
  | 'paint'
  | 'replace_and_paint'
  | 'repair_and_paint'
  | 'calibration'
  | 'diagnostics'
  | 'straightening';

export type CatalogPart = {
  label: string;
  basePrice: number;
  aliases: string[];
};

export type LaborRule = {
  label: string;
  laborPrice: number;
  materialPrice: number;
};

export const PARTS: Record<PartCode, CatalogPart> = {
  front_bumper: {
    label: 'Передній бампер',
    basePrice: 3200,
    aliases: ['передній бампер', 'бампер передній', 'front bumper'],
  },
  rear_bumper: {
    label: 'Задній бампер',
    basePrice: 3000,
    aliases: ['задній бампер', 'rear bumper'],
  },
  bumper_grille: {
    label: 'Решітка радіатора',
    basePrice: 2500,
    aliases: ['решітка', 'решітка радіатора', 'grille', 'radiator grille'],
  },
  hood: {
    label: 'Капот',
    basePrice: 8500,
    aliases: ['капот', 'hood'],
  },
  left_headlight: {
    label: 'Ліва фара',
    basePrice: 7000,
    aliases: ['ліва фара', 'ліва передня фара', 'left headlight'],
  },
  right_headlight: {
    label: 'Права фара',
    basePrice: 7000,
    aliases: ['права фара', 'права передня фара', 'right headlight'],
  },
  left_fender: {
    label: 'Ліве крило',
    basePrice: 2200,
    aliases: ['ліве крило', 'left fender'],
  },
  right_fender: {
    label: 'Праве крило',
    basePrice: 2200,
    aliases: ['праве крило', 'right fender'],
  },
  left_front_door: {
    label: 'Ліві передні двері',
    basePrice: 8200,
    aliases: ['ліві передні двері', 'left front door'],
  },
  right_front_door: {
    label: 'Праві передні двері',
    basePrice: 8200,
    aliases: ['праві передні двері', 'right front door'],
  },
  left_rear_door: {
    label: 'Ліві задні двері',
    basePrice: 7000,
    aliases: ['ліві задні двері', 'left rear door'],
  },
  right_rear_door: {
    label: 'Праві задні двері',
    basePrice: 7000,
    aliases: ['праві задні двері', 'right rear door'],
  },
  left_mirror: {
    label: 'Ліве дзеркало',
    basePrice: 4200,
    aliases: ['ліве дзеркало', 'left mirror'],
  },
  right_mirror: {
    label: 'Праве дзеркало',
    basePrice: 4200,
    aliases: ['праве дзеркало', 'right mirror'],
  },
  radiator_support: {
    label: 'Панель телевізора',
    basePrice: 2600,
    aliases: ['телевізор', 'панель радіатора', 'radiator support'],
  },
  left_quarter_panel: {
    label: 'Ліве заднє крило',
    basePrice: 9000,
    aliases: ['ліве заднє крило', 'left quarter panel'],
  },
  right_quarter_panel: {
    label: 'Праве заднє крило',
    basePrice: 9000,
    aliases: ['праве заднє крило', 'right quarter panel'],
  },
  trunk_lid: {
    label: 'Кришка багажника',
    basePrice: 11200,
    aliases: ['багажник', 'кришка багажника', 'trunk lid'],
  },
  wheel_rim: {
    label: 'Диск колеса',
    basePrice: 5000,
    aliases: ['диск', 'диск колеса', 'rim', 'wheel rim'],
  },
  parking_sensor: {
    label: 'Парктронік / датчик',
    basePrice: 600,
    aliases: ['парктронік', 'датчик паркування', 'sensor', 'parking sensor'],
  },
  unknown_part: {
    label: 'Невідома деталь',
    basePrice: 0,
    aliases: [],
  },
};

export const OPERATIONS: Record<OperationCode, LaborRule> = {
  replace: { label: 'Заміна', laborPrice: 1000, materialPrice: 0 },
  repair: { label: 'Ремонт', laborPrice: 1800, materialPrice: 0 },
  paint: { label: 'Фарбування', laborPrice: 3800, materialPrice: 1200 },
  replace_and_paint: { label: 'Заміна і фарбування', laborPrice: 4800, materialPrice: 1200 },
  repair_and_paint: { label: 'Ремонт і фарбування', laborPrice: 4300, materialPrice: 1200 },
  calibration: { label: 'Калібрування', laborPrice: 1000, materialPrice: 0 },
  diagnostics: { label: 'Діагностика', laborPrice: 600, materialPrice: 0 },
  straightening: { label: 'Рихтування', laborPrice: 2500, materialPrice: 0 },
};

## data/vehicle-options.ts

export const VEHICLE_OPTIONS = {
  Audi: ['A3', 'A4', 'A6', 'A8', 'Q3', 'Q5', 'Q7', 'Q8'],
  BMW: ['1 Series', '3 Series', '5 Series', '7 Series', 'X1', 'X3', 'X5', 'X6'],
  Chevrolet: ['Aveo', 'Cruze', 'Epica', 'Lacetti', 'Malibu', 'Orlando', 'Tacuma'],
  Ford: ['Fiesta', 'Focus', 'Fusion', 'Kuga', 'Mondeo', 'Mustang', 'S-Max'],
  Honda: ['Accord', 'CR-V', 'Civic', 'HR-V', 'Jazz', 'Pilot'],
  Hyundai: ['Accent', 'Elantra', 'Getz', 'i30', 'Santa Fe', 'Sonata', 'Tucson'],
  Kia: ['Carens', 'Ceed', 'Cerato', 'Optima', 'Sorento', 'Sportage', 'Stonic'],
  Lexus: ['ES', 'GS', 'GX', 'IS', 'LX', 'NX', 'RX'],
  Mazda: ['3', '5', '6', 'CX-3', 'CX-5', 'CX-7', 'CX-9'],
  'Mercedes-Benz': ['A-Class', 'C-Class', 'CLA', 'CLS', 'E-Class', 'GLA', 'GLC', 'GLE', 'S-Class', 'Vito'],
  Mitsubishi: ['ASX', 'Galant', 'L200', 'Lancer', 'Outlander', 'Pajero'],
  Nissan: ['Almera', 'Juke', 'Leaf', 'Micra', 'Murano', 'Qashqai', 'Rogue', 'X-Trail'],
  Opel: ['Astra', 'Combo', 'Corsa', 'Insignia', 'Meriva', 'Omega', 'Vectra', 'Zafira'],
  Peugeot: ['206', '207', '208', '301', '308', '407', '508', '3008', '5008'],
  Renault: ['Clio', 'Duster', 'Fluence', 'Kangoo', 'Laguna', 'Logan', 'Megane', 'Scenic'],
  Skoda: ['Fabia', 'Kamiq', 'Karoq', 'Kodiaq', 'Octavia', 'Rapid', 'Superb'],
  Subaru: ['Forester', 'Impreza', 'Legacy', 'Outback', 'Tribeca', 'XV'],
  Tesla: ['Model 3', 'Model S', 'Model X', 'Model Y'],
  Toyota: ['Auris', 'Avalon', 'Avensis', 'Camry', 'Corolla', 'Highlander', 'Land Cruiser', 'RAV4', 'Yaris'],
  Volkswagen: ['Amarok', 'Caddy', 'Golf', 'Jetta', 'Passat', 'Polo', 'Tiguan', 'Touareg', 'Transporter'],
  Volvo: ['S40', 'S60', 'S80', 'V50', 'V60', 'XC60', 'XC70', 'XC90'],
} as const;

export type VehicleBrand = keyof typeof VEHICLE_OPTIONS;

export const VEHICLE_BRANDS = Object.keys(VEHICLE_OPTIONS) as VehicleBrand[];

export const VEHICLE_YEARS = Array.from({ length: 31 }, (_, index) => String(2026 - index));

## hooks/use-color-scheme.ts

export { useColorScheme } from 'react-native';

## hooks/use-color-scheme.web.ts

import { useEffect, useState } from 'react';
import { useColorScheme as useRNColorScheme } from 'react-native';

/**
 * To support static rendering, this value needs to be re-calculated on the client side for web
 */
export function useColorScheme() {
  const [hasHydrated, setHasHydrated] = useState(false);

  useEffect(() => {
    setHasHydrated(true);
  }, []);

  const colorScheme = useRNColorScheme();

  if (hasHydrated) {
    return colorScheme;
  }

  return 'light';
}


## hooks/use-theme-color.ts

import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

export function useThemeColor(
  props: { light?: string; dark?: string },
  colorName: keyof typeof Colors.light & keyof typeof Colors.dark
) {
  const theme = useColorScheme() ?? 'light';
  const colorFromProps = props[theme];

  if (colorFromProps) {
    return colorFromProps;
  } else {
    return Colors[theme][colorName];
  }
}

## lib/history.ts

import * as FileSystem from 'expo-file-system/legacy';
import * as SecureStore from 'expo-secure-store';

import type { DamageAnalysis } from '@/lib/openai';

const HISTORY_DIRECTORY = `${FileSystem.documentDirectory ?? ''}history`;
const HISTORY_FALLBACK_PREFIX = 'cardamageanalyzer.history.';
const MAX_HISTORY_ITEMS = 200;

let memoryHistory: Record<string, string> = {};

export type AnalysisHistoryPhoto = {
  uri: string;
  fileName?: string | null;
};

export type AnalysisHistoryItem = {
  id: string;
  createdAt: string;
  userEmail: string;
  vehicleLabel: string;
  summary: string;
  damagedZones: string[];
  totalAmount: string;
  currency: string;
  photos: AnalysisHistoryPhoto[];
  lineItems: DamageAnalysis['lineItems'];
};

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function getFallbackKey(email: string) {
  return `${HISTORY_FALLBACK_PREFIX}${normalizeEmail(email)}`;
}

function getHistoryFileUri(email: string) {
  const normalizedEmail = normalizeEmail(email);
  const safeName = normalizedEmail.replace(/[^a-z0-9._-]/gi, '_');
  return `${HISTORY_DIRECTORY}/${safeName}.json`;
}

async function safeGetSecureItem(key: string): Promise<string | null> {
  try {
    return await SecureStore.getItemAsync(key);
  } catch {
    return memoryHistory[key] ?? null;
  }
}

async function safeSetSecureItem(key: string, value: string) {
  try {
    await SecureStore.setItemAsync(key, value);
  } catch {
    memoryHistory[key] = value;
  }
}

async function ensureHistoryDirectory() {
  if (!FileSystem.documentDirectory) {
    return false;
  }

  const info = await FileSystem.getInfoAsync(HISTORY_DIRECTORY);
  if (!info.exists) {
    await FileSystem.makeDirectoryAsync(HISTORY_DIRECTORY, { intermediates: true });
  }

  return true;
}

async function readHistoryRaw(email: string): Promise<string | null> {
  try {
    const hasDirectory = await ensureHistoryDirectory();

    if (hasDirectory) {
      const fileUri = getHistoryFileUri(email);
      const info = await FileSystem.getInfoAsync(fileUri);

      if (info.exists && !info.isDirectory) {
        return await FileSystem.readAsStringAsync(fileUri);
      }
    }
  } catch {
    // Fall back to other storage layers below.
  }

  const fallbackKey = getFallbackKey(email);
  return await safeGetSecureItem(fallbackKey);
}

async function writeHistoryRaw(email: string, value: string) {
  let wroteToFile = false;

  try {
    const hasDirectory = await ensureHistoryDirectory();

    if (hasDirectory) {
      const fileUri = getHistoryFileUri(email);
      await FileSystem.writeAsStringAsync(fileUri, value);
      wroteToFile = true;
    }
  } catch {
    wroteToFile = false;
  }

  await safeSetSecureItem(getFallbackKey(email), value);

  if (!wroteToFile) {
    memoryHistory[getFallbackKey(email)] = value;
  }
}

export async function getAnalysisHistory(email: string): Promise<AnalysisHistoryItem[]> {
  const raw = await readHistoryRaw(email);
  if (!raw) {
    return [];
  }

  try {
    const parsed = JSON.parse(raw) as AnalysisHistoryItem[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export async function getAnalysisHistoryItem(email: string, id: string) {
  const history = await getAnalysisHistory(email);
  return history.find((item) => item.id === id) ?? null;
}

export async function deleteAnalysisHistoryItem(email: string, id: string) {
  const normalizedEmail = normalizeEmail(email);
  const currentHistory = await getAnalysisHistory(normalizedEmail);
  const nextHistory = currentHistory.filter((item) => item.id !== id);

  await writeHistoryRaw(normalizedEmail, JSON.stringify(nextHistory));
}

export async function saveAnalysisHistory(params: {
  email: string;
  analysis: DamageAnalysis;
  photos: AnalysisHistoryPhoto[];
}) {
  const { email, analysis, photos } = params;
  const normalizedEmail = normalizeEmail(email);
  const currentHistory = await getAnalysisHistory(normalizedEmail);

  const nextItem: AnalysisHistoryItem = {
    id: `${Date.now()}`,
    createdAt: new Date().toISOString(),
    userEmail: normalizedEmail,
    vehicleLabel: analysis.vehicle.makeModel,
    summary: analysis.damageSummary,
    damagedZones: analysis.damagedZones,
    totalAmount: analysis.estimatedCost.amount,
    currency: analysis.estimatedCost.currency,
    photos,
    lineItems: analysis.lineItems,
  };

  const nextHistory = [nextItem, ...currentHistory].slice(0, MAX_HISTORY_ITEMS);
  await writeHistoryRaw(normalizedEmail, JSON.stringify(nextHistory));
}

## lib/openai.ts

import {
  calculateLineItemPrices,
  getOperationLabel,
  getPartLabel,
  normalizeOperationCode,
  normalizePartCode,
} from '@/lib/pricing';

const OPENAI_API_URL = 'https://api.openai.com/v1/responses';
const DEFAULT_MODEL = 'gpt-5-mini';

type AiLineItem = {
  part?: string;
  zone?: string;
  damage?: string;
  operation?: string;
  note?: string;
};

type AiValidation = {
  hasVehicle?: boolean;
  error?: string;
};

export type EstimateLineItem = {
  part: string;
  zone: string;
  damage: string;
  work: string;
  partPrice: string;
  laborPrice: string;
  currency: string;
  note: string;
};

export type DamageAnalysis = {
  validation: {
    hasVehicle: boolean;
    error: string;
  };
  vehicle: {
    makeModel: string;
    source: 'user_input' | 'ai_estimated';
    confidence: 'high' | 'medium' | 'low';
  };
  damagedZones: string[];
  damageSummary: string;
  repairActions: string[];
  lineItems: EstimateLineItem[];
  estimatedCost: {
    amount: string;
    currency: string;
    note: string;
  };
};

type AnalyzePhotoParams = {
  photos: Array<{
    base64Data: string;
    mimeType: string;
  }>;
  vehicleModelInput?: string;
};

function buildPrompt(vehicleModelInput?: string) {
  const modelHint = vehicleModelInput?.trim()
    ? `Користувач вказав авто: ${vehicleModelInput.trim()}. Використай це як основний контекст для визначення деталей.`
    : 'Користувач не вказав авто. Спробуй самостійно визначити марку, модель і приблизний рік по фото. Якщо не впевнений, знизь confidence.';

  return [
    'Проаналізуй фото пошкодженого автомобіля українською мовою.',
    modelHint,
    'Поверни тільки JSON без жодного тексту поза JSON.',
    'Важливо: не вигадуй ціни. Ціни рахує окремий локальний прайс-модуль, не ти.',
    'Спочатку перевір, чи на фото взагалі є автомобіль.',
    'Якщо автомобіля немає, або він нечитабельний, поверни hasVehicle=false і коротку помилку.',
    'Якщо автомобіль є, поверни hasVehicle=true і заповни решту структури.',
    'Тобі треба:',
    '1. Визначити авто або використати введені дані користувача.',
    '2. Визначити пошкоджені зони.',
    '3. Коротко описати характер пошкодження.',
    '4. Скласти список робіт для ремонту.',
    '5. Для кожної пошкодженої деталі повернути назву деталі, зону, характер пошкодження, тип операції та примітку.',
    'Допустимі типи операції:',
    'replace, repair, paint, replace_and_paint, repair_and_paint, calibration, diagnostics, straightening',
    'JSON формат:',
    '{',
    '  "validation": {',
    '    "hasVehicle": true,',
    '    "error": "string"',
    '  },',
    '  "vehicle": {',
    '    "makeModel": "string",',
    '    "source": "user_input | ai_estimated",',
    '    "confidence": "high | medium | low"',
    '  },',
    '  "damagedZones": ["string"],',
    '  "damageSummary": "string",',
    '  "repairActions": ["string"],',
    '  "lineItems": [',
    '    {',
    '      "part": "string",',
    '      "zone": "string",',
    '      "damage": "string",',
    '      "operation": "string from allowed list",',
    '      "note": "string"',
    '    }',
    '  ]',
    '}',
  ].join('\n');
}

function normalizeLineItems(items: unknown, vehicle: string): EstimateLineItem[] {
  if (!Array.isArray(items)) {
    return [];
  }

  return items
    .map((item) => {
      const value = item as AiLineItem;
      const partCode = normalizePartCode(value.part);
      if (partCode === 'unknown_part') {
        return null;
      }
      const operationCode = normalizeOperationCode(value.operation);
      const pricing = calculateLineItemPrices({
        partCode,
        operationCode,
        vehicle,
      });

      return {
        part: getPartLabel(partCode, value.part?.trim()),
        zone: value.zone?.trim() || 'Не вказано',
        damage: value.damage?.trim() || 'Не вказано',
        work: getOperationLabel(operationCode),
        partPrice: pricing.partPrice,
        laborPrice: pricing.laborPrice,
        currency: pricing.currency,
        note: value.note?.trim() || 'Ціну розраховано з локального довідника, не з AI.',
      };
    })
    .filter((item): item is EstimateLineItem => Boolean(item && item.part && item.work));
}

function sumLineItems(lineItems: EstimateLineItem[]) {
  const total = lineItems.reduce((sum, item) => {
    const part = Number(item.partPrice) || 0;
    const labor = Number(item.laborPrice) || 0;
    return sum + part + labor;
  }, 0);

  return String(total);
}

export async function analyzeCarDamagePhotos({
  photos,
  vehicleModelInput,
}: AnalyzePhotoParams): Promise<DamageAnalysis> {
  const apiKey = process.env.EXPO_PUBLIC_OPENAI_API_KEY;
  const model = process.env.EXPO_PUBLIC_OPENAI_MODEL || DEFAULT_MODEL;

  if (!apiKey) {
    throw new Error(
      'Не знайдено API ключ. Відкрий файл .env у корені проєкту і додай EXPO_PUBLIC_OPENAI_API_KEY.'
    );
  }

  if (!photos.length) {
    throw new Error('Не додано жодного фото для аналізу.');
  }

  const response = await fetch(OPENAI_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      text: {
        format: {
          type: 'json_object',
        },
      },
      input: [
        {
          role: 'user',
          content: [
            {
              type: 'input_text',
              text: buildPrompt(vehicleModelInput),
            },
            ...photos.map((photo) => ({
              type: 'input_image' as const,
              image_url: `data:${photo.mimeType};base64,${photo.base64Data}`,
              detail: 'high' as const,
            })),
          ],
        },
      ],
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();

    try {
      const parsed = JSON.parse(errorText) as {
        error?: {
          code?: string;
          message?: string;
        };
      };

      if (parsed.error?.code === 'insufficient_quota') {
        throw new Error(
          'У акаунті OpenAI немає доступних API credits або вичерпано ліміт. Додай баланс у Platform Billing.'
        );
      }

      if (parsed.error?.code === 'invalid_value') {
        throw new Error(
          'OpenAI не зміг прочитати це зображення. Спробуй інше фото або JPEG/PNG нормальної якості.'
        );
      }

      if (parsed.error?.message) {
        throw new Error(parsed.error.message);
      }
    } catch (parseError) {
      if (parseError instanceof Error) {
        throw parseError;
      }
    }

    throw new Error(errorText || 'OpenAI API повернув помилку.');
  }

  const data = (await response.json()) as {
    output_text?: string;
    output?: Array<{
      content?: Array<{
        type?: string;
        text?: string;
      }>;
    }>;
  };

  const rawText =
    (typeof data.output_text === 'string' && data.output_text.trim()) ||
    data.output
      ?.flatMap((item) => item.content ?? [])
      .filter((item) => item.type === 'output_text' && typeof item.text === 'string')
      .map((item) => item.text?.trim())
      .filter(Boolean)
      .join('\n\n');

  if (!rawText) {
    throw new Error('Модель не повернула текстовий результат.');
  }

  let parsedAnalysis: unknown;

  try {
    parsedAnalysis = JSON.parse(rawText);
  } catch {
    throw new Error('AI повернув неструктурований результат. Спробуй ще раз.');
  }

  const analysis = parsedAnalysis as {
    validation?: AiValidation;
    vehicle?: DamageAnalysis['vehicle'];
    damagedZones?: string[];
    damageSummary?: string;
    repairActions?: string[];
    lineItems?: AiLineItem[];
  };

  const validation = {
    hasVehicle: Boolean(analysis.validation?.hasVehicle),
    error:
      analysis.validation?.error?.trim() ||
      'На фото не вдалося надійно визначити автомобіль. Спробуй перефотографувати.',
  };

  if (!validation.hasVehicle) {
    throw new Error(validation.error);
  }

  const resolvedVehicle =
    analysis.vehicle?.makeModel?.trim() || vehicleModelInput?.trim() || 'Не визначено';
  const lineItems = normalizeLineItems(analysis.lineItems, resolvedVehicle);

  return {
    validation,
    vehicle: {
      makeModel: resolvedVehicle,
      source:
        analysis.vehicle?.source === 'user_input' || analysis.vehicle?.source === 'ai_estimated'
          ? analysis.vehicle.source
          : vehicleModelInput?.trim()
            ? 'user_input'
            : 'ai_estimated',
      confidence:
        analysis.vehicle?.confidence === 'high' ||
        analysis.vehicle?.confidence === 'medium' ||
        analysis.vehicle?.confidence === 'low'
          ? analysis.vehicle.confidence
          : vehicleModelInput?.trim()
            ? 'high'
            : 'low',
    },
    damagedZones:
      analysis.damagedZones?.filter((item): item is string => typeof item === 'string') ?? [],
    damageSummary: analysis.damageSummary?.trim() || 'AI не зміг коротко описати пошкодження.',
    repairActions:
      analysis.repairActions?.filter((item): item is string => typeof item === 'string') ?? [],
    lineItems,
    estimatedCost: {
      amount: sumLineItems(lineItems),
      currency: 'UAH',
      note: 'Сума розрахована локально за довідником деталей і робіт. Це орієнтир, а не прайс з магазину.',
    },
  };
}

export async function analyzeCarDamagePhoto(params: {
  base64Data: string;
  mimeType: string;
  vehicleModelInput?: string;
}) {
  return analyzeCarDamagePhotos({
    photos: [
      {
        base64Data: params.base64Data,
        mimeType: params.mimeType,
      },
    ],
    vehicleModelInput: params.vehicleModelInput,
  });
}

export function getOpenAISetupState() {
  return {
    hasApiKey: Boolean(process.env.EXPO_PUBLIC_OPENAI_API_KEY),
    model: process.env.EXPO_PUBLIC_OPENAI_MODEL || DEFAULT_MODEL,
  };
}

## lib/pricing.ts

import {
  OPERATIONS,
  PARTS,
  type CatalogPart,
  type OperationCode,
  type PartCode,
} from '@/data/pricing-catalog';

export type { OperationCode, PartCode } from '@/data/pricing-catalog';

function getBrandFactor(vehicle: string) {
  const normalized = vehicle.toLowerCase();

  if (
    ['mercedes', 'bmw', 'audi', 'lexus', 'tesla', 'volvo', 'porsche'].some((brand) =>
      normalized.includes(brand)
    )
  ) {
    return 1.22;
  }

  if (['toyota', 'volkswagen', 'mazda', 'honda', 'subaru', 'ford', 'nissan'].some((brand) =>
    normalized.includes(brand)
  )) {
    return 1.05;
  }

  if (['renault', 'skoda', 'hyundai', 'kia', 'chevrolet', 'mitsubishi'].some((brand) =>
    normalized.includes(brand)
  )) {
    return 0.98;
  }

  return 1;
}

function getYearFactor(vehicle: string) {
  const match = vehicle.match(/\b(19|20)\d{2}\b/);
  const year = match ? Number(match[0]) : 0;

  if (year >= 2022) return 1.15;
  if (year >= 2018) return 1.08;
  if (year >= 2013) return 1;
  if (year >= 2008) return 0.92;
  return 0.85;
}

function roundMoney(value: number) {
  return Math.round(value / 50) * 50;
}

export function normalizePartCode(input?: string): PartCode {
  const text = input?.trim().toLowerCase() || '';

  const directMatch = (Object.keys(PARTS) as PartCode[]).find((partCode) => text === partCode);
  if (directMatch) {
    return directMatch;
  }

  const entry = (Object.entries(PARTS) as Array<[PartCode, CatalogPart]>).find(([, part]) =>
    part.aliases.some((alias) => text.includes(alias))
  );

  return entry?.[0] ?? 'unknown_part';
}

export function normalizeOperationCode(input?: string): OperationCode {
  const text = input?.trim().toLowerCase() || '';

  if (text.includes('replace') && text.includes('paint')) return 'replace_and_paint';
  if (text.includes('repair') && text.includes('paint')) return 'repair_and_paint';
  if (text.includes('замі') && text.includes('фарб')) return 'replace_and_paint';
  if (text.includes('ремонт') && text.includes('фарб')) return 'repair_and_paint';
  if (text.includes('фарб')) return 'paint';
  if (text.includes('калібр') || text.includes('calibr')) return 'calibration';
  if (text.includes('діагност') || text.includes('diagnost')) return 'diagnostics';
  if (text.includes('рихту') || text.includes('straight')) return 'straightening';
  if (text.includes('замі') || text.includes('replace')) return 'replace';
  if (text.includes('ремонт') || text.includes('repair')) return 'repair';

  return 'repair';
}

export function getPartLabel(partCode: PartCode, fallback?: string) {
  return PARTS[partCode].label || fallback || 'Невідома деталь';
}

export function getOperationLabel(operationCode: OperationCode) {
  return OPERATIONS[operationCode].label;
}

export function calculateLineItemPrices(params: {
  partCode: PartCode;
  operationCode: OperationCode;
  vehicle: string;
}) {
  const { partCode, operationCode, vehicle } = params;
  const part = PARTS[partCode];
  const operation = OPERATIONS[operationCode];
  const multiplier = getBrandFactor(vehicle) * getYearFactor(vehicle);

  const rawPartPrice =
    operationCode === 'replace' || operationCode === 'replace_and_paint'
      ? part.basePrice * multiplier
      : operation.materialPrice;

  const rawLaborPrice = operation.laborPrice * multiplier;

  return {
    partPrice: String(roundMoney(rawPartPrice)),
    laborPrice: String(roundMoney(rawLaborPrice)),
    currency: 'UAH',
  };
}


import { Link, Redirect, router } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { uiPalette } from '@/constants/ui-palette';
import { useAuth } from '@/context/auth-context';

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
        <View style={styles.header}>
          <ThemedText type="title" style={styles.title}>
            Створити акаунт
          </ThemedText>
          <ThemedText style={styles.subtitle}>
            Акаунт зберігається локально на цьому пристрої й відкриває доступ до історії звітів.
          </ThemedText>
        </View>

        <View style={styles.formCard}>
          <View style={styles.fieldGroup}>
            <ThemedText style={styles.label}>Ім&apos;я</ThemedText>
            <TextInput
              value={name}
              onChangeText={setName}
              placeholder="Як до тебе звертатися"
              placeholderTextColor={uiPalette.textSoft}
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
              placeholderTextColor={uiPalette.textSoft}
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
              placeholderTextColor={uiPalette.textSoft}
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
              placeholderTextColor={uiPalette.textSoft}
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
    backgroundColor: uiPalette.background,
  },
  content: {
    flexGrow: 1,
    paddingHorizontal: 16,
    paddingTop: 24,
    paddingBottom: 32,
    gap: 16,
    justifyContent: 'center',
  },
  header: {
    gap: 8,
  },
  title: {
    color: uiPalette.text,
    fontSize: 34,
    lineHeight: 38,
  },
  subtitle: {
    color: uiPalette.textMuted,
    lineHeight: 22,
  },
  formCard: {
    backgroundColor: uiPalette.surface,
    borderRadius: 24,
    padding: 18,
    gap: 14,
    borderWidth: 1,
    borderColor: uiPalette.border,
    shadowColor: uiPalette.primary,
    shadowOpacity: 0.1,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
  },
  fieldGroup: {
    gap: 8,
  },
  label: {
    color: uiPalette.textMuted,
    fontSize: 13,
    textTransform: 'uppercase',
    letterSpacing: 0.9,
  },
  input: {
    minHeight: 56,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: uiPalette.borderStrong,
    backgroundColor: uiPalette.surfaceMuted,
    paddingHorizontal: 16,
    fontSize: 16,
    color: uiPalette.text,
  },
  errorText: {
    color: uiPalette.danger,
    lineHeight: 21,
  },
  primaryButton: {
    minHeight: 58,
    borderRadius: 18,
    backgroundColor: uiPalette.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: uiPalette.primary,
    shadowOpacity: 0.2,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
  },
  primaryButtonText: {
    color: uiPalette.dark,
    fontWeight: '700',
    fontSize: 16,
  },
  secondaryButton: {
    minHeight: 54,
    borderRadius: 18,
    backgroundColor: uiPalette.surfaceMuted,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: uiPalette.borderStrong,
  },
  secondaryButtonText: {
    color: uiPalette.text,
    fontWeight: '700',
    fontSize: 15,
  },
});

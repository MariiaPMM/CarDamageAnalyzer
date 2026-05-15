import { router } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { uiPalette } from '@/constants/ui-palette';
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
        <View style={styles.header}>
          <View style={styles.profileOrb}>
            <ThemedText style={styles.profileInitial}>
              {(session?.name || session?.email || 'A').trim().charAt(0).toUpperCase()}
            </ThemedText>
          </View>
          <View style={styles.heroTextWrap}>
            <ThemedText type="title" style={styles.title}>
              Профіль
            </ThemedText>
            <ThemedText style={styles.subtitle}>
              Особистий кабінет поточного акаунта з локальною історією аналізів.
            </ThemedText>
          </View>
        </View>

        <View style={styles.card}>
          <ThemedText style={styles.cardLabel}>Користувач</ThemedText>
          <ThemedText style={styles.cardValue}>{session?.name || 'Без імені'}</ThemedText>
          <ThemedText style={styles.cardNote}>{session?.email || '-'}</ThemedText>
        </View>

        <View style={styles.noteCard}>
          <ThemedText style={styles.noteTitle}>Про цей режим</ThemedText>
          <ThemedText style={styles.noteText}>
            Для цього MVP акаунт і сесія зберігаються локально на пристрої, а історія аналізів доступна у сусідній вкладці.
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
    backgroundColor: uiPalette.background,
  },
  content: {
    paddingHorizontal: 16,
    paddingTop: 22,
    paddingBottom: 120,
    gap: 16,
  },
  header: {
    gap: 14,
  },
  profileOrb: {
    width: 92,
    height: 92,
    borderRadius: 46,
    backgroundColor: uiPalette.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: uiPalette.primary,
    shadowOpacity: 0.12,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
  },
  profileInitial: {
    color: uiPalette.primaryPressed,
    fontSize: 34,
    lineHeight: 34,
    fontWeight: '700',
  },
  heroTextWrap: {
    gap: 8,
  },
  title: {
    color: uiPalette.text,
    fontSize: 32,
    lineHeight: 36,
  },
  subtitle: {
    color: uiPalette.textMuted,
    lineHeight: 22,
  },
  card: {
    borderRadius: 24,
    padding: 20,
    backgroundColor: uiPalette.surface,
    borderWidth: 1,
    borderColor: uiPalette.border,
    gap: 6,
    shadowColor: uiPalette.primary,
    shadowOpacity: 0.08,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
  },
  cardLabel: {
    color: uiPalette.textMuted,
    fontSize: 12,
    textTransform: 'uppercase',
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  cardValue: {
    color: uiPalette.text,
    fontSize: 24,
    lineHeight: 28,
    fontWeight: '700',
  },
  cardNote: {
    color: uiPalette.textMuted,
    lineHeight: 22,
  },
  noteCard: {
    borderRadius: 24,
    padding: 20,
    backgroundColor: uiPalette.surface,
    borderWidth: 1,
    borderColor: uiPalette.border,
    gap: 10,
    shadowColor: uiPalette.primary,
    shadowOpacity: 0.08,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
  },
  noteTitle: {
    color: uiPalette.text,
    fontSize: 20,
    fontWeight: '700',
  },
  noteText: {
    color: uiPalette.textMuted,
    lineHeight: 22,
  },
  logoutButton: {
    minHeight: 58,
    borderRadius: 18,
    backgroundColor: uiPalette.surfaceMuted,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: uiPalette.border,
  },
  logoutButtonText: {
    color: uiPalette.text,
    fontWeight: '700',
    fontSize: 16,
  },
});

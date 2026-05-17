import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { uiPalette } from '@/constants/ui-palette';
import { useAuth } from '@/context/auth-context';

const PROFILE_FEATURES = [
  { icon: 'history', label: 'Локальна\nісторія' },
  { icon: 'shield', label: 'Конфіденційність\nданих' },
  { icon: 'bolt', label: 'Швидкий\nдоступ' },
] as const;

function getAvatarStorageKey(email?: string) {
  return `cardamageanalyzer.profile.avatar.${email?.trim().toLowerCase() ?? 'guest'}`;
}

export default function ProfileScreen() {
  const { session, logout } = useAuth();
  const [avatarUri, setAvatarUri] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function loadAvatar() {
      try {
        const storedValue = await SecureStore.getItemAsync(getAvatarStorageKey(session?.email));
        if (isMounted) {
          setAvatarUri(storedValue ?? null);
        }
      } catch {
        if (isMounted) {
          setAvatarUri(null);
        }
      }
    }

    void loadAvatar();

    return () => {
      isMounted = false;
    };
  }, [session?.email]);

  async function handleLogout() {
    await logout();
    router.replace('/login');
  }

  async function handlePickAvatar() {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permission.granted) {
      return;
    }

    const pickerResult = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.9,
      selectionLimit: 1,
    });

    if (pickerResult.canceled || !pickerResult.assets.length) {
      return;
    }

    const nextUri = pickerResult.assets[0]?.uri;
    if (!nextUri) {
      return;
    }

    setAvatarUri(nextUri);

    try {
      await SecureStore.setItemAsync(getAvatarStorageKey(session?.email), nextUri);
    } catch {
      // Avatar remains in memory for the current session even if persistence fails.
    }
  }

  const initial = useMemo(
    () => (session?.name || session?.email || 'A').trim().charAt(0).toUpperCase(),
    [session?.email, session?.name],
  );

  return (
    <SafeAreaView style={styles.screen} edges={['left', 'right']}>
      <LinearGradient
        colors={['#061028', '#0B1C4D', '#0B1742', '#08112C']}
        locations={[0, 0.28, 0.68, 1]}
        start={{ x: 0, y: 0.04 }}
        end={{ x: 1, y: 1 }}
        style={styles.backgroundGradient}
      />
      <View style={styles.glowOne} />
      <View style={styles.glowTwo} />

      <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
        <View style={styles.headerRow}>
          <ThemedText type="title" style={styles.title}>
            Профіль
          </ThemedText>
        </View>

        <View style={styles.orbitWrap}>
          <View style={styles.orbitGlow} />
          <View style={styles.orbitOuter} />
          <View style={styles.orbitMiddle} />
          <View style={styles.profileOrb}>
            {avatarUri ? (
              <Image source={{ uri: avatarUri }} style={styles.avatarImage} contentFit="cover" />
            ) : (
              <ThemedText style={styles.profileInitial}>{initial}</ThemedText>
            )}
          </View>
          <Pressable style={styles.editBadge} onPress={handlePickAvatar}>
            <MaterialIcons name="edit" size={15} color={uiPalette.primaryPressed} />
          </Pressable>
        </View>

        <View style={styles.card}>
          <ThemedText style={styles.cardLabel}>КОРИСТУВАЧ</ThemedText>
          <ThemedText style={styles.cardValue}>{session?.name || 'Марія'}</ThemedText>
          <ThemedText style={styles.cardNote}>{session?.email || '-'}</ThemedText>
        </View>

        <View style={styles.card}>
          <ThemedText style={styles.cardTitle}>Про цей режим</ThemedText>
          <ThemedText style={styles.cardNote}>
            Для цього MVP акаунт і сесія зберігаються локально на пристрої, а історія аналізів
            доступна у сусідній вкладці.
          </ThemedText>

          <View style={styles.featureGrid}>
            {PROFILE_FEATURES.map((item) => (
              <View key={item.label} style={styles.featureCard}>
                <View style={styles.featureIconWrap}>
                  <MaterialIcons name={item.icon} size={20} color={uiPalette.primaryPressed} />
                </View>
                <ThemedText style={styles.featureText}>{item.label}</ThemedText>
              </View>
            ))}
          </View>
        </View>

        <Pressable onPress={handleLogout} style={styles.logoutButton}>
          <MaterialIcons name="logout" size={18} color="#FF7A8F" />
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
  backgroundGradient: {
    ...StyleSheet.absoluteFillObject,
  },
  glowOne: {
    position: 'absolute',
    top: 80,
    right: -30,
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: 'rgba(67, 157, 255, 0.24)',
  },
  glowTwo: {
    position: 'absolute',
    top: 220,
    left: 60,
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: 'rgba(78, 208, 255, 0.16)',
  },
  content: {
    paddingHorizontal: 18,
    paddingTop: 18,
    paddingBottom: 120,
    gap: 18,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  title: {
    color: uiPalette.text,
    fontSize: 33,
    lineHeight: 38,
  },
  orbitWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    height: 208,
    marginBottom: 8,
  },
  orbitGlow: {
    position: 'absolute',
    width: 188,
    height: 84,
    borderRadius: 999,
    backgroundColor: 'rgba(68, 154, 255, 0.24)',
  },
  orbitOuter: {
    position: 'absolute',
    width: 156,
    height: 156,
    borderRadius: 78,
    borderWidth: 1,
    borderColor: 'rgba(79, 149, 255, 0.18)',
  },
  orbitMiddle: {
    position: 'absolute',
    width: 124,
    height: 124,
    borderRadius: 62,
    borderWidth: 1,
    borderColor: 'rgba(79, 149, 255, 0.32)',
  },
  profileOrb: {
    width: 98,
    height: 98,
    borderRadius: 49,
    backgroundColor: 'rgba(23, 36, 79, 0.88)',
    borderWidth: 1,
    borderColor: 'rgba(113, 211, 255, 0.42)',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    shadowColor: '#4EA5FF',
    shadowOpacity: 0.32,
    shadowRadius: 26,
    shadowOffset: { width: 0, height: 0 },
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  profileInitial: {
    color: uiPalette.text,
    fontSize: 38,
    lineHeight: 40,
    fontWeight: '700',
  },
  editBadge: {
    position: 'absolute',
    right: '29%',
    bottom: 38,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(15, 29, 65, 0.94)',
    borderWidth: 1,
    borderColor: uiPalette.borderStrong,
    alignItems: 'center',
    justifyContent: 'center',
  },
  card: {
    borderRadius: 26,
    padding: 20,
    backgroundColor: 'rgba(20, 34, 76, 0.76)',
    borderWidth: 1,
    borderColor: 'rgba(164, 207, 255, 0.14)',
    gap: 8,
    shadowColor: '#08112C',
    shadowOpacity: 0.18,
    shadowRadius: 22,
    shadowOffset: { width: 0, height: 12 },
  },
  cardLabel: {
    color: uiPalette.textMuted,
    fontSize: 11,
    textTransform: 'uppercase',
    fontWeight: '700',
    letterSpacing: 0.9,
  },
  cardTitle: {
    color: uiPalette.text,
    fontSize: 18,
    fontWeight: '700',
  },
  cardValue: {
    color: uiPalette.text,
    fontSize: 21,
    lineHeight: 25,
    fontWeight: '700',
  },
  cardNote: {
    color: uiPalette.textMuted,
    lineHeight: 23,
  },
  featureGrid: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 10,
  },
  featureCard: {
    flex: 1,
    minHeight: 126,
    borderRadius: 20,
    padding: 14,
    backgroundColor: 'rgba(16, 28, 64, 0.86)',
    borderWidth: 1,
    borderColor: 'rgba(164, 207, 255, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  featureIconWrap: {
    width: 46,
    height: 46,
    borderRadius: 18,
    backgroundColor: 'rgba(31, 53, 114, 0.72)',
    borderWidth: 1,
    borderColor: uiPalette.borderStrong,
    alignItems: 'center',
    justifyContent: 'center',
  },
  featureText: {
    color: uiPalette.textMuted,
    fontSize: 12,
    lineHeight: 17,
    textAlign: 'center',
  },
  logoutButton: {
    minHeight: 60,
    borderRadius: 20,
    backgroundColor: 'rgba(56, 21, 33, 0.58)',
    borderWidth: 1,
    borderColor: 'rgba(255, 122, 143, 0.62)',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 10,
  },
  logoutButtonText: {
    color: '#FF7A8F',
    fontWeight: '700',
    fontSize: 16,
  },
});

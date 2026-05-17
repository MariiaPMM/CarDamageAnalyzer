import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useIsFocused } from '@react-navigation/native';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { useAuth } from '@/context/auth-context';
import {
  deleteAnalysisHistoryItem,
  getAnalysisHistory,
  type AnalysisHistoryItem,
} from '@/lib/history';

const COLORS = {
  screenTop: '#050D1F',
  screenMid: '#07142E',
  screenBottom: '#081733',
  cardBg: '#132653',
  cardBorder: '#263F73',
  blockBg: '#0E1F45',
  blockBorder: '#263F73',
  imageFallback: '#183468',
  imageBg: '#0B1A35',
  primaryText: '#F5F8FF',
  secondaryText: '#C6D2E8',
  mutedText: '#8EA1C4',
  accentBlue: '#2F8CFF',
  lightBlue: '#6DDCFF',
  success: '#20C777',
} as const;

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
  const insets = useSafeAreaInsets();
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
      void loadHistory();
    }

    return () => {
      isMounted = false;
    };
  }, [isFocused, session?.email]);

  function openReport(itemId: string) {
    router.push(`/history-report/${itemId}`);
  }

  async function handleDelete(item: AnalysisHistoryItem) {
    if (!session?.email) {
      return;
    }

    await deleteAnalysisHistoryItem(session.email, item.id);
    setHistory((current) => current.filter((entry) => entry.id !== item.id));
  }

  function openItemMenu(item: AnalysisHistoryItem) {
    Alert.alert(item.vehicleLabel, 'Оберіть дію для цього звіту.', [
      { text: 'Скасувати', style: 'cancel' },
      {
        text: 'Видалити',
        style: 'destructive',
        onPress: () => {
          void handleDelete(item);
        },
      },
    ]);
  }

  return (
    <SafeAreaView style={styles.screen} edges={['left', 'right']}>
      <StatusBar style="light" translucent backgroundColor="transparent" />
      <LinearGradient
        colors={[COLORS.screenTop, COLORS.screenMid, COLORS.screenBottom]}
        locations={[0, 0.42, 1]}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={styles.background}
      />

      <ScrollView
        style={styles.screen}
        contentContainerStyle={[styles.content, { paddingTop: insets.top + 18 }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.headerRow}>
          <View style={styles.headerTitleWrap}>
            <MaterialIcons name="history" size={23} color={COLORS.primaryText} />
            <ThemedText type="title" style={styles.headerTitle}>
              Історія
            </ThemedText>
          </View>
          <Pressable style={styles.filterButton}>
            <MaterialIcons name="filter-list" size={22} color={COLORS.primaryText} />
          </Pressable>
        </View>

        {isHistoryLoading ? (
          <View style={styles.stateCard}>
            <ThemedText style={styles.stateText}>Завантаження історії...</ThemedText>
          </View>
        ) : history.length ? (
          history.map((item) => (
            <Pressable key={item.id} onPress={() => openReport(item.id)} style={styles.card}>
              <View style={styles.topRow}>
                <View style={styles.imageGlow} />
                {item.photos[0]?.uri ? (
                  <Image source={{ uri: item.photos[0].uri }} style={styles.carImage} contentFit="cover" />
                ) : (
                  <View style={styles.carImageFallback}>
                    <MaterialIcons name="directions-car" size={24} color={COLORS.lightBlue} />
                  </View>
                )}

                <View style={styles.metaColumn}>
                  <ThemedText style={styles.vehicleTitle} numberOfLines={2}>
                    {item.vehicleLabel}
                  </ThemedText>
                </View>

                <Pressable
                  onPress={(event) => {
                    event.stopPropagation();
                    openItemMenu(item);
                  }}
                  style={styles.moreButton}
                >
                  <MaterialIcons name="more-vert" size={20} color={COLORS.primaryText} />
                </Pressable>
              </View>

              <View style={styles.metaRow}>
                <ThemedText style={styles.dateText}>{formatDate(item.createdAt)}</ThemedText>
                <ThemedText style={styles.priceText}>{item.totalAmount} грн</ThemedText>
              </View>

              <View style={styles.infoRow}>
                <View style={styles.infoBlock}>
                  <View style={styles.infoInline}>
                    <MaterialIcons name="directions-car" size={16} color={COLORS.accentBlue} />
                    <ThemedText style={styles.infoInlineLabel}>ЗОН {item.damagedZones.length}</ThemedText>
                  </View>
                </View>

                <View style={styles.infoBlock}>
                  <ThemedText style={styles.statusLabel}>СТАТУС</ThemedText>
                  <View style={styles.statusRow}>
                    <View style={styles.statusDot} />
                    <ThemedText style={styles.statusValue}>Готово</ThemedText>
                  </View>
                </View>
              </View>
            </Pressable>
          ))
        ) : (
          <View style={styles.stateCard}>
            <ThemedText style={styles.stateTitle}>Історія порожня</ThemedText>
            <ThemedText style={styles.stateText}>Після першого аналізу тут з’являться збережені звіти.</ThemedText>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: COLORS.screenMid,
  },
  background: {
    ...StyleSheet.absoluteFillObject,
  },
  content: {
    paddingHorizontal: 22,
    paddingBottom: 120,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 18,
  },
  headerTitleWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  headerTitle: {
    color: COLORS.primaryText,
    fontSize: 18,
    lineHeight: 24,
  },
  filterButton: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  card: {
    backgroundColor: COLORS.cardBg,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    borderRadius: 24,
    paddingHorizontal: 14,
    paddingVertical: 14,
    marginBottom: 16,
    shadowColor: '#000000',
    shadowOpacity: 0.28,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  imageGlow: {
    position: 'absolute',
    left: -2,
    top: -4,
    width: 90,
    height: 66,
    borderRadius: 18,
    backgroundColor: 'rgba(47, 140, 255, 0.14)',
  },
  carImage: {
    width: 76,
    height: 58,
    borderRadius: 14,
    backgroundColor: COLORS.imageBg,
  },
  carImageFallback: {
    width: 76,
    height: 58,
    borderRadius: 14,
    backgroundColor: COLORS.imageFallback,
    alignItems: 'center',
    justifyContent: 'center',
  },
  metaColumn: {
    flex: 1,
    marginLeft: 14,
    paddingTop: 2,
    paddingRight: 8,
  },
  vehicleTitle: {
    color: COLORS.primaryText,
    fontSize: 18,
    fontWeight: '700',
    lineHeight: 22,
  },
  moreButton: {
    width: 30,
    height: 30,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  metaRow: {
    marginTop: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dateText: {
    color: COLORS.mutedText,
    fontSize: 13,
    lineHeight: 18,
  },
  priceText: {
    color: COLORS.lightBlue,
    fontSize: 16,
    fontWeight: '700',
    lineHeight: 18,
  },
  infoRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
  },
  infoBlock: {
    flex: 1,
    height: 56,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    backgroundColor: COLORS.blockBg,
    paddingHorizontal: 14,
    justifyContent: 'center',
  },
  infoInline: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  infoInlineLabel: {
    color: COLORS.primaryText,
    fontSize: 15,
    fontWeight: '600',
  },
  statusLabel: {
    color: COLORS.mutedText,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.6,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.success,
    shadowColor: 'rgba(32, 199, 119, 0.6)',
    shadowOpacity: 1,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 0 },
  },
  statusValue: {
    color: COLORS.primaryText,
    fontSize: 15,
    fontWeight: '700',
  },
  stateCard: {
    backgroundColor: COLORS.cardBg,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    borderRadius: 24,
    padding: 20,
    marginTop: 20,
  },
  stateTitle: {
    color: COLORS.primaryText,
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 8,
  },
  stateText: {
    color: COLORS.secondaryText,
    fontSize: 15,
    lineHeight: 21,
  },
});

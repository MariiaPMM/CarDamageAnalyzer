import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { StatusBar } from 'expo-status-bar';
import { useIsFocused } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { uiPalette } from '@/constants/ui-palette';
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

    Alert.alert('Видалити звіт?', `Звіт для ${item.vehicleLabel} буде видалено з історії.`, [
      { text: 'Скасувати', style: 'cancel' },
      {
        text: 'Видалити',
        style: 'destructive',
        onPress: async () => {
          await deleteAnalysisHistoryItem(session.email, item.id);
          setHistory((current) => current.filter((entry) => entry.id !== item.id));
        },
      },
    ]);
  }

  return (
    <SafeAreaView style={styles.screen} edges={['left', 'right']}>
      <StatusBar style="light" translucent backgroundColor="transparent" />
      <LinearGradient
        colors={['#060C23', '#12377C', '#4A8DFF', '#0E1B47']}
        locations={[0, 0.26, 0.64, 1]}
        start={{ x: 0, y: 0.05 }}
        end={{ x: 1, y: 1 }}
        style={styles.backgroundGradient}
      />
      <LinearGradient
        colors={['rgba(196, 238, 255, 0.38)', 'rgba(118, 203, 255, 0.18)', 'rgba(0,0,0,0)']}
        locations={[0, 0.42, 1]}
        start={{ x: 0.08, y: 0.02 }}
        end={{ x: 0.95, y: 0.68 }}
        style={styles.backgroundHighlight}
      />
      <LinearGradient
        colors={['rgba(9, 15, 37, 0)', 'rgba(7, 12, 29, 0.14)', 'rgba(3, 7, 18, 0.34)']}
        locations={[0, 0.58, 1]}
        start={{ x: 0.5, y: 0.18 }}
        end={{ x: 0.5, y: 1 }}
        style={styles.backgroundShade}
      />
      <View style={styles.glowPrimary} />
      <View style={styles.glowSecondary} />
      <View style={styles.glowTertiary} />

      <ScrollView
        style={styles.screen}
        contentContainerStyle={[styles.content, { paddingTop: insets.top + 26 }]}>
        <View style={styles.header}>
          <View style={styles.headerPill}>
            <MaterialIcons name="schedule" size={15} color={uiPalette.primaryPressed} />
            <ThemedText style={styles.headerPillText}>History</ThemedText>
          </View>
          <ThemedText type="title" style={styles.title}>
            Історія аналізів
          </ThemedText>
          <ThemedText style={styles.subtitle}>
            Збережені звіти з коротким підсумком і сумою. Натисни на картку, щоб
            переглянути деталі.
          </ThemedText>
        </View>

        {isHistoryLoading ? (
          <View style={styles.stateCard}>
            <ThemedText style={styles.stateText}>Завантаження історії...</ThemedText>
          </View>
        ) : history.length ? (
          history.map((item) => (
            <Pressable key={item.id} onPress={() => openReport(item.id)} style={styles.reportCard}>
              <LinearGradient
                colors={['rgba(40, 61, 120, 0.72)', 'rgba(21, 33, 72, 0.64)']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.reportGradient}
              >
                <View style={styles.reportTopRow}>
                  <View style={styles.iconBubble}>
                    <MaterialIcons name="description" size={18} color={uiPalette.primaryPressed} />
                  </View>

                  <View style={styles.reportMeta}>
                    <ThemedText style={styles.reportVehicle}>{item.vehicleLabel}</ThemedText>
                    <ThemedText style={styles.reportDate}>{formatDate(item.createdAt)}</ThemedText>
                  </View>

                  <View style={styles.pricePill}>
                    <ThemedText style={styles.pricePillValue}>
                      {item.totalAmount} {item.currency}
                    </ThemedText>
                  </View>
                </View>

                <ThemedText style={styles.reportSummary} numberOfLines={2}>
                  {item.summary}
                </ThemedText>

                <View style={styles.metricsRow}>
                  <View style={styles.metricChip}>
                    <ThemedText style={styles.metricLabel}>Зони</ThemedText>
                    <ThemedText style={styles.metricValue}>{item.damagedZones.length}</ThemedText>
                  </View>

                  <View style={styles.metricChip}>
                    <ThemedText style={styles.metricLabel}>Статус</ThemedText>
                    <ThemedText style={styles.metricValue}>Готово</ThemedText>
                  </View>
                </View>

                <View style={styles.cardFooter}>
                  <View style={styles.viewMoreRow}>
                    <ThemedText style={styles.viewMoreText}>Переглянути звіт</ThemedText>
                    <MaterialIcons name="chevron-right" size={18} color={uiPalette.textMuted} />
                  </View>

                  <Pressable
                    onPress={(event) => {
                      event.stopPropagation();
                      handleDelete(item);
                    }}
                    style={styles.deleteButton}
                  >
                    <MaterialIcons name="delete-outline" size={16} color={uiPalette.textSoft} />
                  </Pressable>
                </View>
              </LinearGradient>
            </Pressable>
          ))
        ) : (
          <View style={styles.stateCard}>
            <ThemedText style={styles.emptyTitle}>Поки що порожньо</ThemedText>
            <ThemedText style={styles.stateText}>
              Після першого успішного аналізу тут з’являться збережені звіти.
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
    backgroundColor: uiPalette.background,
  },
  backgroundGradient: {
    ...StyleSheet.absoluteFillObject,
  },
  backgroundHighlight: {
    ...StyleSheet.absoluteFillObject,
  },
  backgroundShade: {
    ...StyleSheet.absoluteFillObject,
  },
  glowPrimary: {
    position: 'absolute',
    top: -10,
    right: -20,
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: 'rgba(113, 211, 255, 0.28)',
  },
  glowSecondary: {
    position: 'absolute',
    bottom: 72,
    left: -24,
    width: 280,
    height: 280,
    borderRadius: 140,
    backgroundColor: 'rgba(108, 156, 255, 0.2)',
  },
  glowTertiary: {
    position: 'absolute',
    top: 210,
    left: '14%',
    width: 260,
    height: 260,
    borderRadius: 130,
    backgroundColor: 'rgba(134, 228, 255, 0.14)',
  },
  content: {
    paddingHorizontal: 18,
    paddingTop: 26,
    paddingBottom: 120,
    gap: 18,
  },
  header: {
    gap: 10,
  },
  headerPill: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: 'rgba(32, 49, 101, 0.38)',
    borderWidth: 1,
    borderColor: 'rgba(167, 212, 255, 0.14)',
  },
  headerPillText: {
    color: uiPalette.textMuted,
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  title: {
    color: uiPalette.text,
    fontSize: 30,
    lineHeight: 34,
  },
  subtitle: {
    color: uiPalette.textMuted,
    lineHeight: 22,
    maxWidth: 320,
  },
  stateCard: {
    borderRadius: 28,
    padding: 22,
    backgroundColor: 'rgba(24, 37, 77, 0.58)',
    borderWidth: 1,
    borderColor: 'rgba(164, 207, 255, 0.14)',
    gap: 8,
    shadowColor: '#09112A',
    shadowOpacity: 0.16,
    shadowRadius: 22,
    shadowOffset: { width: 0, height: 12 },
  },
  stateText: {
    color: uiPalette.textMuted,
    lineHeight: 22,
  },
  emptyTitle: {
    color: uiPalette.text,
    fontSize: 20,
    fontWeight: '700',
  },
  reportCard: {
    borderRadius: 28,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(170, 214, 255, 0.14)',
    shadowColor: '#07102A',
    shadowOpacity: 0.18,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 12 },
  },
  reportGradient: {
    padding: 18,
    gap: 14,
  },
  reportTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconBubble: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(64, 148, 255, 0.16)',
    borderWidth: 1,
    borderColor: 'rgba(170, 214, 255, 0.14)',
  },
  reportMeta: {
    flex: 1,
    gap: 3,
  },
  reportVehicle: {
    color: uiPalette.text,
    fontSize: 19,
    lineHeight: 23,
    fontWeight: '700',
  },
  reportDate: {
    color: uiPalette.textSoft,
    fontSize: 12,
  },
  pricePill: {
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 16,
    backgroundColor: 'rgba(53, 89, 166, 0.34)',
    borderWidth: 1,
    borderColor: 'rgba(173, 219, 255, 0.14)',
  },
  pricePillValue: {
    color: uiPalette.text,
    fontSize: 13,
    fontWeight: '700',
  },
  reportSummary: {
    color: uiPalette.textMuted,
    lineHeight: 22,
  },
  metricsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  metricChip: {
    flex: 1,
    backgroundColor: 'rgba(26, 40, 82, 0.58)',
    borderRadius: 16,
    padding: 12,
    gap: 4,
    borderWidth: 1,
    borderColor: 'rgba(168, 211, 255, 0.12)',
  },
  metricLabel: {
    color: uiPalette.textSoft,
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  metricValue: {
    color: uiPalette.text,
    fontWeight: '700',
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
  },
  viewMoreRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  viewMoreText: {
    color: uiPalette.textMuted,
    fontSize: 13,
    fontWeight: '600',
  },
  deleteButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(25, 38, 77, 0.52)',
    borderWidth: 1,
    borderColor: 'rgba(167, 210, 255, 0.12)',
  },
});

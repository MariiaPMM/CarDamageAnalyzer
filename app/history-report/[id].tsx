import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { Image } from 'expo-image';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { uiPalette } from '@/constants/ui-palette';
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
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <MaterialIcons name="arrow-back-ios-new" size={18} color={uiPalette.text} />
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

              <View style={styles.estimateNoteCard}>
                <ThemedText style={styles.noteText}>{item.estimateNote}</ThemedText>
              </View>
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
    backgroundColor: uiPalette.background,
  },
  content: {
    paddingHorizontal: 18,
    paddingTop: 12,
    paddingBottom: 32,
    gap: 14,
  },
  backButton: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: uiPalette.surface,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: uiPalette.border,
    marginTop: 8,
  },
  backButtonText: {
    color: uiPalette.text,
    fontWeight: '700',
  },
  card: {
    backgroundColor: uiPalette.surface,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: uiPalette.border,
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
    color: uiPalette.textSoft,
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  title: {
    color: uiPalette.text,
    fontSize: 30,
    lineHeight: 34,
  },
  meta: {
    color: uiPalette.textMuted,
    lineHeight: 21,
  },
  totalValue: {
    color: uiPalette.primary,
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
    borderRadius: 16,
    backgroundColor: uiPalette.photoPlaceholder,
  },
  photoLabel: {
    color: uiPalette.textMuted,
    fontWeight: '600',
  },
  summaryCard: {
    backgroundColor: uiPalette.surfaceMuted,
    borderRadius: 16,
    padding: 16,
  },
  summaryText: {
    color: uiPalette.text,
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
    backgroundColor: uiPalette.primarySoft,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  zoneTagText: {
    color: uiPalette.primary,
    fontWeight: '600',
  },
  estimateBlock: {
    gap: 12,
  },
  sectionTitle: {
    color: uiPalette.text,
    fontSize: 20,
    lineHeight: 24,
    fontWeight: '700',
  },
  lineItemCard: {
    backgroundColor: uiPalette.surfaceMuted,
    borderRadius: 16,
    padding: 14,
    gap: 10,
    borderWidth: 1,
    borderColor: uiPalette.border,
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
    color: uiPalette.text,
    fontSize: 18,
    lineHeight: 22,
    fontWeight: '700',
  },
  lineItemMeta: {
    color: uiPalette.textMuted,
    lineHeight: 21,
  },
  operationText: {
    color: uiPalette.secondary,
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
    backgroundColor: uiPalette.surface,
    borderRadius: 14,
    padding: 12,
    gap: 2,
    borderWidth: 1,
    borderColor: uiPalette.border,
  },
  priceLabel: {
    color: uiPalette.textSoft,
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  priceValue: {
    color: uiPalette.text,
    fontWeight: '700',
  },
  noteText: {
    color: uiPalette.textMuted,
    lineHeight: 22,
  },
  estimateNoteCard: {
    backgroundColor: uiPalette.surface,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: uiPalette.border,
  },
});

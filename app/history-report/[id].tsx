import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import * as Print from 'expo-print';
import { router, useLocalSearchParams } from 'expo-router';
import * as Sharing from 'expo-sharing';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useMemo, useState } from 'react';
import { Alert, Pressable, ScrollView, Share, StyleSheet, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { useAuth } from '@/context/auth-context';
import { getAnalysisHistoryItem, type AnalysisHistoryItem } from '@/lib/history';

const COLORS = {
  screenTop: '#050D1F',
  screenMid: '#07142E',
  screenBottom: '#081733',
  cardBg: '#132653',
  cardBorder: '#263F73',
  innerBlockBg: '#0E1F45',
  innerBlockBorder: '#263F73',
  totalBadgeBg: '#16325E',
  primaryText: '#F5F8FF',
  secondaryText: '#C6D2E8',
  mutedText: '#8EA1C4',
  accentBlue: '#2F8CFF',
  lightBlue: '#6DDCFF',
  success: '#20C777',
  buttonBlue: '#1E88FF',
  buttonBlueDark: '#006DFF',
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

function buildSummaryBullets(item: AnalysisHistoryItem) {
  const parts = item.summary
    .split(/[.!?]\s+/)
    .map((entry) => entry.trim())
    .filter(Boolean)
    .slice(0, 3);

  if (parts.length) {
    return parts;
  }

  return item.damagedZones.length
    ? item.damagedZones.slice(0, 3).map((zone) => `Виявлено пошкодження у зоні: ${zone}.`)
    : ['Пошкодження потребують уточнення за фото та локальної діагностики.'];
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function buildPdfHtml(params: {
  item: AnalysisHistoryItem;
  totalParts: number;
  totalLabor: number;
  summaryBullets: string[];
}) {
  const { item, totalParts, totalLabor, summaryBullets } = params;

  const lineItemsHtml = item.lineItems.length
    ? item.lineItems
        .map(
          (lineItem) => `
            <tr>
              <td>${escapeHtml(lineItem.part)}</td>
              <td>${escapeHtml(lineItem.damage || '-')}</td>
              <td>${escapeHtml(lineItem.work || '-')}</td>
              <td class="num">${escapeHtml(String(lineItem.partPrice))} грн</td>
              <td class="num">${escapeHtml(String(lineItem.laborPrice))} грн</td>
            </tr>
          `,
        )
        .join('')
    : `
      <tr>
        <td colspan="5" class="empty-cell">Деталізований кошторис відсутній.</td>
      </tr>
    `;

  const bulletsHtml = summaryBullets.map((bullet) => `<li>${escapeHtml(bullet)}</li>`).join('');

  return `
    <html>
      <head>
        <meta charset="utf-8" />
        <style>
          @page { margin: 24px; }
          body {
            margin: 0;
            font-family: Arial, Helvetica, sans-serif;
            background: #ffffff;
            color: #111827;
            font-size: 14px;
            line-height: 1.45;
          }
          .doc-title {
            font-size: 24px;
            font-weight: 700;
            margin-bottom: 4px;
          }
          .doc-subtitle {
            color: #6b7280;
            font-size: 12px;
            margin-bottom: 20px;
          }
          .section {
            margin-bottom: 22px;
          }
          .section-title {
            font-size: 16px;
            font-weight: 700;
            margin: 0 0 10px;
            padding-bottom: 6px;
            border-bottom: 1px solid #d1d5db;
          }
          .summary-table,
          .cost-table,
          .totals-table {
            width: 100%;
            border-collapse: collapse;
          }
          .summary-table td {
            padding: 7px 0;
            vertical-align: top;
          }
          .label {
            width: 190px;
            font-weight: 700;
            color: #374151;
          }
          .value {
            color: #111827;
          }
          ul {
            margin: 8px 0 0 18px;
            padding: 0;
          }
          li {
            margin-bottom: 6px;
          }
          .cost-table th,
          .cost-table td,
          .totals-table td {
            border: 1px solid #d1d5db;
            padding: 10px 8px;
            text-align: left;
            vertical-align: top;
          }
          .cost-table th {
            background: #f3f4f6;
            color: #374151;
            font-size: 12px;
            font-weight: 700;
          }
          .num {
            text-align: right;
            white-space: nowrap;
            font-weight: 700;
          }
          .empty-cell {
            color: #6b7280;
            text-align: center;
            padding: 18px 10px;
          }
          .totals-table .total-label {
            background: #f9fafb;
            font-weight: 700;
          }
          .totals-table .grand-label,
          .totals-table .grand-value {
            background: #eef2ff;
            font-size: 16px;
            font-weight: 700;
          }
          .note-box {
            border: 1px solid #d1d5db;
            background: #f9fafb;
            padding: 12px 14px;
          }
        </style>
      </head>
      <body>
        <div class="doc-title">Звіт по аналізу пошкоджень авто</div>
        <div class="doc-subtitle">Сформовано застосунком AI Авто Асистент</div>

        <div class="section">
          <div class="section-title">Загальна інформація</div>
          <table class="summary-table">
            <tr>
              <td class="label">Автомобіль</td>
              <td class="value">${escapeHtml(item.vehicleLabel)}</td>
            </tr>
            <tr>
              <td class="label">Дата формування</td>
              <td class="value">${escapeHtml(formatDate(item.createdAt))}</td>
            </tr>
            <tr>
              <td class="label">Орієнтовна сума</td>
              <td class="value"><strong>${escapeHtml(item.totalAmount)} грн</strong></td>
            </tr>
            <tr>
              <td class="label">Кількість зон пошкодження</td>
              <td class="value">${escapeHtml(String(item.damagedZones.length))}</td>
            </tr>
            <tr>
              <td class="label">Статус</td>
              <td class="value">Готово</td>
            </tr>
          </table>
        </div>

        <div class="section">
          <div class="section-title">Короткий висновок</div>
          <ul>${bulletsHtml}</ul>
        </div>

        <div class="section">
          <div class="section-title">Кошторис ремонту</div>
          <table class="cost-table">
            <thead>
              <tr>
                <th>Деталь</th>
                <th>Опис пошкодження</th>
                <th>Робота</th>
                <th>Вартість деталі</th>
                <th>Вартість роботи</th>
              </tr>
            </thead>
            <tbody>${lineItemsHtml}</tbody>
          </table>
        </div>

        <div class="section">
          <div class="section-title">Підсумок</div>
          <table class="totals-table">
            <tr>
              <td class="total-label">Деталі</td>
              <td class="num">${escapeHtml(String(totalParts))} грн</td>
            </tr>
            <tr>
              <td class="total-label">Робота</td>
              <td class="num">${escapeHtml(String(totalLabor))} грн</td>
            </tr>
            <tr>
              <td class="grand-label">Разом</td>
              <td class="num grand-value">${escapeHtml(item.totalAmount)} грн</td>
            </tr>
          </table>
        </div>

        <div class="section">
          <div class="section-title">Примітка</div>
          <div class="note-box">${escapeHtml(item.estimateNote)}</div>
        </div>
      </body>
    </html>
  `;
}

export default function HistoryReportScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { session } = useAuth();
  const insets = useSafeAreaInsets();
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

    void loadItem();

    return () => {
      isMounted = false;
    };
  }, [id, session?.email]);

  const totalParts = useMemo(
    () => item?.lineItems.reduce((sum, lineItem) => sum + Number(lineItem.partPrice || 0), 0) ?? 0,
    [item],
  );
  const totalLabor = useMemo(
    () => item?.lineItems.reduce((sum, lineItem) => sum + Number(lineItem.laborPrice || 0), 0) ?? 0,
    [item],
  );
  const summaryBullets = useMemo(() => (item ? buildSummaryBullets(item) : []), [item]);
  const uniqueParts = useMemo(
    () => (item ? Array.from(new Set(item.lineItems.map((lineItem) => lineItem.part))).slice(0, 8) : []),
    [item],
  );

  async function handleDownloadPdf() {
    if (!item) {
      return;
    }

    try {
      const html = buildPdfHtml({ item, totalParts, totalLabor, summaryBullets });
      const pdf = await Print.printToFileAsync({ html });
      const canShare = await Sharing.isAvailableAsync();

      if (!canShare) {
        Alert.alert('PDF створено', `Файл збережено: ${pdf.uri}`);
        return;
      }

      await Sharing.shareAsync(pdf.uri, {
        mimeType: 'application/pdf',
        dialogTitle: 'Зберегти або поділитися PDF',
        UTI: 'com.adobe.pdf',
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Не вдалося створити PDF.';
      Alert.alert('Помилка PDF', message);
    }
  }

  async function handleShareReport() {
    if (!item) {
      return;
    }

    try {
      const partsSection = uniqueParts.length
        ? uniqueParts.map((part) => `• ${part}`).join('\n')
        : '• Пошкоджені елементи потребують додаткового уточнення';

      const recommendation =
        item.lineItems.length || item.damagedZones.length
          ? 'Потрібна очна діагностика на СТО для уточнення обсягу робіт, вартості ремонту та потреби в заміні деталей.'
          : 'Рекомендовано виконати додатковий огляд автомобіля та зробити чіткіші фото за кращого освітлення.';

      const shareMessage =
        `Звіт аналізу авто\n\n` +
        `Авто: ${item.vehicleLabel}\n` +
        `Дата аналізу: ${formatDate(item.createdAt)}\n\n` +
        `Короткий опис:\n${item.summary}\n\n` +
        `Пошкоджені елементи:\n${partsSection}\n\n` +
        `Рекомендація:\n${recommendation}\n\n` +
        `Примітка:\nЗвіт сформовано автоматично та має інформаційний характер.`;

      await Share.share({
        title: 'Звіт аналізу авто',
        message: shareMessage,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Не вдалося поділитися звітом.';
      Alert.alert('Помилка поширення', message);
    }
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
          <Pressable style={styles.headerBack} onPress={() => router.back()}>
            <MaterialIcons name="arrow-back-ios-new" size={18} color={COLORS.primaryText} />
            <ThemedText style={styles.headerActionText}>Назад</ThemedText>
          </Pressable>

          <ThemedText style={styles.headerTitle}>
            {item?.lineItems.length ? 'Кошторис ремонту' : 'Деталі звіту'}
          </ThemedText>

          <Pressable style={styles.headerIcon} onPress={handleShareReport}>
            <MaterialIcons name="ios-share" size={20} color={COLORS.primaryText} />
          </Pressable>
        </View>

        {isLoading ? (
          <View style={styles.stateCard}>
            <ThemedText style={styles.stateText}>Завантаження звіту...</ThemedText>
          </View>
        ) : item ? (
          <>
            <View style={styles.heroCard}>
              <View style={styles.heroHeader}>
                <View style={styles.heroMeta}>
                  <ThemedText style={styles.heroEyebrow}>ЗВІТ</ThemedText>
                  <ThemedText style={styles.heroTitle}>{item.vehicleLabel}</ThemedText>
                  <ThemedText style={styles.heroDate}>{formatDate(item.createdAt)}</ThemedText>
                </View>

                <View style={styles.totalBadge}>
                  <ThemedText style={styles.totalLabel}>Орієнтовна сума</ThemedText>
                  <ThemedText style={styles.totalValue}>{item.totalAmount} грн</ThemedText>
                </View>
              </View>

              {item.photos[0]?.uri ? (
                <Image source={{ uri: item.photos[0].uri }} style={styles.heroImage} contentFit="cover" />
              ) : (
                <View style={styles.heroImageFallback}>
                  <MaterialIcons name="directions-car" size={34} color={COLORS.lightBlue} />
                </View>
              )}

              <View style={styles.summaryBlock}>
                <ThemedText style={styles.sectionTitle}>Короткий висновок</ThemedText>
                <View style={styles.bulletList}>
                  {summaryBullets.map((bullet) => (
                    <View key={bullet} style={styles.bulletRow}>
                      <View style={styles.bulletDot} />
                      <ThemedText style={styles.bulletText}>{bullet}</ThemedText>
                    </View>
                  ))}
                </View>
              </View>

              <View style={styles.statusChipsRow}>
                <View style={styles.statusChip}>
                  <MaterialIcons name="directions-car" size={16} color={COLORS.accentBlue} />
                  <View style={styles.statusChipCopy}>
                    <ThemedText style={styles.statusChipValue}>{item.damagedZones.length} зон</ThemedText>
                    <ThemedText style={styles.statusChipLabel}>проаналізовано</ThemedText>
                  </View>
                </View>

                <View style={styles.statusChip}>
                  <View style={styles.statusDot} />
                  <View style={styles.statusChipCopy}>
                    <ThemedText style={styles.statusChipValue}>Готово</ThemedText>
                    <ThemedText style={styles.statusChipLabel}>статус</ThemedText>
                  </View>
                </View>

                <View style={styles.statusChip}>
                  <MaterialIcons name="analytics" size={16} color={COLORS.accentBlue} />
                  <View style={styles.statusChipCopy}>
                    <ThemedText style={styles.statusChipValue}>Середня</ThemedText>
                    <ThemedText style={styles.statusChipLabel}>тяжкість</ThemedText>
                  </View>
                </View>
              </View>
            </View>

            {uniqueParts.length ? (
              <View style={styles.partsCard}>
                <ThemedText style={styles.sectionTitle}>Пошкоджені елементи</ThemedText>
                <View style={styles.tagsWrap}>
                  {uniqueParts.map((part) => (
                    <View key={part} style={styles.partTag}>
                      <MaterialIcons name="directions-car" size={14} color={COLORS.accentBlue} />
                      <ThemedText style={styles.partTagText}>{part}</ThemedText>
                    </View>
                  ))}
                </View>
              </View>
            ) : null}

            {item.lineItems.length ? (
              <View style={styles.estimateSection}>
                {item.lineItems.map((lineItem, index) => (
                  <View key={`${item.id}-${lineItem.part}-${index}`} style={styles.lineCard}>
                    <View style={styles.lineHeader}>
                      <View style={styles.lineIconBox}>
                        <MaterialIcons name="directions-car" size={22} color={COLORS.accentBlue} />
                      </View>

                      <View style={styles.lineHeaderCopy}>
                        <ThemedText style={styles.lineTitle}>{lineItem.part}</ThemedText>
                        <ThemedText style={styles.lineDescription}>
                          {lineItem.damage || 'Пошкодження уточнюється за фото та локальним оглядом.'}
                        </ThemedText>
                      </View>

                      <ThemedText style={styles.lineWorkTag}>{lineItem.work || 'Робота'}</ThemedText>
                    </View>

                    <View style={styles.linePricesRow}>
                      <View style={styles.linePriceCard}>
                        <ThemedText style={styles.linePriceLabel}>ДЕТАЛЬ</ThemedText>
                        <ThemedText style={styles.linePriceValue}>{lineItem.partPrice} грн</ThemedText>
                      </View>
                      <View style={styles.linePriceCard}>
                        <ThemedText style={styles.linePriceLabel}>РОБОТА</ThemedText>
                        <ThemedText style={styles.linePriceValue}>{lineItem.laborPrice} грн</ThemedText>
                      </View>
                    </View>
                  </View>
                ))}
              </View>
            ) : null}

            <View style={styles.summaryTotalsCard}>
              <ThemedText style={styles.summaryTotalsTitle}>Підсумок</ThemedText>
              <View style={styles.totalRow}>
                <ThemedText style={styles.totalRowLabel}>Деталі</ThemedText>
                <View style={styles.totalRowLine} />
                <ThemedText style={styles.totalRowValue}>{totalParts} грн</ThemedText>
              </View>
              <View style={styles.totalRow}>
                <ThemedText style={styles.totalRowLabel}>Робота</ThemedText>
                <View style={styles.totalRowLine} />
                <ThemedText style={styles.totalRowValue}>{totalLabor} грн</ThemedText>
              </View>
              <View style={styles.totalGrandRow}>
                <ThemedText style={styles.totalGrandLabel}>Разом</ThemedText>
                <ThemedText style={styles.totalGrandValue}>{item.totalAmount} грн</ThemedText>
              </View>
            </View>

            <View style={styles.noteCard}>
              <View style={styles.noteTitleRow}>
                <MaterialIcons name="info-outline" size={18} color={COLORS.accentBlue} />
                <ThemedText style={styles.noteTitle}>Примітка</ThemedText>
              </View>
              <ThemedText style={styles.noteText}>{item.estimateNote}</ThemedText>
            </View>

            <Pressable style={styles.primaryAction} onPress={handleDownloadPdf}>
              <LinearGradient
                colors={[COLORS.buttonBlue, COLORS.buttonBlueDark]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.primaryActionGradient}
              >
                <MaterialIcons name="picture-as-pdf" size={18} color={COLORS.primaryText} />
                <ThemedText style={styles.primaryActionText}>Завантажити PDF</ThemedText>
              </LinearGradient>
            </Pressable>

            <Pressable style={styles.secondaryAction} onPress={handleShareReport}>
              <MaterialIcons name="ios-share" size={18} color={COLORS.primaryText} />
              <ThemedText style={styles.secondaryActionText}>Поділитися</ThemedText>
            </Pressable>
          </>
        ) : (
          <View style={styles.stateCard}>
            <ThemedText style={styles.stateText}>Не вдалося знайти цей запис в історії.</ThemedText>
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
    paddingHorizontal: 18,
    paddingBottom: 42,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 18,
  },
  headerBack: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    minWidth: 76,
  },
  headerActionText: {
    color: COLORS.primaryText,
    fontSize: 14,
    fontWeight: '500',
  },
  headerTitle: {
    color: COLORS.primaryText,
    fontSize: 16,
    fontWeight: '700',
  },
  headerIcon: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroCard: {
    backgroundColor: COLORS.cardBg,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    borderRadius: 24,
    padding: 16,
    shadowColor: '#000000',
    shadowOpacity: 0.28,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8,
  },
  heroHeader: {
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'space-between',
  },
  heroMeta: {
    flex: 1,
  },
  heroEyebrow: {
    color: COLORS.mutedText,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.8,
  },
  heroTitle: {
    marginTop: 8,
    color: COLORS.primaryText,
    fontSize: 18,
    fontWeight: '700',
  },
  heroDate: {
    marginTop: 4,
    color: COLORS.mutedText,
    fontSize: 14,
  },
  totalBadge: {
    minWidth: 118,
    backgroundColor: COLORS.totalBadgeBg,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    borderRadius: 18,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  totalLabel: {
    color: COLORS.secondaryText,
    fontSize: 11,
  },
  totalValue: {
    marginTop: 8,
    color: COLORS.lightBlue,
    fontSize: 16,
    fontWeight: '700',
  },
  heroImage: {
    width: '100%',
    height: 168,
    borderRadius: 18,
    marginTop: 16,
  },
  heroImageFallback: {
    marginTop: 16,
    height: 168,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.innerBlockBg,
  },
  summaryBlock: {
    marginTop: 16,
  },
  sectionTitle: {
    color: COLORS.primaryText,
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 10,
  },
  bulletList: {
    gap: 8,
  },
  bulletRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  bulletDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.accentBlue,
    marginTop: 8,
  },
  bulletText: {
    flex: 1,
    color: COLORS.secondaryText,
    fontSize: 15,
    lineHeight: 22,
  },
  statusChipsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 18,
  },
  statusChip: {
    flex: 1,
    minHeight: 66,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.innerBlockBorder,
    backgroundColor: COLORS.innerBlockBg,
    paddingHorizontal: 10,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statusChipCopy: {
    flex: 1,
  },
  statusChipValue: {
    color: COLORS.primaryText,
    fontSize: 14,
    fontWeight: '700',
  },
  statusChipLabel: {
    marginTop: 2,
    color: COLORS.mutedText,
    fontSize: 11,
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
  partsCard: {
    marginTop: 16,
    backgroundColor: COLORS.cardBg,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    borderRadius: 20,
    padding: 14,
  },
  tagsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  partTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.innerBlockBorder,
    backgroundColor: COLORS.innerBlockBg,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  partTagText: {
    color: COLORS.secondaryText,
    fontSize: 13,
    fontWeight: '500',
  },
  estimateSection: {
    marginTop: 16,
    gap: 14,
  },
  lineCard: {
    backgroundColor: COLORS.cardBg,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    borderRadius: 22,
    padding: 16,
  },
  lineHeader: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'flex-start',
  },
  lineIconBox: {
    width: 42,
    height: 42,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.innerBlockBorder,
    backgroundColor: COLORS.innerBlockBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  lineHeaderCopy: {
    flex: 1,
  },
  lineTitle: {
    color: COLORS.primaryText,
    fontSize: 16,
    fontWeight: '700',
  },
  lineDescription: {
    marginTop: 4,
    color: COLORS.secondaryText,
    fontSize: 14,
    lineHeight: 21,
  },
  lineWorkTag: {
    color: COLORS.lightBlue,
    fontSize: 13,
    fontWeight: '600',
    maxWidth: 110,
    textAlign: 'right',
  },
  linePricesRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
  },
  linePriceCard: {
    flex: 1,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.innerBlockBorder,
    backgroundColor: COLORS.innerBlockBg,
    padding: 14,
  },
  linePriceLabel: {
    color: COLORS.mutedText,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.6,
  },
  linePriceValue: {
    marginTop: 10,
    color: COLORS.primaryText,
    fontSize: 16,
    fontWeight: '700',
  },
  summaryTotalsCard: {
    marginTop: 16,
    backgroundColor: COLORS.cardBg,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    borderRadius: 20,
    padding: 16,
  },
  summaryTotalsTitle: {
    color: COLORS.primaryText,
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 14,
  },
  totalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 12,
  },
  totalRowLabel: {
    color: COLORS.secondaryText,
    fontSize: 15,
  },
  totalRowLine: {
    flex: 1,
    height: 1,
    backgroundColor: COLORS.cardBorder,
  },
  totalRowValue: {
    color: COLORS.primaryText,
    fontSize: 15,
    fontWeight: '600',
  },
  totalGrandRow: {
    marginTop: 8,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.innerBlockBorder,
    backgroundColor: COLORS.innerBlockBg,
    paddingHorizontal: 14,
    paddingVertical: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  totalGrandLabel: {
    color: COLORS.primaryText,
    fontSize: 17,
    fontWeight: '700',
  },
  totalGrandValue: {
    color: COLORS.lightBlue,
    fontSize: 18,
    fontWeight: '700',
  },
  noteCard: {
    marginTop: 16,
    backgroundColor: COLORS.cardBg,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    borderRadius: 20,
    padding: 16,
  },
  noteTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  noteTitle: {
    color: COLORS.primaryText,
    fontSize: 16,
    fontWeight: '700',
  },
  noteText: {
    color: COLORS.secondaryText,
    fontSize: 14,
    lineHeight: 21,
  },
  primaryAction: {
    marginTop: 16,
    borderRadius: 18,
    overflow: 'hidden',
  },
  primaryActionGradient: {
    height: 54,
    borderRadius: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  primaryActionText: {
    color: COLORS.primaryText,
    fontSize: 16,
    fontWeight: '700',
  },
  secondaryAction: {
    marginTop: 12,
    marginBottom: 12,
    height: 54,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    backgroundColor: 'rgba(8, 23, 51, 0.62)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  secondaryActionText: {
    color: COLORS.primaryText,
    fontSize: 16,
    fontWeight: '600',
  },
  stateCard: {
    marginTop: 24,
    backgroundColor: COLORS.cardBg,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    borderRadius: 20,
    padding: 20,
  },
  stateText: {
    color: COLORS.secondaryText,
    fontSize: 15,
    lineHeight: 21,
  },
});

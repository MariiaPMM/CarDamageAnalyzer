import { useEffect, useMemo, useState } from 'react';
import { router } from 'expo-router';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { uiPalette } from '@/constants/ui-palette';
import { useAnalysisFlow } from '@/context/analysis-flow-context';
import { useAuth } from '@/context/auth-context';
import {
  askDamageAnalysisQuestion,
  type AnalysisChatMessage,
} from '@/lib/openai';

export default function AnalysisResultScreen() {
  const { session } = useAuth();
  const { draft, result, error, isAnalyzing, runAnalysis } = useAnalysisFlow();
  const [messages, setMessages] = useState<AnalysisChatMessage[]>([]);
  const [question, setQuestion] = useState('');
  const [chatError, setChatError] = useState('');
  const [isChatLoading, setIsChatLoading] = useState(false);

  const assistantHistory = useMemo(() => messages, [messages]);

  useEffect(() => {
    if (!draft) {
      router.replace('/(tabs)');
      return;
    }

    if (!result && !error && !isAnalyzing) {
      runAnalysis(session?.email);
    }
  }, [draft, error, isAnalyzing, result, runAnalysis, session?.email]);

  useEffect(() => {
    setMessages([]);
    setQuestion('');
    setChatError('');
    setIsChatLoading(false);
  }, [result?.damageSummary, result?.estimatedCost.amount, draft?.photos.length]);

  if (!draft) {
    return null;
  }

  async function handleSendMessage() {
    if (!result || isChatLoading) {
      return;
    }

    const normalizedQuestion = question.trim();
    if (!normalizedQuestion) {
      setChatError('Напиши запитання перед відправленням.');
      return;
    }

    const userMessage: AnalysisChatMessage = {
      id: `${Date.now()}-user`,
      role: 'user',
      text: normalizedQuestion,
    };

    setQuestion('');
    setChatError('');
    setIsChatLoading(true);
    setMessages((current) => [...current, userMessage]);

    try {
      const answer = await askDamageAnalysisQuestion({
        result,
        question: normalizedQuestion,
        history: assistantHistory,
      });

      setMessages((current) => [
        ...current,
        {
          id: `${Date.now()}-assistant`,
          role: 'assistant',
          text: answer,
        },
      ]);
    } catch (requestError) {
      const message =
        requestError instanceof Error
          ? requestError.message
          : 'Не вдалося отримати відповідь чату.';
      setChatError(message);
      setQuestion(normalizedQuestion);
      setMessages((current) =>
        current.filter((item) => item.id !== userMessage.id),
      );
    } finally {
      setIsChatLoading(false);
    }
  }

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <ThemedText type="title" style={styles.title}>
          Результат аналізу
        </ThemedText>
        <ThemedText style={styles.subtitle}>
          Дані авто та фото вже передані в обробку. Тут відображається готовий
          звіт і чат для уточнювальних запитань.
        </ThemedText>
      </View>

      <View style={styles.card}>
        <ThemedText type="defaultSemiBold">Передано в аналіз</ThemedText>
        <ThemedText style={styles.text}>
          Авто:{' '}
          {[draft.brand, draft.model, draft.year]
            .filter(Boolean)
            .join(' ') || 'не вказано'}
        </ThemedText>
        <ThemedText style={styles.text}>Фото: {draft.photos.length}</ThemedText>
      </View>

      {isAnalyzing ? (
        <View style={styles.loaderCard}>
          <ActivityIndicator size="large" color={uiPalette.primary} />
          <ThemedText type="defaultSemiBold" style={styles.loaderTitle}>
            Обробка фото...
          </ThemedText>
          <ThemedText style={styles.loaderText}>
            Модель перевіряє фото, визначає пошкоджені зони та формує
            орієнтовний кошторис.
          </ThemedText>
        </View>
      ) : null}

      {!isAnalyzing && error ? (
        <View style={styles.card}>
          <ThemedText type="defaultSemiBold">Помилка аналізу</ThemedText>
          <ThemedText style={styles.errorText}>{error}</ThemedText>
          <View style={styles.actionsRow}>
            <Pressable
              onPress={() => runAnalysis(session?.email)}
              style={styles.primaryButton}>
              <ThemedText style={styles.buttonText}>
                Спробувати ще раз
              </ThemedText>
            </Pressable>
            <Pressable
              onPress={() => router.back()}
              style={styles.secondaryButton}>
              <ThemedText style={styles.secondaryButtonText}>Назад</ThemedText>
            </Pressable>
          </View>
        </View>
      ) : null}

      {!isAnalyzing && result ? (
        <View style={styles.card}>
          <View style={styles.resultSection}>
            <ThemedText type="defaultSemiBold" style={styles.sectionTitle}>
              Авто
            </ThemedText>
            <ThemedText style={styles.text}>{result.vehicle.makeModel}</ThemedText>
            <ThemedText style={styles.subtext}>
              Джерело:{' '}
              {result.vehicle.source === 'user_input'
                ? 'ввід користувача'
                : 'AI'}{' '}
              · Впевненість: {result.vehicle.confidence}
            </ThemedText>
          </View>

          <View style={styles.resultSection}>
            <ThemedText type="defaultSemiBold" style={styles.sectionTitle}>
              Пошкоджені зони
            </ThemedText>
            {result.damagedZones.length ? (
              result.damagedZones.map((zone) => (
                <ThemedText key={zone} style={styles.text}>
                  • {zone}
                </ThemedText>
              ))
            ) : (
              <ThemedText style={styles.text}>
                Не вдалося чітко визначити зони.
              </ThemedText>
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
                  • {action}
                </ThemedText>
              ))
            ) : (
              <ThemedText style={styles.text}>
                Список робіт не повернувся.
              </ThemedText>
            )}
          </View>

          <View style={styles.resultSection}>
            <ThemedText type="defaultSemiBold" style={styles.sectionTitle}>
              Кошторис по деталях
            </ThemedText>
            {result.lineItems.length ? (
              result.lineItems.map((item, index) => (
                <View key={`${item.part}-${index}`} style={styles.lineItemCard}>
                  <ThemedText
                    type="defaultSemiBold"
                    style={styles.lineItemTitle}>
                    {item.part}
                  </ThemedText>
                  <ThemedText style={styles.text}>Зона: {item.zone}</ThemedText>
                  <ThemedText style={styles.text}>
                    Пошкодження: {item.damage}
                  </ThemedText>
                  <ThemedText style={styles.text}>
                    Операція: {item.work}
                  </ThemedText>
                  <ThemedText style={styles.text}>
                    Деталь: {item.partPrice} {item.currency}
                  </ThemedText>
                  <ThemedText style={styles.text}>
                    Робота: {item.laborPrice} {item.currency}
                  </ThemedText>
                  <ThemedText style={styles.subtext}>
                    Примітка: {item.note}
                  </ThemedText>
                </View>
              ))
            ) : (
              <ThemedText style={styles.text}>
                Деталізований кошторис відсутній.
              </ThemedText>
            )}
          </View>

          <View style={styles.resultSection}>
            <ThemedText type="defaultSemiBold" style={styles.sectionTitle}>
              Загальна орієнтовна сума
            </ThemedText>
            <ThemedText style={styles.totalPrice}>
              {result.estimatedCost.amount} {result.estimatedCost.currency}
            </ThemedText>
            <ThemedText style={styles.subtext}>
              {result.estimatedCost.note}
            </ThemedText>
          </View>
        </View>
      ) : null}

      {!isAnalyzing && result ? (
        <View style={styles.card}>
          <View style={styles.chatHeader}>
            <ThemedText type="defaultSemiBold" style={styles.sectionTitle}>
              Чат
            </ThemedText>
            <ThemedText style={styles.subtext}>
              Можна поставити уточнення по пошкодженнях, роботах або кошторису.
            </ThemedText>
          </View>

          <View style={styles.chatMessages}>
            {messages.length ? (
              messages.map((message) => (
                <View
                  key={message.id}
                  style={[
                    styles.chatBubble,
                    message.role === 'user'
                      ? styles.userBubble
                      : styles.assistantBubble,
                  ]}>
                  <ThemedText
                    style={[
                      styles.chatBubbleText,
                      message.role === 'user'
                        ? styles.userBubbleText
                        : styles.assistantBubbleText,
                    ]}>
                    {message.text}
                  </ThemedText>
                </View>
              ))
            ) : (
              <ThemedText style={styles.subtext}>
                Запитай, наприклад: &quot;Чому потрібне фарбування?&quot; або &quot;Що означає
                ця сума?&quot;.
              </ThemedText>
            )}

            {isChatLoading ? (
              <View style={[styles.chatBubble, styles.assistantBubble]}>
                <ThemedText
                  style={[styles.chatBubbleText, styles.assistantBubbleText]}>
                  Готую відповідь...
                </ThemedText>
              </View>
            ) : null}
          </View>

          <View style={styles.chatComposer}>
            <TextInput
              value={question}
              onChangeText={setQuestion}
              placeholder="Постав уточнювальне запитання..."
              placeholderTextColor={uiPalette.textMuted}
              style={styles.chatInput}
              multiline
            />
            <Pressable
              onPress={handleSendMessage}
              disabled={isChatLoading}
              style={[
                styles.primaryButton,
                isChatLoading ? styles.primaryButtonDisabled : undefined,
              ]}>
              <ThemedText style={styles.buttonText}>
                {isChatLoading ? 'Зачекай...' : 'Надіслати'}
              </ThemedText>
            </Pressable>
          </View>

          {chatError ? (
            <ThemedText style={styles.errorText}>{chatError}</ThemedText>
          ) : null}
        </View>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: uiPalette.background,
  },
  content: {
    padding: 16,
    gap: 16,
  },
  header: {
    gap: 6,
    paddingTop: 8,
  },
  title: {
    color: uiPalette.text,
    fontSize: 32,
    lineHeight: 36,
  },
  subtitle: {
    color: uiPalette.textMuted,
  },
  card: {
    borderRadius: 18,
    padding: 18,
    gap: 14,
    borderWidth: 1,
    borderColor: uiPalette.border,
    backgroundColor: uiPalette.surface,
  },
  loaderCard: {
    borderRadius: 18,
    padding: 20,
    gap: 12,
    borderWidth: 1,
    borderColor: uiPalette.borderStrong,
    backgroundColor: uiPalette.surfaceMuted,
    alignItems: 'center',
  },
  loaderTitle: {
    color: uiPalette.text,
  },
  loaderText: {
    color: uiPalette.textMuted,
    textAlign: 'center',
    lineHeight: 22,
  },
  text: {
    color: uiPalette.text,
    lineHeight: 23,
  },
  subtext: {
    color: uiPalette.textMuted,
    lineHeight: 22,
  },
  errorText: {
    color: uiPalette.danger,
    lineHeight: 24,
  },
  actionsRow: {
    gap: 10,
  },
  chatHeader: {
    gap: 8,
  },
  chatMessages: {
    gap: 10,
  },
  chatBubble: {
    maxWidth: '92%',
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  userBubble: {
    alignSelf: 'flex-end',
    backgroundColor: uiPalette.primary,
  },
  assistantBubble: {
    alignSelf: 'flex-start',
    backgroundColor: uiPalette.surfaceMuted,
    borderWidth: 1,
    borderColor: uiPalette.border,
  },
  chatBubbleText: {
    lineHeight: 22,
  },
  userBubbleText: {
    color: uiPalette.dark,
  },
  assistantBubbleText: {
    color: uiPalette.text,
  },
  chatComposer: {
    gap: 12,
  },
  chatInput: {
    minHeight: 96,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: uiPalette.border,
    backgroundColor: uiPalette.surfaceMuted,
    color: uiPalette.text,
    paddingHorizontal: 14,
    paddingVertical: 12,
    textAlignVertical: 'top',
    fontSize: 16,
    lineHeight: 22,
  },
  primaryButton: {
    backgroundColor: uiPalette.primary,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
  },
  primaryButtonDisabled: {
    opacity: 0.65,
  },
  secondaryButton: {
    backgroundColor: uiPalette.surfaceMuted,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: uiPalette.border,
  },
  buttonText: {
    color: uiPalette.dark,
    fontWeight: '700',
  },
  secondaryButtonText: {
    color: uiPalette.text,
    fontWeight: '600',
  },
  resultSection: {
    gap: 8,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: uiPalette.border,
  },
  sectionTitle: {
    color: uiPalette.text,
  },
  lineItemCard: {
    gap: 4,
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: uiPalette.border,
    backgroundColor: uiPalette.surfaceMuted,
  },
  lineItemTitle: {
    color: uiPalette.text,
  },
  totalPrice: {
    color: uiPalette.primary,
    fontSize: 30,
    lineHeight: 34,
    fontWeight: '700',
  },
});

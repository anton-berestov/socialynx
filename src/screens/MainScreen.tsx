import React, { useCallback, useState } from 'react';
import { Alert, ActivityIndicator, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Clipboard from 'expo-clipboard';
import { ContentLength, ContentType, CONTENT_TYPES, LENGTHS, TONES } from '../constants';
import { useContentGenerator } from '../hooks/useContentGenerator';
import { useSubscription } from '../context/SubscriptionContext';
import { useDailyLimit } from '../hooks/useDailyLimit';
import { lightColors, darkColors, spacing, typography, borderRadius, shadows } from '../styles/theme';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import { AdBannerPlaceholder } from '../components/AdBannerPlaceholder';
import { useTheme } from '../context/ThemeContext';

export const MainScreen: React.FC = () => {
  const { isDark } = useTheme();
  const colors = isDark ? darkColors : lightColors;

  const [prompt, setPrompt] = useState('');
  const [selectedType, setSelectedType] = useState<ContentType>('post');
  const [selectedTone, setSelectedTone] = useState(TONES[0].key);
  const [selectedLength, setSelectedLength] = useState<ContentLength>('medium');
  const { result, loading, handleGenerate, error } = useContentGenerator();
  const { status } = useSubscription();
  const isPro = status === 'pro';
  const { remaining, loading: limitLoading, consume } = useDailyLimit(isPro);
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const insets = useSafeAreaInsets();

  const onGeneratePress = useCallback(async () => {
    if (!prompt.trim()) {
      Alert.alert('Введите тему', 'Пожалуйста, опишите тему или идею для генерации.');
      return;
    }

    if (!isPro && remaining <= 0) {
      Alert.alert('Лимит исчерпан', 'Вы использовали все бесплатные генерации на сегодня. Оформите PRO, чтобы продолжить без ограничений.', [
        { text: 'Позже' },
        { text: 'Оформить PRO', onPress: () => navigation.navigate('Paywall') }
      ]);
      return;
    }

    try {
      await handleGenerate({ prompt, type: selectedType, tone: selectedTone, length: selectedLength });
      await consume();
    } catch (err) {
      console.error(err);
    }
  }, [prompt, selectedType, selectedTone, selectedLength, handleGenerate, consume, isPro, remaining, navigation]);

  const handleCopy = useCallback(async () => {
    if (!result) return;
    await Clipboard.setStringAsync(result);
    Alert.alert('Скопировано', 'Текст добавлен в буфер обмена.');
  }, [result]);

  const styles = createStyles(colors, isDark);

  return (
    <ScrollView contentContainerStyle={[styles.container, { paddingTop: insets.top + spacing.lg }]}>
      <View style={styles.header}>
        <Text style={styles.title}>Генератор контента</Text>
        <Text style={styles.description}>
          Опишите идею — получите готовый пост, описание, хэштеги или заголовок
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.label}>Тема</Text>
        <TextInput
          value={prompt}
          onChangeText={setPrompt}
          placeholder="Например: продвижение эко-товаров"
          placeholderTextColor={colors.textTertiary}
          multiline
          style={styles.promptInput}
        />
      </View>

      <View style={styles.section}>
        <Text style={styles.label}>Тип контента</Text>
        <View style={styles.chipRow}>
          {CONTENT_TYPES.map((type) => (
            <TouchableOpacity
              key={type.key}
              onPress={() => setSelectedType(type.key)}
              style={[
                styles.chip,
                selectedType === type.key && styles.chipActive
              ]}
            >
              <Text style={[styles.chipText, selectedType === type.key && styles.chipTextActive]}>
                {type.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Настройки генерации</Text>

        <View style={styles.settingSection}>
          <Text style={styles.settingLabel}>Тон</Text>
          <View style={styles.chipRow}>
            {TONES.map((tone) => {
              const locked = !isPro && tone.key !== 'friendly';
              const active = selectedTone === tone.key;
              return (
                <TouchableOpacity
                  key={tone.key}
                  onPress={() => {
                    if (locked) {
                      navigation.navigate('Paywall');
                      return;
                    }
                    setSelectedTone(tone.key as any);
                  }}
                  style={[
                    styles.chipSmall,
                    active && styles.chipSmallActive,
                    locked && styles.chipLocked
                  ]}
                >
                  <Text style={[styles.chipSmallText, active && styles.chipSmallTextActive]}>
                    {tone.label} {locked && '🔒'}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        <View style={styles.settingSection}>
          <Text style={styles.settingLabel}>Длина</Text>
          <View style={styles.chipRow}>
            {LENGTHS.map((length) => {
              const locked = !isPro && length.key === 'long';
              const active = selectedLength === length.key;
              return (
                <TouchableOpacity
                  key={length.key}
                  onPress={() => {
                    if (locked) {
                      navigation.navigate('Paywall');
                      return;
                    }
                    setSelectedLength(length.key);
                  }}
                  style={[
                    styles.chipSmall,
                    active && styles.chipSmallSecondaryActive,
                    locked && styles.chipLocked
                  ]}
                >
                  <Text style={[styles.chipSmallText, active && styles.chipSmallTextActive]}>
                    {length.label} {locked && '🔒'}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {!isPro && (
          <View style={styles.proHint}>
            <Text style={styles.proHintText}>
              ✨ PRO: выбор тона и длинные тексты
            </Text>
          </View>
        )}
      </View>

      {!isPro && (
        <View style={styles.limitCard}>
          <View style={styles.limitBadge}>
            <Text style={styles.limitBadgeText}>{limitLoading ? '…' : remaining}/3</Text>
          </View>
          <View style={styles.limitContent}>
            <Text style={styles.limitTitle}>Генераций сегодня</Text>
            <Text style={styles.limitDescription}>
              Оформите PRO для безлимитных генераций и отключения рекламы
            </Text>
          </View>
        </View>
      )}

      <AdBannerPlaceholder hidden={isPro} />

      <TouchableOpacity
        onPress={onGeneratePress}
        style={[styles.generateButton, loading && styles.generateButtonDisabled]}
        disabled={loading}
        activeOpacity={0.8}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.generateButtonText}>✨ Сгенерировать</Text>
        )}
      </TouchableOpacity>

      {error && (
        <View style={styles.errorCard}>
          <Text style={styles.errorTitle}>⚠️ Ошибка</Text>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      {result && (
        <View style={styles.resultCard}>
          <View style={styles.resultHeader}>
            <Text style={styles.resultTitle}>Результат</Text>
            <TouchableOpacity onPress={handleCopy} style={styles.copyButton}>
              <Text style={styles.copyButtonText}>Скопировать</Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.resultText}>{result}</Text>
        </View>
      )}
    </ScrollView>
  );
};

const createStyles = (colors: typeof lightColors, isDark: boolean) => StyleSheet.create({
  container: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl,
    flexGrow: 1,
    backgroundColor: colors.background
  },
  header: {
    marginBottom: spacing.xl
  },
  title: {
    ...typography.title,
    marginBottom: spacing.sm,
    color: colors.text
  },
  description: {
    ...typography.body,
    color: colors.textSecondary,
    lineHeight: 22
  },
  section: {
    marginBottom: spacing.lg
  },
  label: {
    ...typography.subtitle,
    marginBottom: spacing.md,
    color: colors.text
  },
  promptInput: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    minHeight: 120,
    borderWidth: 1,
    borderColor: colors.border,
    textAlignVertical: 'top',
    color: colors.text,
    ...typography.body,
    ...shadows.sm
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  chip: {
    backgroundColor: colors.surface,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.lg,
    borderWidth: 1.5,
    borderColor: colors.border,
    ...shadows.sm
  },
  chipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary
  },
  chipText: {
    ...typography.button,
    color: colors.text
  },
  chipTextActive: {
    color: '#fff'
  },
  card: {
    backgroundColor: colors.surface,
    padding: spacing.lg,
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.lg,
    ...shadows.md
  },
  cardTitle: {
    ...typography.heading,
    color: colors.text,
    marginBottom: spacing.lg
  },
  settingSection: {
    marginBottom: spacing.lg
  },
  settingLabel: {
    ...typography.caption,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
    textTransform: 'uppercase',
    letterSpacing: 0.5
  },
  chipSmall: {
    backgroundColor: colors.surfaceElevated,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border
  },
  chipSmallActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary
  },
  chipSmallSecondaryActive: {
    backgroundColor: colors.secondary,
    borderColor: colors.secondary
  },
  chipSmallText: {
    ...typography.body,
    color: colors.text
  },
  chipSmallTextActive: {
    color: '#fff',
    fontWeight: '600'
  },
  chipLocked: {
    opacity: 0.6
  },
  proHint: {
    backgroundColor: isDark ? 'rgba(129, 140, 248, 0.1)' : 'rgba(99, 102, 241, 0.05)',
    padding: spacing.md,
    borderRadius: borderRadius.md,
    marginTop: spacing.sm
  },
  proHintText: {
    ...typography.caption,
    color: colors.primary,
    textAlign: 'center'
  },
  limitCard: {
    backgroundColor: colors.surface,
    padding: spacing.lg,
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    ...shadows.sm
  },
  limitBadge: {
    width: 56,
    height: 56,
    borderRadius: borderRadius.full,
    backgroundColor: isDark ? 'rgba(129, 140, 248, 0.15)' : 'rgba(99, 102, 241, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md
  },
  limitBadgeText: {
    ...typography.heading,
    color: colors.primary,
    fontWeight: '700'
  },
  limitContent: {
    flex: 1
  },
  limitTitle: {
    ...typography.subtitle,
    color: colors.text,
    marginBottom: spacing.xs
  },
  limitDescription: {
    ...typography.caption,
    color: colors.textSecondary,
    lineHeight: 18
  },
  generateButton: {
    backgroundColor: colors.primary,
    paddingVertical: spacing.lg,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    marginBottom: spacing.lg,
    ...shadows.lg
  },
  generateButtonDisabled: {
    opacity: 0.6
  },
  generateButtonText: {
    ...typography.button,
    color: '#fff',
    fontSize: 17
  },
  errorCard: {
    backgroundColor: isDark ? 'rgba(239, 68, 68, 0.1)' : '#FEE2E2',
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: isDark ? 'rgba(239, 68, 68, 0.2)' : '#FEF2F2'
  },
  errorTitle: {
    ...typography.subtitle,
    color: colors.danger,
    marginBottom: spacing.xs
  },
  errorText: {
    ...typography.body,
    color: colors.danger
  },
  resultCard: {
    backgroundColor: colors.surface,
    padding: spacing.lg,
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.lg
  },
  resultHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md
  },
  resultTitle: {
    ...typography.heading,
    color: colors.text
  },
  copyButton: {
    backgroundColor: colors.secondary,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.md
  },
  copyButtonText: {
    ...typography.button,
    color: '#fff',
    fontSize: 14
  },
  resultText: {
    ...typography.bodyLarge,
    color: colors.text,
    lineHeight: 24
  }
});
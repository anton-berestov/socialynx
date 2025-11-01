import React, { useCallback, useState } from 'react';
import { Alert, ActivityIndicator, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Clipboard from 'expo-clipboard';
import { ContentLength, ContentType, CONTENT_TYPES, LENGTHS, TONES } from '../constants';
import { useContentGenerator } from '../hooks/useContentGenerator';
import { useSubscription } from '../context/SubscriptionContext';
import { useDailyLimit } from '../hooks/useDailyLimit';
import { colors, spacing, typography } from '../styles/theme';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import { AdBannerPlaceholder } from '../components/AdBannerPlaceholder';

export const MainScreen: React.FC = () => {
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
    if (!result) {
      return;
    }
    await Clipboard.setStringAsync(result);
    Alert.alert('Скопировано', 'Текст добавлен в буфер обмена.');
  }, [result]);

  return (
    <ScrollView contentContainerStyle={[styles.container, { paddingTop: insets.top + spacing.lg }]}>
      <Text style={styles.title}>Генератор контента</Text>
      <Text style={styles.description}>
        Введите ключевую мысль или задачу — SociaLynx подготовит пост, описание, хэштеги или заголовок.
      </Text>

      <Text style={styles.sectionTitle}>Тема</Text>
      <TextInput
        value={prompt}
        onChangeText={setPrompt}
        placeholder="Например: продвижение эко-товаров"
        multiline
        style={styles.promptInput}
      />

      <Text style={styles.sectionTitle}>Тип генерации</Text>
      <View style={styles.chipRow}>
        {CONTENT_TYPES.map((type) => (
          <TouchableOpacity
            key={type.key}
            onPress={() => setSelectedType(type.key)}
            style={[
              styles.chip,
              selectedType === type.key && styles.chipActive,
              { marginRight: spacing.sm, marginBottom: spacing.sm }
            ]}
          >
            <Text style={[styles.chipText, selectedType === type.key && styles.chipTextActive]}>{type.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.sectionTitle}>Настройки</Text>
      <View style={styles.card}>
        <Text style={styles.cardLabel}>Тон</Text>
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
                  setSelectedTone(tone.key);
                }}
                style={[
                  styles.chipSmall,
                  active && styles.chipActive,
                  locked && styles.chipLocked,
                  { marginRight: spacing.sm, marginBottom: spacing.sm }
                ]}
              >
                <Text style={[styles.chipText, active && styles.chipTextActive]}>{tone.label}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <Text style={styles.cardLabel}>Длина</Text>
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
                  active && styles.chipSecondaryActive,
                  locked && styles.chipLocked,
                  { marginRight: spacing.sm, marginBottom: spacing.sm }
                ]}
              >
                <Text
                  style={[
                    styles.chipText,
                    active && styles.chipTextActive,
                    active && { color: '#fff' }
                  ]}
                >
                  {length.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
        {!isPro && (
          <Text style={styles.cardHelper}>Длинные тексты и выбор тона доступны в PRO.</Text>
        )}
      </View>

      {!isPro && (
        <View style={styles.limitCard}>
          <Text style={styles.limitTitle}>Осталось генераций: {limitLoading ? '…' : remaining}</Text>
          <Text style={styles.limitDescription}>
            Бесплатно доступно {remaining} из 3 генераций в сутки. Оформите PRO, чтобы снимать ограничения и отключить рекламу.
          </Text>
        </View>
      )}

      {/* Placeholder for Yandex Ads banner until native modules are connected */}
      <AdBannerPlaceholder hidden={isPro} />

      <TouchableOpacity
        onPress={onGeneratePress}
        style={[styles.generateButton, loading && styles.generateButtonDisabled]}
        disabled={loading}
      >
        {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.generateButtonText}>Сгенерировать</Text>}
      </TouchableOpacity>

      {error && (
        <View style={styles.errorCard}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      {result ? (
        <View style={styles.resultCard}>
          <Text style={styles.resultTitle}>Результат</Text>
          <Text style={styles.resultText}>{result}</Text>
          <TouchableOpacity
            onPress={handleCopy}
            style={styles.copyButton}
          >
            <Text style={styles.copyButtonText}>Скопировать</Text>
          </TouchableOpacity>
        </View>
      ) : null}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
    flexGrow: 1,
    backgroundColor: colors.background
  },
  title: {
    ...typography.title,
    marginBottom: spacing.sm,
    color: colors.text
  },
  description: {
    ...typography.body,
    color: colors.muted,
    marginBottom: spacing.md
  },
  sectionTitle: {
    ...typography.subtitle,
    marginBottom: spacing.sm,
    color: colors.text
  },
  promptInput: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: spacing.md,
    minHeight: 120,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    marginBottom: spacing.lg,
    textAlignVertical: 'top',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: spacing.lg
  },
  chip: {
    backgroundColor: colors.white,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1
  },
  chipSmall: {
    backgroundColor: colors.white,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1
  },
  chipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary
  },
  chipSecondaryActive: {
    backgroundColor: colors.secondary,
    borderColor: colors.secondary
  },
  chipText: {
    color: colors.text
  },
  chipTextActive: {
    color: '#fff'
  },
  chipLocked: {
    opacity: 0.5
  },
  card: {
    backgroundColor: colors.white,
    padding: spacing.md,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    marginBottom: spacing.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2
  },
  cardLabel: {
    ...typography.caption,
    color: colors.muted,
    marginBottom: spacing.sm
  },
  cardHelper: {
    ...typography.caption,
    color: colors.muted,
    marginTop: spacing.sm
  },
  limitCard: {
    backgroundColor: colors.white,
    padding: spacing.md,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    marginBottom: spacing.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2
  },
  limitTitle: {
    ...typography.subtitle,
    color: colors.text,
    marginBottom: spacing.xs
  },
  limitDescription: {
    ...typography.body,
    color: colors.muted
  },
  generateButton: {
    backgroundColor: colors.primary,
    paddingVertical: spacing.md,
    borderRadius: 18,
    alignItems: 'center',
    marginBottom: spacing.lg,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4
  },
  generateButtonDisabled: {
    opacity: 0.7
  },
  generateButtonText: {
    color: '#fff',
    fontWeight: '600'
  },
  errorCard: {
    backgroundColor: '#FEE2E2',
    padding: spacing.md,
    borderRadius: 16,
    marginBottom: spacing.lg
  },
  errorText: {
    ...typography.body,
    color: colors.danger
  },
  resultCard: {
    backgroundColor: colors.white,
    padding: spacing.md,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3
  },
  resultTitle: {
    ...typography.subtitle,
    color: colors.text,
    marginBottom: spacing.sm
  },
  resultText: {
    ...typography.body,
    color: colors.text,
    marginBottom: spacing.md
  },
  copyButton: {
    alignSelf: 'flex-start',
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
    borderRadius: 12,
    backgroundColor: colors.secondary
  },
  copyButtonText: {
    color: '#fff',
    fontWeight: '600'
  }
});

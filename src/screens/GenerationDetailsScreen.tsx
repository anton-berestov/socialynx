import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import * as Clipboard from 'expo-clipboard';
import { RootStackParamList } from '../navigation/types';
import { lightColors, darkColors, spacing, typography, borderRadius, shadows } from '../styles/theme';
import { GeneratedContentItem } from '../types/content';
import { useAuth } from '../context/AuthContext';
import { fetchGenerations } from '../services/firestoreService';
import { useTheme } from '../context/ThemeContext';

export const GenerationDetailsScreen: React.FC<NativeStackScreenProps<RootStackParamList, 'GenerationDetails'>> = ({ route }) => {
  const { isDark } = useTheme();
  const colors = isDark ? darkColors : lightColors;

  const { user } = useAuth();
  const [item, setItem] = useState<GeneratedContentItem | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const run = async () => {
      if (!user || !route.params?.id) {
        setLoading(false);
        return;
      }
      setLoading(true);
      try {
        const data = await fetchGenerations(user.uid);
        const found = data.find((it) => it.id === route.params?.id) ?? null;
        setItem(found);
      } finally {
        setLoading(false);
      }
    };
    run();
  }, [user, route.params?.id]);

  const onCopy = async () => {
    if (!item) return;
    await Clipboard.setStringAsync(item.result);
    Alert.alert('Скопировано', 'Текст добавлен в буфер обмена');
  };

  const styles = createStyles(colors, isDark);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator color={colors.primary} size="large" />
      </View>
    );
  }

  if (!item) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyIcon}>📭</Text>
        <Text style={styles.emptyTitle}>Не найдено</Text>
        <Text style={styles.emptyText}>
          Не удалось найти генерацию. Попробуйте заново из истории.
        </Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <View style={styles.metadata}>
          <View style={styles.typeBadge}>
            <Text style={styles.typeBadgeText}>{item.type}</Text>
          </View>
          <Text style={styles.date}>
            {new Date(item.createdAt).toLocaleDateString('ru-RU', {
              day: 'numeric',
              month: 'long',
              year: 'numeric'
            })}
          </Text>
        </View>
      </View>

      <View style={styles.promptCard}>
        <Text style={styles.promptLabel}>Тема</Text>
        <Text style={styles.promptText}>{item.prompt}</Text>
      </View>

      <View style={styles.resultCard}>
        <View style={styles.resultHeader}>
          <Text style={styles.resultLabel}>Результат</Text>
          <TouchableOpacity onPress={onCopy} style={styles.copyButton} activeOpacity={0.7}>
            <Text style={styles.copyButtonText}>Скопировать</Text>
          </TouchableOpacity>
        </View>
        <Text style={styles.resultText}>{item.result}</Text>
      </View>

      {item.tokensUsed && item.tokensUsed > 0 && (
        <View style={styles.statsCard}>
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>Токенов использовано</Text>
            <Text style={styles.statValue}>{item.tokensUsed}</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>Тон</Text>
            <Text style={styles.statValue}>{item.tone || 'Дружелюбный'}</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>Длина</Text>
            <Text style={styles.statValue}>{item.length || 'Средняя'}</Text>
          </View>
        </View>
      )}
    </ScrollView>
  );
};

const createStyles = (colors: typeof lightColors, isDark: boolean) => StyleSheet.create({
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
    backgroundColor: colors.background
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: spacing.lg
  },
  emptyTitle: {
    ...typography.heading,
    color: colors.text,
    marginBottom: spacing.sm,
    textAlign: 'center'
  },
  emptyText: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    maxWidth: 280
  },
  container: {
    flex: 1,
    backgroundColor: colors.background
  },
  content: {
    padding: spacing.lg
  },
  header: {
    marginBottom: spacing.lg
  },
  metadata: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  typeBadge: {
    backgroundColor: isDark ? 'rgba(129, 140, 248, 0.15)' : 'rgba(99, 102, 241, 0.1)',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md
  },
  typeBadgeText: {
    ...typography.button,
    color: colors.primary,
    textTransform: 'capitalize',
    fontSize: 14
  },
  date: {
    ...typography.caption,
    color: colors.textTertiary
  },
  promptCard: {
    backgroundColor: colors.surface,
    padding: spacing.lg,
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.lg,
    ...shadows.sm
  },
  promptLabel: {
    ...typography.caption,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
    textTransform: 'uppercase',
    letterSpacing: 0.5
  },
  promptText: {
    ...typography.heading,
    color: colors.text,
    lineHeight: 28
  },
  resultCard: {
    backgroundColor: colors.surface,
    padding: spacing.lg,
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.lg,
    ...shadows.md
  },
  resultHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md
  },
  resultLabel: {
    ...typography.caption,
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5
  },
  copyButton: {
    backgroundColor: colors.primary,
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
    lineHeight: 26
  },
  statsCard: {
    backgroundColor: colors.surface,
    padding: spacing.lg,
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.sm
  },
  statItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.sm
  },
  statLabel: {
    ...typography.body,
    color: colors.textSecondary
  },
  statValue: {
    ...typography.body,
    color: colors.text,
    fontWeight: '600',
    textTransform: 'capitalize'
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: spacing.xs
  }
});
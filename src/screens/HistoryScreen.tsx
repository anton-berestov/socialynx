import React, { useCallback, useState, useRef } from 'react';
import { ActivityIndicator, FlatList, RefreshControl, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../context/AuthContext';
import { fetchGenerations } from '../services/firestoreService';
import { GeneratedContentItem } from '../types/content';
import { lightColors, darkColors, spacing, typography, borderRadius, shadows } from '../styles/theme';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import { useSubscription } from '../context/SubscriptionContext';
import { useTheme } from '../context/ThemeContext';

export const HistoryScreen: React.FC = () => {
  const { isDark } = useTheme();
  const colors = isDark ? darkColors : lightColors;

  const { user } = useAuth();
  const [items, setItems] = useState<GeneratedContentItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { status } = useSubscription();
  const isPro = status === 'pro';
  const insets = useSafeAreaInsets();
  const userRef = useRef(user);
  const isProRef = useRef(isPro);
  const hasLoadedRef = useRef(false);

  userRef.current = user;
  isProRef.current = isPro;

  const load = useCallback(async (isRefresh = false, force = false) => {
    if (!userRef.current || !isProRef.current) {
      setItems([]);
      hasLoadedRef.current = false;
      return;
    }

    if (hasLoadedRef.current && !force) {
      return;
    }

    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    try {
      const data = await fetchGenerations(userRef.current.uid);
      setItems(data);
      hasLoadedRef.current = true;
    } finally {
      if (isRefresh) {
        setRefreshing(false);
      } else {
        setLoading(false);
      }
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const onRefresh = useCallback(() => {
    load(true, true);
  }, [load]);

  const styles = createStyles(colors, isDark);

  if (!user) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyIcon}>🔐</Text>
        <Text style={styles.emptyTitle}>Войдите в аккаунт</Text>
        <Text style={styles.emptyText}>
          Авторизуйтесь, чтобы сохранять и просматривать историю генераций
        </Text>
      </View>
    );
  }

  if (!isPro) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyIcon}>✨</Text>
        <Text style={styles.emptyTitle}>История доступна в PRO</Text>
        <Text style={styles.emptyText}>
          Сохранённые генерации доступны только подписчикам SociaLynx PRO
        </Text>
        <TouchableOpacity
          onPress={() => navigation.navigate('Paywall')}
          style={styles.upgradeButton}
        >
          <Text style={styles.upgradeButtonText}>Оформить PRO</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + spacing.lg }]}>
        <Text style={styles.title}>История</Text>
        <Text style={styles.subtitle}>Все ваши генерации</Text>
      </View>
      {loading && !refreshing ? (
        <View style={styles.loaderContainer}>
          <ActivityIndicator color={colors.primary} size="large" />
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={colors.primary}
              colors={[colors.primary]}
            />
          }
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.item}
              onPress={() => navigation.navigate('GenerationDetails', { id: item.id })}
              activeOpacity={0.7}
            >
              <View style={styles.itemHeader}>
                <View style={styles.typeBadge}>
                  <Text style={styles.typeBadgeText}>{item.type}</Text>
                </View>
                <Text style={styles.itemDate}>
                  {new Date(item.createdAt).toLocaleDateString('ru-RU', {
                    day: 'numeric',
                    month: 'short'
                  })}
                </Text>
              </View>
              <Text style={styles.itemPrompt} numberOfLines={2}>{item.prompt}</Text>
              <Text style={styles.itemResult} numberOfLines={3}>{item.result}</Text>
            </TouchableOpacity>
          )}
          ListEmptyComponent={
            <View style={styles.emptyList}>
              <Text style={styles.emptyListIcon}>📝</Text>
              <Text style={styles.emptyListTitle}>Пока пусто</Text>
              <Text style={styles.emptyListText}>
                У вас пока нет сохранённых генераций. Создайте первый пост!
              </Text>
            </View>
          }
        />
      )}
    </View>
  );
};

const createStyles = (colors: typeof lightColors, isDark: boolean) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background
  },
  header: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
    backgroundColor: colors.background
  },
  title: {
    ...typography.title,
    color: colors.text,
    marginBottom: spacing.xs
  },
  subtitle: {
    ...typography.body,
    color: colors.textSecondary
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
    marginBottom: spacing.xl,
    lineHeight: 22
  },
  upgradeButton: {
    backgroundColor: colors.primary,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    borderRadius: borderRadius.lg,
    ...shadows.md
  },
  upgradeButtonText: {
    ...typography.button,
    color: '#fff'
  },
  loaderContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center'
  },
  listContent: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl
  },
  item: {
    backgroundColor: colors.surface,
    padding: spacing.lg,
    borderRadius: borderRadius.xl,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.sm
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md
  },
  typeBadge: {
    backgroundColor: isDark ? 'rgba(129, 140, 248, 0.15)' : 'rgba(99, 102, 241, 0.1)',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm
  },
  typeBadgeText: {
    ...typography.caption,
    color: colors.primary,
    fontWeight: '600',
    textTransform: 'capitalize'
  },
  itemDate: {
    ...typography.caption,
    color: colors.textTertiary
  },
  itemPrompt: {
    ...typography.subtitle,
    color: colors.text,
    marginBottom: spacing.sm
  },
  itemResult: {
    ...typography.body,
    color: colors.textSecondary,
    lineHeight: 20
  },
  emptyList: {
    alignItems: 'center',
    paddingVertical: spacing.xxl
  },
  emptyListIcon: {
    fontSize: 48,
    marginBottom: spacing.md
  },
  emptyListTitle: {
    ...typography.heading,
    color: colors.text,
    marginBottom: spacing.sm
  },
  emptyListText: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
    maxWidth: 280,
    lineHeight: 22
  }
});
import React, { useCallback, useState, useRef } from 'react';
import { ActivityIndicator, FlatList, RefreshControl, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../context/AuthContext';
import { fetchGenerations } from '../services/firestoreService';
import { GeneratedContentItem } from '../types/content';
import { colors, spacing, typography } from '../styles/theme';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import { useSubscription } from '../context/SubscriptionContext';

export const HistoryScreen: React.FC = () => {
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

  if (!user) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>
          Авторизуйтесь, чтобы сохранять и просматривать историю генераций.
        </Text>
      </View>
    );
  }

  if (!isPro) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.proTitle}>История доступна в PRO</Text>
        <Text style={styles.proDescription}>
          Сохранённые посты и проекты доступны только подписчикам SociaLynx PRO.
        </Text>
        <TouchableOpacity
          onPress={() => navigation.navigate('Paywall')}
          style={styles.proButton}
        >
          <Text style={styles.proButtonText}>Оформить PRO</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + spacing.lg }]}>
        <Text style={styles.title}>История</Text>
      </View>
      {loading && !refreshing ? (
        <ActivityIndicator color={colors.primary} style={styles.loader} />
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
            >
              <Text style={styles.itemPrompt}>{item.prompt}</Text>
              <Text style={styles.itemMeta}>
                {item.type} · {new Date(item.createdAt).toLocaleString()}
              </Text>
            </TouchableOpacity>
          )}
          ListEmptyComponent={
            <Text style={styles.emptyListText}>
              У вас пока нет сохраненных генераций. Сгенерируйте первый пост!
            </Text>
          }
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background
  },
  header: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.sm
  },
  title: {
    ...typography.title,
    color: colors.text
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.lg
  },
  emptyText: {
    ...typography.body,
    color: colors.muted,
    textAlign: 'center'
  },
  proTitle: {
    ...typography.subtitle,
    color: colors.text,
    marginBottom: spacing.sm
  },
  proDescription: {
    ...typography.body,
    color: colors.muted,
    textAlign: 'center',
    marginBottom: spacing.lg
  },
  proButton: {
    backgroundColor: colors.primary,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: 18
  },
  proButtonText: {
    color: '#fff',
    fontWeight: '600'
  },
  loader: {
    marginTop: spacing.lg
  },
  listContent: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg
  },
  item: {
    backgroundColor: '#fff',
    padding: spacing.md,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginBottom: spacing.md
  },
  itemPrompt: {
    ...typography.subtitle,
    color: colors.text,
    marginBottom: spacing.xs
  },
  itemMeta: {
    ...typography.caption,
    color: colors.muted
  },
  emptyListText: {
    ...typography.body,
    color: colors.muted
  }
});

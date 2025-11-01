import React, { useState } from 'react';
import { ActivityIndicator, Alert, Linking, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { PAYMENT_PLANS, createPaymentSession } from '../services/yookassaService';
import { colors, spacing, typography } from '../styles/theme';
import { useAuth } from '../context/AuthContext';
import { useSubscription } from '../context/SubscriptionContext';

export const PaywallScreen: React.FC = () => {
  const { user } = useAuth();
  const { refresh } = useSubscription();
  const navigation = useNavigation();
  const [loadingPlanId, setLoadingPlanId] = useState<string | null>(null);
  const insets = useSafeAreaInsets();

  const handleSubscribe = async (planId: typeof PAYMENT_PLANS[number]['id']) => {
    if (!user) {
      Alert.alert('Войдите', 'Авторизуйтесь, чтобы оформить подписку.');
      return;
    }

    setLoadingPlanId(planId);
    try {
      const session = await createPaymentSession(user.uid, planId);
      Alert.alert(
        'Перейдите к оплате',
        'После оплаты нажмите "Готово" для обновления статуса.',
        [
          {
            text: 'Открыть',
            onPress: () => Linking.openURL(session.confirmationUrl)
          },
          {
            text: 'Готово',
            onPress: async () => {
              // Ждем немного и обновляем статус
              setTimeout(async () => {
                await refresh();
                Alert.alert('Успешно!', 'Подписка активирована! Перезапустите приложение если PRO не активировался.', [
                  { text: 'OK', onPress: () => navigation.goBack() }
                ]);
              }, 2000);
            }
          }
        ]
      );
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Не удалось создать платежную сессию';
      Alert.alert('Ошибка', message);
    } finally {
      setLoadingPlanId(null);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={[styles.content, { paddingTop: insets.top || spacing.lg }]}>
      <Text style={styles.title}>SociaLynx PRO</Text>
      <Text style={styles.description}>
        PRO-подписка открывает длинные тексты, серию постов, выбор тона и отключает рекламу.
      </Text>

      {PAYMENT_PLANS.map((plan) => (
        <View key={plan.id} style={styles.planCard}>
          <Text style={styles.planTitle}>{plan.title}</Text>
          <Text style={styles.planPeriod}>{plan.periodLabel}</Text>
          <TouchableOpacity
            onPress={() => handleSubscribe(plan.id)}
            style={[styles.selectButton, loadingPlanId === plan.id && styles.selectButtonDisabled]}
            disabled={loadingPlanId === plan.id}
          >
            {loadingPlanId === plan.id ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.selectButtonText}>Выбрать</Text>
            )}
          </TouchableOpacity>
        </View>
      ))}

      <View style={styles.featuresCard}>
        <Text style={styles.featuresTitle}>Что включено</Text>
        <Text style={styles.featureItem}>• Серия постов и длинные тексты</Text>
        <Text style={styles.featureItem}>• Выбор тона (дружелюбный, экспертный, продающий)</Text>
        <Text style={styles.featureItem}>• Запоминание проектов и история</Text>
        <Text style={styles.featureItem}>• Без рекламы и без лимитов</Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background
  },
  content: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg
  },
  title: {
    ...typography.title,
    color: colors.text,
    marginBottom: spacing.sm
  },
  description: {
    ...typography.body,
    color: colors.muted,
    marginBottom: spacing.lg
  },
  planCard: {
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginBottom: spacing.lg
  },
  planTitle: {
    ...typography.subtitle,
    color: colors.text,
    marginBottom: spacing.xs
  },
  planPeriod: {
    ...typography.body,
    color: colors.muted,
    marginBottom: spacing.md
  },
  selectButton: {
    backgroundColor: colors.primary,
    paddingVertical: spacing.md,
    borderRadius: 18,
    alignItems: 'center'
  },
  selectButtonDisabled: {
    opacity: 0.6
  },
  selectButtonText: {
    color: '#fff',
    fontWeight: '600'
  },
  featuresCard: {
    backgroundColor: '#fff',
    padding: spacing.lg,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#E5E7EB'
  },
  featuresTitle: {
    ...typography.subtitle,
    color: colors.text,
    marginBottom: spacing.sm
  },
  featureItem: {
    ...typography.body,
    color: colors.muted,
    marginBottom: spacing.xs
  }
});

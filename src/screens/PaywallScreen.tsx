import React, { useState } from 'react';
import { ActivityIndicator, Alert, Linking, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { PAYMENT_PLANS, createPaymentSession } from '../services/yookassaService';
import { lightColors, darkColors, spacing, typography, borderRadius, shadows } from '../styles/theme';
import { useAuth } from '../context/AuthContext';
import { useSubscription } from '../context/SubscriptionContext';
import { useTheme } from '../context/ThemeContext';

export const PaywallScreen: React.FC = () => {
  const { isDark } = useTheme();
  const colors = isDark ? darkColors : lightColors;

  const { user } = useAuth();
  const { refresh } = useSubscription();
  const navigation = useNavigation();
  const [loadingPlanId, setLoadingPlanId] = useState<string | null>(null);
  const [selectedPlan, setSelectedPlan] = useState<string>(PAYMENT_PLANS[0]?.id || 'plan_monthly');
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

  const styles = createStyles(colors, isDark);

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={[styles.content, { paddingTop: insets.top + spacing.lg }]}
    >
      <View style={styles.header}>
        <View style={styles.iconContainer}>
          <Text style={styles.icon}>✨</Text>
        </View>
        <Text style={styles.title}>SociaLynx PRO</Text>
        <Text style={styles.description}>
          Безлимитные генерации и расширенные возможности для профессионалов
        </Text>
      </View>

      <View style={styles.featuresSection}>
        <Text style={styles.featuresSectionTitle}>Что входит в PRO</Text>
        {[
          { icon: '∞', title: 'Безлимитные генерации', description: 'Создавайте контент без ограничений' },
          { icon: '🎨', title: 'Выбор тона', description: 'Дружелюбный, экспертный или продающий' },
          { icon: '📏', title: 'Длинные тексты', description: 'Генерация развёрнутых постов' },
          { icon: '📚', title: 'История генераций', description: 'Сохраняйте и редактируйте контент' },
          { icon: '🚫', title: 'Без рекламы', description: 'Чистый интерфейс без отвлечений' }
        ].map((feature, index) => (
          <View key={index} style={styles.featureItem}>
            <View style={styles.featureIcon}>
              <Text style={styles.featureIconText}>{feature.icon}</Text>
            </View>
            <View style={styles.featureContent}>
              <Text style={styles.featureTitle}>{feature.title}</Text>
              <Text style={styles.featureDescription}>{feature.description}</Text>
            </View>
          </View>
        ))}
      </View>

      <View style={styles.plansSection}>
        <Text style={styles.plansSectionTitle}>Выберите тариф</Text>
        {PAYMENT_PLANS.map((plan) => {
          const isPopular = plan.id === 'plan_quarterly';
          const isSelected = selectedPlan === plan.id;

          return (
            <TouchableOpacity
              key={plan.id}
              onPress={() => setSelectedPlan(plan.id)}
              style={[
                styles.planCard,
                isSelected && styles.planCardSelected,
                isPopular && styles.planCardPopular
              ]}
              activeOpacity={0.7}
            >
              {isPopular && (
                <View style={styles.popularBadge}>
                  <Text style={styles.popularBadgeText}>Популярный</Text>
                </View>
              )}
              <View style={styles.planHeader}>
                <View>
                  <Text style={[styles.planTitle, isSelected && styles.planTitleSelected]}>
                    {plan.title}
                  </Text>
                  <Text style={[styles.planPeriod, isSelected && styles.planPeriodSelected]}>
                    {plan.periodLabel}
                  </Text>
                </View>
                <View style={[styles.radioOuter, isSelected && styles.radioOuterSelected]}>
                  {isSelected && <View style={styles.radioInner} />}
                </View>
              </View>
            </TouchableOpacity>
          );
        })}
      </View>

      <TouchableOpacity
        onPress={() => handleSubscribe(selectedPlan)}
        style={[styles.subscribeButton, loadingPlanId !== null && styles.subscribeButtonDisabled]}
        disabled={loadingPlanId !== null}
        activeOpacity={0.8}
      >
        {loadingPlanId !== null ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.subscribeButtonText}>
            Оформить подписку
          </Text>
        )}
      </TouchableOpacity>

      <Text style={styles.disclaimer}>
        Подписка автоматически продлевается. Отменить можно в любой момент.
      </Text>
    </ScrollView>
  );
};

const createStyles = (colors: typeof lightColors, isDark: boolean) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background
  },
  content: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl
  },
  header: {
    alignItems: 'center',
    marginBottom: spacing.xl
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: borderRadius.full,
    backgroundColor: isDark ? 'rgba(129, 140, 248, 0.15)' : 'rgba(99, 102, 241, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg
  },
  icon: {
    fontSize: 40
  },
  title: {
    ...typography.hero,
    color: colors.text,
    marginBottom: spacing.sm,
    textAlign: 'center'
  },
  description: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    maxWidth: 320
  },
  featuresSection: {
    marginBottom: spacing.xl
  },
  featuresSectionTitle: {
    ...typography.heading,
    color: colors.text,
    marginBottom: spacing.lg
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.lg
  },
  featureIcon: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.md,
    backgroundColor: isDark ? 'rgba(129, 140, 248, 0.1)' : 'rgba(99, 102, 241, 0.05)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md
  },
  featureIconText: {
    fontSize: 24
  },
  featureContent: {
    flex: 1
  },
  featureTitle: {
    ...typography.subtitle,
    color: colors.text,
    marginBottom: spacing.xs
  },
  featureDescription: {
    ...typography.body,
    color: colors.textSecondary,
    lineHeight: 20
  },
  plansSection: {
    marginBottom: spacing.lg
  },
  plansSectionTitle: {
    ...typography.heading,
    color: colors.text,
    marginBottom: spacing.md
  },
  planCard: {
    backgroundColor: colors.surface,
    padding: spacing.lg,
    borderRadius: borderRadius.xl,
    borderWidth: 2,
    borderColor: colors.border,
    marginBottom: spacing.md,
    position: 'relative',
    ...shadows.sm
  },
  planCardSelected: {
    borderColor: colors.primary,
    ...shadows.md
  },
  planCardPopular: {
    borderColor: colors.secondary
  },
  popularBadge: {
    position: 'absolute',
    top: -12,
    left: spacing.lg,
    backgroundColor: colors.secondary,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm
  },
  popularBadgeText: {
    ...typography.caption,
    color: '#fff',
    fontWeight: '600'
  },
  planHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  planTitle: {
    ...typography.heading,
    color: colors.text,
    marginBottom: spacing.xs
  },
  planTitleSelected: {
    color: colors.primary
  },
  planPeriod: {
    ...typography.body,
    color: colors.textSecondary
  },
  planPeriodSelected: {
    color: colors.textSecondary
  },
  radioOuter: {
    width: 24,
    height: 24,
    borderRadius: borderRadius.full,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center'
  },
  radioOuterSelected: {
    borderColor: colors.primary
  },
  radioInner: {
    width: 12,
    height: 12,
    borderRadius: borderRadius.full,
    backgroundColor: colors.primary
  },
  subscribeButton: {
    backgroundColor: colors.primary,
    paddingVertical: spacing.lg,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    marginBottom: spacing.md,
    ...shadows.lg
  },
  subscribeButtonDisabled: {
    opacity: 0.6
  },
  subscribeButtonText: {
    ...typography.button,
    color: '#fff',
    fontSize: 17
  },
  disclaimer: {
    ...typography.caption,
    color: colors.textTertiary,
    textAlign: 'center',
    lineHeight: 18
  }
});
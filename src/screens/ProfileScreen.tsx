import React, { useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../context/AuthContext';
import { useSubscription } from '../context/SubscriptionContext';
import { useTheme } from '../context/ThemeContext';
import { lightColors, darkColors, spacing, typography, borderRadius, shadows } from '../styles/theme';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';

export const ProfileScreen: React.FC = () => {
  const { isDark, mode, setMode } = useTheme();
  const colors = isDark ? darkColors : lightColors;

  const { user, signInWithEmail, signUpWithEmail, logout, loading } = useAuth();
  const { status } = useSubscription();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const insets = useSafeAreaInsets();

  const handleAuth = async (authMode: 'login' | 'signup') => {
    if (!email || !password) {
      Alert.alert('Введите данные', 'Укажите email и пароль.');
      return;
    }
    setSubmitting(true);
    try {
      if (authMode === 'login') {
        await signInWithEmail(email.trim(), password);
      } else {
        await signUpWithEmail(email.trim(), password);
      }
      setEmail('');
      setPassword('');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Ошибка авторизации';
      Alert.alert('Ошибка', message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleLogout = async () => {
    await logout();
  };

  const styles = createStyles(colors, isDark);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator color={colors.primary} size="large" />
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={[styles.content, { paddingTop: insets.top + spacing.lg }]}
    >
      <View style={styles.header}>
        <Text style={styles.title}>Профиль</Text>
        {user && (
          <Text style={styles.subtitle}>Настройки аккаунта</Text>
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Тема оформления</Text>
        <View style={styles.themeCard}>
          <TouchableOpacity
            style={[styles.themeOption, mode === 'light' && styles.themeOptionActive]}
            onPress={() => setMode('light')}
            activeOpacity={0.7}
          >
            <View style={styles.themeIcon}>
              <Text style={styles.themeEmoji}>☀️</Text>
            </View>
            <Text style={[styles.themeLabel, mode === 'light' && styles.themeLabelActive]}>
              Светлая
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.themeOption, mode === 'dark' && styles.themeOptionActive]}
            onPress={() => setMode('dark')}
            activeOpacity={0.7}
          >
            <View style={styles.themeIcon}>
              <Text style={styles.themeEmoji}>🌙</Text>
            </View>
            <Text style={[styles.themeLabel, mode === 'dark' && styles.themeLabelActive]}>
              Тёмная
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.themeOption, mode === 'auto' && styles.themeOptionActive]}
            onPress={() => setMode('auto')}
            activeOpacity={0.7}
          >
            <View style={styles.themeIcon}>
              <Text style={styles.themeEmoji}>⚙️</Text>
            </View>
            <Text style={[styles.themeLabel, mode === 'auto' && styles.themeLabelActive]}>
              Авто
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {user ? (
        <>
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Аккаунт</Text>
            <View style={styles.card}>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Email</Text>
                <Text style={styles.infoValue}>
                  {user.email ?? 'Не указан'}
                </Text>
              </View>
              <View style={styles.divider} />
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Подписка</Text>
                <View style={[styles.statusBadge, status === 'pro' && styles.statusBadgePro]}>
                  <Text style={[styles.statusBadgeText, status === 'pro' && styles.statusBadgeTextPro]}>
                    {status === 'pro' ? '✨ PRO' : 'Free'}
                  </Text>
                </View>
              </View>
            </View>
          </View>

          {status !== 'pro' && (
            <TouchableOpacity
              onPress={() => navigation.navigate('Paywall')}
              style={styles.upgradeCard}
              activeOpacity={0.8}
            >
              <View style={styles.upgradeContent}>
                <Text style={styles.upgradeTitle}>Получить PRO</Text>
                <Text style={styles.upgradeDescription}>
                  Безлимитные генерации и расширенные настройки
                </Text>
              </View>
              <Text style={styles.upgradeArrow}>→</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            onPress={handleLogout}
            style={styles.logoutButton}
            activeOpacity={0.7}
          >
            <Text style={styles.logoutButtonText}>Выйти из аккаунта</Text>
          </TouchableOpacity>
        </>
      ) : (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Вход в аккаунт</Text>
          <View style={styles.card}>
            <Text style={styles.authTitle}>Войдите или создайте аккаунт</Text>
            <Text style={styles.authDescription}>
              Сохраняйте генерации и синхронизируйте данные между устройствами
            </Text>

            <TextInput
              placeholder="Email"
              placeholderTextColor={colors.textTertiary}
              value={email}
              keyboardType="email-address"
              autoCapitalize="none"
              onChangeText={setEmail}
              style={styles.input}
            />
            <TextInput
              placeholder="Пароль"
              placeholderTextColor={colors.textTertiary}
              value={password}
              secureTextEntry
              onChangeText={setPassword}
              style={styles.input}
            />

            <TouchableOpacity
              onPress={() => handleAuth('login')}
              disabled={submitting || loading}
              style={[styles.loginButton, (submitting || loading) && styles.buttonDisabled]}
              activeOpacity={0.8}
            >
              {submitting ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.loginButtonText}>Войти</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => handleAuth('signup')}
              disabled={submitting || loading}
              style={[styles.signupButton, (submitting || loading) && styles.buttonDisabled]}
              activeOpacity={0.8}
            >
              <Text style={styles.signupButtonText}>Создать аккаунт</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      <View style={styles.footer}>
        <Text style={styles.footerText}>SociaLynx v1.0.0</Text>
      </View>
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
  container: {
    flex: 1,
    backgroundColor: colors.background
  },
  content: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl
  },
  header: {
    marginBottom: spacing.xl
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
  section: {
    marginBottom: spacing.lg
  },
  sectionTitle: {
    ...typography.caption,
    color: colors.textSecondary,
    marginBottom: spacing.md,
    textTransform: 'uppercase',
    letterSpacing: 0.5
  },
  themeCard: {
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    flexDirection: 'row',
    gap: spacing.sm,
    ...shadows.sm
  },
  themeOption: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    backgroundColor: colors.backgroundSecondary
  },
  themeOptionActive: {
    backgroundColor: colors.primary
  },
  themeIcon: {
    marginBottom: spacing.xs
  },
  themeEmoji: {
    fontSize: 24
  },
  themeLabel: {
    ...typography.caption,
    color: colors.textSecondary,
    fontWeight: '600'
  },
  themeLabelActive: {
    color: '#fff'
  },
  card: {
    backgroundColor: colors.surface,
    padding: spacing.lg,
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.sm
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.sm
  },
  infoLabel: {
    ...typography.body,
    color: colors.textSecondary
  },
  infoValue: {
    ...typography.body,
    color: colors.text,
    fontWeight: '600'
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: spacing.sm
  },
  statusBadge: {
    backgroundColor: isDark ? 'rgba(156, 163, 175, 0.15)' : 'rgba(107, 114, 128, 0.1)',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm
  },
  statusBadgePro: {
    backgroundColor: isDark ? 'rgba(129, 140, 248, 0.15)' : 'rgba(99, 102, 241, 0.1)'
  },
  statusBadgeText: {
    ...typography.caption,
    color: colors.textSecondary,
    fontWeight: '600'
  },
  statusBadgeTextPro: {
    color: colors.primary
  },
  upgradeCard: {
    backgroundColor: isDark
      ? 'linear-gradient(135deg, rgba(99, 102, 241, 0.1) 0%, rgba(236, 72, 153, 0.1) 100%)'
      : colors.surface,
    padding: spacing.lg,
    borderRadius: borderRadius.xl,
    borderWidth: 1.5,
    borderColor: colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.lg,
    ...shadows.md
  },
  upgradeContent: {
    flex: 1
  },
  upgradeTitle: {
    ...typography.heading,
    color: colors.text,
    marginBottom: spacing.xs
  },
  upgradeDescription: {
    ...typography.body,
    color: colors.textSecondary
  },
  upgradeArrow: {
    fontSize: 28,
    color: colors.primary
  },
  logoutButton: {
    backgroundColor: colors.surface,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.danger,
    alignItems: 'center',
    marginBottom: spacing.lg,
    ...shadows.sm
  },
  logoutButtonText: {
    ...typography.button,
    color: colors.danger
  },
  authTitle: {
    ...typography.heading,
    color: colors.text,
    marginBottom: spacing.sm
  },
  authDescription: {
    ...typography.body,
    color: colors.textSecondary,
    marginBottom: spacing.lg,
    lineHeight: 22
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
    ...typography.body,
    color: colors.text,
    backgroundColor: colors.backgroundSecondary
  },
  loginButton: {
    backgroundColor: colors.primary,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    marginBottom: spacing.sm,
    marginTop: spacing.md,
    ...shadows.md
  },
  loginButtonText: {
    ...typography.button,
    color: '#fff'
  },
  signupButton: {
    backgroundColor: colors.surface,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border
  },
  signupButtonText: {
    ...typography.button,
    color: colors.primary
  },
  buttonDisabled: {
    opacity: 0.6
  },
  footer: {
    alignItems: 'center',
    paddingVertical: spacing.xl
  },
  footerText: {
    ...typography.caption,
    color: colors.textTertiary
  }
});
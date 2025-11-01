import React, { useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../context/AuthContext';
import { useSubscription } from '../context/SubscriptionContext';
import { colors, spacing, typography } from '../styles/theme';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';

export const ProfileScreen: React.FC = () => {
  const { user, signInWithEmail, signUpWithEmail, logout, loading } = useAuth();
  const { status } = useSubscription();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const insets = useSafeAreaInsets();

  const handleAuth = async (mode: 'login' | 'signup') => {
    if (!email || !password) {
      Alert.alert('Введите данные', 'Укажите email и пароль.');
      return;
    }
    setSubmitting(true);
    try {
      if (mode === 'login') {
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

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={[styles.content, { paddingTop: insets.top + spacing.lg }]}>
      <Text style={styles.title}>Профиль</Text>

      {user ? (
        <View style={styles.card}>
          <Text style={styles.email}>
            {user.email ?? 'Аккаунт без email'}
          </Text>
          <Text style={styles.status}>
            Статус: {status === 'pro' ? 'PRO подписка' : 'Free'}
          </Text>

          <TouchableOpacity
            onPress={() => navigation.navigate('Paywall')}
            style={styles.proButton}
          >
            <Text style={styles.proButtonText}>Оформить PRO</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleLogout}
            style={styles.logoutButton}
          >
            <Text style={styles.logoutButtonText}>Выйти</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.card}>
          <Text style={styles.authTitle}>Вход или регистрация</Text>
          <TextInput
            placeholder="Email"
            value={email}
            keyboardType="email-address"
            autoCapitalize="none"
            onChangeText={setEmail}
            style={styles.input}
          />
          <TextInput
            placeholder="Пароль"
            value={password}
            secureTextEntry
            onChangeText={setPassword}
            style={styles.input}
          />

          <TouchableOpacity
            onPress={() => handleAuth('login')}
            disabled={submitting || loading}
            style={[styles.loginButton, (submitting || loading) && styles.buttonDisabled]}
          >
            <Text style={styles.loginButtonText}>Войти</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => handleAuth('signup')}
            disabled={submitting || loading}
            style={[styles.signupButton, (submitting || loading) && styles.buttonDisabled]}
          >
            <Text style={styles.signupButtonText}>Создать аккаунт</Text>
          </TouchableOpacity>
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
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
    paddingBottom: spacing.lg
  },
  title: {
    ...typography.title,
    color: colors.text,
    marginBottom: spacing.md
  },
  card: {
    backgroundColor: '#fff',
    padding: spacing.lg,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB'
  },
  email: {
    ...typography.subtitle,
    color: colors.text,
    marginBottom: spacing.xs
  },
  status: {
    ...typography.body,
    color: colors.muted,
    marginBottom: spacing.lg
  },
  proButton: {
    backgroundColor: colors.secondary,
    paddingVertical: spacing.md,
    borderRadius: 18,
    alignItems: 'center',
    marginBottom: spacing.md
  },
  proButtonText: {
    color: '#fff',
    fontWeight: '600'
  },
  logoutButton: {
    backgroundColor: '#fff',
    paddingVertical: spacing.md,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.primary,
    alignItems: 'center'
  },
  logoutButtonText: {
    color: colors.primary,
    fontWeight: '600'
  },
  authTitle: {
    ...typography.subtitle,
    color: colors.text,
    marginBottom: spacing.md
  },
  input: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    padding: spacing.md,
    marginBottom: spacing.md
  },
  loginButton: {
    backgroundColor: colors.primary,
    paddingVertical: spacing.md,
    borderRadius: 18,
    alignItems: 'center',
    marginBottom: spacing.sm,
    marginTop: spacing.md
  },
  loginButtonText: {
    color: '#fff',
    fontWeight: '600'
  },
  signupButton: {
    backgroundColor: colors.secondary,
    paddingVertical: spacing.md,
    borderRadius: 18,
    alignItems: 'center'
  },
  signupButtonText: {
    color: '#fff',
    fontWeight: '600'
  },
  buttonDisabled: {
    opacity: 0.6
  }
});

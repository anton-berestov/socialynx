import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { onAuthStateChanged, signOut, signInWithEmailAndPassword, createUserWithEmailAndPassword, User } from 'firebase/auth';
import { auth } from '../services/firebase';

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  signUpWithEmail: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

interface FirebaseAuthError {
  code: string;
  message: string;
}

function isFirebaseError(error: unknown): error is FirebaseAuthError {
  return typeof error === 'object' && error !== null && 'code' in error && 'message' in error;
}

function getAuthErrorMessage(error: FirebaseAuthError): string {
  switch (error.code) {
    case 'auth/user-not-found':
      return 'Пользователь с таким email не найден. Проверьте email или зарегистрируйтесь.';
    case 'auth/wrong-password':
      return 'Неверный пароль. Попробуйте еще раз.';
    case 'auth/invalid-email':
      return 'Неверный формат email. Проверьте правильность ввода.';
    case 'auth/user-disabled':
      return 'Этот аккаунт был заблокирован.';
    case 'auth/too-many-requests':
      return 'Слишком много попыток входа. Попробуйте позже.';
    case 'auth/email-already-in-use':
      return 'Этот email уже зарегистрирован. Войдите в существующий аккаунт.';
    case 'auth/weak-password':
      return 'Слабый пароль. Используйте минимум 6 символов.';
    case 'auth/operation-not-allowed':
      return 'Регистрация временно недоступна.';
    case 'auth/invalid-credential':
      return 'Неверные учетные данные. Проверьте email и пароль.';
    default:
      return `Ошибка авторизации: ${error.message}`;
  }
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      loading,
      async signInWithEmail(email: string, password: string) {
        try {
          await signInWithEmailAndPassword(auth, email, password);
        } catch (error) {
          if (isFirebaseError(error)) {
            throw new Error(getAuthErrorMessage(error));
          }
          throw error;
        }
      },
      async signUpWithEmail(email: string, password: string) {
        try {
          await createUserWithEmailAndPassword(auth, email, password);
        } catch (error) {
          if (isFirebaseError(error)) {
            throw new Error(getAuthErrorMessage(error));
          }
          throw error;
        }
      },
      async logout() {
        await signOut(auth);
      }
    }),
    [user, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return ctx;
}

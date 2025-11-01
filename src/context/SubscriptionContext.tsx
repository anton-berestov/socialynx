import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { getSubscriptionStatus } from '../services/subscriptionService';
import { useAuth } from './AuthContext';

interface SubscriptionContextValue {
  status: 'free' | 'pro';
  loading: boolean;
  refresh: () => Promise<void>;
}

const SubscriptionContext = createContext<SubscriptionContextValue | undefined>(undefined);

export const SubscriptionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [status, setStatus] = useState<'free' | 'pro'>('free');
  const [loading, setLoading] = useState(false);

  const fetchStatus = async () => {
    if (!user) {
      setStatus('free');
      return;
    }
    setLoading(true);
    try {
      const current = await getSubscriptionStatus(user.uid);
      setStatus(current.status);
    } finally {
      setLoading(false);
    }
  };

  // Загрузка статуса при изменении пользователя
  useEffect(() => {
    fetchStatus();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.uid]);

  // Обновление статуса при возвращении в приложение
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextAppState: AppStateStatus) => {
      if (nextAppState === 'active' && user) {
        // Приложение стало активным - обновляем статус
        fetchStatus();
      }
    });

    return () => {
      subscription.remove();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.uid]);

  const value = useMemo<SubscriptionContextValue>(
    () => ({ status, loading, refresh: fetchStatus }),
    [status, loading]
  );

  return <SubscriptionContext.Provider value={value}>{children}</SubscriptionContext.Provider>;
};

export function useSubscription() {
  const ctx = useContext(SubscriptionContext);
  if (!ctx) {
    throw new Error('useSubscription must be used within SubscriptionProvider');
  }
  return ctx;
}

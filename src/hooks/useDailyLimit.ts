import { useCallback, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { FREE_DAILY_LIMIT } from '../constants';

const STORAGE_KEY = 'daily_generation_usage';

interface UsageState {
  date: string;
  count: number;
}

function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

export function useDailyLimit(isPro: boolean) {
  const [remaining, setRemaining] = useState(FREE_DAILY_LIMIT);
  const [loading, setLoading] = useState(true);

  const hydrate = useCallback(async () => {
    if (isPro) {
      setRemaining(Number.POSITIVE_INFINITY);
      setLoading(false);
      return;
    }

    let raw: string | null = null;
    try {
      raw = await AsyncStorage.getItem(STORAGE_KEY);
    } catch (err) {
      console.error('Failed to read usage limit', err);
    }
    if (!raw) {
      setRemaining(FREE_DAILY_LIMIT);
      setLoading(false);
      return;
    }

    let parsed: UsageState | null = null;
    try {
      parsed = JSON.parse(raw) as UsageState;
    } catch (err) {
      console.error('Failed to parse usage limit', err);
    }

    if (!parsed) {
      setRemaining(FREE_DAILY_LIMIT);
      setLoading(false);
      return;
    }
    if (parsed.date !== todayKey()) {
      setRemaining(FREE_DAILY_LIMIT);
    } else {
      setRemaining(Math.max(FREE_DAILY_LIMIT - parsed.count, 0));
    }
    setLoading(false);
  }, [isPro]);

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  const consume = useCallback(async () => {
    if (isPro) {
      return;
    }

    let current: UsageState = { date: todayKey(), count: 0 };
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      current = raw ? (JSON.parse(raw) as UsageState) : current;
    } catch (err) {
      console.error('Failed to update usage limit', err);
    }

    if (current.date !== todayKey()) {
      current.date = todayKey();
      current.count = 1;
    } else {
      current.count += 1;
    }

    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(current));
    setRemaining(Math.max(FREE_DAILY_LIMIT - current.count, 0));
  }, [isPro]);

  return {
    remaining,
    loading,
    consume
  };
}

import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import * as Clipboard from 'expo-clipboard';
import { RootStackParamList } from '../navigation/types';
import { colors, spacing, typography } from '../styles/theme';
import { GeneratedContentItem } from '../types/content';
import { useAuth } from '../context/AuthContext';
import { fetchGenerations } from '../services/firestoreService';

export const GenerationDetailsScreen: React.FC<NativeStackScreenProps<RootStackParamList, 'GenerationDetails'>> = ({ route }) => {
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
    if (!item) {
      return;
    }
    await Clipboard.setStringAsync(item.result);
    Alert.alert('Скопировано', 'Текст добавлен в буфер обмена');
  };

  if (loading) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  if (!item) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.lg }}>
        <Text style={{ ...typography.body, color: colors.muted, textAlign: 'center' }}>
          Не удалось найти генерацию. Попробуйте заново из истории.
        </Text>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={{ padding: spacing.lg, backgroundColor: colors.background }}>
      <Text style={{ ...typography.title, color: colors.text, marginBottom: spacing.sm }}>{item.prompt}</Text>
      <Text style={{ ...typography.caption, color: colors.muted, marginBottom: spacing.md }}>
        {item.type} · {new Date(item.createdAt).toLocaleString()}
      </Text>
      <Text style={{ ...typography.body, color: colors.text, marginBottom: spacing.lg }}>{item.result}</Text>
      <TouchableOpacity
        onPress={onCopy}
        style={{ alignSelf: 'flex-start', backgroundColor: colors.primary, paddingVertical: spacing.sm, paddingHorizontal: spacing.md, borderRadius: 14 }}
      >
        <Text style={{ color: '#fff', fontWeight: '600' }}>Скопировать</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

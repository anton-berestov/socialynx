import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, spacing, typography } from '../styles/theme';

interface Props {
  hidden?: boolean;
}

export const AdBannerPlaceholder: React.FC<Props> = ({ hidden }) => {
  if (hidden) {
    return null;
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Реклама</Text>
      <Text style={styles.text}>Здесь будет баннер Яндекс Mobile Ads SDK</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    padding: spacing.md,
    alignItems: 'center',
    marginBottom: spacing.lg
  },
  title: {
    ...typography.subtitle,
    color: colors.text,
    marginBottom: spacing.xs
  },
  text: {
    ...typography.caption,
    color: colors.muted,
    textAlign: 'center'
  }
});

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { lightColors, darkColors, spacing, typography, borderRadius } from '../styles/theme';
import { useTheme } from '../context/ThemeContext';

interface Props {
  hidden?: boolean;
}

export const AdBannerPlaceholder: React.FC<Props> = ({ hidden }) => {
  const { isDark } = useTheme();
  const colors = isDark ? darkColors : lightColors;

  if (hidden) {
    return null;
  }

  const styles = createStyles(colors);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Реклама</Text>
      <Text style={styles.text}>Здесь будет баннер Яндекс Mobile Ads SDK</Text>
    </View>
  );
};

const createStyles = (colors: typeof lightColors) => StyleSheet.create({
  container: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border,
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
    color: colors.textSecondary,
    textAlign: 'center'
  }
});
import React from 'react';
import { StyleSheet, View } from 'react-native';
import { useTranslation } from '@/i18n';
import { useThemedStyles, type Theme } from '@/theme';
import { Button } from './Button';
import { Icon, type IconName } from './Icon';
import { Text } from './Text';

interface EmptyStateProps {
  icon?: IconName;
  title: string;
  message?: string;
  actionLabel?: string;
  onAction?: () => void;
}

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    wrap: {
      alignItems: 'center',
      gap: theme.spacing.sm,
      paddingVertical: theme.spacing.xxl,
      paddingHorizontal: theme.spacing.xl,
    },
    action: { marginTop: theme.spacing.md },
  });

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon = 'file-tray-outline',
  title,
  message,
  actionLabel,
  onAction,
}) => {
  const styles = useThemedStyles(createStyles);
  return (
    <View style={styles.wrap}>
      <Icon name={icon} size={36} color="textSubtle" />
      <Text variant="heading" align="center">
        {title}
      </Text>
      {message ? (
        <Text variant="body" tone="muted" align="center">
          {message}
        </Text>
      ) : null}
      {actionLabel && onAction ? (
        <View style={styles.action}>
          <Button label={actionLabel} onPress={onAction} size="sm" />
        </View>
      ) : null}
    </View>
  );
};

interface ErrorStateProps {
  message: string;
  onRetry?: () => void;
}

export const ErrorState: React.FC<ErrorStateProps> = ({ message, onRetry }) => {
  const { t } = useTranslation();
  return (
    <EmptyState
      icon="cloud-offline-outline"
      title={t('Something went wrong')}
      message={message}
      actionLabel={onRetry ? t('Try again') : undefined}
      onAction={onRetry}
    />
  );
};

import React from 'react';
import { StyleSheet, View } from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import { Card } from '@/components/ui/Card';
import { Text } from '@/components/ui/Text';
import { useTranslation } from '@/i18n';
import type { MemberPass } from '@/storage/member-pass';
import { useThemedStyles, type Theme } from '@/theme';

interface MemberPassCardProps {
  pass: MemberPass;
}

const QR_SIZE = 220;

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    card: { alignItems: 'center', gap: theme.spacing.md },
    // The reader needs dark on light, whatever the app theme is.
    tile: {
      padding: theme.spacing.lg,
      borderRadius: theme.radius.lg,
      backgroundColor: '#FFFFFF',
    },
  });

// The member's QR code: reception scans it to check them in, and again to check them out.
export const MemberPassCard: React.FC<MemberPassCardProps> = ({ pass }) => {
  const styles = useThemedStyles(createStyles);
  const { t } = useTranslation();
  return (
    <Card style={styles.card}>
      <Text variant="label" tone="muted">
        {t('CHECK-IN PASS')}
      </Text>
      <View
        accessible
        accessibilityLabel={t('Your check-in QR code')}
        style={styles.tile}
      >
        <QRCode
          value={pass.clientId}
          size={QR_SIZE}
          color="#000000"
          backgroundColor="#FFFFFF"
        />
      </View>
      <Text variant="heading">{pass.fullName}</Text>
      <Text variant="caption" tone="muted" align="center">
        {t('Show this code at reception. It works without mobile data.')}
      </Text>
    </Card>
  );
};

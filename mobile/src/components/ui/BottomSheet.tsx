import React from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
  useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from '@/i18n';
import { useThemedStyles, type Theme } from '@/theme';
import { Button } from './Button';
import { Icon } from './Icon';
import { Text } from './Text';
import { ToastHost } from './ToastHost';

interface BottomSheetProps {
  visible: boolean;
  title: string;
  description?: string;
  onClose: () => void;
  children: React.ReactNode;
  // The main action of the sheet. Without it the only button is the one that closes the sheet.
  submitLabel?: string;
  onSubmit?: () => void;
  isSubmitting?: boolean;
  submitDisabled?: boolean;
  // "Cancel" by default; use "Close" for sheets that only show information.
  cancelLabel?: string;
}

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    overlay: { flex: 1, justifyContent: 'flex-end' },
    backdrop: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: theme.colors.overlay,
    },
    sheet: {
      backgroundColor: theme.colors.background,
      borderTopLeftRadius: theme.radius.lg + 4,
      borderTopRightRadius: theme.radius.lg + 4,
      paddingTop: theme.spacing.sm,
    },
    handle: {
      alignSelf: 'center',
      width: 40,
      height: 4,
      borderRadius: 2,
      backgroundColor: theme.colors.border,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: theme.spacing.md,
      padding: theme.spacing.lg,
      paddingBottom: theme.spacing.sm,
    },
    titles: { flex: 1, gap: 2 },
    body: { padding: theme.spacing.lg, gap: theme.spacing.md },
    footer: {
      flexDirection: 'row',
      gap: theme.spacing.md,
      padding: theme.spacing.lg,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: theme.colors.border,
    },
    // Both buttons take half of the width, like the drawers of the web app.
    half: { flex: 1 },
  });

// A panel that slides up from the bottom: the mobile way to ask for a choice or a few fields.
// It opens its own toast host, because a modal covers the one of the root layout.
export const BottomSheet: React.FC<BottomSheetProps> = ({
  visible,
  title,
  description,
  onClose,
  children,
  submitLabel,
  onSubmit,
  isSubmitting = false,
  submitDisabled = false,
  cancelLabel,
}) => {
  const styles = useThemedStyles(createStyles);
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const { height } = useWindowDimensions();
  const hasSubmit = Boolean(submitLabel && onSubmit);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <Pressable
          accessibilityLabel={t('Close')}
          style={styles.backdrop}
          onPress={onClose}
        />
        <KeyboardAvoidingView behavior="padding">
          <View style={[styles.sheet, { paddingBottom: insets.bottom }]}>
            <View style={styles.handle} />
            <View style={styles.header}>
              <View style={styles.titles}>
                <Text variant="heading">{title}</Text>
                {description ? (
                  <Text variant="caption" tone="muted">
                    {description}
                  </Text>
                ) : null}
              </View>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={t('Close')}
                hitSlop={12}
                onPress={onClose}
              >
                <Icon name="close" size={24} />
              </Pressable>
            </View>
            <ScrollView
              style={{ maxHeight: height * 0.6 }}
              contentContainerStyle={styles.body}
              keyboardShouldPersistTaps="handled"
            >
              {children}
            </ScrollView>
            <View style={styles.footer}>
              <View style={styles.half}>
                <Button
                  label={cancelLabel ?? t('Cancel')}
                  variant="secondary"
                  onPress={onClose}
                  fullWidth
                />
              </View>
              {hasSubmit ? (
                <View style={styles.half}>
                  <Button
                    label={submitLabel ?? ''}
                    onPress={() => onSubmit?.()}
                    loading={isSubmitting}
                    disabled={submitDisabled}
                    fullWidth
                  />
                </View>
              ) : null}
            </View>
          </View>
        </KeyboardAvoidingView>
        <ToastHost />
      </View>
    </Modal>
  );
};

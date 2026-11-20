import React, { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { Banner } from '@/components/ui/Banner';
import { Button } from '@/components/ui/Button';
import { FormTextField } from '@/components/ui/FormTextField';
import { Text } from '@/components/ui/Text';
import { useSecondsLeft } from '@/hooks/countdown';
import { useTranslation } from '@/i18n';
import { useThemedStyles, type Theme } from '@/theme';
import {
  emailCodeFormSchema,
  type EmailCodeFormValues,
} from '@gym/shared/validation/client-signups';

interface VerifyEmailFormProps {
  email: string;
  // Set when a gym already added this email as a client.
  gymName: string | null;
  // When the emailed code stops working (ISO).
  expiresAt: string;
  isPending: boolean;
  isResending: boolean;
  serverError: string | null;
  onSubmit: (code: string) => void;
  onResend: () => void;
  onBack: () => void;
}

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    form: { gap: theme.spacing.lg },
    buttons: { flexDirection: 'row', gap: theme.spacing.md },
    half: { flex: 1 },
  });

// Proves the email is the member's own: they type the code that was emailed to it.
export const VerifyEmailForm: React.FC<VerifyEmailFormProps> = ({
  email,
  gymName,
  expiresAt,
  isPending,
  isResending,
  serverError,
  onSubmit,
  onResend,
  onBack,
}) => {
  const styles = useThemedStyles(createStyles);
  const { t } = useTranslation();
  const secondsLeft = useSecondsLeft(expiresAt);
  const expired = secondsLeft === 0;
  const { control, handleSubmit, reset } = useForm<EmailCodeFormValues>({
    resolver: zodResolver(emailCodeFormSchema),
    defaultValues: { code: '' },
  });

  // A new code makes the old input useless.
  useEffect(() => reset({ code: '' }), [expiresAt, reset]);

  const submit = handleSubmit((values) => onSubmit(values.code));

  return (
    <View style={styles.form}>
      <Text variant="body" tone="muted">
        {t('We sent a 6-digit code to {{email}}.', { email })}
      </Text>
      {gymName ? (
        <Banner
          tone="info"
          message={t('{{gym}} already added you as a member.', {
            gym: gymName,
          })}
        />
      ) : null}
      {serverError ? <Banner tone="danger" message={serverError} /> : null}
      <FormTextField
        control={control}
        name="code"
        label={t('Verification code')}
        keyboardType="number-pad"
        autoComplete="one-time-code"
        textContentType="oneTimeCode"
        maxLength={6}
        onSubmitEditing={() => void submit()}
      />
      <Text variant="caption" tone={expired ? 'danger' : 'muted'}>
        {expired
          ? t('The code has expired.')
          : t('The code expires in {{seconds}} seconds.', {
              seconds: secondsLeft,
            })}
      </Text>
      <Button
        label={t('Verify email')}
        onPress={() => void submit()}
        loading={isPending}
        disabled={expired}
        fullWidth
      />
      <View style={styles.buttons}>
        <View style={styles.half}>
          <Button
            label={t('Change details')}
            variant="secondary"
            onPress={onBack}
            fullWidth
          />
        </View>
        <View style={styles.half}>
          <Button
            label={t('Send a new code')}
            variant="secondary"
            onPress={onResend}
            loading={isResending}
            fullWidth
          />
        </View>
      </View>
    </View>
  );
};

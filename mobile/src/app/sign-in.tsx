import React, { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'expo-router';
import { useForm } from 'react-hook-form';
import { Banner } from '@/components/ui/Banner';
import { Button } from '@/components/ui/Button';
import { FormTextField } from '@/components/ui/FormTextField';
import { Icon } from '@/components/ui/Icon';
import { Screen } from '@/components/ui/Screen';
import { Text } from '@/components/ui/Text';
import { API_ORIGIN } from '@/config/env';
import { useTranslation } from '@/i18n';
import { useSession } from '@/providers/SessionProvider';
import { useThemedStyles, type Theme } from '@/theme';
import { loginSchema, type LoginFormValues } from '@gym/shared/validation/auth';

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    content: { flexGrow: 1, justifyContent: 'center', gap: theme.spacing.xl },
    brand: { alignItems: 'center', gap: theme.spacing.sm },
    logo: {
      width: 72,
      height: 72,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: theme.radius.lg,
      backgroundColor: theme.colors.accentSoft,
    },
    form: { gap: theme.spacing.lg },
    signUp: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'center',
      gap: theme.spacing.xs,
    },
  });

export default function SignInScreen(): React.ReactElement {
  const styles = useThemedStyles(createStyles);
  const { t } = useTranslation();
  const router = useRouter();
  const { signIn } = useSession();
  const [serverError, setServerError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  const onSubmit = handleSubmit(async (values) => {
    setServerError(null);
    try {
      await signIn(values);
    } catch (error) {
      setServerError(
        error instanceof Error ? error.message : t('Sign-in failed.')
      );
    }
  });

  return (
    <Screen edges={['top', 'bottom']} contentStyle={styles.content}>
      <View style={styles.brand}>
        <View style={styles.logo}>
          <Icon name="barbell" size={40} color="accent" />
        </View>
        <Text variant="title">{t('Welcome back')}</Text>
        <Text variant="body" tone="muted" align="center">
          {t('Sign in with the account your gym created for you.')}
        </Text>
      </View>

      <View style={styles.form}>
        {serverError ? <Banner tone="danger" message={serverError} /> : null}
        <FormTextField
          control={control}
          name="email"
          label={t('Email')}
          placeholder="you@example.com"
          keyboardType="email-address"
          autoComplete="email"
          textContentType="emailAddress"
        />
        <FormTextField
          control={control}
          name="password"
          label={t('Password')}
          secureTextEntry={!showPassword}
          autoComplete="current-password"
          textContentType="password"
          onSubmitEditing={() => void onSubmit()}
          accessory={
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={
                showPassword ? t('Hide password') : t('Show password')
              }
              hitSlop={10}
              onPress={() => setShowPassword((visible) => !visible)}
            >
              <Icon
                name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                size={20}
              />
            </Pressable>
          }
        />
        <Button
          label={t('Sign in')}
          onPress={() => void onSubmit()}
          loading={isSubmitting}
          fullWidth
        />
      </View>

      <View style={styles.signUp}>
        <Text variant="caption" tone="subtle">
          {t('New member?')}
        </Text>
        <Pressable
          accessibilityRole="link"
          hitSlop={10}
          onPress={() => router.push('/sign-up')}
        >
          <Text variant="caption" tone="accent" style={{ fontWeight: '600' }}>
            {t('Create an account')}
          </Text>
        </Pressable>
      </View>

      <Text variant="caption" tone="subtle" align="center">
        {t('Forgot your password? Ask your gym for a new invite link.')}
        {__DEV__ ? `\nServer: ${API_ORIGIN}` : ''}
      </Text>
    </Screen>
  );
}

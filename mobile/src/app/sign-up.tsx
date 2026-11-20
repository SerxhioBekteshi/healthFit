import React, { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { JoinCodeField } from '@/components/client-signups/JoinCodeField';
import { NewMemberForm } from '@/components/client-signups/NewMemberForm';
import { VerifyEmailForm } from '@/components/client-signups/VerifyEmailForm';
import { Banner } from '@/components/ui/Banner';
import { Icon } from '@/components/ui/Icon';
import { Screen } from '@/components/ui/Screen';
import { Text } from '@/components/ui/Text';
import {
  useClaimClientAccount,
  useClientSignup,
  useClientSignupLookup,
  useGymJoinPreview,
} from '@/hooks/client-signups';
import { useTranslation } from '@/i18n';
import { useThemedStyles, type Theme } from '@/theme';
import type { ClientSignupLookup } from '@gym/shared/types';
import type { ClientSignupFormValues } from '@gym/shared/validation/client-signups';

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
    stack: { gap: theme.spacing.lg },
    footer: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'center',
      gap: theme.spacing.xs,
    },
  });

// Members sign themselves up: with a gym's join code or link, or without one into the community,
// where they choose a gym later. They fill in everything first; the email is then checked: an existing
// account goes to sign in, any other email is sent a code that must be typed in before the account is
// created (a new member) or claimed (a client a gym already added).
export default function SignUpScreen(): React.ReactElement {
  const styles = useThemedStyles(createStyles);
  const { t } = useTranslation();
  const router = useRouter();
  const params = useLocalSearchParams<{ joinCode?: string }>();
  const [typedCode, setTypedCode] = useState(params.joinCode ?? '');
  const [linkedCode, setLinkedCode] = useState(params.joinCode);
  const [values, setValues] = useState<ClientSignupFormValues | null>(null);
  // Kept here because a mutation forgets its answer while it asks again for a new code.
  const [found, setFound] = useState<ClientSignupLookup | null>(null);
  const preview = useGymJoinPreview(typedCode);
  const lookup = useClientSignupLookup();
  const signup = useClientSignup();
  const claim = useClaimClientAccount();

  // A deep link such as `/sign-up?joinCode=...` fills the field, also when the screen is already open.
  if (params.joinCode !== linkedCode) {
    setLinkedCode(params.joinCode);
    if (params.joinCode) setTypedCode(params.joinCode);
  }

  const goToSignIn = (): void => router.dismissTo('/sign-in');
  const backToForm = (): void => {
    setFound(null);
    lookup.reset();
    signup.reset();
    claim.reset();
  };
  const askForCode = (email: string): void => {
    signup.reset();
    claim.reset();
    lookup.mutate(email, { onSuccess: setFound });
  };
  const submit = (entered: ClientSignupFormValues): void => {
    setValues(entered);
    askForCode(entered.email);
  };
  const verify = (details: ClientSignupFormValues, code: string): void => {
    if (found?.status === 'gym_client') {
      claim.mutate({ email: details.email, code, password: details.password });
      return;
    }
    signup.mutate({
      firstName: details.firstName,
      lastName: details.lastName,
      email: details.email,
      phone: details.phone,
      gender: details.gender,
      country: details.country,
      password: details.password,
      joinCode: preview.gymName ? preview.code : undefined,
      code,
    });
  };

  const expiresAt = found?.expiresAt ?? null;
  const verifying =
    found !== null &&
    found.status !== 'registered' &&
    expiresAt !== null &&
    values;

  return (
    <Screen edges={['top', 'bottom']} contentStyle={styles.content}>
      <View style={styles.brand}>
        <View style={styles.logo}>
          <Icon name="barbell" size={40} color="accent" />
        </View>
        <Text variant="title">{t('Create your account')}</Text>
        <Text variant="body" tone="muted" align="center">
          {preview.gymName
            ? t('You are joining {{gym}}.', { gym: preview.gymName })
            : t(
                'Join the community, then browse gyms and choose where to start.'
              )}
        </Text>
      </View>

      {found?.status === 'registered' ? (
        <View style={styles.stack}>
          <Banner
            tone="warning"
            message={t(
              'An account with this email already exists. Sign in instead.'
            )}
          />
          <Pressable accessibilityRole="link" onPress={goToSignIn}>
            <Text variant="bodyStrong" tone="accent">
              {t('Sign in')}
            </Text>
          </Pressable>
        </View>
      ) : null}

      {verifying ? (
        <VerifyEmailForm
          email={values.email}
          gymName={found.status === 'gym_client' ? found.gymName : null}
          expiresAt={expiresAt}
          isPending={signup.isPending || claim.isPending}
          isResending={lookup.isPending}
          serverError={
            signup.error?.message ??
            claim.error?.message ??
            lookup.error?.message ??
            null
          }
          onSubmit={(code) => verify(values, code)}
          onResend={() => askForCode(values.email)}
          onBack={backToForm}
        />
      ) : (
        <NewMemberForm
          defaultCountry={preview.gymCountry}
          defaultValues={values}
          isPending={lookup.isPending}
          submitDisabled={preview.isChecking || preview.isInvalid}
          serverError={lookup.error?.message ?? null}
          onSubmit={submit}
        >
          <JoinCodeField
            value={typedCode}
            onChange={setTypedCode}
            isInvalid={preview.isInvalid}
          />
        </NewMemberForm>
      )}

      <View style={styles.footer}>
        <Text variant="caption" tone="subtle">
          {t('Already have an account?')}
        </Text>
        <Pressable accessibilityRole="link" hitSlop={10} onPress={goToSignIn}>
          <Text variant="caption" tone="accent" style={{ fontWeight: '600' }}>
            {t('Sign in')}
          </Text>
        </Pressable>
      </View>
    </Screen>
  );
}

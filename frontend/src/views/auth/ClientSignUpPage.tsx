import React, { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { NewMemberForm } from '@/components/client-signups/NewMemberForm';
import { VerifyEmailForm } from '@/components/client-signups/VerifyEmailForm';
import { LanguageSwitcher } from '@/components/common/LanguageSwitcher';
import { ThemeToggle } from '@/components/common/ThemeToggle';
import { Alert } from '@/components/ui/Alert';
import { BrandMark } from '@/components/ui/BrandMark';
import { BrandName } from '@/components/ui/BrandName';
import { Skeleton } from '@/components/ui/Skeleton';
import {
  useClaimClientAccount,
  useClientSignup,
  useClientSignupLookup,
  useGymJoinPreview,
} from '@/hooks/client-signups';
import { t } from '@/i18n';
import { roleHomePath } from '@/utils/constants/navigation';
import type { ClientSignupLookup, User } from '@gym/shared/types';
import type { ClientSignupFormValues } from '@gym/shared/validation/client-signups';

const linkClass = 'text-sm font-medium text-signal hover:underline';

// Members sign themselves up: from a gym's permanent join link (`/join/<code>`) or, without one, into
// the community where they pick a gym later. They fill in everything first; the email is then checked:
// an existing account goes to sign in, otherwise a 6-digit code is emailed to prove the email is
// theirs, and with it a new account is created (or a client a gym already added claims theirs).
export const ClientSignUpPage: React.FC = () => {
  const { code } = useParams();
  const navigate = useNavigate();
  const preview = useGymJoinPreview(code);
  const lookup = useClientSignupLookup();
  const signup = useClientSignup();
  const claim = useClaimClientAccount();
  const [values, setValues] = useState<ClientSignupFormValues | null>(null);
  const [found, setFound] = useState<ClientSignupLookup | null>(null);

  const goHome = (user: User): void => {
    void navigate(roleHomePath[user.role], { replace: true });
  };
  const backToForm = (): void => {
    setFound(null);
    lookup.reset();
    signup.reset();
    claim.reset();
  };
  // Asks the server about the email; it also sends (or sends again) the code.
  const check = (email: string): void => {
    lookup.mutate(email, { onSuccess: setFound });
  };
  const submit = (entered: ClientSignupFormValues): void => {
    setValues(entered);
    signup.reset();
    claim.reset();
    check(entered.email);
  };
  const verify = (otp: string): void => {
    if (!values) return;
    if (found?.status === 'gym_client') {
      claim.mutate(
        { email: values.email, code: otp, password: values.password },
        { onSuccess: goHome }
      );
    } else {
      signup.mutate({ ...values, code: otp }, { onSuccess: goHome });
    }
  };

  const brokenLink = Boolean(code) && !preview.isLoading && !preview.data;
  const verifying =
    found !== null && found.status !== 'registered' && found.expiresAt !== null;

  const body = (): React.ReactNode => {
    if (code && preview.isLoading) return <Skeleton className="h-64" />;
    if (brokenLink) {
      return (
        <div className="text-center">
          <h1 className="text-2xl font-semibold tracking-tight">
            {t('This link does not work')}
          </h1>
          <p className="mt-3 text-sm text-bone/60">
            {t('This join link is invalid or no longer active.')}{' '}
            {t('Ask your gym for a new one.')}
          </p>
          <Link to="/join" className={`${linkClass} mt-6 inline-block`}>
            {t('Create an account without a gym')}
          </Link>
        </div>
      );
    }

    return (
      <>
        <h1 className="text-3xl font-semibold tracking-tight">
          {t('Create your account')}
        </h1>
        <p className="mb-8 mt-3 text-sm text-bone/60">
          {preview.data
            ? t('You are joining {{gym}}.', { gym: preview.data.gymName })
            : t(
                'Join the community, then browse gyms and choose where to start.'
              )}
        </p>

        {found?.status === 'registered' ? (
          <div className="mb-5 space-y-3">
            <Alert tone="warning">
              {t('An account with this email already exists. Sign in instead.')}
            </Alert>
            <Link to="/login" className={linkClass}>
              {t('Sign in')}
            </Link>
          </div>
        ) : null}

        {verifying && values && found.expiresAt ? (
          <VerifyEmailForm
            email={values.email}
            gymName={found.status === 'gym_client' ? found.gymName : null}
            expiresAt={found.expiresAt}
            isPending={signup.isPending || claim.isPending}
            isResending={lookup.isPending}
            serverError={
              signup.error?.message ??
              claim.error?.message ??
              lookup.error?.message ??
              null
            }
            onSubmit={verify}
            onResend={() => check(values.email)}
            onBack={backToForm}
          />
        ) : (
          <NewMemberForm
            joinCode={preview.data ? code : undefined}
            defaultCountry={preview.data?.gymCountry}
            defaultValues={values}
            isPending={lookup.isPending}
            serverError={lookup.error?.message ?? null}
            onSubmit={submit}
          />
        )}

        <p className="mt-8 text-center text-sm text-bone/55">
          {t('Already have an account?')}{' '}
          <Link to="/login" className="font-medium text-signal hover:underline">
            {t('Sign in')}
          </Link>
        </p>
      </>
    );
  };

  return (
    <div className="app-shell min-h-screen bg-ink text-bone">
      <header className="mx-auto flex max-w-md items-center justify-between px-5 py-6">
        <Link to="/" className="flex items-center gap-3">
          <BrandMark className="h-7 w-7" />
          <BrandName className="text-base" />
        </Link>
        <div className="flex items-center gap-2">
          <LanguageSwitcher />
          <ThemeToggle variant="icon" />
        </div>
      </header>
      <main className="mx-auto max-w-md px-5 pb-16 pt-6">{body()}</main>
    </div>
  );
};

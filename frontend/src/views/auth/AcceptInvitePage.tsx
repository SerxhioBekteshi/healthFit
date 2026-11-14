import React from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { FormField, fieldInputClass } from '@/components/common/FormField';
import { LanguageSwitcher } from '@/components/common/LanguageSwitcher';
import { ThemeToggle } from '@/components/common/ThemeToggle';
import { Alert } from '@/components/ui/Alert';
import { BrandMark } from '@/components/ui/BrandMark';
import { BrandName } from '@/components/ui/BrandName';
import { Button } from '@/components/ui/Button';
import { Skeleton } from '@/components/ui/Skeleton';
import {
  useAcceptClientInvite,
  useClientInvitePreview,
} from '@/hooks/client-invites';
import { t } from '@/i18n';
import {
  acceptClientInviteFormSchema,
  type AcceptClientInviteFormValues,
} from '@gym/shared/validation/client-invites';

// Opened from the link a gym gave a client: they choose a password, then sign in as usual.
export const AcceptInvitePage: React.FC = () => {
  const { token = '' } = useParams();
  const navigate = useNavigate();
  const preview = useClientInvitePreview(token);
  const accept = useAcceptClientInvite(token);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<AcceptClientInviteFormValues>({
    resolver: zodResolver(acceptClientInviteFormSchema),
    defaultValues: { password: '', confirmPassword: '' },
  });

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

      <main className="mx-auto max-w-md px-5 pb-16 pt-6">
        {preview.isLoading ? (
          <Skeleton className="h-64" />
        ) : preview.error || !preview.data ? (
          <div className="text-center">
            <h1 className="text-2xl font-semibold tracking-tight">
              {t('This link does not work')}
            </h1>
            <p className="mt-3 text-sm text-bone/60">
              {t('This invite link is invalid or has expired.')}{' '}
              {t('Ask your gym for a new one.')}
            </p>
            <Link
              to="/login"
              className="mt-6 inline-block text-sm font-medium text-signal hover:underline"
            >
              {t('Sign in')}
            </Link>
          </div>
        ) : accept.isSuccess ? (
          <div className="text-center">
            <h1 className="text-2xl font-semibold tracking-tight">
              {t('You are all set')}
            </h1>
            <p className="mt-3 text-sm text-bone/60">
              {t('Sign in with {{email}} and the password you just chose.', {
                email: preview.data.email,
              })}
            </p>
            <Button
              className="mt-6"
              onClick={() => navigate('/login', { replace: true })}
            >
              {t('Sign in')}
            </Button>
          </div>
        ) : (
          <>
            <h1 className="text-3xl font-semibold tracking-tight">
              {t('Welcome, {{name}}.', { name: preview.data.clientName })}
            </h1>
            <p className="mb-8 mt-3 text-sm text-bone/60">
              {t('{{gym}} invited you. Choose a password to finish.', {
                gym: preview.data.gymName,
              })}
            </p>

            <form
              className="space-y-5"
              noValidate
              onSubmit={handleSubmit((values) =>
                accept.mutate(values.password)
              )}
            >
              <FormField
                id="password"
                label={t('New password')}
                hint={t(
                  'At least 8 characters, with a number and an uppercase letter.'
                )}
                error={errors.password?.message}
              >
                <input
                  id="password"
                  type="password"
                  autoComplete="new-password"
                  className={fieldInputClass}
                  {...register('password')}
                />
              </FormField>
              <FormField
                id="confirmPassword"
                label={t('Confirm new password')}
                error={errors.confirmPassword?.message}
              >
                <input
                  id="confirmPassword"
                  type="password"
                  autoComplete="new-password"
                  className={fieldInputClass}
                  {...register('confirmPassword')}
                />
              </FormField>

              {accept.error ? <Alert>{accept.error.message}</Alert> : null}

              <Button
                type="submit"
                className="w-full"
                loading={accept.isPending}
              >
                {accept.isPending ? t('Saving') : t('Set password')}
              </Button>
            </form>
          </>
        )}
      </main>
    </div>
  );
};

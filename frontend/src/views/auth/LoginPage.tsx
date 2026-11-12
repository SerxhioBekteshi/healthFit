import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { FormField, fieldInputClass } from '@/components/common/FormField';
import { Alert } from '@/components/ui/Alert';
import { BrandMark } from '@/components/ui/BrandMark';
import { BrandName } from '@/components/ui/BrandName';
import { Button } from '@/components/ui/Button';
import { LanguageSwitcher } from '@/components/common/LanguageSwitcher';
import { ThemeToggle } from '@/components/common/ThemeToggle';
import { t } from '@/i18n';
import { authClient } from '@/services/auth';
import { meService } from '@/services/me';
import { loginSchema, type LoginFormValues } from '@gym/shared/validation/auth';
import { roleHomePath } from '@/utils/constants/navigation';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  const loginMutation = useMutation({
    meta: { success: 'Signed in.' },
    mutationFn: async (values: LoginFormValues) => {
      const result = await authClient.signIn.email(values);
      if (result.error) {
        throw new Error(t('Invalid email or password.'));
      }
      queryClient.removeQueries({ queryKey: ['me'] });
      return queryClient.fetchQuery({
        queryKey: ['me'],
        queryFn: meService.get,
      });
    },
    onSuccess: (user) => {
      navigate(roleHomePath[user.role], { replace: true });
    },
    onError: (error) => {
      setError('root', {
        type: 'server',
        message:
          error instanceof Error
            ? error.message
            : t('Login failed. Please try again.'),
      });
    },
  });

  return (
    <div className="app-shell relative grid min-h-screen overflow-hidden bg-ink text-bone lg:grid-cols-2">
      <section className="relative hidden flex-col justify-between overflow-hidden border-r border-white/[0.07] bg-graphite p-12 lg:flex">
        <Link to="/" className="flex items-center gap-3">
          <BrandMark className="h-7 w-7" />
          <BrandName className="text-base" />
        </Link>
        <div>
          <h2 className="text-4xl font-semibold leading-tight tracking-tight">
            {t('Run the gym.')}
            <br />
            <span className="text-bone/45">{t('Not the paperwork.')}</span>
          </h2>
          <p className="mt-5 max-w-md text-base text-bone/60">
            {t(
              'Members, memberships, check-ins and billing — one calm platform for every gym you run.'
            )}
          </p>
        </div>
        <p className="text-sm text-bone/40">
          {t('Multi-tenant · Role-based · Secure')}
        </p>
      </section>

      <section className="relative flex items-center justify-center p-6 sm:p-10">
        <div className="absolute right-5 top-5 flex items-center gap-2">
          <LanguageSwitcher />
          <ThemeToggle variant="icon" />
        </div>
        <div className="w-full max-w-sm">
          <h1 className="text-3xl font-semibold tracking-tight">
            {t('Welcome back')}
          </h1>
          <p className="mb-8 mt-3 text-sm text-bone/60">
            {t('Sign in to continue.')}
          </p>

          <form
            className="space-y-5"
            onSubmit={handleSubmit((values) => loginMutation.mutate(values))}
            noValidate
          >
            <FormField
              id="email"
              label={t('Email')}
              error={errors.email?.message}
            >
              <input
                id="email"
                type="email"
                autoComplete="email"
                placeholder="you@gym.com"
                className={fieldInputClass}
                {...register('email')}
              />
            </FormField>

            <FormField
              id="password"
              label={t('Password')}
              error={errors.password?.message}
            >
              <input
                id="password"
                type="password"
                autoComplete="current-password"
                placeholder={t('Enter your password')}
                className={fieldInputClass}
                {...register('password')}
              />
            </FormField>

            {errors.root?.message ? <Alert>{errors.root.message}</Alert> : null}

            <Button
              type="submit"
              className="w-full"
              loading={loginMutation.isPending}
            >
              {loginMutation.isPending ? t('Signing in') : t('Sign in')}
            </Button>
          </form>

          <p className="mt-8 text-center text-xs text-bone/40">
            <Link to="/" className="transition hover:text-bone">
              {t('← Back to home')}
            </Link>
          </p>
        </div>
      </section>
    </div>
  );
};

import React, { useEffect, useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { FormField, fieldInputClass } from '@/components/common/FormField';
import { Alert } from '@/components/ui/Alert';
import { Button } from '@/components/ui/Button';
import { t } from '@/i18n';
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

const secondsLeft = (expiresAt: string): number =>
  Math.max(0, Math.ceil((new Date(expiresAt).getTime() - Date.now()) / 1000));

// Proves the email is theirs: a 6-digit code that lives one minute, with a way to ask for another.
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
  const [remaining, setRemaining] = useState(() => secondsLeft(expiresAt));
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<EmailCodeFormValues>({
    resolver: zodResolver(emailCodeFormSchema),
    defaultValues: { code: '' },
  });

  useEffect(() => {
    setRemaining(secondsLeft(expiresAt));
    reset({ code: '' });
    const timer = window.setInterval(
      () => setRemaining(secondsLeft(expiresAt)),
      1000
    );
    return () => window.clearInterval(timer);
  }, [expiresAt, reset]);

  const expired = remaining === 0;

  return (
    <form
      className="space-y-5"
      noValidate
      onSubmit={handleSubmit((values) => onSubmit(values.code))}
    >
      {gymName ? (
        <Alert tone="info">
          {t('{{gym}} already added you as a member.', { gym: gymName })}
        </Alert>
      ) : null}
      <p className="text-sm text-bone/70">
        {t('We sent a 6-digit code to {{email}}.', { email })}
      </p>

      <FormField
        id="code"
        label={t('Verification code')}
        hint={
          expired
            ? undefined
            : t('The code expires in {{seconds}} seconds.', {
                seconds: remaining,
              })
        }
        error={expired ? t('The code has expired.') : errors.code?.message}
      >
        <input
          id="code"
          inputMode="numeric"
          autoComplete="one-time-code"
          maxLength={6}
          className={fieldInputClass}
          {...register('code')}
        />
      </FormField>

      {serverError ? <Alert>{serverError}</Alert> : null}

      <Button
        type="submit"
        className="w-full"
        loading={isPending}
        disabled={expired}
      >
        {isPending ? t('Saving') : t('Verify email')}
      </Button>

      <div className="flex items-center justify-between gap-3 text-sm">
        <button
          type="button"
          className="font-medium text-bone/60 hover:text-bone"
          onClick={onBack}
        >
          {t('Change details')}
        </button>
        <button
          type="button"
          className="font-medium text-signal hover:underline disabled:opacity-50"
          disabled={isResending}
          onClick={onResend}
        >
          {t('Send a new code')}
        </button>
      </div>
    </form>
  );
};

import React from 'react';
import { t } from '@/i18n';

interface FormFieldProps {
  id: string;
  label: string;
  error?: string;
  hint?: string;
  children: React.ReactNode;
}

// Label, hint and validation message come in English and are translated here.
export const FormField: React.FC<FormFieldProps> = ({
  id,
  label,
  error,
  hint,
  children,
}) => (
  <div>
    <label
      htmlFor={id}
      className="mb-1.5 block text-sm font-medium text-bone/70"
    >
      {t(label)}
    </label>
    {children}
    {hint && !error ? (
      <p className="mt-1.5 text-xs text-bone/40">{t(hint)}</p>
    ) : null}
    {error ? <p className="mt-1.5 text-xs text-danger">{t(error)}</p> : null}
  </div>
);

export const fieldInputClass =
  'w-full rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-bone outline-none transition placeholder:text-bone/30 focus:border-signal/60 focus:ring-2 focus:ring-signal/15';

import React, { useState } from 'react';
import { t } from '@/i18n';

const COPIED_MS = 1500;

// The code is the client's id, the same value as the QR on their dashboard.
export const CheckInCode: React.FC<{ code: string }> = ({ code }) => {
  const [copied, setCopied] = useState(false);

  const copy = async (): Promise<void> => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    window.setTimeout(() => setCopied(false), COPIED_MS);
  };

  return (
    <button
      type="button"
      onClick={() => void copy()}
      title={t('Copy check-in code')}
      className="inline-flex items-center gap-2 rounded-md bg-white/[0.06] px-2 py-1 font-mono text-xs text-bone/70 transition-colors hover:bg-white/10"
    >
      <span>{code.slice(0, 8)}…</span>
      <span className={copied ? 'text-signal' : 'text-bone/40'}>
        {copied ? t('Copied') : t('Copy')}
      </span>
    </button>
  );
};

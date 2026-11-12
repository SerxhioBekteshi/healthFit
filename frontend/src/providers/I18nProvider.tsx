import React from 'react';
import { useLocaleKey } from '@/hooks/language';

// Strings are translated when they render, so a language or currency change remounts the app below.
export const I18nProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const localeKey = useLocaleKey();
  return <React.Fragment key={localeKey}>{children}</React.Fragment>;
};

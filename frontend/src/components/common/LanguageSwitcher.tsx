import React from 'react';
import { Icon } from '@/components/ui/Icon';
import { useLanguage } from '@/hooks/language';
import { isLanguage, LANGUAGES, languageNames, t } from '@/i18n';

// A compact language dropdown for the header, the login page and the landing page.
export const LanguageSwitcher: React.FC<{ className?: string }> = ({
  className = '',
}) => {
  const { language, chooseLanguage } = useLanguage();

  return (
    <label
      className={`relative inline-flex h-10 items-center rounded-lg border border-white/10 text-bone/70 transition hover:bg-white/10 hover:text-bone ${className}`}
    >
      <span className="sr-only">{t('Language')}</span>
      <Icon
        name="globe"
        className="pointer-events-none absolute left-2.5 h-[1.05rem] w-[1.05rem]"
      />
      <select
        value={language}
        onChange={(event) => {
          if (isLanguage(event.target.value))
            chooseLanguage(event.target.value);
        }}
        className="h-full cursor-pointer appearance-none rounded-lg bg-transparent py-0 pl-8 pr-3 text-sm font-medium text-current outline-none focus-visible:ring-2 focus-visible:ring-signal/40"
      >
        {LANGUAGES.map((code) => (
          <option key={code} value={code} className="bg-graphite text-bone">
            {languageNames[code]}
          </option>
        ))}
      </select>
    </label>
  );
};

import React from 'react';
import { Menu, MenuButton, MenuItem, MenuItems } from '@headlessui/react';
import { AL, DE, GB, GR, IT } from 'country-flag-icons/react/3x2';
import type { FlagComponent } from 'country-flag-icons/react/3x2';
import { Icon } from '@/components/ui/Icon';
import { useLanguage } from '@/hooks/language';
import { LANGUAGES, languageNames, t, type Language } from '@/i18n';

// Each language is shown with the flag of the country it belongs to.
const flags: Record<Language, FlagComponent> = {
  en: GB,
  sq: AL,
  it: IT,
  de: DE,
  el: GR,
};

const LanguageFlag: React.FC<{ language: Language }> = ({ language }) => {
  const FlagIcon = flags[language];
  return (
    <span className="inline-block h-4 w-6 shrink-0 overflow-hidden rounded-[3px] ring-1 ring-inset ring-white/15">
      <FlagIcon aria-hidden className="block h-full w-full" />
    </span>
  );
};

// A compact language menu with a flag per language, for the header and the login page.
export const LanguageSwitcher: React.FC<{ className?: string }> = ({
  className = '',
}) => {
  const { language, chooseLanguage } = useLanguage();

  return (
    <Menu>
      <MenuButton
        aria-label={t('Language')}
        title={t('Language')}
        className={`inline-flex h-10 items-center gap-2 rounded-lg border border-white/10 px-2.5 text-sm font-medium text-bone/80 transition hover:bg-white/10 hover:text-bone data-[open]:bg-white/10 ${className}`}
      >
        <LanguageFlag language={language} />
        <span className="hidden sm:inline">{languageNames[language]}</span>
        <Icon
          name="chevron"
          className="hidden h-3.5 w-3.5 rotate-90 text-bone/40 sm:block"
        />
      </MenuButton>
      {/* Rendered in a portal like the row menus; it re-applies the theme tokens. */}
      <MenuItems
        anchor="bottom end"
        transition
        className="app-shell z-50 w-48 origin-top-right rounded-xl border border-white/10 bg-graphite p-1.5 text-bone shadow-[0_20px_50px_var(--shadow)] [--anchor-gap:6px] focus:outline-none transition duration-150 ease-out data-[closed]:scale-95 data-[closed]:opacity-0"
      >
        {LANGUAGES.map((code) => (
          <MenuItem key={code}>
            <button
              type="button"
              onClick={() => chooseLanguage(code)}
              className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm text-bone/85 transition data-[focus]:bg-white/[0.07]"
            >
              <LanguageFlag language={code} />
              <span className="flex-1">{languageNames[code]}</span>
              {code === language ? (
                <Icon name="check" className="h-4 w-4 text-signal" />
              ) : null}
            </button>
          </MenuItem>
        ))}
      </MenuItems>
    </Menu>
  );
};

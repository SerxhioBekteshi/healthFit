import React from 'react';
import { Icon } from '@/components/ui/Icon';
import { useTheme } from '@/hooks/theme';
import { t } from '@/i18n';

interface ThemeToggleProps {
  // `row` is the labelled sidebar entry, `icon` the compact header button.
  variant?: 'row' | 'icon';
}

export const ThemeToggle: React.FC<ThemeToggleProps> = ({
  variant = 'row',
}) => {
  const { theme, toggleTheme } = useTheme();
  const label =
    theme === 'dark' ? t('Switch to light theme') : t('Switch to dark theme');
  const icon = theme === 'dark' ? 'sun' : 'moon';

  if (variant === 'icon') {
    return (
      <button
        type="button"
        onClick={toggleTheme}
        aria-label={label}
        title={label}
        className="grid h-10 w-10 place-items-center rounded-lg border border-white/10 text-bone/70 transition hover:bg-white/10 hover:text-bone"
      >
        <Icon name={icon} className="h-[1.1rem] w-[1.1rem]" />
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-bone/60 transition-colors hover:bg-white/[0.06] hover:text-bone"
    >
      <Icon name={icon} className="h-[1.15rem] w-[1.15rem]" />
      {theme === 'dark' ? t('Light theme') : t('Dark theme')}
    </button>
  );
};

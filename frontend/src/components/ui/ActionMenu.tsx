import React from 'react';
import { Menu, MenuButton, MenuItem, MenuItems } from '@headlessui/react';
import { Icon, type IconName } from '@/components/ui/Icon';
import { t } from '@/i18n';

export interface ActionMenuItem {
  label: string;
  icon?: IconName;
  onClick: () => void;
  tone?: 'default' | 'danger' | 'warning' | 'success';
  disabled?: boolean;
  // Native tooltip explaining what the action does.
  hint?: string;
}

const tones: Record<NonNullable<ActionMenuItem['tone']>, string> = {
  default: 'text-bone/80',
  danger: 'text-danger',
  warning: 'text-warn',
  success: 'text-signal',
};

// The three-dot menu that holds the actions of a table row.
export const ActionMenu: React.FC<{ items: ActionMenuItem[] }> = ({
  items,
}) => (
  <Menu>
    <MenuButton
      aria-label={t('Actions')}
      title={t('Actions')}
      className="grid h-8 w-8 place-items-center rounded-lg border border-white/10 text-bone/70 transition hover:bg-white/10 hover:text-bone data-[open]:bg-white/10"
    >
      <Icon name="more" className="h-4 w-4" />
    </MenuButton>
    {/* Rendered in a portal so the table's overflow cannot clip it; it re-applies the theme tokens. */}
    <MenuItems
      anchor="bottom end"
      transition
      className="app-shell z-50 w-56 origin-top-right rounded-xl border border-white/10 bg-graphite p-1.5 text-bone shadow-[0_20px_50px_var(--shadow)] [--anchor-gap:6px] focus:outline-none transition duration-150 ease-out data-[closed]:scale-95 data-[closed]:opacity-0"
    >
      {items.map((item) => (
        <MenuItem key={item.label} disabled={item.disabled}>
          <button
            type="button"
            title={item.hint}
            onClick={item.onClick}
            className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm transition data-[focus]:bg-white/[0.07] data-[disabled]:cursor-not-allowed data-[disabled]:opacity-40 ${tones[item.tone ?? 'default']}`}
          >
            {item.icon ? <Icon name={item.icon} className="h-4 w-4" /> : null}
            {item.label}
          </button>
        </MenuItem>
      ))}
    </MenuItems>
  </Menu>
);

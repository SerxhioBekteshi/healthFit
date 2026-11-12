import React, { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Avatar } from '@/components/ui/Avatar';
import { Icon } from '@/components/ui/Icon';
import { t } from '@/i18n';
import { roleLabels } from '@/utils/constants/navigation';
import type { UserRole } from '@gym/shared/types';

const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];

interface UserMenuProps {
  userName: string;
  userEmail: string;
  role: UserRole;
  onChangePassword: () => void;
  onLogout: () => void;
}

// The profile dropdown of the top bar.
export const UserMenu: React.FC<UserMenuProps> = ({
  userName,
  userEmail,
  role,
  onChangePassword,
  onLogout,
}) => {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: PointerEvent): void => {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('pointerdown', onPointerDown);
    return () => document.removeEventListener('pointerdown', onPointerDown);
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
        className="flex items-center gap-2.5 rounded-xl border border-white/10 bg-white/[0.03] py-1.5 pl-1.5 pr-2.5 text-left transition hover:bg-white/[0.06]"
      >
        <Avatar name={userName} size="sm" />
        <span className="hidden min-w-0 sm:block">
          <span className="block max-w-[9rem] truncate text-sm font-semibold leading-tight text-bone">
            {userName}
          </span>
          <span className="block text-[0.7rem] leading-tight text-bone/45">
            {roleLabels[role]}
          </span>
        </span>
        <Icon
          name="chevron"
          className={`h-4 w-4 text-bone/40 transition-transform ${open ? '-rotate-90' : 'rotate-90'}`}
        />
      </button>

      <AnimatePresence>
        {open ? (
          <motion.div
            role="menu"
            initial={{ opacity: 0, y: -8, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.97 }}
            transition={{ duration: 0.2, ease: EASE }}
            className="absolute right-0 top-full z-50 mt-2 w-64 overflow-hidden rounded-xl border border-white/10 bg-graphite p-1.5 shadow-[0_20px_50px_var(--shadow)]"
          >
            <div className="border-b border-white/10 px-3 py-2.5">
              <p className="truncate text-sm font-semibold text-bone">
                {userName}
              </p>
              <p className="truncate text-xs text-bone/50">{userEmail}</p>
            </div>
            <button
              type="button"
              role="menuitem"
              onClick={() => {
                setOpen(false);
                onChangePassword();
              }}
              className="mt-1.5 flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm text-bone/80 transition hover:bg-white/[0.07] hover:text-bone"
            >
              <Icon name="key" className="h-4 w-4" />
              {t('Change password')}
            </button>
            <button
              type="button"
              role="menuitem"
              onClick={onLogout}
              className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm text-danger transition hover:bg-danger/10"
            >
              <Icon name="logout" className="h-4 w-4" />
              {t('Sign out')}
            </button>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
};

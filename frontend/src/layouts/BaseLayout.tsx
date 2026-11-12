import React, { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { useQueryClient } from '@tanstack/react-query';
import { ChangePasswordDrawer } from './ChangePasswordDrawer';
import { SidebarNav } from './SidebarNav';
import { UserMenu } from './UserMenu';
import { BrandMark } from '@/components/ui/BrandMark';
import { BrandName } from '@/components/ui/BrandName';
import { ThemeToggle } from '@/components/common/ThemeToggle';
import { LanguageSwitcher } from '@/components/common/LanguageSwitcher';
import { Icon } from '@/components/ui/Icon';
import { t } from '@/i18n';
import { useSidebarCollapsed } from '@/hooks/sidebar';
import { authClient } from '@/services/auth';
import type { UserRole } from '@gym/shared/types';
import { navigationByRole } from '@/utils/constants/navigation';

interface BaseLayoutProps {
  role: UserRole;
  userName: string;
  userEmail: string;
  children: React.ReactNode;
}

const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];

export const BaseLayout: React.FC<BaseLayoutProps> = ({
  role,
  userName,
  userEmail,
  children,
}) => {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [passwordOpen, setPasswordOpen] = useState(false);
  const { collapsed, toggleCollapsed } = useSidebarCollapsed();
  const items = navigationByRole[role];

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileOpen]);

  const onLogout = async (): Promise<void> => {
    await authClient.signOut();
    queryClient.clear();
    navigate('/login', { replace: true });
  };

  // On desktop `onToggle` makes the brand and a chevron collapse or expand the sidebar.
  const sidebar = (
    isCollapsed: boolean,
    onNavigate?: () => void,
    onToggle?: () => void
  ) => {
    const brand = (
      <>
        <BrandMark className="h-7 w-7" />
        {isCollapsed ? null : <BrandName className="text-base" />}
      </>
    );
    const brandClass = `flex items-center gap-3 ${isCollapsed ? 'justify-center' : 'px-3'}`;
    const toggleLabel = isCollapsed
      ? t('Expand sidebar')
      : t('Collapse sidebar');

    return (
      <div className="flex h-full flex-col">
        <div className="mb-9 flex items-center justify-between gap-2">
          {onToggle ? (
            <button
              type="button"
              onClick={onToggle}
              aria-label={toggleLabel}
              title={toggleLabel}
              className={`${brandClass} ${isCollapsed ? 'w-full' : ''}`}
            >
              {brand}
            </button>
          ) : (
            <Link
              to="/"
              className={brandClass}
              aria-label={t('Home')}
              onClick={onNavigate}
            >
              {brand}
            </Link>
          )}
          {onToggle && !isCollapsed ? (
            <button
              type="button"
              onClick={onToggle}
              aria-label={toggleLabel}
              title={toggleLabel}
              className="grid h-8 w-8 shrink-0 place-items-center rounded-lg text-bone/50 transition hover:bg-white/10 hover:text-bone"
            >
              <Icon name="chevron" className="h-4 w-4 rotate-180" />
            </button>
          ) : null}
        </div>

        <div className="-mr-2 flex-1 overflow-y-auto pr-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <SidebarNav
            items={items}
            pathname={pathname}
            collapsed={isCollapsed}
            onNavigate={onNavigate}
          />
        </div>
      </div>
    );
  };

  return (
    <div className="app-shell relative min-h-screen bg-ink text-bone">
      <div
        aria-hidden
        className="pointer-events-none fixed inset-x-0 top-0 h-[420px] bg-[radial-gradient(60%_100%_at_70%_0%,var(--glow),transparent)]"
      />

      <aside
        className={`fixed inset-y-0 left-0 z-30 hidden border-r border-white/[0.07] bg-ink/80 py-7 backdrop-blur-xl transition-[width] duration-300 lg:block ${
          collapsed ? 'w-[4.5rem] px-3' : 'w-[17rem] px-4'
        }`}
      >
        {sidebar(collapsed, undefined, toggleCollapsed)}
      </aside>

      <AnimatePresence>
        {mobileOpen ? (
          <>
            <motion.div
              key="scrim"
              className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileOpen(false)}
            />
            <motion.aside
              key="drawer"
              className="fixed inset-y-0 left-0 z-50 w-[19rem] max-w-[85vw] border-r border-white/10 bg-graphite px-4 py-7 lg:hidden"
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ duration: 0.45, ease: EASE }}
            >
              <button
                type="button"
                aria-label={t('Close menu')}
                onClick={() => setMobileOpen(false)}
                className="absolute right-4 top-6 grid h-9 w-9 place-items-center rounded-full border border-white/10 text-bone/70"
              >
                <Icon name="x" className="h-4 w-4" />
              </button>
              {sidebar(false, () => setMobileOpen(false))}
            </motion.aside>
          </>
        ) : null}
      </AnimatePresence>

      <div
        className={`relative transition-[padding] duration-300 ${
          collapsed ? 'lg:pl-[4.5rem]' : 'lg:pl-[17rem]'
        }`}
      >
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-3 border-b border-white/[0.07] bg-ink/80 px-3 backdrop-blur-xl sm:px-5 lg:px-6">
          <div className="flex items-center gap-3">
            <Link
              to="/"
              className="flex items-center gap-3 lg:hidden"
              aria-label={t('Home')}
            >
              <BrandMark />
              <BrandName className="text-base" />
            </Link>
          </div>
          <div className="flex items-center gap-2">
            <LanguageSwitcher />
            <ThemeToggle variant="icon" />
            <UserMenu
              userName={userName}
              userEmail={userEmail}
              role={role}
              onChangePassword={() => setPasswordOpen(true)}
              onLogout={onLogout}
            />
            <button
              type="button"
              aria-label={t('Open menu')}
              onClick={() => setMobileOpen(true)}
              className="grid h-10 w-10 place-items-center rounded-lg border border-white/10 text-bone/80 lg:hidden"
            >
              <Icon name="menu" className="h-5 w-5" />
            </button>
          </div>
        </header>

        <main className="relative">
          <motion.div
            key={pathname}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.15 }}
            className="mx-auto max-w-[1360px] px-3 pb-6 pt-5 sm:px-5 lg:px-6 lg:pt-6"
          >
            {children}
          </motion.div>
        </main>
      </div>

      <ChangePasswordDrawer
        isOpen={passwordOpen}
        onClose={() => setPasswordOpen(false)}
      />
    </div>
  );
};

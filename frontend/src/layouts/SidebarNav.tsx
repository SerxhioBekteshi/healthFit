import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Icon } from '@/components/ui/Icon';
import { t } from '@/i18n';
import type { NavigationItem } from '@/utils/constants/navigation';

const groupItems = (items: NavigationItem[]) => {
  const groups = new Map<string, NavigationItem[]>();
  for (const item of items) {
    groups.set(item.group, [...(groups.get(item.group) ?? []), item]);
  }
  return [...groups.entries()];
};

const isActive = (pathname: string, to: string): boolean =>
  pathname === to || pathname.startsWith(`${to}/`);

interface ItemProps {
  item: NavigationItem;
  pathname: string;
  collapsed: boolean;
  onNavigate?: () => void;
}

const NavLeaf: React.FC<ItemProps> = ({
  item,
  pathname,
  collapsed,
  onNavigate,
}) => {
  const active = isActive(pathname, item.to);
  return (
    <Link
      to={item.to}
      onClick={onNavigate}
      aria-current={active ? 'page' : undefined}
      aria-label={collapsed ? t(item.label) : undefined}
      title={collapsed ? t(item.label) : undefined}
      className={`group relative flex items-center gap-3 rounded-lg py-2 text-sm font-medium transition-colors duration-200 ${
        collapsed ? 'justify-center px-0' : 'px-3'
      } ${active ? 'text-bone' : 'text-bone/55 hover:text-bone'}`}
    >
      {active ? (
        <motion.span
          layoutId="nav-active"
          className="absolute inset-0 rounded-lg bg-white/[0.07]"
          transition={{ type: 'spring', stiffness: 400, damping: 36 }}
        />
      ) : null}
      {active ? (
        <span className="absolute -left-px top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-full bg-signal" />
      ) : null}
      <Icon
        name={item.icon}
        className={`relative h-[1.15rem] w-[1.15rem] shrink-0 transition-colors ${
          active ? 'text-signal' : 'group-hover:text-bone'
        }`}
      />
      {collapsed ? null : <span className="relative">{t(item.label)}</span>}
    </Link>
  );
};

// A parent with a submenu; it stays open while one of its pages is showing.
const NavSubmenu: React.FC<Omit<ItemProps, 'collapsed'>> = ({
  item,
  pathname,
  onNavigate,
}) => {
  const children = item.children ?? [];
  const childActive = children.some((child) => child.to === pathname);
  const [open, setOpen] = useState(childActive);
  const expanded = open || childActive;

  return (
    <div>
      <button
        type="button"
        aria-expanded={expanded}
        onClick={() => setOpen(!expanded)}
        className={`group flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors duration-200 ${
          childActive ? 'text-bone' : 'text-bone/55 hover:text-bone'
        }`}
      >
        <Icon
          name={item.icon}
          className={`h-[1.15rem] w-[1.15rem] transition-colors ${
            childActive ? 'text-signal' : 'group-hover:text-bone'
          }`}
        />
        <span className="flex-1 text-left">{t(item.label)}</span>
        <Icon
          name="chevron"
          className={`h-4 w-4 transition-transform duration-200 ${
            expanded ? 'rotate-90' : ''
          }`}
        />
      </button>
      {expanded ? (
        <ul className="ml-[1.45rem] mt-0.5 space-y-0.5 border-l border-white/10 pl-3">
          {children.map((child) => {
            const active = child.to === pathname;
            return (
              <li key={child.to}>
                <Link
                  to={child.to}
                  onClick={onNavigate}
                  aria-current={active ? 'page' : undefined}
                  className={`block rounded-md px-3 py-1.5 text-sm transition-colors duration-200 ${
                    active
                      ? 'bg-white/[0.07] font-medium text-signal'
                      : 'text-bone/55 hover:text-bone'
                  }`}
                >
                  {t(child.label)}
                </Link>
              </li>
            );
          })}
        </ul>
      ) : null}
    </div>
  );
};

interface SidebarNavProps {
  items: NavigationItem[];
  pathname: string;
  // Icons only; a submenu parent then links to its first page.
  collapsed?: boolean;
  onNavigate?: () => void;
}

export const SidebarNav: React.FC<SidebarNavProps> = ({
  items,
  pathname,
  collapsed = false,
  onNavigate,
}) => (
  <nav aria-label={t('Main')} className={collapsed ? 'space-y-4' : 'space-y-7'}>
    {groupItems(items).map(([group, groupEntries]) => (
      <div key={group}>
        {collapsed ? (
          <div aria-hidden className="mx-3 mb-3 border-t border-white/10" />
        ) : (
          <p className="mb-2 px-3 text-xs font-medium text-bone/40">
            {t(group)}
          </p>
        )}
        <ul className="space-y-0.5">
          {groupEntries.map((item) => (
            <li key={item.to}>
              {item.children && !collapsed ? (
                <NavSubmenu
                  item={item}
                  pathname={pathname}
                  onNavigate={onNavigate}
                />
              ) : (
                <NavLeaf
                  item={item}
                  pathname={pathname}
                  collapsed={collapsed}
                  onNavigate={onNavigate}
                />
              )}
            </li>
          ))}
        </ul>
      </div>
    ))}
  </nav>
);

import type { IconName } from '@/components/ui/Icon';
import { msg, translated } from '@/i18n';
import type { UserRole } from '@gym/shared/types';

// Labels and groups are English `msg` texts; the sidebar translates them when shown.

export interface NavigationChild {
  label: string;
  to: string;
}

export interface NavigationItem {
  label: string;
  to: string;
  icon: IconName;
  group: string;
  // Renders the item as an expandable submenu.
  children?: NavigationChild[];
}

export const roleHomePath: Record<UserRole, string> = {
  super_admin: '/super-admin/dashboard',
  gym_admin: '/dashboard',
  client: '/client/dashboard',
};

export const roleLabels = translated<UserRole>({
  super_admin: msg('Platform owner'),
  gym_admin: msg('Gym admin'),
  client: msg('Member'),
});

const superAdminNavigationItems: NavigationItem[] = [
  {
    label: msg('Dashboard'),
    to: '/super-admin/dashboard',
    icon: 'dashboard',
    group: msg('Overview'),
  },
  {
    label: msg('Gyms'),
    to: '/super-admin/gyms',
    icon: 'building',
    group: msg('Platform'),
  },
  {
    label: msg('Gym admins'),
    to: '/super-admin/gym-admins',
    icon: 'user-cog',
    group: msg('Platform'),
  },
  {
    label: msg('Subscriptions'),
    to: '/super-admin/gym-subscriptions',
    icon: 'card',
    group: msg('Billing'),
  },
  {
    label: msg('Billings'),
    to: '/super-admin/billings',
    icon: 'receipt',
    group: msg('Billing'),
  },
];

const gymAdminNavigationItems: NavigationItem[] = [
  {
    label: msg('Dashboard'),
    to: '/dashboard',
    icon: 'dashboard',
    group: msg('Overview'),
  },
  {
    label: msg('My gyms'),
    to: '/gym-locations',
    icon: 'pin',
    group: msg('Overview'),
  },
  {
    label: msg('Clients'),
    to: '/clients',
    icon: 'users',
    group: msg('Members'),
  },
  {
    label: msg('Membership'),
    to: '/memberships',
    icon: 'badge',
    group: msg('Members'),
    children: [
      { label: msg('Members'), to: '/memberships' },
      { label: msg('Configuration'), to: '/memberships/configuration' },
    ],
  },
  {
    label: msg('Attendance'),
    to: '/attendance',
    icon: 'scan',
    group: msg('Members'),
  },
  {
    label: msg('Products'),
    to: '/products',
    icon: 'bag',
    group: msg('Operations'),
  },
  {
    label: msg('Workouts'),
    to: '/workout-programs',
    icon: 'dumbbell',
    group: msg('Operations'),
  },
  {
    label: msg('Classes'),
    to: '/classes',
    icon: 'clock',
    group: msg('Operations'),
  },
  {
    label: msg('Staff'),
    to: '/staff-members',
    icon: 'user-cog',
    group: msg('Operations'),
  },
  {
    label: msg('Closures'),
    to: '/closures',
    icon: 'calendar-off',
    group: msg('Operations'),
  },
];

const clientNavigationItems: NavigationItem[] = [
  {
    label: msg('Dashboard'),
    to: '/client/dashboard',
    icon: 'dashboard',
    group: msg('Menu'),
  },
  {
    label: msg('Workouts'),
    to: '/client/workouts',
    icon: 'dumbbell',
    group: msg('Menu'),
  },
  {
    label: msg('Classes'),
    to: '/client/classes',
    icon: 'clock',
    group: msg('Menu'),
  },
  {
    label: msg('Gyms'),
    to: '/client/locations',
    icon: 'pin',
    group: msg('Menu'),
  },
  {
    label: msg('Membership'),
    to: '/client/membership',
    icon: 'badge',
    group: msg('Menu'),
  },
  {
    label: msg('Products'),
    to: '/client/products',
    icon: 'bag',
    group: msg('Menu'),
  },
  {
    label: msg('Balance'),
    to: '/client/balance',
    icon: 'wallet',
    group: msg('Menu'),
  },
  {
    label: msg('History'),
    to: '/client/history',
    icon: 'clock',
    group: msg('Menu'),
  },
];

export const navigationByRole: Record<UserRole, NavigationItem[]> = {
  super_admin: superAdminNavigationItems,
  gym_admin: gymAdminNavigationItems,
  client: clientNavigationItems,
};

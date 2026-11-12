import React from 'react';
import { Navigate, Outlet, createBrowserRouter } from 'react-router-dom';
import { PageSkeleton } from '@/components/ui/PageSkeleton';
import { useSession } from '@/hooks/session';
import { AuthShell } from '@/layouts/AuthShell';
import { t } from '@/i18n';
import { roleHomePath } from '@/utils/constants/navigation';
import { LandingPage } from '@/views/landing/LandingPage';
import { LoginPage } from '@/views/auth/LoginPage';
import type { UserRole } from '@gym/shared/types';

const HomeRoute: React.FC = () => {
  const { user } = useSession();
  return (
    <LandingPage
      ctaHref={user ? roleHomePath[user.role] : '/login'}
      ctaLabel={user ? t('Open your dashboard') : t('Enter the platform')}
    />
  );
};

const LoginRoute: React.FC = () => {
  const { user, isLoading } = useSession();
  if (isLoading) {
    return <PageSkeleton />;
  }
  if (user) {
    return <Navigate to={roleHomePath[user.role]} replace />;
  }
  return <LoginPage />;
};

const shell = (role: UserRole): React.FC => {
  const Shell: React.FC = () => (
    <AuthShell role={role}>
      <Outlet />
    </AuthShell>
  );
  return Shell;
};

// Page modules are loaded on demand so each role only downloads its own screens.
const page = <K extends string>(
  load: () => Promise<Record<K, React.ComponentType>>,
  name: K
) => ({
  lazy: async () => ({ Component: (await load())[name] }),
});

export const router = createBrowserRouter([
  {
    HydrateFallback: PageSkeleton,
    children: [
      { path: '/', Component: HomeRoute },
      { path: '/login', Component: LoginRoute },
      {
        Component: shell('gym_admin'),
        children: [
          {
            path: '/dashboard',
            ...page(
              () => import('@/views/gym/GymDashboardPage'),
              'GymDashboardPage'
            ),
          },
          {
            path: '/attendance',
            ...page(
              () => import('@/views/gym/attendance/AttendancePage'),
              'AttendancePage'
            ),
          },
          {
            path: '/clients',
            ...page(
              () => import('@/views/gym/clients/ClientsPage'),
              'ClientsPage'
            ),
          },
          {
            path: '/memberships/configuration',
            ...page(
              () =>
                import('@/views/gym/membership-plans/MembershipConfigurationPage'),
              'MembershipConfigurationPage'
            ),
          },
          {
            path: '/memberships',
            ...page(
              () => import('@/views/gym/memberships/MembershipsPage'),
              'MembershipsPage'
            ),
          },
          {
            path: '/products',
            ...page(
              () => import('@/views/gym/products/ProductsPage'),
              'ProductsPage'
            ),
          },
          {
            path: '/closures',
            ...page(
              () => import('@/views/gym/gym-closures/GymClosuresPage'),
              'GymClosuresPage'
            ),
          },
          {
            path: '/gym-locations',
            ...page(
              () => import('@/views/gym/gym-locations/GymLocationsPage'),
              'GymLocationsPage'
            ),
          },
          {
            path: '/workout-programs',
            ...page(
              () => import('@/views/gym/workout-programs/WorkoutProgramsPage'),
              'WorkoutProgramsPage'
            ),
          },
          {
            path: '/classes',
            ...page(
              () => import('@/views/gym/classes/ClassesPage'),
              'ClassesPage'
            ),
          },
          {
            path: '/staff-members',
            ...page(
              () => import('@/views/gym/staff-members/StaffMembersPage'),
              'StaffMembersPage'
            ),
          },
        ],
      },
      {
        Component: shell('client'),
        children: [
          {
            path: '/client/dashboard',
            ...page(
              () => import('@/views/client/ClientDashboardPage'),
              'ClientDashboardPage'
            ),
          },
          {
            path: '/client/membership',
            ...page(
              () => import('@/views/client/ClientMembershipPage'),
              'ClientMembershipPage'
            ),
          },
          {
            path: '/client/balance',
            ...page(
              () => import('@/views/client/ClientBalancePage'),
              'ClientBalancePage'
            ),
          },
          {
            path: '/client/products',
            ...page(
              () => import('@/views/client/ClientProductsPage'),
              'ClientProductsPage'
            ),
          },
          {
            path: '/client/history',
            ...page(
              () => import('@/views/client/ClientHistoryPage'),
              'ClientHistoryPage'
            ),
          },
          {
            path: '/client/workouts',
            ...page(
              () => import('@/views/client/ClientWorkoutsPage'),
              'ClientWorkoutsPage'
            ),
          },
          {
            path: '/client/classes',
            ...page(
              () => import('@/views/client/ClientClassesPage'),
              'ClientClassesPage'
            ),
          },
          {
            path: '/client/locations',
            ...page(
              () => import('@/views/client/ClientLocationsPage'),
              'ClientLocationsPage'
            ),
          },
        ],
      },
      {
        Component: shell('super_admin'),
        children: [
          {
            path: '/super-admin/dashboard',
            ...page(
              () => import('@/views/super-admin/PlatformDashboardPage'),
              'PlatformDashboardPage'
            ),
          },
          {
            path: '/super-admin/gyms',
            ...page(
              () => import('@/views/super-admin/gyms/GymsPage'),
              'GymsPage'
            ),
          },
          {
            path: '/super-admin/gym-admins',
            ...page(
              () => import('@/views/super-admin/gym-admins/GymAdminsPage'),
              'GymAdminsPage'
            ),
          },
          {
            path: '/super-admin/gym-subscriptions',
            ...page(
              () =>
                import('@/views/super-admin/gym-subscriptions/GymSubscriptionsPage'),
              'GymSubscriptionsPage'
            ),
          },
          {
            path: '/super-admin/billings',
            ...page(
              () => import('@/views/super-admin/BillingsPage'),
              'BillingsPage'
            ),
          },
        ],
      },
      { path: '*', element: <Navigate to="/" replace /> },
    ],
  },
]);

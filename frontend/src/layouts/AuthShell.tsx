import React, { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { BaseLayout } from '@/layouts/BaseLayout';
import { PageSkeleton } from '@/components/ui/PageSkeleton';
import { useSession } from '@/hooks/session';
import type { UserRole } from '@gym/shared/types';
import {
  communityNavigationItems,
  communityPath,
  roleHomePath,
} from '@/utils/constants/navigation';

interface AuthShellProps {
  role: UserRole;
  children: React.ReactNode;
}

// Redirects only; every API route still enforces the role on the server.
export const AuthShell: React.FC<AuthShellProps> = ({ role, children }) => {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const { user, isLoading } = useSession();

  // A client without a gym (signed up on their own) can only reach the page that lets them pick one.
  const isCommunity = user?.role === 'client' && user.gymId === null;
  const misplaced =
    user?.role === 'client' && isCommunity !== (pathname === communityPath);

  useEffect(() => {
    if (isLoading) return;
    if (!user) {
      navigate('/login', { replace: true });
    } else if (user.role !== role) {
      navigate(roleHomePath[user.role], { replace: true });
    } else if (misplaced) {
      navigate(isCommunity ? communityPath : roleHomePath.client, {
        replace: true,
      });
    }
  }, [isLoading, user, role, misplaced, isCommunity, navigate]);

  if (!user || user.role !== role || misplaced) {
    return (
      <div className="app-shell min-h-screen bg-ink p-8 text-bone">
        <PageSkeleton />
      </div>
    );
  }

  return (
    <BaseLayout
      role={user.role}
      userName={user.fullName}
      userEmail={user.email}
      navigation={isCommunity ? communityNavigationItems : undefined}
    >
      {children}
    </BaseLayout>
  );
};

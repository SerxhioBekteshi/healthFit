import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { BaseLayout } from '@/layouts/BaseLayout';
import { PageSkeleton } from '@/components/ui/PageSkeleton';
import { useSession } from '@/hooks/session';
import type { UserRole } from '@gym/shared/types';
import { roleHomePath } from '@/utils/constants/navigation';

interface AuthShellProps {
  role: UserRole;
  children: React.ReactNode;
}

// Redirects only; every API route still enforces the role on the server.
export const AuthShell: React.FC<AuthShellProps> = ({ role, children }) => {
  const navigate = useNavigate();
  const { user, isLoading } = useSession();

  useEffect(() => {
    if (isLoading) return;
    if (!user) {
      navigate('/login', { replace: true });
    } else if (user.role !== role) {
      navigate(roleHomePath[user.role], { replace: true });
    }
  }, [isLoading, user, role, navigate]);

  if (!user || user.role !== role) {
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
    >
      {children}
    </BaseLayout>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// MineCore — Role Guard
// Restricts rendering based on user roles and displays a premium access denied page.
// ─────────────────────────────────────────────────────────────────────────────

'use client';

import React from 'react';
import { useAuth } from '../hooks/useAuth';
import { UserRole } from '@/types/enums';
import { EmptyState } from '@/components/shared/EmptyState';
import { ShieldAlert } from 'lucide-react';

interface RoleGuardProps {
  children: React.ReactNode;
  allowedRoles: UserRole[];
  fallback?: React.ReactNode;
}

export function RoleGuard({ children, allowedRoles, fallback }: RoleGuardProps) {
  const { user, isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return null; // Parent layout ProtectedRoute handles initial loading state
  }

  if (!isAuthenticated || !user) {
    return null;
  }

  const hasAccess = allowedRoles.includes(user.role);

  if (!hasAccess) {
    if (fallback !== undefined) {
      return <>{fallback}</>;
    }
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center min-h-[400px]">
        <EmptyState
          icon={ShieldAlert}
          title="Access Denied"
          description={`Your account role (${user.role.replace('_', ' ')}) does not have permission to access this module.`}
        />
      </div>
    );
  }

  return <>{children}</>;
}

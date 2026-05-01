import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/app/store/auth-store';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: string[];
}

export function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const { user, token, isLoading } = useAuthStore();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="size-10 animate-spin rounded-full border-4 border-border border-t-brand-primary" />
          <p className="text-sm text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!token || !user) {
    // Redirect to login but save the current location they were trying to access
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles && !allowedRoles.map(r => r.toLowerCase()).includes(user.role.toLowerCase())) {
    // Role not authorized, redirect to their default dashboard
    const roleLower = user.role.toLowerCase();
    const defaultPath = roleLower === 'master' ? '/dashboard-master' : (roleLower === 'owner' ? '/dashboard-owner' : '/dashboard-sales');
    return <Navigate to={defaultPath} replace />;
  }

  return <>{children}</>;
}

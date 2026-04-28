import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/app/store/auth-store';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: ('master' | 'owner' | 'sales' | 'staff')[];
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

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    // Role not authorized, redirect to their default dashboard
    const defaultPath = user.role === 'master' ? '/dashboard-master' : (user.role === 'owner' ? '/dashboard-owner' : '/dashboard-sales');
    return <Navigate to={defaultPath} replace />;
  }

  return <>{children}</>;
}

import { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { isAuthenticated, getUserRole } from '../api/client';

interface RoleGuardProps {
  allowedRoles: string[];
  children: ReactNode;
}

/**
 * Protects routes by role. Redirects to login if not authenticated,
 * or to home if authenticated but wrong role.
 */
function RoleGuard({ allowedRoles, children }: RoleGuardProps) {
  const location = useLocation();

  if (!isAuthenticated()) {
    return <Navigate to="/login" state={{ returnTo: location.pathname }} replace />;
  }

  const role = getUserRole();
  if (!role || !allowedRoles.includes(role)) {
    // If role can't be determined, redirect to home
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}

export default RoleGuard;

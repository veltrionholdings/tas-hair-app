import { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
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
  if (!isAuthenticated()) {
    return <Navigate to="/login" replace />;
  }

  const role = getUserRole();
  if (!role || !allowedRoles.includes(role)) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}

export default RoleGuard;

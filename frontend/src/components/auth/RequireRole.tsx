import type { PropsWithChildren } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

export function RequireRole({ children, roles }: PropsWithChildren<{ roles: string[] }>): JSX.Element {
  const { session } = useAuth();

  if (!session) {
    return <Navigate to="/login" replace />;
  }

  const allowed = roles.some((role) => session.roles.includes(role));
  if (!allowed) {
    return <Navigate to="/рабочий-стол" replace />;
  }

  return <>{children}</>;
}

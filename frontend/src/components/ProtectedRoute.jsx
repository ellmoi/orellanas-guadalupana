import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth.js';
import { ForbiddenPage } from '../pages/ErrorPages.jsx';

export function ProtectedRoute({ children, roles }) {
  const { user, loading } = useAuth();
  const location = useLocation();
  if (loading) return <p className="page-message">Validando sesión…</p>;
  if (!user)
    return (
      <Navigate
        to={location.pathname.startsWith('/admin') ? '/admin/login' : '/iniciar-sesion'}
        replace
        state={{ from: location.pathname }}
      />
    );
  if (roles && !roles.some((role) => user.roles.includes(role))) return <ForbiddenPage />;
  return children;
}

import { Navigate, useLocation } from 'react-router-dom';
import { useApp } from '../context/AppContext';

export default function ProtectedRoute({ roles, children }) {
  const { currentUser } = useApp();
  const loc = useLocation();
  if (!currentUser) return <Navigate to="/login" replace state={{ from: loc.pathname + loc.search }} />;
  if (roles && !roles.includes(currentUser.role)) return <Navigate to="/dashboard" replace />;
  return children;
}

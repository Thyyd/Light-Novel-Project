import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

function RequireAuth({ children }) {
  const { isLoggedIn, loading } = useAuth();
  const location = useLocation();

  if (loading) return null;
  if (!isLoggedIn) return <Navigate to="/login" state={{ from: location.pathname }} replace />;

  return children;
}

export default RequireAuth;
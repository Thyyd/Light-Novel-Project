import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

function RedirectIfAuthenticated({ children }) {
  const { isLoggedIn, loading } = useAuth();

  if (loading) return null;
  if (isLoggedIn) return <Navigate to="/" replace />;

  return children;
}

export default RedirectIfAuthenticated;
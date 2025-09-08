import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Loader from "../pages/Loading";

const PublicRoute = ({ children }) => {
  const { currentUser, isAuthenticated, loading } = useAuth();

  // Show loading while checking auth state
  if (loading) {
    return <Loader />;
  }

  // If user is authenticated, redirect to dashboard
  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  // If not authenticated, show the public page (login/signup)
  return children;
};

export default PublicRoute;

import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Loader from "../pages/Loading";
import { db } from "../firebase/config";
import { doc, getDoc } from "firebase/firestore";
import { useEffect, useState } from "react";

const PublicRoute = ({ children }) => {
  const { currentUser, isAuthenticated, loading } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const run = async () => {
      if (!currentUser) {
        setIsAdmin(false);
        setChecking(false);
        return;
      }
      const snap = await getDoc(doc(db, 'users', currentUser.uid));
      setIsAdmin(snap.exists() ? !!snap.data().isAdmin : false);
      setChecking(false);
    };
    run();
  }, [currentUser]);

  // Show loading while checking auth state
  if (loading || checking) {
    return <Loader />;
  }

  // If user is authenticated, redirect to dashboard
  if (isAuthenticated) {
    return <Navigate to={isAdmin ? "/admin" : "/dashboard"} replace />;
  }

  // If not authenticated, show the public page (login/signup)
  return children;
};

export default PublicRoute;

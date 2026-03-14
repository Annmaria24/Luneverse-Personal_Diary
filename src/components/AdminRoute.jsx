import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useEffect, useState } from "react";
import { db } from "../firebase/config";
import { doc, getDoc } from "firebase/firestore";
import Loader from "../pages/Loading";

const AdminRoute = ({ children }) => {
  const { currentUser, isAuthenticated, loading } = useAuth();
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      if (currentUser) {
        const snap = await getDoc(doc(db, "users", currentUser.uid));
        const profile = snap.exists() ? snap.data() : null;
        setIsAdmin(!!profile?.isAdmin);
      }
      setLoadingProfile(false);
    };
    fetchProfile();
  }, [currentUser]);

  if (loading || loadingProfile) {
    return <Loader />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (!isAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

export default AdminRoute;








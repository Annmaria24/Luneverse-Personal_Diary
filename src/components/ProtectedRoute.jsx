import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useEffect, useState } from "react";
import { db } from "../firebase/config";
import { doc, getDoc } from "firebase/firestore";

const ProtectedRoute = ({ children }) => {
  const { currentUser, isAuthenticated, loading } = useAuth();
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [userProfile, setUserProfile] = useState(null);

  useEffect(() => {
    const fetchProfile = async () => {
      if (currentUser) {
        const snap = await getDoc(doc(db, "users", currentUser.uid));
        setUserProfile(snap.exists() ? snap.data() : null);
      }
      setLoadingProfile(false);
    };
    fetchProfile();
  }, [currentUser]);

  if (loading || loadingProfile) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100vh",
          fontSize: "1.2rem",
          color: "#fff",
          backgroundColor: "#1c1c1c",
        }}
      >
        Loading...
      </div>
    );
  }

 if (!isAuthenticated) {
  return <Navigate to="/login" replace />;
}

// ✅ This blocks dashboard access until password is set
if (
  userProfile &&
  currentUser.providerData[0]?.providerId === "google.com" &&
  !userProfile.hasPassword
) {
  return <Navigate to="/set-password" replace />;
}

return children;

};

export default ProtectedRoute;

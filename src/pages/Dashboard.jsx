import { useAuth } from "../context/AuthContext";
import { signOut } from "firebase/auth";
import { auth } from "../firebase/config";
import { useNavigate } from "react-router-dom";

function Dashboard() {
  const { currentUser, userProfile } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate("/");
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h1>Welcome to your Luneverse Dashboard 🌙</h1>
        <p>Hello, {currentUser?.email}!</p>
        <button onClick={handleLogout} className="logout-button">
          Sign Out
        </button>
      </div>

      <div className="dashboard-content">
        <p>Your personal wellness sanctuary awaits...</p>
        {/* Later we'll add Diary, Mood Tracker, Cycle Tracker here */}
      </div>
    </div>
  );
}

export default Dashboard;

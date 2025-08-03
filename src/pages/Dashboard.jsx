import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { signOut } from "firebase/auth";
import { auth } from "../firebase/config";
import { useNavigate } from "react-router-dom";
import "./Styles/Dashboard.css";

function Dashboard() {
  const { currentUser, userProfile } = useAuth();
  const navigate = useNavigate();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [greeting, setGreeting] = useState("");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  useEffect(() => {
    // Update time every minute
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);

    // Set greeting based on time
    const hour = new Date().getHours();
    if (hour < 12) {
      setGreeting("Good Morning");
    } else if (hour < 17) {
      setGreeting("Good Afternoon");
    } else {
      setGreeting("Good Evening");
    }

    return () => clearInterval(timer);
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (isDropdownOpen && !event.target.closest('.profile-dropdown')) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isDropdownOpen]);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate("/");
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  const formatDate = (date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getFirstName = (email) => {
    return email ? email.split('@')[0] : 'User';
  };

  return (
    <div className="dashboard">
      {/* Background Elements */}
      <div className="dashboard-background">
        <div className="floating-element element-1">🌙</div>
        <div className="floating-element element-2">✨</div>
        <div className="floating-element element-3">🌸</div>
        <div className="floating-element element-4">💜</div>
        <div className="floating-element element-5">🦋</div>
        <div className="floating-element element-6">🌺</div>
      </div>

      {/* Header */}
      <header className="dashboard-header">
        <div className="header-content">
          <div className="header-left">
            <h1 className="app-title">🌙 Luneverse</h1>
            <p className="date-display">{formatDate(currentTime)}</p>
          </div>
          <div className="header-right">
            <div className="user-profile-section">
              <span className="user-greeting">{greeting}, {getFirstName(currentUser?.email)}</span>
              <div className="profile-dropdown">
                <div
                  className="user-avatar"
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                >
                  {getFirstName(currentUser?.email).charAt(0).toUpperCase()}
                </div>
                {isDropdownOpen && (
                  <div className="dropdown-menu">
                    <button
                      onClick={() => {
                        navigate('/settings');
                        setIsDropdownOpen(false);
                      }}
                      className="dropdown-item"
                    >
                      <span className="dropdown-icon">⚙️</span>
                      Settings
                    </button>
                    <button
                      onClick={() => {
                        handleLogout();
                        setIsDropdownOpen(false);
                      }}
                      className="dropdown-item"
                    >
                      <span className="dropdown-icon">🚪</span>
                      Sign Out
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="dashboard-main">
        {/* Welcome Section */}
        <section className="welcome-section">
          <div className="welcome-card">
            <h2>Welcome to Your Personal Sanctuary</h2>
            <p>Track your wellness journey, reflect on your thoughts, and nurture your inner peace.</p>
          </div>
        </section>

        {/* Quick Stats */}
        <section className="stats-section">
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-icon">📝</div>
              <div className="stat-content">
                <h3>Journal Entries</h3>
                <p className="stat-number">0</p>
                <span className="stat-label">This month</span>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon">📊</div>
              <div className="stat-content">
                <h3>Mood Tracking</h3>
                <p className="stat-number">0</p>
                <span className="stat-label">Days logged</span>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon">🌸</div>
              <div className="stat-content">
                <h3>Cycle Insights</h3>
                <p className="stat-number">-</p>
                <span className="stat-label">Next phase</span>
              </div>
            </div>
          </div>
        </section>

        {/* Main Features */}
        <section className="features-section">
          <div className="features-grid">
            <div className="feature-card diary-card">
              <div className="feature-header">
                <div className="feature-icon">📝</div>
                <h3>Digital Diary</h3>
              </div>
              <p>Capture your thoughts, feelings, and daily reflections in your private digital space.</p>
              <button
                className="feature-button"
                onClick={() => navigate('/diary')}
              >
                Start Writing
              </button>
            </div>

            <div className="feature-card mood-card">
              <div className="feature-header">
                <div className="feature-icon">📊</div>
                <h3>Mood Tracker</h3>
              </div>
              <p>Monitor your emotional patterns and discover insights about your mental wellness.</p>
              <button
                className="feature-button"
                onClick={() => navigate('/mood-tracker')}
              >
                Track Mood
              </button>
            </div>

            <div className="feature-card cycle-card">
              <div className="feature-header">
                <div className="feature-icon">🌸</div>
                <h3>Cycle Tracker</h3>
              </div>
              <p>Keep track of your menstrual cycle with privacy and personalized insights.</p>
              <button
                className="feature-button"
                onClick={() => navigate('/cycle-tracker')}
              >
                Log Cycle
              </button>
            </div>
          </div>
        </section>

        {/* Recent Activity */}
        <section className="activity-section">
          <div className="activity-card">
            <h3>Recent Activity</h3>
            <div className="activity-content">
              <div className="empty-state">
                <div className="empty-icon">🌙</div>
                <p>Your wellness journey starts here</p>
                <span>Begin by exploring the features above</span>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

export default Dashboard;

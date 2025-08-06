import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { signOut } from "firebase/auth";
import { auth } from "../firebase/config";
import { useNavigate } from "react-router-dom";
import "./Styles/Dashboard.css";
import { getDiaryEntriesCountForMonth } from "../services/diaryService";
import { getMoodEntriesCountForMonth } from "../services/moodService";
import { getCycleEntriesCountForMonth } from "../services/cycleService";

function Dashboard() {
  const { currentUser, userProfile } = useAuth();
  const navigate = useNavigate();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [greeting, setGreeting] = useState("");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  // New state variables for counts
  const [journalCount, setJournalCount] = useState(0);
  const [moodCount, setMoodCount] = useState(0);
  const [cycleCount, setCycleCount] = useState(0);

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

  // Fetch counts for journal, mood, and cycle entries for current month
  useEffect(() => {
    if (!currentUser) return;

    const year = new Date().getFullYear();
    const month = new Date().getMonth();

    const fetchCounts = async () => {
      try {
        const [journalEntriesCount, moodEntriesCount, cycleEntriesCount] = await Promise.all([
          getDiaryEntriesCountForMonth(currentUser.uid, year, month),
          getMoodEntriesCountForMonth(currentUser.uid, year, month),
          getCycleEntriesCountForMonth(currentUser.uid, year, month)
        ]);
        
        setJournalCount(journalEntriesCount);
        setMoodCount(moodEntriesCount);
        setCycleCount(cycleEntriesCount);
      } catch (error) {
        console.error("Error fetching counts:", error);
      }
    };

    fetchCounts();
  }, [currentUser]);

  // Add a function to refresh counts
  const refreshCounts = async () => {
    if (!currentUser) return;
    
    const year = new Date().getFullYear();
    const month = new Date().getMonth();
    
    try {
      const [journalEntriesCount, moodEntriesCount, cycleEntriesCount] = await Promise.all([
        getDiaryEntriesCountForMonth(currentUser.uid, year, month),
        getMoodEntriesCountForMonth(currentUser.uid, year, month),
        getCycleEntriesCountForMonth(currentUser.uid, year, month)
      ]);
      
      setJournalCount(journalEntriesCount);
      setMoodCount(moodEntriesCount);
      setCycleCount(cycleEntriesCount);
    } catch (error) {
      console.error("Error refreshing counts:", error);
    }
  };

  // Add event listener for data updates
  useEffect(() => {
    // Listen for custom event when data changes
    const handleDataUpdate = () => {
      refreshCounts();
    };

    window.addEventListener('dashboardDataUpdated', handleDataUpdate);
    
    return () => {
      window.removeEventListener('dashboardDataUpdated', handleDataUpdate);
    };
  }, [currentUser]);

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
            <div style={{
              color: 'rgb(255, 255, 255)',
              fontSize: '1.8rem',
              fontWeight: '600',
              margin: '0',
              textShadow: 'none',
              letterSpacing: '0.5px',
              fontFamily: 'Arial, sans-serif',
              filter: 'none',
              opacity: '1',
              background: 'transparent',
              textDecoration: 'none',
              WebkitFontSmoothing: 'antialiased'
            }}>
              🌙 Luneverse
            </div>
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
                <p className="stat-number">{journalCount}</p>
                <span className="stat-label">This month</span>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon">📊</div>
              <div className="stat-content">
                <h3>Mood Tracking</h3>
                <p className="stat-number">{moodCount}</p>
                <span className="stat-label">Days logged</span>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon">🌸</div>
              <div className="stat-content">
                <h3>Cycle Insights</h3>
                <p className="stat-number">{cycleCount > 0 ? cycleCount : '-'}</p>
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

        {/* Achievements */}
        <section className="activity-section">
          <div className="activity-card">
            <h3>🏆 Achievements</h3>
            <div className="achievements-grid">
              <div className="achievement-item unlocked">
                <div className="achievement-icon">🌟</div>
                <div className="achievement-content">
                  <h4>Welcome Warrior</h4>
                  <p>Started your wellness journey</p>
                  <span className="achievement-date">Today</span>
                </div>
              </div>

              <div className="achievement-item locked">
                <div className="achievement-icon">📝</div>
                <div className="achievement-content">
                  <h4>First Entry</h4>
                  <p>Write your first diary entry</p>
                  <span className="achievement-progress">0/1</span>
                </div>
              </div>

              <div className="achievement-item locked">
                <div className="achievement-icon">😊</div>
                <div className="achievement-content">
                  <h4>Mood Tracker</h4>
                  <p>Log your mood for 3 days</p>
                  <span className="achievement-progress">0/3</span>
                </div>
              </div>

              <div className="achievement-item locked">
                <div className="achievement-icon">🔥</div>
                <div className="achievement-content">
                  <h4>Week Warrior</h4>
                  <p>Use the app for 7 consecutive days</p>
                  <span className="achievement-progress">1/7</span>
                </div>
              </div>

              <div className="achievement-item locked">
                <div className="achievement-icon">💎</div>
                <div className="achievement-content">
                  <h4>Consistency Queen</h4>
                  <p>Complete all daily activities for 30 days</p>
                  <span className="achievement-progress">0/30</span>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

export default Dashboard;

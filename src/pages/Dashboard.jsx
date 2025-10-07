import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { signOut } from "firebase/auth";
import { auth } from "../firebase/config";
import { useNavigate } from "react-router-dom";
import "./Styles/Dashboard.css";
import { getDiaryEntriesCountForMonth } from "../services/diaryService";
import { getMoodEntriesCountForMonth } from "../services/moodService";
import { getCycleEntriesCountForMonth, getCycleStats } from "../services/cycleService";
import Navbar from '../components/Navbar';
import { getPregnancyEntriesCountForMonth, getPregnancyStats } from '../services/pregnancyService';
import { getUserSettings } from '../services/userService';

function Dashboard() {
  const { currentUser, userProfile } = useAuth();
  const navigate = useNavigate();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [greeting, setGreeting] = useState("");


  // New state variables for counts
  const [journalCount, setJournalCount] = useState(0);
  const [moodCount, setMoodCount] = useState(0);
  const [cycleCount, setCycleCount] = useState(0);
  const [pregnancyCount, setPregnancyCount] = useState(0);
  const [cycleStats, setCycleStats] = useState({
    currentPhase: '',
    nextPredictedPeriod: null,
    currentCycleDay: 1
  });
  const [pregnancyStats, setPregnancyStats] = useState({
    currentWeek: 0,
    currentTrimester: 0,
    nextAppointment: null
  });
  const [pregnancyTrackingEnabled, setPregnancyTrackingEnabled] = useState(false);

  // Loading states for navigation buttons
  const [loadingStates, setLoadingStates] = useState({
    diary: false,
    mood: false,
    cycle: false,
    pregnancy: false
  });

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



  // Fetch counts for journal, mood, and cycle entries for current month
  useEffect(() => {
    if (!currentUser) return;

    const year = new Date().getFullYear();
    const month = new Date().getMonth();

    const fetchCounts = async () => {
      try {
        console.log("Fetching dashboard counts for user:", currentUser.uid, "Year:", year, "Month:", month);
        
        // Load user settings to check pregnancy tracking
        const userSettings = await getUserSettings(currentUser.uid);
        setPregnancyTrackingEnabled(userSettings?.pregnancyTrackingEnabled || false);
        
        const [journalEntriesCount, moodEntriesCount, cycleEntriesCount, pregnancyEntriesCount, cycleStatsData, pregnancyStatsData] = await Promise.all([
          getDiaryEntriesCountForMonth(currentUser.uid, year, month),
          getMoodEntriesCountForMonth(currentUser.uid, year, month),
          getCycleEntriesCountForMonth(currentUser.uid, year, month),
          getPregnancyEntriesCountForMonth(currentUser.uid, year, month),
          getCycleStats(currentUser.uid),
          getPregnancyStats(currentUser.uid)
        ]);

        console.log("Dashboard counts fetched:", {
          journalEntriesCount,
          moodEntriesCount,
          cycleEntriesCount,
          pregnancyEntriesCount,
          cycleStatsData,
          pregnancyStatsData
        });

        setJournalCount(journalEntriesCount);
        setMoodCount(moodEntriesCount);
        setCycleCount(cycleEntriesCount);
        setPregnancyCount(pregnancyEntriesCount);
        setCycleStats(cycleStatsData);
        setPregnancyStats(pregnancyStatsData);
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
      // Load user settings to check pregnancy tracking
      const userSettings = await getUserSettings(currentUser.uid);
      setPregnancyTrackingEnabled(userSettings?.pregnancyTrackingEnabled || false);
      
      const [journalEntriesCount, moodEntriesCount, cycleEntriesCount, pregnancyEntriesCount, cycleStatsData, pregnancyStatsData] = await Promise.all([
        getDiaryEntriesCountForMonth(currentUser.uid, year, month),
        getMoodEntriesCountForMonth(currentUser.uid, year, month),
        getCycleEntriesCountForMonth(currentUser.uid, year, month),
        getPregnancyEntriesCountForMonth(currentUser.uid, year, month),
        getCycleStats(currentUser.uid),
        getPregnancyStats(currentUser.uid)
      ]);

      setJournalCount(journalEntriesCount);
      setMoodCount(moodEntriesCount);
      setCycleCount(cycleEntriesCount);
      setPregnancyCount(pregnancyEntriesCount);
      setCycleStats(cycleStatsData);
      setPregnancyStats(pregnancyStatsData);
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

  // Navigation functions with loading states
  const handleNavigateWithLoading = async (route, loadingKey) => {
    setLoadingStates(prev => ({ ...prev, [loadingKey]: true }));
    
    // Add a small delay to show the loading state
    setTimeout(() => {
      navigate(route);
      setLoadingStates(prev => ({ ...prev, [loadingKey]: false }));
    }, 800);
  };

  return (
    <div className="dashboard">
      {/* Background Elements */}
      <div className="dashboard-background">
        <div className="floating-element element-2">✨</div>
        <div className="floating-element element-3">🌸</div>
        <div className="floating-element element-4">💜</div>
        <div className="floating-element element-5">🦋</div>
        <div className="floating-element element-6">🌺</div>
      </div>

      {/* Header */}
      <Navbar />

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
              <div className="stat-icon">{pregnancyTrackingEnabled ? '🤰' : '🌸'}</div>
              <div className="stat-content">
                <h3>{pregnancyTrackingEnabled ? 'Pregnancy Progress' : 'Cycle Insights'}</h3>
        <p className="stat-number">
          {pregnancyTrackingEnabled
            ? (pregnancyStats.conceptionDate
                ? `Week ${pregnancyStats.currentWeek}`
                : (pregnancyStats.currentWeek > 0 ? `Week ${pregnancyStats.currentWeek}` : 'Early Stage'))
            : (cycleStats.totalCycles > 0 ? cycleStats.currentPhase : '')
          }
        </p>
                <span className="stat-label">
                  {pregnancyTrackingEnabled ? 'Current week' : 'Current phase'}
                </span>
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
                className={`feature-button ${loadingStates.diary ? 'loading' : ''}`}
                onClick={() => handleNavigateWithLoading('/diary', 'diary')}
                disabled={loadingStates.diary}
              >
                {loadingStates.diary ? (
                  <>
                    <span className="loading-spinner">⏳</span>
                    Loading...
                  </>
                ) : (
                  'Start Writing'
                )}
              </button>
            </div>

            <div className="feature-card mood-card">
              <div className="feature-header">
                <div className="feature-icon">📊</div>
                <h3>Mood Tracker</h3>
              </div>
              <p>Monitor your emotional patterns and discover insights about your mental wellness.</p>
              <button
                className={`feature-button ${loadingStates.mood ? 'loading' : ''}`}
                onClick={() => handleNavigateWithLoading('/mood-tracker', 'mood')}
                disabled={loadingStates.mood}
              >
                {loadingStates.mood ? (
                  <>
                    <span className="loading-spinner">⏳</span>
                    Loading...
                  </>
                ) : (
                  'Track Mood'
                )}
              </button>
            </div>

          <div className="feature-card health-cycle-card">
            <div className="feature-header">
              <div className="feature-icon">{pregnancyTrackingEnabled ? '🤰' : '🌸'}</div>
              <h3>Health Cycle</h3>
            </div>
            <p>{pregnancyTrackingEnabled ? 'Track your pregnancy journey with detailed insights and weekly updates.' : 'Keep track of your menstrual cycle with privacy and personalized insights.'}</p>
            {pregnancyTrackingEnabled && pregnancyStats.currentWeek > 0 ? (
              <>
                <div className="pregnancy-week-info">Week {pregnancyStats.currentWeek}</div>
                <div className="pregnancy-trimester-info">Trimester {pregnancyStats.currentTrimester}</div>
                <div className="pregnancy-progress-bar">
                  <div
                    className="progress-fill"
                    style={{ width: `${(pregnancyStats.currentWeek / 40) * 100}%` }}
                  />
                </div>
              </>
            ) : pregnancyTrackingEnabled ? (
              <div className="pregnancy-week-info">Early Stage</div>
            ) : null}
            <button
              className={`feature-button ${loadingStates.cycle ? 'loading' : ''}`}
              onClick={() => handleNavigateWithLoading('/my-cycle', 'cycle')}
              disabled={loadingStates.cycle}
            >
              {loadingStates.cycle ? (
                <>
                  <span className="loading-spinner">⏳</span>
                  Loading...
                </>
              ) : (
                pregnancyTrackingEnabled ? 'Track Pregnancy' : 'Log Cycle'
              )}
            </button>
          </div>

          </div>
        </section>

        {/* Pregnancy Tracker - Only show if enabled */}
        {/* Removed separate pregnancy tracker card section as it is now conditionally rendered inside features grid */}

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

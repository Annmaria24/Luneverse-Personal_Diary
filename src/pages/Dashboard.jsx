import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { useAuth } from "../context/AuthContext";
import { signOut } from "firebase/auth";
import { auth } from "../firebase/config";
import { useNavigate } from "react-router-dom";
import { useToast } from "../hooks/useToast";
import ToastContainer from "../components/ToastContainer";
import "./Styles/Dashboard.css";
import { getDiaryEntriesCountForMonth } from "../services/diaryService";
import { getMoodEntriesCountForMonth } from "../services/moodService";
import { getCycleEntriesCountForMonth, getCycleStats } from "../services/cycleService";
import Navbar from '../components/Navbar';
import { getPregnancyEntriesCountForMonth, getPregnancyStats } from '../services/pregnancyService';
import { getUserSettings } from '../services/userService';

function Dashboard() {
  const { currentUser, userProfile, modulePreferences } = useAuth();
  const navigate = useNavigate();
  const { toasts, showSuccess, showError, removeToast } = useToast();
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
    pregnancy: false,
    affirmations: false
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

  // Create completely independent fixed button - always show
  useEffect(() => {
    console.log('Creating affirmations button, relaxMode:', modulePreferences?.relaxMode);
    
    // Remove any existing button
    const existingButton = document.getElementById('daily-affirmations-fixed');
    if (existingButton) {
      existingButton.remove();
    }

    // Create a completely isolated container with direct style assignment
    const buttonContainer = document.createElement('div');
    buttonContainer.id = 'daily-affirmations-fixed';
    
    // Use sticky positioning that moves with scroll
    buttonContainer.style.position = 'sticky';
    buttonContainer.style.top = '100px';
    buttonContainer.style.float = 'right';
    buttonContainer.style.zIndex = '99999';
    buttonContainer.style.width = 'fit-content';
    buttonContainer.style.height = 'fit-content';
    buttonContainer.style.margin = '20px 30px 0 0';
    buttonContainer.style.padding = '0';
    buttonContainer.style.border = 'none';
    buttonContainer.style.background = 'transparent';
    buttonContainer.style.fontFamily = 'inherit';
    buttonContainer.style.fontSize = 'inherit';
    buttonContainer.style.lineHeight = 'inherit';
    buttonContainer.style.textAlign = 'left';
    buttonContainer.style.textDecoration = 'none';
    buttonContainer.style.verticalAlign = 'baseline';
    buttonContainer.style.boxSizing = 'border-box';
    buttonContainer.style.transform = 'translateZ(0)';
    buttonContainer.style.willChange = 'transform';
    buttonContainer.style.isolation = 'isolate';
    buttonContainer.style.pointerEvents = 'auto';

    const button = document.createElement('button');
    button.style.position = 'relative';
    button.style.display = 'inline-block';
    button.style.background = 'linear-gradient(135deg, #7c3aed 0%, #ec4899 100%)';
    button.style.color = 'white';
    button.style.border = 'none';
    button.style.borderRadius = '12px';
    button.style.padding = '12px 16px';
    button.style.boxShadow = '0 6px 18px rgba(124,58,237,0.25)';
    button.style.cursor = 'pointer';
    button.style.fontSize = '14px';
    button.style.fontWeight = '500';
    button.style.whiteSpace = 'nowrap';
    button.style.margin = '0';
    button.style.width = 'auto';
    button.style.height = 'auto';
    button.style.outline = 'none';
    button.style.fontFamily = 'inherit';
    button.style.textAlign = 'center';
    button.style.textDecoration = 'none';
    button.style.verticalAlign = 'middle';
    button.style.boxSizing = 'border-box';
    button.style.userSelect = 'none';
    
    button.textContent = '✨ Daily Affirmations';
    button.onclick = () => {
      console.log('Button clicked, navigating to affirmations');
      handleNavigateWithLoading('/relax?section=affirmations', 'affirmations');
    };

    buttonContainer.appendChild(button);
    
    // Try to find a better parent element for sticky positioning
    const mainContent = document.querySelector('.dashboard-content') || 
                       document.querySelector('main') || 
                       document.querySelector('.app') ||
                       document.body;
    
    mainContent.appendChild(buttonContainer);
    
    console.log('Button created and appended to body');

    // No need for complex scroll handling with sticky positioning

    return () => {
      if (buttonContainer && buttonContainer.parentNode) {
        buttonContainer.parentNode.removeChild(buttonContainer);
      }
    };
  }, []); // Remove dependency on modulePreferences.relaxMode

  // Daily affirmations notification - trigger when dashboard loads
  useEffect(() => {
    const getTodayKey = () => {
      const d = new Date();
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${y}-${m}-${day}`;
    };

    const remindDaily = localStorage.getItem('affirmations_remind_daily');
    if (remindDaily === 'false') return;

    const todayKey = getTodayKey();
    const last = localStorage.getItem('affirmations_last_notify');
    if (last === todayKey) return;

    const show = () => {
      try {
        const n = new Notification('Daily Affirmations', {
          body: 'Take 1 minute to review your affirmations ✨',
        });
        n.onclick = () => {
          window.focus();
          navigate('/relax?section=affirmations');
          n.close();
        };
        localStorage.setItem('affirmations_last_notify', todayKey);
      } catch (e) {
        // Fallback toast-like alert
        showSuccess('Daily Affirmations: Take 1 minute to review your affirmations ✨');
        localStorage.setItem('affirmations_last_notify', todayKey);
      }
    };

    if ('Notification' in window) {
      if (Notification.permission === 'granted') {
        show();
      } else if (Notification.permission !== 'denied') {
        Notification.requestPermission().then((perm) => {
          if (perm === 'granted') show();
        });
      }
    }
  }, [navigate]);

  // Period notification check
  useEffect(() => {
    const checkPeriodNotification = async () => {
      if (!currentUser || !modulePreferences?.cycleTracker) return;
      
      try {
        const cycleStats = await getCycleStats(currentUser.uid);
        if (!cycleStats || !cycleStats.averageCycleLength) return;
        
        const today = new Date();
        const lastPeriod = cycleStats.lastPeriodDate ? new Date(cycleStats.lastPeriodDate) : null;
        
        if (!lastPeriod) return;
        
        const averageCycleLength = cycleStats.averageCycleLength;
        const expectedPeriodDate = new Date(lastPeriod);
        expectedPeriodDate.setDate(expectedPeriodDate.getDate() + averageCycleLength);
        
        const daysUntilExpected = Math.floor((expectedPeriodDate - today) / (1000 * 60 * 60 * 24));
        
        // Show notification if period is due within 2 days
        if (daysUntilExpected <= 2 && daysUntilExpected >= -1) {
          const message = daysUntilExpected === 0 
            ? "Your period is expected today! 🩸"
            : daysUntilExpected === 1 
            ? "Your period is expected tomorrow! 🩸"
            : daysUntilExpected === -1
            ? "Your period was expected yesterday! 🩸"
            : `Your period is expected in ${daysUntilExpected} days! 🩸`;
          
          showSuccess(message);
        }
      } catch (error) {
        console.error('Error checking period notification:', error);
      }
    };

    checkPeriodNotification();
  }, [currentUser, modulePreferences]);

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
            {modulePreferences.journal && (
              <div className="stat-card">
                <div className="stat-icon">📝</div>
                <div className="stat-content">
                  <h3>Journal Entries</h3>
                  <p className="stat-number">{journalCount}</p>
                  <span className="stat-label">This month</span>
                </div>
              </div>
            )}
            {modulePreferences.moodTracker && (
              <div className="stat-card">
                <div className="stat-icon">📊</div>
                <div className="stat-content">
                  <h3>Mood Tracking</h3>
                  <p className="stat-number">{moodCount}</p>
                  <span className="stat-label">Days logged</span>
                </div>
              </div>
            )}
            {modulePreferences.cycleTracker ? (
              <div className="stat-card">
                <div className="stat-icon">🌸</div>
                <div className="stat-content">
                  <h3>Cycle Insights</h3>
                  <p className="stat-number">
                    {cycleStats.totalCycles > 0 ? cycleStats.currentPhase : ''}
                  </p>
                  <span className="stat-label">Current phase</span>
                </div>
              </div>
            ) : (
              <div className="stat-card">
                <div className="stat-icon">💫</div>
                <div className="stat-content">
                  <h3>Wellness Streak</h3>
                  <p className="stat-number">{Math.max(journalCount, moodCount)}</p>
                  <span className="stat-label">Active days</span>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* Main Features */}
        <section className="features-section">
          <div className="features-grid">
            {modulePreferences.journal && (
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
            )}

            {modulePreferences.moodTracker && (
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
            )}

            {/* Always show third card - cycle tracker or wellness insights */}
            {modulePreferences.cycleTracker ? (
              <div className="feature-card health-cycle-card">
                <div className="feature-header">
                  <div className="feature-icon">🌸</div>
                  <h3>Cycle Tracker</h3>
                </div>
                <p>Keep track of your menstrual cycle with privacy and personalized insights.</p>
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
                      'Log Cycle'
                    )}
                </button>
              </div>
            ) : (
              <div className="feature-card wellness-insights-card">
                <div className="feature-header">
                  <div className="feature-icon">💫</div>
                  <h3>Wellness Insights</h3>
                </div>
                <p>Discover patterns in your wellness journey and get personalized insights.</p>
                <button
                  className="feature-button"
                  onClick={() => navigate('/export')}
                >
                  View Insights
                </button>
              </div>
            )}

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
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </div>
  );
}

export default Dashboard;

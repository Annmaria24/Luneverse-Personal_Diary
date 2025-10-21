import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
// Removed service imports to avoid Firebase index issues
import { getCycleEntriesCountForMonth, getCycleStats } from '../services/cycleService';
import { getPregnancyEntriesCountForMonth, getPregnancyStats } from '../services/pregnancyService';
import Navbar from '../components/Navbar';
import './Styles/InsightsPage.css';

function InsightsPage() {
  const navigate = useNavigate();
  const { currentUser, modulePreferences } = useAuth();
  const [loading, setLoading] = useState(true);
  const [insightsData, setInsightsData] = useState({
    journal: { entries: [], count: 0 },
    mood: { entries: [], count: 0, averageMood: 0 },
    cycle: { entries: [], count: 0, stats: {} },
    pregnancy: { entries: [], count: 0, stats: {} }
  });

  useEffect(() => {
    const fetchInsightsData = async () => {
      try {
        setLoading(true);
        const currentDate = new Date();
        const currentMonth = currentDate.getMonth() + 1; // JavaScript months are 0-indexed, so add 1
        const currentYear = currentDate.getFullYear();
        
        console.log('Current date:', currentDate);
        console.log('Current month (1-indexed):', currentMonth);
        console.log('Current year:', currentYear);

        const data = {
          journal: { entries: [], count: 0 },
          mood: { entries: [], count: 0, averageMood: 0 },
          cycle: { entries: [], count: 0, stats: {} },
          pregnancy: { entries: [], count: 0, stats: {} }
        };

        // Fetch journal data
        if (modulePreferences.journal) {
          try {
            // Use a simple query without ordering to avoid index issues
            const { collection, query, where, getDocs } = await import('firebase/firestore');
            const { db } = await import('../firebase/config');
            
            const journalRef = collection(db, "diaryEntries");
            const q = query(journalRef, where("userId", "==", currentUser.uid));
            const snapshot = await getDocs(q);
            
            const journalEntries = snapshot.docs.map(doc => ({
              id: doc.id,
              ...doc.data(),
              timestamp: doc.data().timestamp?.toDate ? doc.data().timestamp.toDate() : new Date(doc.data().timestamp)
            }));
            
            // Manual calculation for this month's data
            const currentMonthStart = new Date(currentYear, currentMonth - 1, 1);
            const currentMonthEnd = new Date(currentYear, currentMonth, 0);
            
            const journalCount = journalEntries.filter(entry => {
              const entryDate = new Date(entry.timestamp || entry.date);
              return entryDate >= currentMonthStart && entryDate <= currentMonthEnd;
            }).length;
            
            console.log('Journal entries fetched:', journalEntries.length);
            console.log('Journal count for this month:', journalCount);
            console.log('Month range:', currentMonthStart, 'to', currentMonthEnd);
            
            data.journal = { entries: journalEntries, count: journalCount };
          } catch (error) {
            console.error('Error fetching journal data:', error);
          }
        }

        // Fetch mood data
        if (modulePreferences.moodTracker) {
          try {
            // Use a simple query without ordering to avoid index issues
            const { collection, query, where, getDocs } = await import('firebase/firestore');
            const { db } = await import('../firebase/config');
            
            const moodRef = collection(db, "moodEntries");
            const q = query(moodRef, where("userId", "==", currentUser.uid));
            const snapshot = await getDocs(q);
            
            const moodEntries = snapshot.docs.map(doc => ({
              id: doc.id,
              ...doc.data(),
              timestamp: doc.data().timestamp?.toDate ? doc.data().timestamp.toDate() : new Date(doc.data().timestamp)
            }));
            
            // Manual calculation for this month's data
            const currentMonthStart = new Date(currentYear, currentMonth - 1, 1);
            const currentMonthEnd = new Date(currentYear, currentMonth, 0);
            
            const moodCount = moodEntries.filter(entry => {
              const entryDate = new Date(entry.timestamp || entry.date);
              return entryDate >= currentMonthStart && entryDate <= currentMonthEnd;
            }).length;
            
            const averageMood = moodEntries.length > 0 
              ? moodEntries.reduce((sum, entry) => sum + (entry.value || 0), 0) / moodEntries.length 
              : 0;
            
            console.log('Mood entries fetched:', moodEntries.length);
            console.log('Mood count for this month:', moodCount);
            console.log('Average mood:', averageMood);
            
            data.mood = { 
              entries: moodEntries, 
              count: moodCount, 
              averageMood: averageMood 
            };
          } catch (error) {
            console.error('Error fetching mood data:', error);
          }
        }

        // Fetch cycle data
        if (modulePreferences.cycleTracker) {
          try {
            const cycleStats = await getCycleStats();
            const cycleCount = await getCycleEntriesCountForMonth(currentMonth, currentYear);
            data.cycle = { entries: [], count: cycleCount, stats: cycleStats };
          } catch (error) {
            console.error('Error fetching cycle data:', error);
          }
        }

        // Fetch pregnancy data
        if (modulePreferences.pregnancyTracker) {
          try {
            const pregnancyStats = await getPregnancyStats();
            const pregnancyCount = await getPregnancyEntriesCountForMonth(currentMonth, currentYear);
            data.pregnancy = { entries: [], count: pregnancyCount, stats: pregnancyStats };
          } catch (error) {
            console.error('Error fetching pregnancy data:', error);
          }
        }

        console.log('Final insights data:', data);
        setInsightsData(data);
      } catch (error) {
        console.error('Error fetching insights data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchInsightsData();
  }, [modulePreferences]);

  const getMoodInsight = () => {
    const avgMood = insightsData.mood.averageMood;
    const entryCount = insightsData.mood.entries.length;
    
    if (entryCount < 2) return 'Start tracking to see patterns';
    
    // Analyze mood level and provide meaningful insights
    if (avgMood >= 4.0) {
      return '🌟 Maintaining positive mood';
    } else if (avgMood >= 3.0) {
      return '😊 Generally good mood';
    } else if (avgMood >= 2.0) {
      return '😔 Low mood - consider support';
    } else {
      return '😢 Very low mood - please seek help';
    }
  };

  const getMoodTrend = () => {
    if (insightsData.mood.entries.length < 4) return 'Need more data';
    
    const recent = insightsData.mood.entries.slice(-7);
    const older = insightsData.mood.entries.slice(-14, -7);
    
    if (older.length === 0) return 'Need more data';
    
    const recentAvg = recent.reduce((sum, entry) => sum + (entry.value || 0), 0) / recent.length;
    const olderAvg = older.reduce((sum, entry) => sum + (entry.value || 0), 0) / older.length;
    
    if (recentAvg > olderAvg + 0.5) return '📈 Improving';
    if (recentAvg < olderAvg - 0.5) return '📉 Declining';
    return '📊 Consistent';
  };

  const getJournalInsight = () => {
    const entries = insightsData.journal.entries;
    if (entries.length === 0) return 'Start journaling to see insights';
    
    const thisWeek = entries.filter(entry => {
      const entryDate = new Date(entry.date);
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      return entryDate >= weekAgo;
    }).length;
    
    if (thisWeek >= 5) return '🌟 Excellent consistency!';
    if (thisWeek >= 3) return '✨ Good progress';
    return '💭 Keep writing regularly';
  };

  const getWellnessScore = () => {
    let emotionalScore = 0;
    let maxScore = 0;
    let insights = [];
    
    // Journal emotional engagement (0-40 points)
    if (modulePreferences.journal) {
      maxScore += 40;
      const journalCount = insightsData.journal.count;
      const totalEntries = insightsData.journal.entries.length;
      
      if (journalCount > 0) {
        // Base score for writing regularly this month
        const writingScore = Math.min(20, (journalCount / 15) * 20);
        emotionalScore += writingScore;
        
        // Bonus for consistent writing (emotional processing)
        if (journalCount >= 10) {
          emotionalScore += 20;
          insights.push("Regular emotional processing through journaling");
        } else if (journalCount >= 5) {
          emotionalScore += 10;
          insights.push("Building journaling habits");
        }
      } else if (totalEntries > 0) {
        // Give some points for historical entries even if not this month
        emotionalScore += 5;
        insights.push("Previous journaling experience");
      }
    }
    
    // Mood awareness and tracking (0-35 points)
    if (modulePreferences.moodTracker) {
      maxScore += 35;
      const moodCount = insightsData.mood.count;
      const moodEntries = insightsData.mood.entries;
      
      if (moodCount > 0) {
        // Base score for mood awareness this month
        const awarenessScore = Math.min(20, (moodCount / 15) * 20);
        emotionalScore += awarenessScore;
        
        // Bonus for positive mood trends
        if (moodCount >= 7) {
          const avgMood = insightsData.mood.averageMood;
          if (avgMood >= 3.5) {
            emotionalScore += 15;
            insights.push("Maintaining positive emotional state");
          } else if (avgMood >= 2.5) {
            emotionalScore += 10;
            insights.push("Building emotional awareness");
          }
        } else if (moodCount >= 3) {
          emotionalScore += 5;
          insights.push("Starting mood tracking");
        }
      } else if (moodEntries.length > 0) {
        // Give some points for historical mood entries
        emotionalScore += 5;
        insights.push("Previous mood tracking experience");
      }
    }
    
    // Relaxation and self-care (0-25 points)
    if (modulePreferences.relaxMode) {
      maxScore += 25;
      // This would need to be implemented based on relax module usage
      // For now, give some points if relax mode is enabled
      emotionalScore += 15;
      insights.push("Engaging in relaxation practices");
    }
    
    if (maxScore === 0) return { 
      score: 0, 
      percentage: 0, 
      level: 'Starting Your Journey', 
      description: 'Begin tracking your emotional wellness',
      insights: []
    };
    
    const percentage = Math.round((emotionalScore / maxScore) * 100);
    let level, description;
    
    if (percentage >= 80) {
      level = 'Thriving Well-being';
      description = 'Excellent emotional awareness and self-care';
    } else if (percentage >= 60) {
      level = 'Cultivating Calm';
      description = 'Good emotional regulation and mindfulness';
    } else if (percentage >= 40) {
      level = 'Developing Resilience';
      description = 'Building emotional awareness and coping skills';
    } else if (percentage >= 20) {
      level = 'Emerging Awareness';
      description = 'Beginning to understand your emotional patterns';
    } else {
      level = 'Starting Your Journey';
      description = 'Taking the first steps in emotional wellness';
    }
    
    return { 
      score: Math.round(emotionalScore), 
      maxScore, 
      percentage, 
      level, 
      description,
      insights: insights.slice(0, 3) // Show top 3 insights
    };
  };

  const wellnessScore = getWellnessScore();

  if (loading) {
    return (
      <div className="insights-page">
        <Navbar />
        <div className="insights-loading">
          <div className="loading-spinner">⏳</div>
          <p>Loading your wellness insights...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="insights-page">
      <Navbar />
      
      <main className="insights-main">
        <div className="insights-header">
          <h1>Wellness Insights</h1>
          <p>Your personal growth and mental health journey</p>
        </div>

        {/* Emotional Wellness Overview */}
        <section className="wellness-score-section">
          <div className="wellness-score-card">
            <h2>Emotional Wellness Assessment</h2>
            <div className="score-display">
              <div className="score-circle">
                <span className="score-number">{wellnessScore.percentage}%</span>
                <span className="score-level">{wellnessScore.level}</span>
              </div>
              <div className="score-details">
                <p className="wellness-description">{wellnessScore.description}</p>
                {wellnessScore.insights.length > 0 && (
                  <div className="wellness-insights">
                    <p className="insights-label">Your strengths:</p>
                    <ul>
                      {wellnessScore.insights.map((insight, index) => (
                        <li key={index}>{insight}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* Module-specific Insights */}
        <div className="insights-grid">
          {/* Journal Insights */}
          {modulePreferences.journal && (
            <div className="insight-card journal-insight">
              <div className="insight-header">
                <div className="insight-icon">📝</div>
                <h3>Journal Insights</h3>
              </div>
              <div className="insight-content">
                <div className="insight-stat">
                  <span className="stat-number">{insightsData.journal.count}</span>
                  <span className="stat-label">Entries this month</span>
                </div>
                <div className="insight-trend">
                  <p>{getJournalInsight()}</p>
                </div>
                <div className="insight-details">
                  <p>Total entries: {insightsData.journal.entries.length}</p>
                  <p>Average per week: {Math.round(insightsData.journal.entries.length / 4)}</p>
                </div>
              </div>
            </div>
          )}

          {/* Mood Insights */}
          {modulePreferences.moodTracker && (
            <div className="insight-card mood-insight">
              <div className="insight-header">
                <div className="insight-icon">📊</div>
                <h3>Mood Insights</h3>
              </div>
              <div className="insight-content">
                <div className="insight-stat">
                  <span className="stat-number">{insightsData.mood.count}</span>
                  <span className="stat-label">Days tracked</span>
                </div>
                <div className="insight-trend">
                  <p>Average mood: {insightsData.mood.averageMood.toFixed(1)}/10</p>
                  <p className="mood-insight">{getMoodInsight()}</p>
                  <p className="mood-trend">Trend: {getMoodTrend()}</p>
                </div>
                <div className="insight-details">
                  <p>This month: {insightsData.mood.count} entries</p>
                  <p>Total tracked: {insightsData.mood.entries.length} days</p>
                </div>
              </div>
            </div>
          )}

          {/* Cycle Insights - Only show if enabled */}
          {modulePreferences.cycleTracker && (
            <div className="insight-card cycle-insight">
              <div className="insight-header">
                <div className="insight-icon">🌸</div>
                <h3>Cycle Insights</h3>
              </div>
              <div className="insight-content">
                <div className="insight-stat">
                  <span className="stat-number">{insightsData.cycle.stats.totalCycles || 0}</span>
                  <span className="stat-label">Cycles tracked</span>
                </div>
                <div className="insight-trend">
                  <p>Current phase: {insightsData.cycle.stats.currentPhase || 'Unknown'}</p>
                  <p>Cycle day: {insightsData.cycle.stats.currentCycleDay || 'N/A'}</p>
                </div>
                <div className="insight-details">
                  <p>This month: {insightsData.cycle.count} entries</p>
                  <p>Consistency: {insightsData.cycle.count > 0 ? 'Good' : 'Start tracking'}</p>
                </div>
              </div>
            </div>
          )}

          {/* Pregnancy Insights - Only show if enabled */}
          {modulePreferences.pregnancyTracker && (
            <div className="insight-card pregnancy-insight">
              <div className="insight-header">
                <div className="insight-icon">🤰</div>
                <h3>Pregnancy Insights</h3>
              </div>
              <div className="insight-content">
                <div className="insight-stat">
                  <span className="stat-number">{insightsData.pregnancy.stats.currentWeek || 0}</span>
                  <span className="stat-label">Current week</span>
                </div>
                <div className="insight-trend">
                  <p>Trimester: {insightsData.pregnancy.stats.currentTrimester || 'N/A'}</p>
                  <p>Progress: {insightsData.pregnancy.count > 0 ? 'Active tracking' : 'Start logging'}</p>
                </div>
                <div className="insight-details">
                  <p>This month: {insightsData.pregnancy.count} entries</p>
                  <p>Journey: {insightsData.pregnancy.stats.conceptionDate ? 'In progress' : 'Planning'}</p>
                </div>
              </div>
            </div>
          )}

          {/* Show message if no modules are enabled */}
          {!modulePreferences.journal && !modulePreferences.moodTracker && !modulePreferences.cycleTracker && !modulePreferences.pregnancyTracker && (
            <div className="insight-card no-modules-card">
              <div className="insight-header">
                <div className="insight-icon">💡</div>
                <h3>Enable Modules</h3>
              </div>
              <div className="insight-content">
                <p>Enable tracking modules in Settings to see your wellness insights and data.</p>
                <button 
                  className="feature-button"
                  onClick={() => navigate('/settings?tab=modules')}
                >
                  Go to Settings
                </button>
              </div>
            </div>
          )}
        </div>


        {/* Future AI/ML Section Placeholder */}
        <section className="future-insights-section">
          <div className="future-card">
            <h2>🚀 Coming Soon: AI-Powered Insights</h2>
            <p>Advanced analytics and personalized recommendations will be available soon:</p>
            <ul>
              <li>Pattern recognition in your mood and journal entries</li>
              <li>Predictive wellness recommendations</li>
              <li>Personalized growth strategies</li>
              <li>Correlation analysis between different tracking modules</li>
            </ul>
          </div>
        </section>
      </main>
    </div>
  );
}

export default InsightsPage;

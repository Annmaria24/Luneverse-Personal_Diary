 
import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import './Styles/CycleTrackerPage.css';
import {
  saveCycleEntry,
  getCycleData,
  getCycleStats,
  getCommonSymptoms,
  deleteCycleEntry,
} from "../services/cycleService";


import ProfileDropdown from '../components/ProfileDropdown';
import Navbar from '../components/Navbar';

function CycleTrackerPage() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [cycleData, setCycleData] = useState({});
  const [showSymptomModal, setShowSymptomModal] = useState(false);
  const [selectedSymptoms, setSelectedSymptoms] = useState([]);
  const [flow, setFlow] = useState('');
  const [notes, setNotes] = useState('');
  const [viewMode, setViewMode] = useState('calendar'); // 'calendar', 'insights'
  const [periodStatus, setPeriodStatus] = useState(''); // 'start', 'ongoing', 'end', 'none'
  const [isNavigating] = useState(false);
  const [loading, setLoading] = useState(true);
  const [cycleStats, setCycleStats] = useState({
    totalCycles: 0,
    averageCycleLength: 28,
    averagePeriodLength: 5,
    lastPeriodStart: null,
    nextPredictedPeriod: null,
    currentCycleDay: 1,
    currentPhase: 'Follicular'
  });
  const [commonSymptoms, setCommonSymptoms] = useState([]);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  // Disable global auto-backfill by default to avoid unintended mass updates
  const [backfilled, setBackfilled] = useState(true);



// Consumption tracking state
// Removed consumption tracking state as per user request
// const [consumptionDate, setConsumptionDate] = useState('');
// const [showConsumptionInput, setShowConsumptionInput] = useState(false);

  // Local confirmation modal state
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteModalBusy, setDeleteModalBusy] = useState(false);

  const symptoms = [
    { id: 'cramps', name: 'Cramps', icon: '🤕' },
    { id: 'headache', name: 'Headache', icon: '🤯' },
    { id: 'bloating', name: 'Bloating', icon: '🎈' },
    { id: 'mood_swings', name: 'Mood Swings', icon: '😤' },
    { id: 'fatigue', name: 'Fatigue', icon: '😴' },
    { id: 'acne', name: 'Acne', icon: '😣' },
    { id: 'breast_tenderness', name: 'Breast Tenderness', icon: '💔' },
    { id: 'back_pain', name: 'Back Pain', icon: '🦴' },
    { id: 'nausea', name: 'Nausea', icon: '🤢' },
    { id: 'food_cravings', name: 'Food Cravings', icon: '🍫' }
  ];

  const periodOptions = [
    { id: 'start', name: 'Period Start', color: '#dc2626', icon: '🔴' },
    { id: 'ongoing', name: 'Period Day', color: '#f87171', icon: '🩸' },
    { id: 'end', name: 'Period End', color: '#fca5a5', icon: '🔴' },
    { id: 'none', name: 'No Period', color: '#e5e7eb', icon: '⚪' }
  ];

  const flowLevels = [
    { id: 'light', name: 'Light', color: '#fecaca', icon: '💧' },
    { id: 'medium', name: 'Medium', color: '#f87171', icon: '💧💧' },
    { id: 'heavy', name: 'Heavy', color: '#dc2626', icon: '💧💧💧' },
    { id: 'spotting', name: 'Spotting', color: '#fde68a', icon: '✨' }
  ];

  useEffect(() => {
    if (currentUser) {
      loadCycleData();
    }
  }, [currentUser]);

  // After data loads, backfill ongoing days between start and end into DB/UI
  useEffect(() => {
    const backfill = async () => {
      if (!currentUser || loading || backfilled) return;
      try {
        const intervals = periodInfo.intervals; // [startKey, endKey]
        if (!intervals || intervals.length === 0) return;

        let anySaved = false;
        for (const [startKey, endKey] of intervals) {
          // iterate each day between start and end (exclusive of boundaries)
          let d = new Date(startKey + 'T00:00:00Z');
          d.setUTCDate(d.getUTCDate() + 1);
          const end = new Date(endKey + 'T00:00:00Z');
          while (d < end) {
            const key = d.toISOString().split('T')[0];
            if (!cycleData[key] || !['start','ongoing','end'].includes(cycleData[key].periodStatus)) {
              await saveCycleEntry(currentUser.uid, d, {
                periodStatus: 'ongoing',
                type: 'period',
              });
              anySaved = true;
            }
            d.setUTCDate(d.getUTCDate() + 1);
          }
        }
        if (anySaved) {
          // reload data to reflect backfilled days
          const data = await getCycleData(currentUser.uid);
          setCycleData(data);
        }
      } catch (e) {
        console.error('Backfill failed', e);
      } finally {
        setBackfilled(true);
      }
    };
    backfill();
  }, [currentUser, loading, backfilled, cycleData]);



  // Save consumptionDate to user settings
  // Removed consumption save function as per user request
  // const saveConsumptionDate = async (date) => {
  //   if (!currentUser) return;
  //   try {
  //     await saveUserSettings(currentUser.uid, { consumptionDate: date });
  //     setConsumptionDate(date);
  //   } catch (error) {
  //     console.error("Error saving consumption date:", error);
  //   }
  // };

  const loadCycleData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Load cycle data
      const data = await getCycleData(currentUser.uid);
      setCycleData(data);
      
      // Load cycle statistics
      const stats = await getCycleStats(currentUser.uid);
      setCycleStats(stats);
      
      // Load common symptoms
      const symptoms = await getCommonSymptoms(currentUser.uid);
      setCommonSymptoms(symptoms);
      
    } catch (error) {
      console.error("Error loading cycle data:", error);
      setError(`Failed to load cycle data: ${error.message}. Please refresh the page and try again.`);
    } finally {
      setLoading(false);
    }
  };

  const getDaysInMonth = (date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  const formatDateKey = (date) => {
    return date.toISOString().split('T')[0];
  };

  const getDayData = (day) => {
    const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
    const dateKey = formatDateKey(date);
    return cycleData[dateKey] || null;
  };

  // Inference removed: do not compute intervals; only explicit entries are shown
  const periodInfo = useMemo(() => ({ intervals: [], startSet: new Set(), endSet: new Set() }), [cycleData]);

  // Backfill helpers removed; no automatic filling between start and end

  // Check if a date is in the future
  const isFutureDate = (date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const checkDate = new Date(date);
    checkDate.setHours(0, 0, 0, 0);
    return checkDate > today;
  };

  const handleDateClick = (day) => {
    const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);

    setSelectedDate(date);
    setShowSymptomModal(true);

    // Load existing data for this date
    const dateKey = formatDateKey(date);
    const existingData = cycleData[dateKey];
    if (existingData) {
      setSelectedSymptoms(existingData.symptoms || []);
      setFlow(existingData.flow || '');
      setNotes(existingData.notes || '');
      setPeriodStatus(existingData.periodStatus || 'none');
    } else {
      setSelectedSymptoms([]);
      setFlow('');
      setNotes('');
      setPeriodStatus('none');
    }

    // Removed consumption input reset as per user request
    // setShowConsumptionInput(false);
  };

  const handleSaveData = async () => {
    try {
      // Allow saving notes and reminders for future dates, but restrict period tracking to past/present dates
      if (isFutureDate(selectedDate) && (periodStatus === 'start' || periodStatus === 'ongoing' || periodStatus === 'end')) {
        setError("Cannot track period data for future dates. However, you can add notes and symptom reminders.");
        setTimeout(() => setError(null), 3000);
        return;
      }

      // Determine type based on period status and other data
      let type = 'none';
      if (periodStatus === 'start' || periodStatus === 'ongoing' || periodStatus === 'end') {
        type = 'period';
      } else if (selectedSymptoms.length > 0) {
        type = 'symptoms';
      } else if (notes.trim() !== '') {
        type = 'notes';
      }

      const entryData = {
        periodStatus: periodStatus,
        symptoms: selectedSymptoms,
        flow: flow,
        notes: notes,
        type: type
      };

      // Save to Firebase
      await saveCycleEntry(currentUser.uid, selectedDate, entryData);

      // Update local state
      const dateKey = formatDateKey(selectedDate);
      const newData = {
        ...cycleData,
        [dateKey]: {
          ...entryData,
          date: dateKey,
          userId: currentUser.uid
        }
      };
      setCycleData(newData);

      // No auto-fill/backfill. Only save explicit entries.

      // Reload stats to reflect changes and ensure UI sync
      const stats = await getCycleStats(currentUser.uid);
      setCycleStats(stats);
      const refreshed = await getCycleData(currentUser.uid);
      setCycleData(refreshed);

      setSuccessMessage("Cycle data saved successfully!");
      setTimeout(() => setSuccessMessage(null), 3000);

      setShowSymptomModal(false);
    } catch (error) {
      console.error("Error saving cycle data:", error);
      setError("Failed to save cycle data. Please try again.");
      // Don't close modal on error so user can retry
    }
  };

  const navigateMonth = (direction) => {
    const newDate = new Date(currentDate);
    newDate.setMonth(newDate.getMonth() + direction);
    setCurrentDate(newDate);
  };

  // Delete all period entries for the current visible month
  const deleteCurrentMonthPeriods = async () => {
    if (!currentUser) return;

    const monthName = currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

    try {
      setLoading(true);
      setError(null);

      // Build month prefix e.g. 2025-08-
      const year = currentDate.getFullYear();
      const month = String(currentDate.getMonth() + 1).padStart(2, '0');
      const prefix = `${year}-${month}-`;

      // Collect keys to delete from local state to avoid index requirements
      const dates = Object.keys(cycleData).filter(k => k.startsWith(prefix));

      // Delete each entry for the month
      for (const dateKey of dates) {
        // Use UTC midnight to ensure matching doc id "userId_YYYY-MM-DD"
        await deleteCycleEntry(currentUser.uid, new Date(`${dateKey}T00:00:00Z`));
      }

      // Refresh local state and stats
      const refreshed = await getCycleData(currentUser.uid);
      setCycleData(refreshed);
      const stats = await getCycleStats(currentUser.uid);
      setCycleStats(stats);

      setSuccessMessage(`Deleted ${dates.length} record(s) for ${monthName}.`);
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      console.error('Failed to delete month records:', err);
      setError('Failed to delete month records. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const toggleSymptom = (symptomId) => {
    setSelectedSymptoms(prev => 
      prev.includes(symptomId) 
        ? prev.filter(id => id !== symptomId)
        : [...prev, symptomId]
    );
  };

  const getPredictedNextPeriod = () => {
    if (cycleStats.nextPredictedPeriod) {
      return new Date(cycleStats.nextPredictedPeriod);
    }
    // Fallback to simple prediction
    const today = new Date();
    const nextPeriod = new Date(today);
    nextPeriod.setDate(today.getDate() + 28);
    return nextPeriod;
  };

  const getCycleDay = () => {
    return cycleStats.currentCycleDay || 1;
  };

  const getCurrentPhase = () => {
    return cycleStats.currentPhase || 'Follicular';
  };

  const formatSymptomName = (symptomId) => {
    const symptom = symptoms.find(s => s.id === symptomId);
    return symptom ? symptom.name : symptomId.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  const handleDeleteEntry = async () => {
    try {
      await deleteCycleEntry(currentUser.uid, selectedDate);
      
      // Remove from local state
      const dateKey = formatDateKey(selectedDate);
      const newData = { ...cycleData };
      delete newData[dateKey];
      setCycleData(newData);
      
      // Reload stats to reflect changes
      const stats = await getCycleStats(currentUser.uid);
      setCycleStats(stats);
      
      setShowSymptomModal(false);
    } catch (error) {
      console.error("Error deleting cycle entry:", error);
      setError("Failed to delete entry. Please try again.");
    }
  };



  const renderCalendar = () => {
    const daysInMonth = getDaysInMonth(currentDate);
    const firstDay = getFirstDayOfMonth(currentDate);
    const days = [];

    // Empty cells for days before the first day of the month
    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} className="calendar-day empty"></div>);
    }

    // Days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const dayData = getDayData(day);
      const isToday = new Date().getDate() === day &&
                     new Date().getMonth() === currentDate.getMonth() &&
                     new Date().getFullYear() === currentDate.getFullYear();

      // Determine the type of data for more specific styling
      let dataClass = '';
      // Compute dateKey for this calendar day
      const dateObj = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
      const dateKey = formatDateKey(dateObj);

      // Check if this day is in the future
    const isFuture = isFutureDate(dateObj);

    // Inference disabled: only show explicit entries

    if (dayData) {
      const hasPeriodData = dayData && dayData.periodStatus && dayData.periodStatus !== 'none';
      const hasFlowData = dayData && dayData.type === 'period' && dayData.flow;
      const hasOvulationData = dayData && dayData.type === 'ovulation';
      const hasOnlySymptoms = dayData && dayData.symptoms && dayData.symptoms.length > 0 && !hasPeriodData && !hasFlowData && !hasOvulationData;

      if (hasPeriodData || hasFlowData) {
        dataClass = 'has-period-data';
      } else if (hasOvulationData) {
        dataClass = 'has-ovulation-data';
      } else if (hasOnlySymptoms) {
        dataClass = 'has-symptoms-only';
      } else {
        dataClass = 'has-data';
      }
    }

      days.push(
        <div
          key={day}
          className={`calendar-day ${isToday ? 'today' : ''} ${dataClass} ${isFuture ? 'future-date' : ''}`}
          onClick={() => handleDateClick(day)}
        >
          <span className="day-number">{day}</span>
          {dayData && (
            <div className="day-indicators">
              {/* Show only explicit period status */}
              {(dayData && dayData.periodStatus && dayData.periodStatus !== 'none') && (
                <div className={`period-indicator ${dayData?.flow || dayData?.periodStatus}`}>
                  {dayData?.periodStatus === 'start' && '🔴'}
                  {dayData?.periodStatus === 'ongoing' && '🩸'}
                  {dayData?.periodStatus === 'end' && '🔴'}
                </div>
              )}
              {dayData && dayData.type === 'period' && dayData.flow && (
                <div className={`period-indicator ${dayData.flow}`}>
                  {dayData.flow === 'light' && '💧'}
                  {dayData.flow === 'medium' && '💧💧'}
                  {dayData.flow === 'heavy' && '💧💧💧'}
                  {dayData.flow === 'spotting' && '✨'}
                </div>
              )}
              {dayData && dayData.type === 'ovulation' && (
                <div className="ovulation-indicator">🥚</div>
              )}
              {dayData && dayData.symptoms && dayData.symptoms.length > 0 && (
                <div className="symptoms-indicator">{dayData.symptoms.length}</div>
              )}
            </div>
          )}
        </div>
      );
    }

    return days;
  };

  if (loading) {
    return (
      <div className="cycle-tracker-page">
        <div className="loading-container">
          <div className="loading-spinner">⏳</div>
          <p>Loading your cycle data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="cycle-tracker-page">
        <div className="error-container">
          <div className="error-icon">⚠️</div>
          <p>{error}</p>
          <button onClick={loadCycleData} className="retry-btn">
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Removed extra header to integrate with Navbar */}
      <Navbar viewToggleProps={{ viewMode, setViewMode }} />
      <div className="cycle-tracker-page">
        {/* Header */}
        {/* Removed extra header to integrate with Navbar */}
        {/* <header className="cycle-header">
          <div className="header-left">
            <button onClick={goBack} className={`back-button ${isNavigating ? 'loading' : ''}`} disabled={isNavigating}>
              {isNavigating ? (
                <>
                  <span className="loading-spinner">⏳</span>
                  Loading...
                </>
              ) : (
                <>
                  <span className="back-arrow">←</span>
                  Back
                </>
              )}
            </button>
          </div>
          <h1 className="header-title">Cycle Tracker</h1>
          <div className="header-right">
            <div className="view-toggle">
              <button
                onClick={() => setViewMode('calendar')}
                className={`view-btn ${viewMode === 'calendar' ? 'active' : ''}`}
              >
                Calendar
              </button>
              <button
                onClick={() => setViewMode('insights')}
                className={`view-btn ${viewMode === 'insights' ? 'active' : ''}`}
              >
                Insights
              </button>
            </div>
            <ProfileDropdown />
          </div>
        </header> */}

      {/* Success Message */}
      {successMessage && (
        <div className="success-message">
          <span className="success-icon">✅</span>
          {successMessage}
        </div>
      )}

      <div className="cycle-container">
        {/* Cycle Overview */}
        <div className="cycle-overview">
          <div className="overview-card">
            <h3>Current Cycle</h3>
            <div className="cycle-info">
              <span className="cycle-day">Day {getCycleDay()}</span>
              <span className="cycle-phase">{getCurrentPhase()} Phase</span>
            </div>
          </div>
          <div className="overview-card">
            <h3>Next Period</h3>
            <div className="next-period">
              <span className="days-until">
                {Math.ceil((getPredictedNextPeriod() - new Date()) / (1000 * 60 * 60 * 24))} days
              </span>
              <span className="predicted-date">
                {getPredictedNextPeriod().toLocaleDateString()}
              </span>
            </div>
          </div>
          <div className="overview-card">
            <h3>Average Cycle</h3>
            <div className="cycle-stats">
              <span className="cycle-length">{cycleStats.averageCycleLength} days</span>
              <span className="period-length">{cycleStats.averagePeriodLength} days</span>
            </div>
          </div>
        </div>

        {viewMode === 'calendar' ? (
          <>
            {/* Calendar Navigation */}
            <div className="calendar-navigation">
              <button onClick={() => navigateMonth(-1)} className="nav-btn">
                <span>‹</span>
              </button>
              <h2 className="current-month">
                {currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
              </h2>
              <button onClick={() => navigateMonth(1)} className="nav-btn">
                <span>›</span>
              </button>
            </div>

            {/* Month actions */}
            <div className="month-actions" style={{ display: 'flex', justifyContent: 'flex-end', margin: '8px 0' }}>
              <button onClick={() => setShowDeleteModal(true)} className="danger-btn" title="Delete all tracking entries for this month">
                Clear records
              </button>
            </div>

            {/* Calendar */}
            <div className="calendar-section">
              <div className="calendar-header">
                <div className="day-header">Sun</div>
                <div className="day-header">Mon</div>
                <div className="day-header">Tue</div>
                <div className="day-header">Wed</div>
                <div className="day-header">Thu</div>
                <div className="day-header">Fri</div>
                <div className="day-header">Sat</div>
              </div>
              <div className="calendar-grid">
                {renderCalendar()}
              </div>
            </div>

            {/* Legend */}
            <div className="calendar-legend">
              <h3>Legend</h3>
              <div className="legend-items">
                <div className="legend-item">
                  <span className="legend-icon period-indicator start">🔴</span>
                  <span>Period Start/End</span>
                </div>
                <div className="legend-item">
                  <span className="legend-icon period-indicator ongoing">🩸</span>
                  <span>Period Day</span>
                </div>
                <div className="legend-item">
                  <span className="legend-icon period-indicator light">💧</span>
                  <span>Light Flow</span>
                </div>
                <div className="legend-item">
                  <span className="legend-icon period-indicator medium">💧💧</span>
                  <span>Medium Flow</span>
                </div>
                <div className="legend-item">
                  <span className="legend-icon period-indicator heavy">💧💧💧</span>
                  <span>Heavy Flow</span>
                </div>
                <div className="legend-item">
                  <span className="legend-icon period-indicator spotting">✨</span>
                  <span>Spotting</span>
                </div>
                <div className="legend-item">
                  <span className="legend-icon">🥚</span>
                  <span>Ovulation</span>
                </div>
                <div className="legend-item">
                  <span className="legend-icon">1-9</span>
                  <span>Symptoms Count</span>
                </div>
              </div>
            </div>
          </>
        ) : (
          /* Insights View */
          <div className="insights-section">
            <div className="insights-grid">
              <div className="insight-card">
                <h3>Cycle Regularity</h3>
                <div className="regularity-score">85%</div>
                <p>Your cycles are fairly regular</p>
              </div>
              <div className="insight-card">
                <h3>Common Symptoms</h3>
                <div className="common-symptoms">
                  {commonSymptoms.length > 0 ? (
                    commonSymptoms.slice(0, 3).map((symptom, index) => (
                      <span key={index}>{formatSymptomName(symptom.symptom)}</span>
                    ))
                  ) : (
                    <span>No symptoms tracked yet</span>
                  )}
                </div>
              </div>
              <div className="insight-card">
                <h3>Cycle Statistics</h3>
                <div className="trend-info">
                  <p>📊 Total cycles tracked: {cycleStats.totalCycles}</p>
                  <p>📅 Average cycle: {cycleStats.averageCycleLength} days</p>
                  {cycleStats.lastPeriodStart && (
                    <p>🩸 Last period: {new Date(cycleStats.lastPeriodStart).toLocaleDateString()}</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Delete Month Confirmation Modal */}
      {showDeleteModal && (
        <div className="modal-overlay" onClick={() => !deleteModalBusy && setShowDeleteModal(false)}>
          <div className="symptom-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Clear records for {currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</h3>
              <button onClick={() => !deleteModalBusy && setShowDeleteModal(false)} className="close-btn" disabled={deleteModalBusy}>×</button>
            </div>
            <div className="modal-content">
              <p>This will permanently delete all period tracking entries for this month. This action cannot be undone.</p>
            </div>
            <div className="modal-actions">
              <button onClick={() => !deleteModalBusy && setShowDeleteModal(false)} className="cancel-btn" disabled={deleteModalBusy}>Cancel</button>
              <button
                onClick={async () => {
                  try {
                    setDeleteModalBusy(true);
                    await deleteCurrentMonthPeriods();
                    setShowDeleteModal(false);
                  } finally {
                    setDeleteModalBusy(false);
                  }
                }}
                className="delete-btn"
                disabled={deleteModalBusy}
              >
                {deleteModalBusy ? 'Clearing...' : 'Confirm Clear'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Symptom Modal */}
      {showSymptomModal && (
        <div className="modal-overlay" onClick={() => setShowSymptomModal(false)}>
          <div className="symptom-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Track for {selectedDate.toLocaleDateString()}</h3>
              <button onClick={() => setShowSymptomModal(false)} className="close-btn">×</button>
            </div>

            <div className="modal-content">
              {/* Period Status Section */}
              <div className="period-section">
                <h4>Period Status</h4>
                <div className="period-options">
              {/* Updated period status buttons to new design */}
              <div className="period-btn-group">
                {periodOptions.map((option) => (
                  <button
                    key={option.id}
                    onClick={() => setPeriodStatus(option.id)}
                    className={`period-btn-new ${periodStatus === option.id ? 'selected' : ''}`}
                  >
                    <span className={`period-icon-new ${option.id}`}>
                      {option.icon}
                    </span>
                    <span className="period-name-new">{option.name}</span>
                    {periodStatus === option.id && <div className="arrow-up"></div>}
                  </button>
                ))}
              </div>
                </div>
              </div>

              {/* Flow Section - Only show if period is active */}
              {(periodStatus === 'start' || periodStatus === 'ongoing' || periodStatus === 'end') && (
                <div className="flow-section">
                <h4>Flow</h4>
                <div className="flow-options">
                  {flowLevels.map((level) => (
                    <button
                      key={level.id}
                      onClick={() => setFlow(level.id)}
                      className={`flow-btn ${flow === level.id ? 'selected' : ''}`}
                      style={{ '--flow-color': level.color }}
                    >
                      <span className="flow-icon">{level.icon}</span>
                      <span className="flow-name">{level.name}</span>
                    </button>
                  ))}
                </div>
              </div>
              )}

              {/* Symptoms Section */}
              <div className="symptoms-section">
                <h4>Symptoms</h4>
                <div className="symptoms-grid">
                  {symptoms.map((symptom) => (
                    <button
                      key={symptom.id}
                      onClick={() => toggleSymptom(symptom.id)}
                      className={`symptom-btn ${selectedSymptoms.includes(symptom.id) ? 'selected' : ''}`}
                    >
                      <span className="symptom-icon">{symptom.icon}</span>
                      <span className="symptom-name">{symptom.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Notes Section */}
              <div className="notes-section">
                <h4>Notes</h4>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Any additional notes..."
                  className="notes-input"
                  rows="3"
                />
              </div>



          {/* Consumption marking section */}
          {/* Removed consumption marking section as per user request */}
          {/* <div className="consumption-section">
            <h4>Mark Consumption</h4>
            <div className="consumption-toggle">
              <input
                type="checkbox"
                id="consumptionToggle"
                checked={showConsumptionInput}
                onChange={(e) => setShowConsumptionInput(e.target.checked)}
              />
              <label htmlFor="consumptionToggle">I consumed on this day</label>
            </div>
            {showConsumptionInput && (
              <input
                type="date"
                className="consumption-date-input"
                value={consumptionDate}
                max={new Date().toISOString().split('T')[0]}
                onChange={(e) => saveConsumptionDate(e.target.value)}
              />
            )}
          </div> */}

            <div className="modal-actions">
                <button onClick={() => setShowSymptomModal(false)} className="cancel-btn">
                  Cancel
                </button>
                {/* Show delete button only if there's existing data */}
                {cycleData[formatDateKey(selectedDate)] && (
                  <button onClick={handleDeleteEntry} className="delete-btn">
                    Delete
                  </button>
                )}
                <button onClick={handleSaveData} className="save-btn">
                  Save
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
    </>
  );
}

export default CycleTrackerPage;

import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import './Styles/CycleTrackerPage.css';
import { addCycleEntry, getCycleData } from "../services/cycleService";
import { auth } from "../firebase/config";
import ProfileDropdown from '../components/ProfileDropdown';

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
    loadCycleData();
  }, []);

  const loadCycleData = () => {
    // TODO: Implement Firebase integration
    // Mock data for demonstration
    const mockData = {
      '2025-01-15': { type: 'period', periodStatus: 'start', flow: 'heavy', symptoms: ['cramps', 'fatigue'], notes: 'Period started' },
      '2025-01-16': { type: 'period', periodStatus: 'ongoing', flow: 'medium', symptoms: ['headache'], notes: '' },
      '2025-01-17': { type: 'period', periodStatus: 'ongoing', flow: 'light', symptoms: [], notes: '' },
      '2025-01-18': { type: 'period', periodStatus: 'end', flow: 'spotting', symptoms: [], notes: 'Period ended' },
      '2025-01-29': { type: 'ovulation', periodStatus: 'none', symptoms: ['mood_swings'], notes: 'Ovulation day' }
    };
    setCycleData(mockData);
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
  };

  const handleSaveData = () => {
    const dateKey = formatDateKey(selectedDate);

    // Determine type based on period status and other data
    let type = 'none';
    if (periodStatus === 'start' || periodStatus === 'ongoing' || periodStatus === 'end') {
      type = 'period';
    } else if (selectedSymptoms.length > 0) {
      type = 'symptoms';
    }

    const newData = {
      ...cycleData,
      [dateKey]: {
        periodStatus: periodStatus,
        symptoms: selectedSymptoms,
        flow: flow,
        notes: notes,
        type: type
      }
    };
    setCycleData(newData);
    setShowSymptomModal(false);
  };

  const navigateMonth = (direction) => {
    const newDate = new Date(currentDate);
    newDate.setMonth(newDate.getMonth() + direction);
    setCurrentDate(newDate);
  };

  const toggleSymptom = (symptomId) => {
    setSelectedSymptoms(prev => 
      prev.includes(symptomId) 
        ? prev.filter(id => id !== symptomId)
        : [...prev, symptomId]
    );
  };

  const getPredictedNextPeriod = () => {
    // Simple prediction logic - in real app, this would be more sophisticated
    const today = new Date();
    const nextPeriod = new Date(today);
    nextPeriod.setDate(today.getDate() + 28); // Average cycle length
    return nextPeriod;
  };

  const getCycleDay = () => {
    // Mock cycle day calculation
    return 14; // Day 14 of cycle
  };

  const goBack = () => {
    navigate('/dashboard');
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

      days.push(
        <div
          key={day}
          className={`calendar-day ${isToday ? 'today' : ''} ${dayData ? 'has-data' : ''}`}
          onClick={() => handleDateClick(day)}
        >
          <span className="day-number">{day}</span>
          {dayData && (
            <div className="day-indicators">
              {dayData.periodStatus && dayData.periodStatus !== 'none' && (
                <div className={`period-status-indicator ${dayData.periodStatus}`}>
                  {dayData.periodStatus === 'start' && '🔴'}
                  {dayData.periodStatus === 'ongoing' && '🩸'}
                  {dayData.periodStatus === 'end' && '🔴'}
                </div>
              )}
              {dayData.type === 'period' && dayData.flow && (
                <div className={`flow-indicator ${dayData.flow}`}>
                  {dayData.flow === 'light' && '💧'}
                  {dayData.flow === 'medium' && '💧💧'}
                  {dayData.flow === 'heavy' && '💧💧💧'}
                  {dayData.flow === 'spotting' && '✨'}
                </div>
              )}
              {dayData.type === 'ovulation' && (
                <div className="ovulation-indicator">🥚</div>
              )}
              {dayData.symptoms && dayData.symptoms.length > 0 && (
                <div className="symptoms-indicator">{dayData.symptoms.length}</div>
              )}
            </div>
          )}
        </div>
      );
    }

    return days;
  };

  return (
    <div className="cycle-tracker-page">
      {/* Header */}
      <header className="cycle-header">
        <button onClick={goBack} className="back-button">
          <span className="back-arrow">←</span>
          Dashboard
        </button>
        <h1>Cycle Tracker</h1>
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
      </header>

      <div className="cycle-container">
        {/* Cycle Overview */}
        <div className="cycle-overview">
          <div className="overview-card">
            <h3>Current Cycle</h3>
            <div className="cycle-info">
              <span className="cycle-day">Day {getCycleDay()}</span>
              <span className="cycle-phase">Follicular Phase</span>
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
              <span className="cycle-length">28 days</span>
              <span className="period-length">5 days</span>
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
                  <span className="legend-icon">🔴</span>
                  <span>Period Start/End</span>
                </div>
                <div className="legend-item">
                  <span className="legend-icon">🩸</span>
                  <span>Period Day</span>
                </div>
                <div className="legend-item">
                  <span className="legend-icon">💧</span>
                  <span>Light Flow</span>
                </div>
                <div className="legend-item">
                  <span className="legend-icon">💧💧</span>
                  <span>Medium Flow</span>
                </div>
                <div className="legend-item">
                  <span className="legend-icon">💧💧💧</span>
                  <span>Heavy Flow</span>
                </div>
                <div className="legend-item">
                  <span className="legend-icon">✨</span>
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
                  <span>Cramps</span>
                  <span>Fatigue</span>
                  <span>Headache</span>
                </div>
              </div>
              <div className="insight-card">
                <h3>Cycle Trends</h3>
                <div className="trend-info">
                  <p>📈 Cycle length increasing</p>
                  <p>📊 Symptoms decreasing</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

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
                  {periodOptions.map((option) => (
                    <button
                      key={option.id}
                      onClick={() => setPeriodStatus(option.id)}
                      className={`period-btn ${periodStatus === option.id ? 'selected' : ''}`}
                      style={{ '--period-color': option.color }}
                    >
                      <span className="period-icon">{option.icon}</span>
                      <span className="period-name">{option.name}</span>
                    </button>
                  ))}
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

              <div className="modal-actions">
                <button onClick={() => setShowSymptomModal(false)} className="cancel-btn">
                  Cancel
                </button>
                <button onClick={handleSaveData} className="save-btn">
                  Save
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default CycleTrackerPage;

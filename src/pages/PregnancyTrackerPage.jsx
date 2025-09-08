import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import './Styles/PregnancyTrackerPage.css';
import {
  savePregnancyEntry,
  getPregnancyData,
  getPregnancyStats,
  deletePregnancyEntry,
  getBabyGrowthInfo,
  getPregnancyAdvice,
  calculatePregnancyWeek,
  getTrimester
} from "../services/pregnancyService";
import { getUserSettings, saveUserSettings } from "../services/userService";
import ProfileDropdown from '../components/ProfileDropdown';
import Navbar from '../components/Navbar';

function PregnancyTrackerPage() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [pregnancyData, setPregnancyData] = useState({});
  const [showSymptomModal, setShowSymptomModal] = useState(false);
  const [selectedSymptoms, setSelectedSymptoms] = useState([]);
  const [notes, setNotes] = useState('');
  const [doctorAppointments, setDoctorAppointments] = useState([]);
  const [viewMode, setViewMode] = useState('calendar'); // 'calendar', 'insights'
  const [loading, setLoading] = useState(true);
  const [pregnancyStats, setPregnancyStats] = useState({
    totalEntries: 0,
    currentWeek: 1,
    currentTrimester: 1,
    commonSymptoms: [],
    lastEntry: null,
    nextAppointment: null
  });
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const [dueDate, setDueDate] = useState('');
  const [conceptionDate, setConceptionDate] = useState('');

  // Calculate due date from conception date (conception + 266 days)
  const calculateDueDateFromConception = (conceptionDateStr) => {
    if (!conceptionDateStr) return '';
    const conception = new Date(conceptionDateStr);
    const dueDate = new Date(conception);
    dueDate.setDate(conception.getDate() + 266); // 38 weeks = 266 days
    return dueDate.toISOString().split('T')[0];
  };

  // Load stored dueDate and conceptionDate once on mount
  useEffect(() => {
    if (!currentUser) return;
    const loadStoredDates = async () => {
      try {
        const userSettings = await getUserSettings(currentUser.uid);
        if (userSettings) {
          if (userSettings.conceptionDate) {
            setConceptionDate(userSettings.conceptionDate);
            // Auto-calculate due date if not already set
            if (!userSettings.dueDate) {
              const calculatedDueDate = calculateDueDateFromConception(userSettings.conceptionDate);
              setDueDate(calculatedDueDate);
            } else {
              setDueDate(userSettings.dueDate);
            }
          } else if (userSettings.dueDate) {
            setDueDate(userSettings.dueDate);
          }
        }
      } catch (error) {
        console.error("Failed to load stored dates:", error);
      }
    };
    loadStoredDates();
  }, [currentUser]);

  // Handle conception date change and auto-calculate due date
  const handleConceptionDateChange = async (newConceptionDate) => {
    setConceptionDate(newConceptionDate);
    setError(null); // Clear any existing errors
    
    if (newConceptionDate) {
      const calculatedDueDate = calculateDueDateFromConception(newConceptionDate);
      setDueDate(calculatedDueDate);
      // Save both dates
      try {
        await saveUserSettings(currentUser.uid, { 
          conceptionDate: newConceptionDate, 
          dueDate: calculatedDueDate 
        });
        setSuccessMessage("Conception date saved and due date calculated!");
        setTimeout(() => setSuccessMessage(null), 3000);
      } catch (error) {
        console.error("Failed to save dates:", error);
        setError("Failed to save dates. Please try again.");
        setTimeout(() => setError(null), 5000);
      }
    }
  };

  // Handle due date change (manual override)
  const handleDueDateChange = async (newDueDate) => {
    setDueDate(newDueDate);
    setError(null); // Clear any existing errors
    
    try {
      await saveUserSettings(currentUser.uid, { dueDate: newDueDate });
      setSuccessMessage("Due date updated!");
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (error) {
      console.error("Failed to save due date:", error);
      setError("Failed to save due date. Please try again.");
      setTimeout(() => setError(null), 5000);
    }
  };
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const pregnancySymptoms = [
    { id: 'nausea', name: 'Nausea/Morning Sickness', icon: '🤢' },
    { id: 'fatigue', name: 'Fatigue', icon: '😴' },
    { id: 'breast_tenderness', name: 'Breast Tenderness', icon: '💔' },
    { id: 'back_pain', name: 'Back Pain', icon: '🦴' },
    { id: 'headache', name: 'Headache', icon: '🤯' },
    { id: 'food_cravings', name: 'Food Cravings', icon: '🍫' },
    { id: 'swelling', name: 'Swelling', icon: '🦵' },
    { id: 'heartburn', name: 'Heartburn', icon: '🔥' },
    { id: 'insomnia', name: 'Insomnia', icon: '😵' },
    { id: 'mood_swings', name: 'Mood Swings', icon: '😤' }
  ];

  useEffect(() => {
    if (currentUser) {
      loadPregnancyData();
    }
  }, [currentUser]);

  const loadPregnancyData = async () => {
    try {
      setLoading(true);
      setError(null);

      const data = await getPregnancyData(currentUser.uid);
      setPregnancyData(data);

      const stats = await getPregnancyStats(currentUser.uid);
      setPregnancyStats(stats);

    } catch (error) {
      console.error("Error loading pregnancy data:", error);
      setError(`Failed to load pregnancy data: ${error.message}. Please refresh the page and try again.`);
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

  // Adjust day headers style for better visibility
  const dayHeaders = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const formatDateKey = (date) => {
    return date.toISOString().split('T')[0];
  };

  // Check if a date is in the future
  const isFutureDate = (date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const checkDate = new Date(date);
    checkDate.setHours(0, 0, 0, 0);
    return checkDate > today;
  };

  const getDayData = (day) => {
    const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
    const dateKey = formatDateKey(date);
    return pregnancyData[dateKey] || null;
  };

  const handleDateClick = (day) => {
    const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);

    setSelectedDate(date);
    setShowSymptomModal(true);

    const dateKey = formatDateKey(date);
    const existingData = pregnancyData[dateKey];
    if (existingData) {
      setSelectedSymptoms(existingData.symptoms || []);
      setNotes(existingData.notes || '');
      setDoctorAppointments(existingData.doctorAppointments || []);
    } else {
      setSelectedSymptoms([]);
      setNotes('');
      setDoctorAppointments([]);
    }
  };

  const handleSaveData = async () => {
    try {
      const week = dueDate ? calculatePregnancyWeek(dueDate) : 1;
      const trimester = getTrimester(week);

      // If conceptionDate is set, calculate week based on it instead
      const effectiveWeek = conceptionDate ? calculatePregnancyWeek(conceptionDate, true) : week;

      const entryData = {
        pregnancyWeek: effectiveWeek,
        trimester: getTrimester(effectiveWeek),
        symptoms: selectedSymptoms,
        notes: notes,
        doctorAppointments: doctorAppointments,
        babyGrowthInfo: getBabyGrowthInfo(week).size
      };

      await savePregnancyEntry(currentUser.uid, selectedDate, entryData);

      const dateKey = formatDateKey(selectedDate);
      const newData = {
        ...pregnancyData,
        [dateKey]: {
          ...entryData,
          date: dateKey,
          userId: currentUser.uid
        }
      };
      setPregnancyData(newData);

      const stats = await getPregnancyStats(currentUser.uid);
      setPregnancyStats(stats);

      setSuccessMessage("Pregnancy data saved successfully!");
      setTimeout(() => setSuccessMessage(null), 3000);

      setShowSymptomModal(false);
    } catch (error) {
      console.error("Error saving pregnancy data:", error);
      setError("Failed to save pregnancy data. Please try again.");
    }
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

  const addAppointment = () => {
    setDoctorAppointments([...doctorAppointments, { date: '', description: '' }]);
  };

  const updateAppointment = (index, field, value) => {
    const updated = [...doctorAppointments];
    updated[index][field] = value;
    setDoctorAppointments(updated);
  };

  const removeAppointment = (index) => {
    setDoctorAppointments(doctorAppointments.filter((_, i) => i !== index));
  };

  const handleDeleteEntry = async () => {
    try {
      await deletePregnancyEntry(currentUser.uid, selectedDate);

      const dateKey = formatDateKey(selectedDate);
      const newData = { ...pregnancyData };
      delete newData[dateKey];
      setPregnancyData(newData);

      const stats = await getPregnancyStats(currentUser.uid);
      setPregnancyStats(stats);

      setShowSymptomModal(false);
    } catch (error) {
      console.error("Error deleting pregnancy entry:", error);
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
      const dateObj = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
      
      // Check if this day is in the future
      const isFuture = isFutureDate(dateObj);

      if (dayData) {
        const hasSymptoms = dayData.symptoms && dayData.symptoms.length > 0;
        const hasAppointments = dayData.doctorAppointments && dayData.doctorAppointments.length > 0;
        const hasNotes = dayData.notes && dayData.notes.trim() !== '';
        
        if (hasAppointments) {
          dataClass = 'has-appointment-data';
        } else if (hasSymptoms) {
          dataClass = 'has-symptoms-data';
        } else if (hasNotes) {
          dataClass = 'has-notes-data';
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
              {dayData.doctorAppointments && dayData.doctorAppointments.length > 0 && (
                <div className="appointment-indicator">👩‍⚕️</div>
              )}
              {dayData.symptoms && dayData.symptoms.length > 0 && (
                <div className="symptoms-indicator">{dayData.symptoms.length}</div>
              )}
              {dayData.notes && dayData.notes.trim() !== '' && (
                <div className="notes-indicator">📝</div>
              )}
            </div>
          )}
        </div>
      );
    }

    return days;
  };

  const currentWeek = pregnancyStats.currentWeek;
  const babyInfo = getBabyGrowthInfo(currentWeek);
  const advice = getPregnancyAdvice(currentWeek, pregnancyStats.commonSymptoms.map(s => s.symptom));

  if (loading) {
    return (
      <div className="pregnancy-tracker-page">
        <div className="loading-container">
          <div className="loading-spinner">⏳</div>
          <p>Loading your pregnancy data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="pregnancy-tracker-page">
        <div className="error-container">
          <div className="error-icon">⚠️</div>
          <p>{error}</p>
          <button onClick={loadPregnancyData} className="retry-btn">
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="pregnancy-tracker-page">
      <Navbar 
        viewToggleProps={{
          viewMode,
          setViewMode,
          pregnancyInfo: {
            currentWeek,
            trimester: pregnancyStats.currentTrimester
          }
        }}
      />

      <div className="pregnancy-dates-section">
        <div className="date-inputs-container">
          <div className="date-input-group">
            <label>Conception Date</label>
            <input
              type="date"
              value={conceptionDate}
              onChange={(e) => handleConceptionDateChange(e.target.value)}
              className="pregnancy-date-input"
            />
          </div>
          
          <div className="date-input-group">
            <label>Due Date</label>
            <input
              type="date"
              value={dueDate}
              onChange={(e) => handleDueDateChange(e.target.value)}
              className="pregnancy-date-input"
            />
          </div>
        </div>
      </div>

      {successMessage && (
        <div className="success-message">
          <span className="success-icon">✅</span>
          {successMessage}
        </div>
      )}

      <div className="pregnancy-container">

        {viewMode === 'calendar' ? (
          <>
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

            <div className="calendar-legend">
              <h3>Legend</h3>
              <div className="legend-items">
                <div className="legend-item">
                  <span className="legend-icon">👩‍⚕️</span>
                  <span>Doctor Appointment</span>
                </div>
                <div className="legend-item">
                  <span className="legend-icon">🤢</span>
                  <span>Symptoms Logged</span>
                </div>
                <div className="legend-item">
                  <span className="legend-icon">📝</span>
                  <span>Notes Added</span>
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="insights-section">
            <div className="insights-grid">
              <div className="insight-card">
                <h3>Baby Growth</h3>
                <div className="growth-info">
                  <p><strong>Size:</strong> {babyInfo.size}</p>
                  <p><strong>Weight:</strong> {babyInfo.weight}</p>
                  <div className="developments">
                    <strong>Key Developments:</strong>
                    <ul>
                      {babyInfo.developments.map((dev, index) => (
                        <li key={index}>{dev}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
              <div className="insight-card">
                <h3>Common Symptoms</h3>
                <div className="common-symptoms">
                  {pregnancyStats.commonSymptoms.length > 0 ? (
                    pregnancyStats.commonSymptoms.slice(0, 3).map((symptom, index) => (
                      <span key={index}>{symptom.symptom.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}</span>
                    ))
                  ) : (
                    <span>No symptoms tracked yet</span>
                  )}
                </div>
              </div>
              <div className="insight-card">
                <h3>Health Advice</h3>
                <div className="advice-list">
                  {advice.map((tip, index) => (
                    <p key={index}>• {tip}</p>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {showDeleteModal && (
        <div className="modal-overlay" onClick={() => setShowDeleteModal(false)}>
          <div className="symptom-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Delete entry for {selectedDate.toLocaleDateString()}</h3>
              <button onClick={() => setShowDeleteModal(false)} className="close-btn">×</button>
            </div>
            <div className="modal-content">
              <p>This will permanently delete this pregnancy entry. This action cannot be undone.</p>
            </div>
            <div className="modal-actions">
              <button onClick={() => setShowDeleteModal(false)} className="cancel-btn">Cancel</button>
              <button onClick={handleDeleteEntry} className="delete-btn">Delete</button>
            </div>
          </div>
        </div>
      )}

      {showSymptomModal && (
        <div className="modal-overlay" onClick={() => setShowSymptomModal(false)}>
          <div className="symptom-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Track for {selectedDate.toLocaleDateString()}</h3>
              <button onClick={() => setShowSymptomModal(false)} className="close-btn">×</button>
            </div>

            <div className="modal-content">
              <div className="symptoms-section">
                <h4>Symptoms</h4>
                <div className="symptoms-grid">
                  {pregnancySymptoms.map((symptom) => (
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

              <div className="appointments-section">
                <h4>Doctor Appointments</h4>
                {doctorAppointments.map((appointment, index) => (
                  <div key={index} className="appointment-item">
                    <input
                      type="date"
                      value={appointment.date}
                      onChange={(e) => updateAppointment(index, 'date', e.target.value)}
                      className="appointment-date"
                    />
                    <input
                      type="text"
                      value={appointment.description}
                      onChange={(e) => updateAppointment(index, 'description', e.target.value)}
                      placeholder="Appointment description"
                      className="appointment-desc"
                    />
                    <button onClick={() => removeAppointment(index)} className="remove-appointment">×</button>
                  </div>
                ))}
                <button onClick={addAppointment} className="add-appointment-btn">Add Appointment</button>
              </div>

              <div className="modal-actions">
                <button onClick={() => setShowSymptomModal(false)} className="cancel-btn">
                  Cancel
                </button>
                {pregnancyData[formatDateKey(selectedDate)] && (
                  <button onClick={() => setShowDeleteModal(true)} className="delete-btn">
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
  );
}

export default PregnancyTrackerPage;

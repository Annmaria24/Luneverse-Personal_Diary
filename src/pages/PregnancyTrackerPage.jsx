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
import { useToast } from "../hooks/useToast";
import ToastContainer from "../components/ToastContainer";

function PregnancyTrackerPage() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const { toasts, showSuccess, showError, removeToast } = useToast();
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
  const [showRemoveConceptionModal, setShowRemoveConceptionModal] = useState(false);

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
      const conception = new Date(newConceptionDate);
      const today = new Date();
      const elapsedDays = Math.floor((today - conception) / (1000 * 60 * 60 * 24));

      // Validate that conception date is not more than 40 weeks ago
      if (elapsedDays > 280) { // 40 weeks * 7 days
        setError("Conception date seems too far in the past. Please verify the date is correct.");
        setTimeout(() => setError(null), 5000);
        return;
      }

      // Validate that conception date is not in the future
      if (conception > today) {
        setError("Conception date cannot be in the future.");
        setTimeout(() => setError(null), 5000);
        return;
      }

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

    if (newDueDate) {
      const due = new Date(newDueDate);
      const today = new Date();

      // Validate that due date is not in the past
      if (due < today) {
        setError("Due date cannot be in the past.");
        setTimeout(() => setError(null), 5000);
        return;
      }

      // Validate that due date is not more than 40 weeks from now
      const maxDueDate = new Date(today);
      maxDueDate.setDate(today.getDate() + 280); // 40 weeks
      if (due > maxDueDate) {
        setError("Due date seems too far in the future. Please verify the date is correct.");
        setTimeout(() => setError(null), 5000);
        return;
      }
    }

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

  // Daily appointment notification check
  useEffect(() => {
    const checkDailyAppointments = () => {
      if (currentUser && pregnancyData) {
        checkAppointmentNotifications(pregnancyData);
      }
    };

    // Only check immediately if we haven't shown notifications yet (temporarily disabled)
    // if (shownNotifications.size === 0) {
    //   checkDailyAppointments();
    // }

    // Set up daily check (every 24 hours)
    const interval = setInterval(checkDailyAppointments, 24 * 60 * 60 * 1000);

    return () => clearInterval(interval);
  }, [currentUser, pregnancyData]);

  // Listen for external view mode toggle (from MyCycle toolbar)
  useEffect(() => {
    const handler = (e) => {
      const next = e?.detail;
      if (next === 'calendar' || next === 'insights') {
        setViewMode(next);
        // Force reload data when switching to insights to ensure appointments are shown
        if (next === 'insights') {
          console.log('🔄 Switching to insights, reloading data...');
          loadPregnancyData();
        }
      }
    };
    window.addEventListener('pregnancy:setViewMode', handler);
    return () => window.removeEventListener('pregnancy:setViewMode', handler);
  }, []);

  const loadPregnancyData = async () => {
    try {
      setLoading(true);
      setError(null);

      const data = await getPregnancyData(currentUser.uid);
      setPregnancyData(data);

      const stats = await getPregnancyStats(currentUser.uid);
      setPregnancyStats(stats);

      // Check for appointment notifications (temporarily disabled)
      // checkAppointmentNotifications(data);

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
    try {
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
  } catch (error) {
    console.error("Error handling date click:", error);
    setError("Failed to open date tracker. Please try again.");
  }
  };

  const handleSaveData = async () => {
    try {
      console.log('💾 Saving pregnancy data...');
      console.log('Selected date:', selectedDate);
      console.log('Doctor appointments to save:', doctorAppointments);
      
      // Prefer conception date for week calculation; fallback to due date if not set
      const effectiveWeek = conceptionDate
        ? calculatePregnancyWeek(conceptionDate, true)
        : (dueDate ? calculatePregnancyWeek(dueDate, false) : 1);
      const trimester = getTrimester(effectiveWeek);

      const entryData = {
        pregnancyWeek: effectiveWeek,
        trimester: getTrimester(effectiveWeek),
        symptoms: selectedSymptoms,
        notes: notes,
        doctorAppointments: doctorAppointments,
        babyGrowthInfo: getBabyGrowthInfo(effectiveWeek).size
      };

      console.log('Entry data to save:', entryData);
      await savePregnancyEntry(currentUser.uid, selectedDate, entryData);
      console.log('✅ Data saved to database');

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
      console.log('✅ Local state updated:', newData);

      // Reload pregnancy data to ensure we have the latest from database
      await loadPregnancyData();
      console.log('✅ Pregnancy data reloaded');

      const stats = await getPregnancyStats(currentUser.uid);
      setPregnancyStats(stats);

      setSuccessMessage("Pregnancy data saved successfully!");
      setTimeout(() => setSuccessMessage(null), 3000);

      // Show specific notification for appointments
      if (doctorAppointments.length > 0) {
        const appointmentCount = doctorAppointments.filter(apt => apt.date && apt.description).length;
        if (appointmentCount > 0) {
          showSuccess(`📅 ${appointmentCount} doctor appointment${appointmentCount > 1 ? 's' : ''} saved successfully!`);
        }
      }

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

  const addAppointment = async () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const selectedDateOnly = new Date(selectedDate);
    selectedDateOnly.setHours(0, 0, 0, 0);
    
    // Check if selected date is in the past
    if (selectedDateOnly < today) {
      showError('Cannot add appointments for past dates. Please select today or a future date.');
      return;
    }
    
    // Check if there are any empty appointments
    const hasEmptyAppointments = doctorAppointments.some(apt => !apt.description.trim());
    if (hasEmptyAppointments) {
      showError('Please fill in all appointment descriptions before adding new ones.');
      return;
    }
    
    // If no appointments exist, add one and save immediately
    if (doctorAppointments.length === 0) {
      const selectedDateStr = formatDateKey(selectedDate);
      const newAppointments = [{ 
        date: selectedDateStr, 
        description: ''
      }];
      setDoctorAppointments(newAppointments);
    } else {
      // Save current appointments and close modal
      await handleSaveData();
    }
  };

  const updateAppointment = (index, field, value) => {
    const updated = [...doctorAppointments];
    updated[index][field] = value;
    setDoctorAppointments(updated);
  };

  const removeAppointment = (index) => {
    setDoctorAppointments(doctorAppointments.filter((_, i) => i !== index));
  };


  // Track shown notifications to prevent duplicates (temporarily disabled)
  // const [shownNotifications, setShownNotifications] = useState(new Set());
  // const [lastNotificationDate, setLastNotificationDate] = useState(new Date().toDateString());

  // Check for appointment notifications
  const checkAppointmentNotifications = (data) => {
    if (!data) return;
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Check all pregnancy entries for appointments
    Object.values(data).forEach(entry => {
      if (entry.doctorAppointments && Array.isArray(entry.doctorAppointments)) {
        entry.doctorAppointments.forEach(appointment => {
          if (appointment.date && appointment.description) {
            const appointmentDate = new Date(appointment.date);
            appointmentDate.setHours(0, 0, 0, 0);
            const daysUntilAppointment = Math.floor((appointmentDate - today) / (1000 * 60 * 60 * 24));
            
            // Create notification key
            const notificationKey = `${appointment.date}-${appointment.description}-${daysUntilAppointment}`;
            
            // Show notification if appointment is today, tomorrow, or in 2 days (temporarily disabled)
            // if (daysUntilAppointment === 0) {
            //   showSuccess(`📅 Doctor appointment today: ${appointment.description}`);
            // } else if (daysUntilAppointment === 1) {
            //   showSuccess(`📅 Doctor appointment tomorrow: ${appointment.description}`);
            // } else if (daysUntilAppointment === 2) {
            //   showSuccess(`📅 Doctor appointment in 2 days: ${appointment.description}`);
            // }
          }
        });
      }
    });
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

  // Compute header week/trimester from conception (preferred) or due date, fallback to stats
  const headerWeek = conceptionDate
    ? calculatePregnancyWeek(conceptionDate, true)
    : (dueDate ? calculatePregnancyWeek(dueDate, false) : pregnancyStats.currentWeek);
  const babyInfo = getBabyGrowthInfo(headerWeek);
  const advice = getPregnancyAdvice(headerWeek, pregnancyStats.commonSymptoms.map(s => s.symptom));

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
      {/* Removed Calendar/Insights toggle as requested */}

      {showRemoveConceptionModal && (
        <div className="modal-overlay" onClick={() => setShowRemoveConceptionModal(false)}>
          <div className="symptom-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Confirm Remove Conception Details</h3>
              <button onClick={() => setShowRemoveConceptionModal(false)} className="close-btn">×</button>
            </div>
            <div className="modal-content">
              <p>Are you sure you want to remove conception and due date details? This action cannot be undone.</p>
            </div>
            <div className="modal-actions">
              <button onClick={() => setShowRemoveConceptionModal(false)} className="cancel-btn">Cancel</button>
              <button
                onClick={async () => {
                  setShowRemoveConceptionModal(false);
                  setConceptionDate('');
                  setDueDate('');
                  try {
                    await saveUserSettings(currentUser.uid, { conceptionDate: '', dueDate: '' });
                  } catch (error) {
                    console.error("Failed to remove conception details:", error);
                  }
                }}
                className="delete-btn"
              >
                Remove
              </button>
            </div>
          </div>
        </div>
      )}

      {successMessage && (
        <div className="success-message">
          <span className="success-icon">✅</span>
          {successMessage}
        </div>
      )}

      <div className="pregnancy-container">

        {viewMode === 'calendar' ? (
          <>
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

              {conceptionDate && (
                <div className="remove-conception-container">
                  <button
                    className="remove-conception-btn"
                    onClick={() => setShowRemoveConceptionModal(true)}
                  >
                    Remove Conception Details
                  </button>
                </div>
              )}
            </div>

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
            <div style={{textAlign: 'center', marginBottom: '20px'}}>
              <button 
                onClick={() => {
                  console.log('🔄 Manual refresh triggered');
                  loadPregnancyData();
                }}
                style={{
                  background: 'linear-gradient(135deg, #8b5cf6 0%, #ec4899 100%)',
                  color: 'white',
                  border: 'none',
                  padding: '8px 16px',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '14px'
                }}
              >
                🔄 Refresh Data
              </button>
            </div>
            <div className="insights-grid">
              <div className="insight-card growth-card">
                <h3>👶 Baby Growth</h3>
                <div className="growth-visual">
                  <div className="growth-chart">
                    <div className="baby-size-indicator">
                      <div className="size-circle" style={{ 
                        width: `${Math.min(headerWeek * 2, 100)}px`, 
                        height: `${Math.min(headerWeek * 2, 100)}px` 
                      }}>
                        <span className="week-number">{headerWeek}</span>
                      </div>
                      <div className="size-labels">
                        <span className="current-size">Size: {babyInfo.size}</span>
                        <span className="current-weight">Weight: {babyInfo.weight}</span>
                        <span className="growth-context">
                          {headerWeek <= 8 ? "Embryo stage - rapid cell division" :
                           headerWeek <= 12 ? "Fetal stage - major organs forming" :
                           headerWeek <= 20 ? "Active movement begins" :
                           headerWeek <= 28 ? "Eyes open, can hear sounds" :
                           "Final growth and development"}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="developments">
                    <h4>This Week's Milestones</h4>
                    <div className="milestone-list">
                      {babyInfo.developments.slice(0, 3).map((dev, index) => (
                        <div key={index} className="milestone-item">
                          <span className="milestone-icon">✨</span>
                          <span className="milestone-text">{dev}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
              <div className="insight-card symptoms-card">
                <h3>🤰 Common Symptoms</h3>
                <div className="symptoms-visual">
                  {pregnancyStats.commonSymptoms.length > 0 ? (
                    <div className="symptoms-chart">
                      {pregnancyStats.commonSymptoms.slice(0, 5).map((symptom, index) => {
                        const intensity = Math.min(symptom.count || 1, 5);
                        return (
                          <div key={index} className="symptom-bar">
                            <div className="symptom-label">
                              <span className="symptom-icon">🤢</span>
                              <span className="symptom-name">
                                {symptom.symptom.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                              </span>
                            </div>
                            <div className="symptom-intensity">
                              <div 
                                className="intensity-bar" 
                                style={{ width: `${(intensity / 5) * 100}%` }}
                              ></div>
                              <span className="intensity-count">{symptom.count || 1}x</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="no-symptoms">
                      <div className="no-symptoms-icon">😊</div>
                      <p>No symptoms tracked yet</p>
                      <small>Start logging your daily symptoms to see patterns</small>
                    </div>
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
              
              <div className="insight-card progress-card">
                <h3>📊 Pregnancy Progress</h3>
                <div className="progress-visual">
                  <div className="week-progress">
                    <div className="progress-circle">
                      <svg width="120" height="120" className="progress-ring">
                        <circle
                          cx="60"
                          cy="60"
                          r="50"
                          fill="none"
                          stroke="#e5e7eb"
                          strokeWidth="8"
                        />
                        <circle
                          cx="60"
                          cy="60"
                          r="50"
                          fill="none"
                          stroke="#8b5cf6"
                          strokeWidth="8"
                          strokeDasharray={`${(headerWeek / 40) * 314} 314`}
                          strokeDashoffset="0"
                          transform="rotate(-90 60 60)"
                          className="progress-ring-fill"
                        />
                      </svg>
                      <div className="progress-center">
                        <span className="week-number">{headerWeek}</span>
                        <span className="week-label">weeks</span>
                      </div>
                    </div>
                  </div>
                  <div className="progress-stats">
                    <div className="stat-item">
                      <div className="stat-icon">🏆</div>
                      <div className="stat-content">
                        <span className="stat-value">{getTrimester(headerWeek)}</span>
                        <span className="stat-label">Trimester</span>
                      </div>
                    </div>
                    <div className="stat-item">
                      <div className="stat-icon">📝</div>
                      <div className="stat-content">
                        <span className="stat-value">{pregnancyStats.totalEntries}</span>
                        <span className="stat-label">Days Tracked</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="insight-card">
                <h3>Upcoming Appointments</h3>
                <div className="appointments-list">
                  {(() => {
                    const upcomingAppointments = [];
                    console.log('🔍 Debugging appointments...');
                    console.log('Pregnancy data for appointments:', pregnancyData);
                    console.log('Current doctorAppointments state:', doctorAppointments);
                    
                    // Check saved data first
                    Object.values(pregnancyData).forEach((entry, index) => {
                      console.log(`Entry ${index}:`, entry);
                      if (entry.doctorAppointments && Array.isArray(entry.doctorAppointments)) {
                        console.log('Found saved appointments:', entry.doctorAppointments);
                        entry.doctorAppointments.forEach((apt, aptIndex) => {
                          console.log(`Processing saved appointment ${aptIndex}:`, apt);
                          if (apt.date) {
                            const aptDate = new Date(apt.date);
                            const today = new Date();
                            today.setHours(0, 0, 0, 0); // Reset time to start of day
                            aptDate.setHours(0, 0, 0, 0); // Reset time to start of day
                            const daysUntil = Math.floor((aptDate - today) / (1000 * 60 * 60 * 24));
                            console.log('Saved appointment date:', aptDate, 'Today:', today, 'Days until:', daysUntil);
                            if (daysUntil >= 0) {
                              upcomingAppointments.push({ 
                                ...apt, 
                                daysUntil, 
                                source: 'saved',
                                description: apt.description || 'No description'
                              });
                              console.log('✅ Added saved appointment to list:', apt);
                            } else {
                              console.log('❌ Saved appointment is in the past, skipping:', apt);
                            }
                          }
                        });
                      }
                    });
                    
                    // Also check current doctorAppointments state (unsaved appointments)
                    if (doctorAppointments && doctorAppointments.length > 0) {
                      console.log('Processing current doctor appointments state:', doctorAppointments);
                      doctorAppointments.forEach((apt, index) => {
                        console.log(`Processing current appointment ${index}:`, apt);
                        if (apt.date) {
                          const aptDate = new Date(apt.date);
                          const today = new Date();
                          today.setHours(0, 0, 0, 0); // Reset time to start of day
                          aptDate.setHours(0, 0, 0, 0); // Reset time to start of day
                          const daysUntil = Math.floor((aptDate - today) / (1000 * 60 * 60 * 24));
                          console.log('Current appointment date:', aptDate, 'Today:', today, 'Days until:', daysUntil, 'Description:', apt.description);
                          if (daysUntil >= 0) {
                            // Check if this appointment is already in the list (avoid duplicates)
                            const isDuplicate = upcomingAppointments.some(existing => 
                              existing.date === apt.date
                            );
                            if (!isDuplicate) {
                              upcomingAppointments.push({ 
                                ...apt, 
                                daysUntil, 
                                source: 'current',
                                description: apt.description || 'No description'
                              });
                              console.log('✅ Added current appointment to list:', apt);
                            }
                          } else {
                            console.log('❌ Appointment is in the past, skipping:', apt);
                          }
                        }
                      });
                    }
                    
                    console.log('✅ Final upcoming appointments found:', upcomingAppointments);
                    upcomingAppointments.sort((a, b) => a.daysUntil - b.daysUntil);
                    
                    return upcomingAppointments.length > 0 ? (
                      upcomingAppointments.slice(0, 3).map((apt, index) => (
                        <div key={index} className="appointment-item">
                          <span className="appointment-date">{new Date(apt.date).toLocaleDateString()}</span>
                          <span className="appointment-desc">{apt.description}</span>
                          <span className="appointment-days">
                            {apt.daysUntil === 0 ? 'Today' : 
                             apt.daysUntil === 1 ? 'Tomorrow' : 
                             `In ${apt.daysUntil} days`}
                          </span>
                          <span className="appointment-source" style={{fontSize: '10px', color: '#666'}}>
                            ({apt.source})
                          </span>
                        </div>
                      ))
                    ) : (
                      <div className="no-appointments">
                        <p>No upcoming appointments</p>
                        <div style={{fontSize: '12px', color: '#666', marginTop: '8px'}}>
                          <p>Debug info:</p>
                          <p>Pregnancy data entries: {Object.keys(pregnancyData).length}</p>
                          <p>Current appointments: {doctorAppointments.length}</p>
                          <p>Current appointments data: {JSON.stringify(doctorAppointments)}</p>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              </div>
              
              <div className="insight-card timeline-card">
                <h3>📅 Pregnancy Timeline</h3>
                <div className="timeline-visual">
                  <div className="timeline-chart">
                    <div className="timeline-line">
                      {[1, 2, 3].map(trimester => {
                        const isActive = getTrimester(headerWeek) === trimester;
                        const isCompleted = headerWeek > (trimester * 13);
                        return (
                          <div key={trimester} className={`timeline-marker ${isActive ? 'active' : ''} ${isCompleted ? 'completed' : ''}`}>
                            <div className="marker-circle">
                              <span className="marker-number">{trimester}</span>
                            </div>
                            <div className="marker-label">
                              <span className="trimester-name">Trimester {trimester}</span>
                              <span className="trimester-weeks">
                                {trimester === 1 ? 'Weeks 1-13' : 
                                 trimester === 2 ? 'Weeks 14-26' : 
                                 'Weeks 27-40'}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    <div className="timeline-progress">
                      <div className="progress-bar">
                        <div 
                          className="progress-fill" 
                          style={{ width: `${(headerWeek / 40) * 100}%` }}
                        ></div>
                      </div>
                      <div className="progress-labels">
                        <span>Week 1</span>
                        <span>Week 40</span>
                      </div>
                    </div>
                  </div>
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
              <h3>Delete entry for {selectedDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</h3>
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
              <h3>Track for {selectedDate.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}</h3>
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
                      min={new Date().toISOString().split('T')[0]}
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
          <button 
            onClick={addAppointment} 
            className="add-appointment-btn"
            disabled={selectedDate < new Date(new Date().setHours(0, 0, 0, 0))}
            style={{
              opacity: selectedDate < new Date(new Date().setHours(0, 0, 0, 0)) ? 0.5 : 1,
              cursor: selectedDate < new Date(new Date().setHours(0, 0, 0, 0)) ? 'not-allowed' : 'pointer'
            }}
          >
            {selectedDate < new Date(new Date().setHours(0, 0, 0, 0)) 
              ? `Cannot add appointment for past date (${selectedDate.toLocaleDateString()})`
              : doctorAppointments.length === 0 
                ? `Add Appointment for ${selectedDate.toLocaleDateString()}`
                : `Save & Close`
            }
          </button>
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
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </div>
  );
}

export default PregnancyTrackerPage;

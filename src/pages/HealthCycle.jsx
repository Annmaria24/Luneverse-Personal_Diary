import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import './Styles/CycleTrackerPage.css';
import LineBarTimeline from '../components/charts/LineBarTimeline';

// Legacy services (read/write maintained)
import {
  saveCycleEntry,
  getCycleData,
  getCycleStats,
  getCommonSymptoms,
  getRecentCycles,
} from "../services/cycleService";
import {
  savePregnancyEntry,
  getPregnancyData,
  getPregnancyStats,
  getTrimester,
  calculatePregnancyWeek
} from "../services/pregnancyService";
import { getUserSettings } from '../services/userService';

// Unified collection
// Using legacy services only (no unified collection writes for now)

function HealthCycle() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  const [mode, setMode] = useState('cycle'); // 'cycle' | 'pregnancy'
  const [viewMode, setViewMode] = useState('calendar'); // 'calendar' | 'insights'
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);

  // Calendar state
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showModal, setShowModal] = useState(false);

  // Entry fields (unified)
  const [flow, setFlow] = useState('');
  const [week, setWeek] = useState('');
  const [milestone, setMilestone] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [appointment, setAppointment] = useState('');
  const [endPregnancy, setEndPregnancy] = useState(false);
  const [symptoms, setSymptoms] = useState([]);
  const [notes, setNotes] = useState('');

  // Data stores
  const [cycleData, setCycleData] = useState({});
  const [pregnancyData, setPregnancyData] = useState({});
  const [cycleStats, setCycleStats] = useState({ totalCycles:0, averageCycleLength:28, averagePeriodLength:5, currentCycleDay:1, currentPhase:'Follicular', nextPredictedPeriod:null });
  const [pregnancyStats, setPregnancyStats] = useState({ currentWeek:0, currentTrimester:1 });
  const [recentCycles, setRecentCycles] = useState([]);
  const [commonSymptomsData, setCommonSymptomsData] = useState([]);
  const [pregnancyEnabled, setPregnancyEnabled] = useState(false);

  const allSymptoms = [
    { id: 'cramps', name: 'Cramps', icon: '🤕' },
    { id: 'headache', name: 'Headache', icon: '🤯' },
    { id: 'bloating', name: 'Bloating', icon: '🎈' },
    { id: 'mood_swings', name: 'Mood Swings', icon: '😤' },
    { id: 'fatigue', name: 'Fatigue', icon: '😴' },
    { id: 'acne', name: 'Acne', icon: '😣' },
    { id: 'back_pain', name: 'Back Pain', icon: '🦴' },
    { id: 'nausea', name: 'Nausea', icon: '🤢' },
    { id: 'food_cravings', name: 'Food Cravings', icon: '🍫' }
  ];

  const flowLevels = [
    { id: 'light', name: 'Light', color: '#fecaca', icon: '💧' },
    { id: 'medium', name: 'Medium', color: '#f87171', icon: '💧💧' },
    { id: 'heavy', name: 'Heavy', color: '#dc2626', icon: '💧💧💧' },
    { id: 'spotting', name: 'Spotting', color: '#fde68a', icon: '✨' }
  ];

  useEffect(() => {
    const init = async () => {
      try {
        if (!currentUser) return;
        setLoading(true);
        setError(null);

        // Default mode by settings
        const settings = await getUserSettings(currentUser.uid);
        const pregOn = !!settings?.pregnancyTrackingEnabled;
        setPregnancyEnabled(pregOn);
        setMode(pregOn ? 'pregnancy' : 'cycle');

        // Legacy cycle data
        const cycle = await getCycleData(currentUser.uid);
        setCycleData(cycle);

        // Legacy pregnancy data (optional)
        if (pregOn) {
          const preg = await getPregnancyData(currentUser.uid);
          setPregnancyData(preg);
        } else {
          setPregnancyData({});
        }

        // Stats
        const cStats = await getCycleStats(currentUser.uid);
        setCycleStats(cStats);
        if (pregOn) {
          const pStats = await getPregnancyStats(currentUser.uid);
          setPregnancyStats(pStats);
        }

        const common = await getCommonSymptoms(currentUser.uid);
        setCommonSymptomsData(common);
        const timeline = await getRecentCycles(currentUser.uid, 6);
        setRecentCycles(timeline);
      } catch (e) {
        console.error(e);
        setError('Failed to load Health Cycle data.');
      } finally {
        setLoading(false);
      }
    };
    init();
  }, [currentUser]);

  const getDaysInMonth = (date) => new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  const getFirstDayOfMonth = (date) => new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  const formatDateKey = (date) => date.toISOString().split('T')[0];

  const handleDayClick = (day) => {
    const d = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
    setSelectedDate(d);
    const key = formatDateKey(d);
    if (mode === 'cycle') {
      const entry = cycleData[key] || {};
      setFlow(entry.flow || '');
      setSymptoms(entry.symptoms || []);
      setNotes(entry.notes || '');
    } else {
      const entry = pregnancyData[key] || {};
      setWeek(entry.pregnancyWeek || entry.week || '');
      setMilestone(entry.milestone || '');
      setSymptoms(entry.symptoms || []);
      setNotes(entry.notes || '');
    }
    setShowModal(true);
  };

  const saveEntry = async () => {
    if (!currentUser) return;
    const dateKey = formatDateKey(selectedDate);
    // Persist to legacy collections only
    if (mode === 'cycle') {
      await saveCycleEntry(currentUser.uid, selectedDate, {
        periodStatus: flow ? 'ongoing' : 'none',
        flow: flow || '',
        symptoms: symptoms || [],
        notes: notes || '',
        type: flow ? 'period' : (symptoms?.length ? 'symptoms' : 'notes')
      });
      // update local
      setCycleData(prev => ({
        ...prev,
        [dateKey]: { ...(prev[dateKey]||{}), flow, symptoms, notes, type: flow ? 'period' : (symptoms?.length ? 'symptoms' : 'notes') }
      }));
    } else {
      await savePregnancyEntry(currentUser.uid, selectedDate, {
        pregnancyWeek: Number(week) || 0,
        trimester: getTrimester(Number(week) || 0),
        symptoms: symptoms || [],
        notes: notes || '',
        milestone: milestone || '',
        doctorAppointments: appointment ? [{ date: appointment, note: milestone || 'Appointment' }] : []
      });
      setPregnancyData(prev => ({
        ...prev,
        [dateKey]: { ...(prev[dateKey]||{}), pregnancyWeek: Number(week)||0, milestone, symptoms, notes }
      }));
    }

    setShowModal(false);
    setSuccessMessage('Saved successfully');
    setTimeout(() => setSuccessMessage(null), 2500);

    if (mode === 'pregnancy' && endPregnancy) {
      setMode('cycle');
    }
  };

  const toggleSymptom = (id) => {
    setSymptoms(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const navigateMonth = (dir) => {
    const d = new Date(currentDate);
    d.setMonth(d.getMonth() + dir);
    setCurrentDate(d);
  };

  const renderCalendar = () => {
    const daysInMonth = getDaysInMonth(currentDate);
    const firstDay = getFirstDayOfMonth(currentDate);
    const cells = [];
    for (let i=0;i<firstDay;i++) cells.push(<div key={`e-${i}`} className="calendar-day empty"></div>);
    for (let day=1; day<=daysInMonth; day++) {
      const dateObj = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
      const key = formatDateKey(dateObj);
      if (mode==='cycle') {
        const c = cycleData[key];
        const hasCycle = !!c && (c.flow || (c.symptoms && c.symptoms.length) || c.notes);
        cells.push(
          <div key={day} className={`calendar-day ${new Date().toDateString()===dateObj.toDateString() ? 'today':''}`} onClick={()=>handleDayClick(day)}>
            <span className="day-number">{day}</span>
            <div className="day-indicators">{hasCycle && <div className="period-indicator medium"/>}</div>
          </div>
        );
        continue;
      }
      const p = pregnancyData[key];
      const hasPreg = !!p && ((p.pregnancyWeek||p.week)>0 || p.milestone || (p.symptoms&&p.symptoms.length) || p.notes);
      const bleeding = p && (p.flow==='spotting' || p.flow==='light' || p.flow==='heavy');

      cells.push(
        <div key={day} className={`calendar-day ${new Date().toDateString()===dateObj.toDateString() ? 'today':''}`} onClick={()=>handleDayClick(day)}>
          <span className="day-number">{day}</span>
          <div className="day-indicators">
            {hasPreg && <div className="pregnancy-indicator"/>}
            {bleeding && <div className="period-indicator medium"/>}
          </div>
        </div>
      );
    }
    return cells;
  };

  if (loading) {
    return (
      <div className="cycle-tracker-page"><div className="loading-container"><div className="loading-spinner">⏳</div><p>Loading...</p></div></div>
    );
  }

  if (error) {
    return (
      <div className="cycle-tracker-page"><div className="error-container"><div className="error-icon">⚠️</div><p>{error}</p></div></div>
    );
  }

  return (
    <>
      <div className="cycle-tracker-page">
        <div className="hc-header">
          <h1 className="hc-title">Health Cycle</h1>
          <p className="hc-subtitle">Personalized tracking for your cycle and pregnancy</p>
        </div>
        <div className="top-toggles" style={{justifyContent: 'center', gap: '12px'}}>
          <div className="view-toggle" style={{flex: 'none'}}>
            <button className={`view-btn ${viewMode==='calendar' ? 'active':''}`} onClick={()=>setViewMode('calendar')}>Calendar</button>
            <button className={`view-btn ${viewMode==='insights' ? 'active':''}`} onClick={()=>setViewMode('insights')}>Insights</button>
          </div>
          <div className="view-toggle" style={{flex: 'none'}}>
            <button className={`view-btn ${mode==='cycle' ? 'active':''}`} onClick={()=>setMode('cycle')}>🌸 Cycle</button>
            <button className={`view-btn ${mode==='pregnancy' ? 'active':''}`} onClick={()=>setMode('pregnancy')}>🤰 Pregnancy</button>
          </div>
        </div>

        {successMessage && (<div className="success-message"><span className="success-icon">✅</span>{successMessage}</div>)}

        <div className="cycle-container">
          {/* Summary */}
          <div className="cycle-overview">
            <div className="overview-card">
              <h3>{mode==='cycle' ? 'Current Cycle' : 'Pregnancy Progress'}</h3>
              <div className="cycle-info">
                {mode==='cycle' ? (
                  <>
                    <span className="cycle-day">Day {cycleStats.currentCycleDay || 1}</span>
                    <span className="cycle-phase">{cycleStats.currentPhase || '—'} Phase</span>
                  </>
                ) : (
                  <>
                    <span className="cycle-day">Week {pregnancyStats.currentWeek || 0}</span>
                    <span className="cycle-phase">Trimester {pregnancyStats.currentTrimester || 1}</span>
                  </>
                )}
              </div>
            </div>
            <div className="overview-card">
              <h3>{mode==='cycle' ? 'Next Period' : 'Milestone'}</h3>
              <div className="next-period">
                {mode==='cycle' ? (
                  <>
                    <span className="days-until">{cycleStats.nextPredictedPeriod ? Math.max(0, Math.ceil((new Date(cycleStats.nextPredictedPeriod) - new Date())/(1000*60*60*24))) : '—'} days</span>
                    <span className="predicted-date">{cycleStats.nextPredictedPeriod ? new Date(cycleStats.nextPredictedPeriod).toLocaleDateString('en-US', { month:'short', day:'numeric', year:'numeric'}) : '—'}</span>
                  </>
                ) : (
                  <>
                    <span className="days-until">Week {pregnancyStats.currentWeek || 0}</span>
                    <span className="predicted-date">Trimester {pregnancyStats.currentTrimester || 1}</span>
                  </>
                )}
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

          {viewMode==='calendar' ? (
            <>
              <div className="calendar-navigation">
                <button onClick={()=>navigateMonth(-1)} className="nav-btn"><span>‹</span></button>
                <h2 className="current-month">{currentDate.toLocaleDateString('en-US', { month:'long', year:'numeric'})}</h2>
                <button onClick={()=>navigateMonth(1)} className="nav-btn"><span>›</span></button>
              </div>
              <div className="calendar-section">
                <div className="calendar-header">
                  {['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map(d => <div key={d} className="day-header">{d}</div>)}
                </div>
                <div className="calendar-grid">{renderCalendar()}</div>
              </div>
            </>
          ) : (
            <div className="insights-section">
              <div className="insights-grid">
                <div className="insight-card">
                  <h3>{mode==='cycle' ? 'Cycle History' : 'Pregnancy Weeks'}</h3>
                  <LineBarTimeline data={recentCycles} height={160} />
                </div>
                <div className="insight-card">
                  <h3>Common Symptoms</h3>
                  <div className="common-symptoms">
                    {commonSymptomsData.length ? commonSymptomsData.slice(0,3).map((s, i)=> (<span key={i}>{s.symptom || s}</span>)) : (<span>No symptoms yet</span>)}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Log Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={()=>setShowModal(false)}>
          <div className="symptom-modal" onClick={(e)=>e.stopPropagation()}>
            <div className="modal-header">
              <h3>Log for {selectedDate.toLocaleDateString('en-US', { weekday:'short', month:'short', day:'numeric', year:'numeric'})}</h3>
              <button className="close-btn" onClick={()=>setShowModal(false)}>×</button>
            </div>
            <div className="modal-content">
              {mode==='cycle' ? (
                <div className="flow-section">
                  <h4>Flow</h4>
                  <div className="flow-options">
                    {flowLevels.map(l => (
                      <button key={l.id} className={`flow-btn ${flow===l.id ? 'selected':''}`} style={{'--flow-color': l.color}} onClick={()=>setFlow(l.id)}>
                        <span className="flow-icon">{l.icon}</span>
                        <span className="flow-name">{l.name}</span>
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="flow-section">
                  <h4>Pregnancy</h4>
                  <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'8px'}}>
                    <label style={{display:'flex',flexDirection:'column',gap:'6px'}}>
                      <span className="muted">Week</span>
                      <input type="number" min="0" max="40" value={week} onChange={(e)=>setWeek(e.target.value)} />
                    </label>
                    <label style={{display:'flex',flexDirection:'column',gap:'6px'}}>
                      <span className="muted">Trimester</span>
                      <input readOnly value={(Number(week)>0)? getTrimester(Number(week)) : pregnancyStats.currentTrimester} />
                    </label>
                  </div>
                  <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'8px', marginTop:8}}>
                    <label style={{display:'flex',flexDirection:'column',gap:'6px'}}>
                      <span className="muted">Milestone</span>
                      <input type="text" value={milestone} onChange={(e)=>setMilestone(e.target.value)} placeholder="e.g., First kick" />
                    </label>
                    <label style={{display:'flex',flexDirection:'column',gap:'6px'}}>
                      <span className="muted">Appointment (optional)</span>
                      <input type="date" value={appointment} onChange={(e)=>setAppointment(e.target.value)} />
                    </label>
                  </div>
                  <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'8px', marginTop:8}}>
                    <label style={{display:'flex',flexDirection:'column',gap:'6px'}}>
                      <span className="muted">Due Date (optional)</span>
                      <input type="date" value={dueDate} onChange={(e)=>setDueDate(e.target.value)} />
                    </label>
                  </div>
                </div>
              )}

              <div className="symptoms-section">
                <h4>Symptoms</h4>
                <div className="symptoms-grid">
                  {allSymptoms.map(s => (
                    <button key={s.id} className={`symptom-btn ${symptoms.includes(s.id) ? 'selected' : ''}`} onClick={()=>toggleSymptom(s.id)}>
                      <span className="symptom-icon">{s.icon}</span>
                      <span className="symptom-name">{s.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="notes-section">
                <h4>Notes</h4>
                <textarea className="notes-input" rows="3" value={notes} onChange={(e)=>setNotes(e.target.value)} placeholder="Any additional notes..." />
              </div>
            </div>
            <div className="modal-actions">
              <button className="cancel-btn" onClick={()=>setShowModal(false)}>Cancel</button>
              <button className="save-btn" onClick={saveUnified}>Save</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default HealthCycle;

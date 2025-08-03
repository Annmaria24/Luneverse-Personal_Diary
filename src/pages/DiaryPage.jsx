import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import './Styles/DiaryPage.css';
import { addDiaryEntry, getDiaryEntries } from "../services/diaryService";
import { auth } from "../firebase/config";

function DiaryPage() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [entries, setEntries] = useState([]);
  const [currentEntry, setCurrentEntry] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [mood, setMood] = useState('');

  useEffect(() => {
    // Load entries for the selected date
    loadEntriesForDate(selectedDate);
  }, [selectedDate]);

  const loadEntriesForDate = (date) => {
    // TODO: Implement Firebase integration
    // For now, using mock data
    const mockEntries = [
      {
        id: 1,
        date: new Date().toDateString(),
        content: "Today was a beautiful day. I felt grateful for the small moments of joy...",
        mood: "happy",
        timestamp: new Date()
      }
    ];
    setEntries(mockEntries);
  };

  const handleSaveEntry = () => {
    if (!currentEntry.trim()) return;

    const newEntry = {
      id: Date.now(),
      date: selectedDate.toDateString(),
      content: currentEntry,
      mood: mood,
      timestamp: new Date()
    };

    setEntries([newEntry, ...entries]);
    setCurrentEntry('');
    setMood('');
    setIsEditing(false);
  };

  const handleDateChange = (direction) => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() + direction);
    setSelectedDate(newDate);
  };

  const formatDate = (date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const goBack = () => {
    navigate('/dashboard');
  };

  return (
    <div className="diary-page">
      {/* Header */}
      <header className="diary-header">
        <button onClick={goBack} className="back-button">
          <span className="back-arrow">←</span>
          Dashboard
        </button>
        <h1>My Journal</h1>
        <div className="header-actions">
          <input
            type="text"
            placeholder="Search entries..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>
      </header>

      <div className="diary-container">
        {/* Date Navigation */}
        <div className="date-navigation">
          <button onClick={() => handleDateChange(-1)} className="date-nav-btn">
            <span>‹</span>
          </button>
          <div className="current-date">
            <h2>{formatDate(selectedDate)}</h2>
          </div>
          <button onClick={() => handleDateChange(1)} className="date-nav-btn">
            <span>›</span>
          </button>
        </div>

        {/* Main Content */}
        <div className="diary-content">
          {/* New Entry Section */}
          <div className="new-entry-section">
            <div className="entry-header">
              <h3>How are you feeling today?</h3>
              <div className="mood-selector">
                {['😊', '😌', '😐', '😔', '😢', '😤', '🥰', '😴'].map((emoji) => (
                  <button
                    key={emoji}
                    onClick={() => setMood(emoji)}
                    className={`mood-btn ${mood === emoji ? 'selected' : ''}`}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>

            <div className="entry-editor">
              <textarea
                value={currentEntry}
                onChange={(e) => setCurrentEntry(e.target.value)}
                placeholder="Write about your day, your thoughts, your dreams..."
                className="entry-textarea"
                rows="8"
              />
              <div className="entry-actions">
                <div className="entry-stats">
                  <span>{currentEntry.length} characters</span>
                </div>
                <div className="entry-buttons">
                  <button
                    onClick={() => {
                      setCurrentEntry('');
                      setMood('');
                    }}
                    className="clear-btn"
                  >
                    Clear
                  </button>
                  <button
                    onClick={handleSaveEntry}
                    className="save-btn"
                    disabled={!currentEntry.trim()}
                  >
                    Save Entry
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Previous Entries */}
          <div className="entries-section">
            <h3>Previous Entries</h3>
            {entries.length === 0 ? (
              <div className="no-entries">
                <div className="no-entries-icon">📝</div>
                <p>No entries for this date yet.</p>
                <p>Start writing to capture your thoughts!</p>
              </div>
            ) : (
              <div className="entries-list">
                {entries.map((entry) => (
                  <div key={entry.id} className="entry-card">
                    <div className="entry-meta">
                      <span className="entry-mood">{entry.mood}</span>
                      <span className="entry-time">
                        {entry.timestamp.toLocaleTimeString('en-US', {
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </span>
                    </div>
                    <div className="entry-content">
                      <p>{entry.content}</p>
                    </div>
                    <div className="entry-actions-bottom">
                      <button className="edit-entry-btn">Edit</button>
                      <button className="delete-entry-btn">Delete</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Floating Action Button for Mobile */}
      <button className="fab" onClick={() => setIsEditing(true)}>
        <span>+</span>
      </button>
    </div>
  );
}

export default DiaryPage;

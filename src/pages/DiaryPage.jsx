import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import './Styles/DiaryPage.css';
import { addDiaryEntry, getDiaryEntries, getLatestDiaryEntries, updateDiaryEntry, deleteDiaryEntry, searchDiaryEntries } from "../services/diaryService";
import { auth } from "../firebase/config";
import { collection, query, where, orderBy, limit, getDocs } from "firebase/firestore";
import { db } from "../firebase/config";
import ProfileDropdown from '../components/ProfileDropdown';
import RichTextEditor from '../components/RichTextEditor';


function DiaryPage() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [entries, setEntries] = useState([]);
  const [latestEntries, setLatestEntries] = useState([]);
  const [currentEntry, setCurrentEntry] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [editingEntryId, setEditingEntryId] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [mood, setMood] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isSearching, setIsSearching] = useState(false);
  const [viewMode, setViewMode] = useState('latest'); // 'latest' or 'date'
  const [showCalendar, setShowCalendar] = useState(false);

  useEffect(() => {
    if (currentUser) {
      if (viewMode === 'latest') {
        loadLatestEntries();
      } else {
        loadEntriesForDate(selectedDate);
      }
    }
  }, [selectedDate, currentUser, viewMode]);



  const loadLatestEntries = async () => {
    if (!currentUser) return;

    setLoading(true);
    setError(null);
    setIsSearching(false);

    try {
      const fetchedLatestEntries = await getLatestDiaryEntries(currentUser.uid, 10);
      setEntries(fetchedLatestEntries); // Use entries state for display
      setLatestEntries(fetchedLatestEntries); // Keep for dashboard
      console.log(`Loaded ${fetchedLatestEntries.length} latest entries`);
    } catch (error) {
      console.error("Error loading latest entries:", error);
      setError("Failed to load latest diary entries. Please try again.");
      setEntries([]);
      setLatestEntries([]);
    } finally {
      setLoading(false);
    }
  };

  const loadEntriesForDate = async (date) => {
    if (!currentUser) return;

    setLoading(true);
    setError(null);
    setIsSearching(false);
    setViewMode('date');

    try {
      const dateString = date.toDateString();
      const fetchedEntries = await getDiaryEntries(currentUser.uid, dateString);
      setEntries(fetchedEntries);
      console.log(`Loaded ${fetchedEntries.length} entries for ${dateString}`);
    } catch (error) {
      console.error("Error loading entries:", error);
      setError("Failed to load diary entries. Please try again.");
      setEntries([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveEntry = async () => {
    if (!currentEntry.trim() || !currentUser) return;

    setLoading(true);
    setError(null);

    try {
      const entryData = {
        date: selectedDate.toDateString(),
        content: currentEntry,
        mood: mood
      };

      if (isEditing && editingEntryId) {
        // Update existing entry
        await updateDiaryEntry(editingEntryId, entryData);
        console.log("Entry updated successfully");
      } else {
        // Add new entry
        await addDiaryEntry(currentUser.uid, entryData);
        console.log("Entry added successfully");
      }

      // Reload the appropriate view
      if (viewMode === 'latest') {
        await loadLatestEntries();
      } else {
        await loadEntriesForDate(selectedDate);
      }

      // Reset form
      setCurrentEntry('');
      setMood('');
      setIsEditing(false);
      setEditingEntryId(null);
    } catch (error) {
      console.error("Error saving entry:", error);
      setError("Failed to save diary entry. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (entry) => {
    setCurrentEntry(entry.content);
    setMood(entry.mood || '');
    setIsEditing(true);
    setEditingEntryId(entry.id);
  };

  const handleDelete = async (entryId) => {
    if (!window.confirm('Are you sure you want to delete this entry?')) return;

    setLoading(true);
    setError(null);

    try {
      await deleteDiaryEntry(entryId);
      console.log("Entry deleted successfully");
      // Reload the appropriate view
      if (viewMode === 'latest') {
        await loadLatestEntries();
      } else {
        await loadEntriesForDate(selectedDate);
      }
    } catch (error) {
      console.error("Error deleting entry:", error);
      setError("Failed to delete diary entry. Please try again.");
    } finally {
      setLoading(false);
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

  const handleSearch = async () => {
    if (!searchTerm.trim() || !currentUser) {
      // If search term is empty, reload entries for current date
      await loadEntriesForDate(selectedDate);
      return;
    }

    setLoading(true);
    setError(null);
    setIsSearching(true);

    try {
      const searchResults = await searchDiaryEntries(currentUser.uid, searchTerm);
      setEntries(searchResults);
      console.log(`Found ${searchResults.length} entries matching "${searchTerm}"`);
    } catch (error) {
      console.error("Error searching entries:", error);
      setError("Failed to search diary entries. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const clearSearch = async () => {
    setSearchTerm('');
    setIsSearching(false);
    if (viewMode === 'latest') {
      await loadLatestEntries();
    } else {
      await loadEntriesForDate(selectedDate);
    }
  };

  const handleDateSelect = async (date) => {
    // Prevent selecting future dates
    const today = new Date();
    today.setHours(23, 59, 59, 999); // Set to end of today
    
    if (date > today) {
      setError("Cannot select future dates for diary entries.");
      return;
    }
    
    setSelectedDate(date);
    setShowCalendar(false);
    await loadEntriesForDate(date);
  };

  const handleBackToLatest = async () => {
    setViewMode('latest');
    setShowCalendar(false);
    await loadLatestEntries();
  };

  const handleShowCalendar = () => {
    setShowCalendar(true);
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
          <div className="search-container">
            <div className="search-input-wrapper">
              <span className="search-icon">🔍</span>
              <input
                type="text"
                placeholder="Search entries..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  // Auto-search as user types (with debounce effect)
                  if (e.target.value.trim()) {
                    handleSearch();
                  } else {
                    clearSearch();
                  }
                }}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                className="search-input"
              />
              {searchTerm && (
                <button onClick={clearSearch} className="clear-search-btn" disabled={loading}>
                  ✕
                </button>
              )}
            </div>
          </div>
          <ProfileDropdown />
        </div>
      </header>

      <div className="diary-container">
        {/* Error Display */}
        {error && (
          <div className="error-message">
            <span>⚠️ {error}</span>
            <button onClick={() => setError(null)} className="close-error">✕</button>
          </div>
        )}



        {/* Calendar Modal */}
        {showCalendar && (
          <div className="calendar-modal" onClick={(e) => e.target.classList.contains('calendar-modal') && setShowCalendar(false)}>
            <div className="calendar-content">
              <div className="calendar-header">
                <h3>Select a Date</h3>
                <button onClick={() => setShowCalendar(false)} className="close-calendar">✕</button>
              </div>
              <div className="calendar-body">
                <div className="date-picker-container">
                  <label className="date-picker-label">Choose Date:</label>
                  <div className="date-input-wrapper">
                    <input
                      type="date"
                      value={selectedDate.toISOString().split('T')[0]}
                      onChange={(e) => handleDateSelect(new Date(e.target.value))}
                      className="date-picker"
                      max={new Date().toISOString().split('T')[0]}
                    />
                    <button 
                      onClick={() => document.getElementById('hidden-date-picker').showPicker()} 
                      className="calendar-icon-btn"
                      title="Open Calendar"
                    >
                      📅
                    </button>
                    <input
                      id="hidden-date-picker"
                      type="date"
                      value={selectedDate.toISOString().split('T')[0]}
                      onChange={(e) => handleDateSelect(new Date(e.target.value))}
                      className="hidden-date-picker"
                      max={new Date().toISOString().split('T')[0]}
                    />
                  </div>
                </div>
                <div className="calendar-divider">
                  <span>or choose quickly</span>
                </div>
                <div className="calendar-quick-dates">
                  <button 
                    onClick={() => handleDateSelect(new Date())} 
                    className="quick-date-btn today-btn"
                  >
                    <span className="quick-date-icon">📝</span>
                    <div className="quick-date-text">
                      <span className="quick-date-title">Today</span>
                      <span className="quick-date-subtitle">{new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                    </div>
                  </button>
                  <button 
                    onClick={() => handleDateSelect(new Date(Date.now() - 86400000))} 
                    className="quick-date-btn yesterday-btn"
                  >
                    <span className="quick-date-icon">📖</span>
                    <div className="quick-date-text">
                      <span className="quick-date-title">Yesterday</span>
                      <span className="quick-date-subtitle">{new Date(Date.now() - 86400000).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                    </div>
                  </button>
                  <button 
                    onClick={() => handleDateSelect(new Date(Date.now() - 7 * 86400000))} 
                    className="quick-date-btn week-ago-btn"
                  >
                    <span className="quick-date-icon">📚</span>
                    <div className="quick-date-text">
                      <span className="quick-date-title">1 Week Ago</span>
                      <span className="quick-date-subtitle">{new Date(Date.now() - 7 * 86400000).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                    </div>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Main Content */}
        <div className="diary-content">
          {/* New Entry Section */}
          <div className="new-entry-section">
            <div className="entry-header">
              <h3>{isEditing ? 'Edit your entry' : 'How are you feeling today?'}</h3>
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
              <RichTextEditor
                value={currentEntry}
                onChange={setCurrentEntry}
                placeholder="Write about your day, your thoughts, your dreams... ✨"
              />
              <div className="entry-actions">
                <div className="entry-stats">
                  <span>{currentEntry.replace(/<[^>]*>/g, '').length} characters</span>
                </div>
                <div className="entry-buttons">
                  {isEditing && (
                    <button
                      onClick={() => {
                        setCurrentEntry('');
                        setMood('');
                        setIsEditing(false);
                        setEditingEntryId(null);
                      }}
                      className="cancel-btn"
                      disabled={loading}
                    >
                      Cancel
                    </button>
                  )}
                  <button
                    onClick={() => {
                      setCurrentEntry('');
                      setMood('');
                      setIsEditing(false);
                      setEditingEntryId(null);
                    }}
                    className="clear-btn"
                    disabled={loading}
                  >
                    Clear
                  </button>
                  <button
                    onClick={handleSaveEntry}
                    className="save-btn"
                    disabled={!currentEntry.trim() || loading}
                  >
                    {loading ? 'Saving...' : (isEditing ? 'Update Entry' : 'Save Entry')}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Entries */}
          <div className="entries-section">
            <div className="entries-header">
              <h3>
                {isSearching 
                  ? `Search Results (${entries.length})` 
                  : viewMode === 'latest'
                    ? `Latest Entries (${entries.length})`
                    : `Entries for ${formatDate(selectedDate)} (${entries.length})`
                }
              </h3>
              <div className="entries-header-actions">
                {viewMode === 'latest' && !isSearching && (
                  <button onClick={handleShowCalendar} className="view-all-entries-btn">
                    View All Entries
                  </button>
                )}
                {viewMode === 'date' && !isSearching && (
                  <div className="date-view-actions">
                    <button onClick={handleBackToLatest} className="back-to-latest-btn-small">
                      Latest Entries
                    </button>
                    <button onClick={handleShowCalendar} className="change-date-btn-small">
                      View All Entries
                    </button>
                  </div>
                )}
              </div>
            </div>
            {loading ? (
              <div className="loading-state">
                <div className="loading-spinner">⏳</div>
                <p>Loading entries...</p>
              </div>
            ) : entries.length === 0 ? (
              <div className="no-entries">
                <div className="no-entries-icon">📝</div>
                {isSearching ? (
                  <>
                    <p>No entries found matching your search.</p>
                    <p>Try different keywords or browse by date.</p>
                  </>
                ) : viewMode === 'latest' ? (
                  <>
                    <p>No diary entries yet.</p>
                    <p>Start writing to capture your thoughts!</p>
                  </>
                ) : (
                  <>
                    <p>No entries for this date yet.</p>
                    <p>Start writing to capture your thoughts!</p>
                  </>
                )}
              </div>
            ) : (
              <div className="entries-list">
                {entries.map((entry) => (
                  <div key={entry.id} className="entry-card">
                    <div className="entry-meta">
                      <span className="entry-mood">{entry.mood}</span>
                      <div className="entry-datetime">
                        {viewMode === 'latest' && (
                          <span className="entry-date">
                            {entry.date || new Date(entry.timestamp?.toDate ? entry.timestamp.toDate() : entry.timestamp).toDateString()}
                          </span>
                        )}
                        <span className="entry-time">
                          {entry.timestamp?.toDate ?
                            entry.timestamp.toDate().toLocaleTimeString('en-US', {
                              hour: '2-digit',
                              minute: '2-digit'
                            }) :
                            new Date(entry.timestamp).toLocaleTimeString('en-US', {
                              hour: '2-digit',
                              minute: '2-digit'
                            })
                          }
                        </span>
                      </div>
                    </div>
                    <div className="entry-content">
                      <div 
                        className="entry-text"
                        dangerouslySetInnerHTML={{ __html: entry.content }}
                      />
                    </div>
                    <div className="entry-actions-bottom">
                      <button
                        className="edit-entry-btn"
                        onClick={() => handleEdit(entry)}
                        disabled={loading}
                      >
                        Edit
                      </button>
                      <button
                        className="delete-entry-btn"
                        onClick={() => handleDelete(entry.id)}
                        disabled={loading}
                      >
                        Delete
                      </button>
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

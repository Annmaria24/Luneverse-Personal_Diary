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
import FullScreenEditor from '../components/FullScreenEditor';
import CustomModal from '../components/CustomModal';
import { useCustomModal } from '../hooks/useCustomModal';

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
  const [showFullScreenEditor, setShowFullScreenEditor] = useState(false);
  const [fullScreenContent, setFullScreenContent] = useState('');
  const [fullScreenMood, setFullScreenMood] = useState('');
  const [expandedEntries, setExpandedEntries] = useState(new Set());
  const [isNavigating, setIsNavigating] = useState(false);

  const { modalState, showConfirm, showAlert, showError } = useCustomModal();

  useEffect(() => {
    console.log("Current user in DiaryPage:", currentUser);
    if (currentUser) {
      if (viewMode === 'latest') {
        loadLatestEntriesInternal();
      } else {
        loadEntriesForDateInternal(selectedDate);
      }
    }
  }, [selectedDate, currentUser, viewMode]);
  
  const loadLatestEntriesInternal = async () => {

  const currentUser = auth.currentUser;

  if (!currentUser) {
    console.warn("No currentUser found when loading latest entries");
    return;
  }

  console.log("Loading latest entries for user:", currentUser.uid);
  setLoading(true);
  setError(null);
  setIsSearching(false);

  try {
    const fetchedLatestEntries = await getLatestDiaryEntries(currentUser.uid, 5);
    console.log("Fetched latest entries:", fetchedLatestEntries);
    setEntries(fetchedLatestEntries); // Use entries state for display
    setLatestEntries(fetchedLatestEntries); // Keep for dashboard
  } catch (error) {
    console.error("Error loading latest entries:", error);
    setError("Failed to load latest diary entries. Please try again.");
    setEntries([]);
    setLatestEntries([]);
  } finally {
    setLoading(false);
  }
};

  const loadEntriesForDateInternal = async (date) => {
    if (!currentUser) {
      console.warn("No currentUser found when loading entries for date");
      return;
    }
    console.log(`Loading entries for user: ${currentUser.uid} on date: ${date.toDateString()}`);
    setLoading(true);
    setError(null);
    setIsSearching(false);
    setViewMode('date');

    try {
      const dateString = date.toDateString();
      const fetchedEntries = await getDiaryEntries(currentUser.uid, dateString);
      console.log("Fetched entries for date:", fetchedEntries);
      setEntries(fetchedEntries);
    } catch (error) {
      console.error("Error loading entries:", error);
      setError("Failed to load diary entries. Please try again.");
      setEntries([]);
    } finally {
      setLoading(false);
    }

  };

  const loadLatestEntries = async () => {
    if (!currentUser) return;

    setLoading(true);
    setError(null);
    setIsSearching(false);

    try {
      const fetchedLatestEntries = await getLatestDiaryEntries(currentUser.uid, 5);
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
  userId: currentUser.uid,   // 🔑 required
  date: selectedDate.toDateString(),
  content: content,
  mood: mood,
  timestamp: new Date()
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
    openFullScreenEditor(entry.content, entry.mood || '');
  };

  const handleDelete = async (entryId) => {
    const confirmDelete = await showConfirm(
      'This action cannot be undone. Are you sure you want to delete this entry?',
      'Delete Entry'
    );
    
    if (!confirmDelete) return;

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
      await showError("Failed to delete diary entry. Please try again.", "Delete Failed");
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

  // Helper function to strip HTML tags and get plain text
  const stripHtmlTags = (html) => {
    const temp = document.createElement('div');
    temp.innerHTML = html;
    return temp.textContent || temp.innerText || '';
  };

  // Generate a smart title from entry content
  const generateEntryTitle = (content) => {
    const plainText = stripHtmlTags(content);
    const firstLine = plainText.split('\n')[0].trim();
    
    // If first line is long enough and looks like a title, use it
    if (firstLine.length >= 10 && firstLine.length <= 60) {
      return firstLine;
    }
    
    // Otherwise, create a title from the first few words
    const words = plainText.split(' ').filter(word => word.length > 0);
    if (words.length === 0) return 'Untitled Entry';
    
    let title = '';
    for (let i = 0; i < Math.min(8, words.length); i++) {
      if ((title + ' ' + words[i]).length > 50) break;
      title += (title ? ' ' : '') + words[i];
    }
    
    return title || 'Untitled Entry';
  };

  // Generate a preview of the entry content
  const generateEntryPreview = (content) => {
    const plainText = stripHtmlTags(content);
    const maxLength = 120;
    
    if (plainText.length <= maxLength) {
      return plainText;
    }
    
    // Find a good breaking point (end of sentence or word)
    let preview = plainText.substring(0, maxLength);
    const lastPeriod = preview.lastIndexOf('.');
    const lastSpace = preview.lastIndexOf(' ');
    
    if (lastPeriod > maxLength * 0.7) {
      preview = preview.substring(0, lastPeriod + 1);
    } else if (lastSpace > maxLength * 0.7) {
      preview = preview.substring(0, lastSpace);
    }
    
    return preview + '...';
  };

  // Toggle entry expansion
  const toggleEntryExpansion = (entryId) => {
    setExpandedEntries(prev => {
      const newSet = new Set(prev);
      if (newSet.has(entryId)) {
        newSet.delete(entryId);
      } else {
        newSet.add(entryId);
      }
      return newSet;
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



  const openFullScreenEditor = (content = '', mood = '') => {
    setFullScreenContent(content);
    setFullScreenMood(mood);
    setShowFullScreenEditor(true);
  };

  const closeFullScreenEditor = () => {
    setShowFullScreenEditor(false);
    setFullScreenContent('');
    setFullScreenMood('');
    // Reset editing state if needed
    if (isEditing) {
      setIsEditing(false);
      setEditingEntryId(null);
      setCurrentEntry('');
      setMood('');
    }
  };

  const handleFullScreenSave = async ({ content, mood }) => {
    if (isEditing && editingEntryId) {
      // Update existing entry
      const entryData = {
        date: selectedDate.toDateString(),
        content: content,
        mood: mood
      };
      
      setLoading(true);
      setError(null);
      
      try {
        await updateDiaryEntry(editingEntryId, entryData);
        console.log("Entry updated successfully");
        
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
        console.error("Error updating entry:", error);
        setError("Failed to update diary entry. Please try again.");
      } finally {
        setLoading(false);
      }
    } else {
      // Create new entry
      if (!content.trim()) return;
      
      setLoading(true);
      setError(null);
      
      try {
        const entryData = {
          date: selectedDate.toDateString(),
          content: content,
          mood: mood
        };
        
        await addDiaryEntry(currentUser.uid, entryData);
        console.log("Entry added successfully");
        
        // Reload the appropriate view
        if (viewMode === 'latest') {
          await loadLatestEntries();
        } else {
          await loadEntriesForDate(selectedDate);
        }
        
        // Reset form
        setCurrentEntry('');
        setMood('');
      } catch (error) {
        console.error("Error saving entry:", error);
        setError("Failed to save diary entry. Please try again.");
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <div className="diary-page">
      <div className="dashboard-background">
        <div className="floating-element element-1">🌙</div>
        <div className="floating-element element-2">✨</div>
        <div className="floating-element element-3">🌸</div>
        <div className="floating-element element-4">💜</div>
        <div className="floating-element element-5">🦋</div>
        <div className="floating-element element-6">🌺</div>
      </div>
      <div className="diary-container">
        {/* Search */}
        {/* Removed search section here as it's moved to navbar */}

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
                      <span className="quick-date-subtitle">{new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                    </div>
                  </button>
                  <button 
                    onClick={() => handleDateSelect(new Date(Date.now() - 86400000))} 
                    className="quick-date-btn yesterday-btn"
                  >
                    <span className="quick-date-icon">📖</span>
                    <div className="quick-date-text">
                      <span className="quick-date-title">Yesterday</span>
                      <span className="quick-date-subtitle">{new Date(Date.now() - 86400000).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                    </div>
                  </button>
                  <button 
                    onClick={() => handleDateSelect(new Date(Date.now() - 7 * 86400000))} 
                    className="quick-date-btn week-ago-btn"
                  >
                    <span className="quick-date-icon">📚</span>
                    <div className="quick-date-text">
                      <span className="quick-date-title">1 Week Ago</span>
                      <span className="quick-date-subtitle">{new Date(Date.now() - 7 * 86400000).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
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
              <h3>{isEditing ? 'Edit Entry' : 'New Entry'}</h3>
            </div>

            <div className="entry-editor">
              <div 
                className="entry-editor-placeholder"
                onClick={() => openFullScreenEditor()}
              >
                <div className="placeholder-content">
                  <div className="placeholder-icon">✍️</div>
                  <div className="placeholder-text">
                    <h3>Start writing your thoughts...</h3>
                    <p>Click here to open the full-screen editor with rich text formatting, emojis, and more!</p>
                  </div>
                  <div className="placeholder-features">
                    <span className="feature-tag">📝 Rich Text</span>
                    <span className="feature-tag">😊 Emojis</span>
                    <span className="feature-tag">🎨 Colors</span>
                    <span className="feature-tag">🌙 Dark Mode</span>
                  </div>
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
                      <div className="entry-header-info">
                        <h3 
                          className="entry-title"
                          onClick={() => toggleEntryExpansion(entry.id)}
                          title={expandedEntries.has(entry.id) ? "Show less" : "Show more"}
                        >
                          {generateEntryTitle(entry.content)}
                        </h3>
                        <button 
                          className="expand-toggle-btn"
                          onClick={() => toggleEntryExpansion(entry.id)}
                          title={expandedEntries.has(entry.id) ? "Show less" : "Show more"}
                        >
                          {expandedEntries.has(entry.id) ? '▲' : '▼'}
                        </button>
                      </div>
                      
                      <div className="entry-text">
                        {expandedEntries.has(entry.id) ? (
                          <div dangerouslySetInnerHTML={{ __html: entry.content }} />
                        ) : (
                          <p className="entry-preview">{generateEntryPreview(entry.content)}</p>
                        )}
                      </div>
                      
                      {!expandedEntries.has(entry.id) && stripHtmlTags(entry.content).length > 120 && (
                        <button 
                          className="read-more-btn"
                          onClick={() => toggleEntryExpansion(entry.id)}
                        >
                          Read more
                        </button>
                      )}
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
      <button className="fab" onClick={() => openFullScreenEditor()}>
        <span>+</span>
      </button>

      {/* Full Screen Editor */}
      <FullScreenEditor
        isOpen={showFullScreenEditor}
        onClose={closeFullScreenEditor}
        onSave={handleFullScreenSave}
        initialContent={fullScreenContent}
        initialMood={fullScreenMood}
        isEditing={isEditing}
        placeholder="Write about your day, your thoughts, your dreams... ✨"
      />

      {/* Custom Modal */}
      <CustomModal
        isOpen={modalState.isOpen}
        onClose={modalState.onCancel}
        onConfirm={modalState.onConfirm}
        title={modalState.title}
        message={modalState.message}
        type={modalState.type}
        confirmText={modalState.confirmText}
        cancelText={modalState.cancelText}
        showCancel={modalState.showCancel}
      />
    </div>
  );
}

export default DiaryPage;

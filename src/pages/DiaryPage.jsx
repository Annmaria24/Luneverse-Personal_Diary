import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useAuth } from '../context/AuthContext';
import './Styles/DiaryPage.css';
import { addDiaryEntry, getDiaryEntries, getLatestDiaryEntries, updateDiaryEntry, deleteDiaryEntry } from "../services/diaryService";
import { auth } from "../firebase/config";
import ProfileDropdown from '../components/ProfileDropdown';
import RichTextEditor from '../components/RichTextEditor';
import FullScreenEditor from '../components/FullScreenEditor';
import CustomModal from '../components/CustomModal';
import DiaryBookModal from '../components/DiaryBookModal';
import { useCustomModal } from '../hooks/useCustomModal';
import Navbar from '../components/Navbar';

function DiaryPage({ includeNavbar = true }) {
  const { currentUser } = useAuth();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [entries, setEntries] = useState([]);
  // eslint-disable-next-line no-unused-vars
  const [currentEntry, setCurrentEntry] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [editingEntryId, setEditingEntryId] = useState(null);
  // eslint-disable-next-line no-unused-vars
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
  const [currentPage, setCurrentPage] = useState(0); // book page index
  const [showBookModal, setShowBookModal]   = useState(false);
  const [bookStartPage, setBookStartPage]   = useState(0);
  const [bookEntries, setBookEntries]       = useState([]);

  const openBook = async (startIndex = 0) => {
    // Open the modal immediately with current view's entries as a fallback layout
    setBookEntries(entries);
    setBookStartPage(startIndex);
    setShowBookModal(true);
    
    // Always fetch ALL entries in the background so the book has no limit to its pages,
    // allowing the user to turn back through all time regardless of the current list filter.
    if (auth.currentUser) {
      try {
        const allEntries = await getDiaryEntries(auth.currentUser.uid);
        // We always want to sync if the full list is different
        if (allEntries.length > 0 && allEntries.length !== entries.length) {
          const clickedId = entries[startIndex]?.id;
          const newIndex = allEntries.findIndex(e => e.id === clickedId);
          setBookEntries(allEntries);
          if (newIndex !== -1) setBookStartPage(newIndex);
        }
      } catch (err) {
        console.error("Failed to load full diary for book viewer:", err);
      }
    }
  };

  const { modalState, showConfirm, showError } = useCustomModal();

  const loadLatestEntries = async () => {
    const user = auth.currentUser;
    if (!user) return;
    setLoading(true);
    setError(null);
    setIsSearching(false);
    try {
      const fetchedLatestEntries = await getLatestDiaryEntries(user.uid, 5);
      setEntries(fetchedLatestEntries);
      setCurrentPage(0);
    } catch (error) {
      console.error("Error loading latest entries:", error);
      setError("Failed to load latest diary entries. Please try again.");
      setEntries([]);
    } finally {
      setLoading(false);
    }
  };

  const loadEntriesForDate = async (date) => {
    const user = auth.currentUser;
    if (!user) return;
    setLoading(true);
    setError(null);
    setIsSearching(false);
    try {
      const dateString = date.toDateString();
      const fetchedEntries = await getDiaryEntries(user.uid, dateString);
      setEntries(fetchedEntries);
      setCurrentPage(0);
    } catch (error) {
      console.error("Error loading entries:", error);
      setError("Failed to load diary entries. Please try again.");
      setEntries([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    console.log("Current user in DiaryPage:", currentUser);
    if (currentUser) {
      if (viewMode === 'latest') {
        loadLatestEntries();
      } else {
        loadEntriesForDate(selectedDate);
      }
    }
  }, [selectedDate, currentUser, viewMode]);

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





  const handleDateSelect = async (date) => {
    // Prevent selecting future dates
    const today = new Date();
    today.setHours(23, 59, 59, 999); // Set to end of today

    if (date > today) {
      setError("Cannot select future dates for diary entries.");
      return;
    }

    setSelectedDate(date);
    setViewMode('date');
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

        // addDiaryEntry now returns { id, finalMood, confidence, error }
        const result = await addDiaryEntry(currentUser.uid, entryData);
        console.log("Entry added successfully", result);

        // Show info if mood classification had issues (but entry was still saved)
        if (result.error) {
          console.warn("Mood classification warning:", result.error);
          // Entry is still saved, just show a subtle message
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
      {includeNavbar && (
        <div className="dashboard-background">
          <div className="floating-element element-1">🌙</div>
          <div className="floating-element element-2">✨</div>
          <div className="floating-element element-3">🌸</div>
          <div className="floating-element element-4">💜</div>
          <div className="floating-element element-5">🦋</div>
          <div className="floating-element element-6">🌺</div>
        </div>
      )}
      {includeNavbar && <Navbar />}
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
        {showCalendar && createPortal(
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
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <rect x="3" y="4" width="18" height="18" rx="2" ry="2" stroke="currentColor" strokeWidth="2" />
                        <line x1="16" y1="2" x2="16" y2="6" stroke="currentColor" strokeWidth="2" />
                        <line x1="8" y1="2" x2="8" y2="6" stroke="currentColor" strokeWidth="2" />
                        <line x1="3" y1="10" x2="21" y2="10" stroke="currentColor" strokeWidth="2" />
                      </svg>
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
          </div>,
          document.body
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

          {/* Book-style Entry Viewer */}
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
              <div className="book-viewer">
                {/* Entry cards — click to open book modal */}
                <div className="diary-entry-list">
                  {entries.map((entry, idx) => {
                    const ts = entry.timestamp?.toDate
                      ? entry.timestamp.toDate()
                      : new Date(entry.timestamp);
                    const timeLabel = ts.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
                    const stripped = (() => { const d = document.createElement('div'); d.innerHTML = entry.content || ''; return d.textContent || ''; })();
                    const preview  = stripped.slice(0, 90) + (stripped.length > 90 ? '…' : '');
                    const firstLine = stripped.split('\n')[0].trim();
                    const title = (firstLine.length >= 6 && firstLine.length <= 60)
                      ? firstLine
                      : stripped.split(' ').slice(0, 7).join(' ') || 'Untitled';

                    return (
                      <div
                        key={entry.id}
                        className="diary-preview-card"
                        onClick={() => openBook(idx)}
                        role="button"
                        tabIndex={0}
                        onKeyDown={(e) => e.key === 'Enter' && openBook(idx)}
                      >
                        <div className="diary-preview-left">
                          <span className="diary-preview-mood">{entry.mood || '📓'}</span>
                        </div>
                        <div className="diary-preview-body">
                          <div className="diary-preview-title">{title}</div>
                          <div className="diary-preview-text">{preview || '(empty entry)'}</div>
                        </div>
                        <div className="diary-preview-right">
                          <span className="diary-preview-time">{timeLabel}</span>
                          <span className="diary-preview-open">Open ›</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Diary Book Modal */}
      <DiaryBookModal
        key={bookEntries.length}
        isOpen={showBookModal}
        entries={bookEntries}
        initialPage={bookStartPage}
        onClose={() => setShowBookModal(false)}
        onEdit={(entry) => { setShowBookModal(false); handleEdit(entry); }}
        onDelete={(id) => { setShowBookModal(false); handleDelete(id); }}
        viewMode={viewMode}
      />

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
    </div >
  );
}

export default DiaryPage;

import React, { useCallback, useRef, useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import HTMLFlipBook from 'react-pageflip';
import './DiaryBookModal.css';

const Page = React.forwardRef((props, ref) => {
  return (
    <div className={`book-page-sheet ${props.className || ''}`} ref={ref}>
      {props.children}
    </div>
  );
});

export default function DiaryBookModal({
  isOpen,
  entries = [],
  initialPage = 0,
  onClose,
  onEdit,
  onDelete,
}) {
  const pageFlipRef = useRef(null);

  // Use state to track the current index in the entries array
  const [activeIdx, setActiveIdx] = useState(initialPage);

  // Sync state if initialPage or entries change externally
  useEffect(() => {
    const idxInOrdered = entries.length > 0 ? (entries.length - 1 - initialPage) : 0;
    setActiveIdx(idxInOrdered);
  }, [initialPage, entries.length]);

  const chronologicalEntries = [...entries].reverse(); // Oldest-first order
  const actualInitialPage = entries.length > 0 ? (entries.length - 1 - initialPage) : 0;

  // Close on Escape key
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    if (isOpen) window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [isOpen, onClose]);

  // Turn to initial page on load
  useEffect(() => {
    if (isOpen && pageFlipRef.current && actualInitialPage > 0) {
      setTimeout(() => {
        try {
          pageFlipRef.current.pageFlip().turnToPage(actualInitialPage * 2);
        } catch (e) {
          console.error("Flip transition error:", e);
        }
      }, 100); // Wait for initialization
    }
  }, [isOpen, actualInitialPage]);

  // Arrow controls
  const flipNext = useCallback(() => {
    if (pageFlipRef.current) pageFlipRef.current.pageFlip().flipNext();
  }, []);

  const flipPrev = useCallback(() => {
    if (pageFlipRef.current) pageFlipRef.current.pageFlip().flipPrev();
  }, []);

  const onFlip = useCallback((e) => {
    const newEntryIdx = Math.floor(e.data / 2);
    setActiveIdx(newEntryIdx);
  }, []);

  if (!isOpen || chronologicalEntries.length === 0) return null;

  // ─── helpers ───
  const getTimestamp = (e) => e?.timestamp?.toDate ? e.timestamp.toDate() : new Date(e.timestamp || Date.now());
  const formatDate = (e) => getTimestamp(e).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
  const formatTime = (e) => getTimestamp(e).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

  const stripHtml = (html) => {
    const tmp = document.createElement('div');
    tmp.innerHTML = html || '';
    return tmp.textContent || tmp.innerText || '';
  };

  const getTitle = (content) => {
    const text = stripHtml(content);
    const first = text.split('\n')[0].trim();
    if (first.length >= 10 && first.length <= 60) return first;
    const words = text.split(' ').filter(Boolean);
    let title = '';
    for (let i = 0; i < Math.min(8, words.length); i++) {
      if ((title + ' ' + words[i]).length > 50) break;
      title += (title ? ' ' : '') + words[i];
    }
    return title || 'Untitled Entry';
  };

  const decorativeEmojis = ['🌸', '✨', '🌙', '💜', '🦋', '🌺', '📖', '🌷'];

  // Flatten our entries array into left/right pages in CHRONOLOGICAL order
  const pagesData = chronologicalEntries.flatMap((entry, idx) => {
    const deco = decorativeEmojis[idx % decorativeEmojis.length];

    return [
      <Page key={`left-${entry.id}`} className="page-left-sheet">
        <div className="page-content">
          <div className="book-left-lines">
            {Array.from({ length: 12 }).map((_, i) => <div key={i} className="book-left-line" />)}
          </div>
          <div className="book-left-decoration">{deco}</div>
          <div className="book-left-entry-num">Page {idx + 1} of {chronologicalEntries.length}</div>
          <div className="book-left-mood">{entry.mood || '📓'}</div>
          <div className="book-left-date">{formatDate(entry)}</div>
          
          <div className="book-left-dots">
            {chronologicalEntries.length <= 15 ? chronologicalEntries.map((_, i) => (
              <button
                key={i}
                className={`book-left-dot ${i === idx ? 'active' : ''}`}
                onClick={(e) => {
                  e.stopPropagation();
                  if (pageFlipRef.current) pageFlipRef.current.pageFlip().turnToPage(i * 2);
                }}
                title={`Go to page ${i + 1}`}
              />
            )) : <span style={{fontSize: '0.75rem', color: '#a17ad6', fontStyle: 'italic'}}>Your continuous diary history</span>}
          </div>
        </div>
      </Page>,

      <Page key={`right-${entry.id}`} className="page-right-sheet">
        <div className="page-content">
          <div className="book-right-lines">
            {Array.from({ length: 14 }).map((_, i) => <div key={i} className="book-right-line" />)}
          </div>

          <div className="book-right-content">
            <div className="book-right-header">
              <span style={{ fontSize: '1.1rem' }}>{entry.mood}</span>
              <span className="book-right-time">
                {entry.date ?? formatDate(entry)} &middot; {formatTime(entry)}
              </span>
            </div>

            <h2 className="book-right-title">{getTitle(entry.content)}</h2>

            <div
              className="book-right-body entry-text"
              dangerouslySetInnerHTML={{ __html: entry.content || '' }}
            />

            <div className="book-right-footer">
              <button className="book-action-btn" onClick={() => { onEdit(entry); onClose(); }}>
                ✏️ Edit
              </button>
              <button className="book-action-btn delete" onClick={() => { onDelete(entry.id); onClose(); }}>
                🗑️ Delete
              </button>
            </div>
          </div>
        </div>
      </Page>
    ];
  });

  const modalContent = (
    <div className="book-modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <button className="book-modal-close" onClick={onClose} title="Close journal">✕</button>

      <div className="book-open">
        {/* PageFlip handles its own inner container, we just wrap React component */}
        <HTMLFlipBook
          width={450}
          height={580}
          size="stretch"
          minWidth={315}
          maxWidth={1000}
          minHeight={420}
          maxHeight={1350}
          maxShadowOpacity={0.4}
          showCover={false}
          usePortrait={false}
          mobileScrollSupport={false}
          className="page-flip-container"
          ref={pageFlipRef}
          onFlip={onFlip}
        >
          {pagesData}
        </HTMLFlipBook>

        <button
          className="book-arrow left"
          onClick={flipPrev}
          disabled={activeIdx === 0}
          title="Previous page (older)"
        >
          ‹
        </button>
        <button
          className="book-arrow right"
          onClick={flipNext}
          disabled={activeIdx === chronologicalEntries.length - 1}
          title="Next page (newer)"
        >
          ›
        </button>
      </div>
    </div>
  );

  return ReactDOM.createPortal(modalContent, document.body);
}

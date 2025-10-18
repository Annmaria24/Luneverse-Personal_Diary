import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Styles/RelaxMode.css';

const DEFAULT_AFFIRMATIONS = [
  "I'm beautiful.",
  "I'm loved.",
  "I make changes to the world no one else does."
];

function getTodayKey() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function RelaxAffirmations({ embedded }) {
  const navigate = useNavigate();
  const [affirmations, setAffirmations] = useState(() => {
    const saved = localStorage.getItem('affirmations_v1');
    if (saved) return JSON.parse(saved);
    localStorage.setItem('affirmations_v1', JSON.stringify(DEFAULT_AFFIRMATIONS));
    return DEFAULT_AFFIRMATIONS;
  });
  const [input, setInput] = useState('');
  const [remindDaily, setRemindDaily] = useState(() => {
    const saved = localStorage.getItem('affirmations_remind_daily');
    return saved ? JSON.parse(saved) : true;
  });

  useEffect(() => {
    localStorage.setItem('affirmations_v1', JSON.stringify(affirmations));
  }, [affirmations]);

  useEffect(() => {
    localStorage.setItem('affirmations_remind_daily', JSON.stringify(remindDaily));
  }, [remindDaily]);

  // Note: Daily notification logic moved to Dashboard.jsx to trigger on app open

  const canAdd = useMemo(() => input.trim().length >= 3, [input]);

  const addAffirmation = () => {
    if (!canAdd) return;
    setAffirmations((list) => [input.trim(), ...list]);
    setInput('');
  };

  const removeAffirmation = (idx) => {
    setAffirmations((list) => list.filter((_, i) => i !== idx));
  };

  const restoreTemplate = () => {
    setAffirmations(DEFAULT_AFFIRMATIONS);
  };

  return (
    <div className="affirmations-container">
      {!embedded && <h2 className="breathe-title">Daily Affirmations</h2>}

      <div className="affirmations-header">
        <div className="affirmations-intro">
          Feed your mind with kind words. Read them slowly and breathe.
        </div>
        <div className="affirmations-actions">
          <label className="toggle">
            <input
              type="checkbox"
              checked={remindDaily}
              onChange={(e) => setRemindDaily(e.target.checked)}
            />
            <span>Daily reminder</span>
          </label>
          <button className="template-btn" onClick={restoreTemplate}>Use Template</button>
        </div>
      </div>

      <div className="affirmation-add">
        <input
          className="affirmation-input"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Add a new affirmation..."
          onKeyDown={(e) => {
            if (e.key === 'Enter') addAffirmation();
          }}
        />
        <button className="template-btn" disabled={!canAdd} onClick={addAffirmation}>Add</button>
      </div>

      <div className="affirmations-list">
        {affirmations.length === 0 && (
          <div className="muted">No affirmations yet. Add one to get started ✨</div>
        )}
        {affirmations.map((text, idx) => (
          <div key={`${text}-${idx}`} className="affirmation-card">
            <div className="affirmation-text">{text}</div>
            <button className="remove-btn" onClick={() => removeAffirmation(idx)}>Remove</button>
          </div>
        ))}
      </div>
    </div>
  );
}

export default RelaxAffirmations;




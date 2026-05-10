import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import './Styles/RelaxMode.css';

import RelaxBreathe from './RelaxBreathe';
import RelaxSound from './RelaxSound';
import RelaxQuotes from './RelaxQuotes';
import RelaxFlow from './RelaxFlow';
// Visuals removed
// Visuals removed
import RelaxAffirmations from './RelaxAffirmations';
import { useSearchParams } from 'react-router-dom';

function RelaxMode() {
  // eslint-disable-next-line no-unused-vars
  const [params, setParams] = useSearchParams();
  const [activeSection, setActiveSection] = useState('breathe');

  useEffect(() => {
    const s = params.get('section');
    if (s) setActiveSection(s);
  }, [params]);


  // Function to render right-side content based on selected section
  const renderSection = () => {
    switch (activeSection) {
      case 'breathe':
        return <RelaxBreathe />;
      case 'sound':
        return <RelaxSound embedded />;
      case 'quotes':
        return <RelaxQuotes embedded />;
      case 'flow':
        return <RelaxFlow embedded />;
      // visuals removed
      // reflect removed
      case 'affirmations':
        return <RelaxAffirmations embedded />;
      default:
        return <RelaxBreathe />;
    }
  };

  return (
    <div className="relax-mode-page">
      <Navbar />

      <div className="relax-layout">
        {/* Sidebar */}
        <aside className="relax-sidebar">
          <div className="relax-title">Relax Mode 🌙</div>
          <nav className="relax-nav">
            <button
              className={`relax-link ${activeSection === 'breathe' ? 'active' : ''}`}
              onClick={() => setActiveSection('breathe')}
            >
              🫧 Guided Breathing
            </button>
            <button
              className={`relax-link ${activeSection === 'sound' ? 'active' : ''}`}
              onClick={() => setActiveSection('sound')}
            >
              🌧️ Soundscapes
            </button>
            <button
              className={`relax-link ${activeSection === 'quotes' ? 'active' : ''}`}
              onClick={() => setActiveSection('quotes')}
            >
              💭 Calm Quotes
            </button>
            <button
              className={`relax-link ${activeSection === 'flow' ? 'active' : ''}`}
              onClick={() => setActiveSection('flow')}
            >
              🎨 Flow Mode
            </button>
            {/* Visuals removed */}

            <button
              className={`relax-link ${activeSection === 'affirmations' ? 'active' : ''}`}
              onClick={() => setActiveSection('affirmations')}
            >
              ✨ Affirmations
            </button>
          </nav>
        </aside>

        {/* Right-side main content */}
        <main className="relax-content">{renderSection()}</main>
      </div>
    </div>
  );
}

export default RelaxMode;

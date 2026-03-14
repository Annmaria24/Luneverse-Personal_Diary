import React from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import './Styles/RelaxMode.css';

function RelaxMeditations() {
  const navigate = useNavigate();
  return (
    <div className="relax-mode-page">
      <Navbar />
      <main className="relax-main">
        <button className="template-btn" onClick={() => navigate('/relax')}>← Back</button>
        <h2>Meditations</h2>
        <p>Short practices: Letting Go (3m), Body Scan (5m), Self-Compassion (4m).</p>
      </main>
    </div>
  );
}

export default RelaxMeditations;




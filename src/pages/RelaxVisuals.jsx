import React from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import './Styles/RelaxMode.css';

function RelaxVisuals() {
  const navigate = useNavigate();
  return (
    <div className="relax-mode-page">
      <Navbar />
      <main className="relax-main">
        <button className="template-btn" onClick={() => navigate('/relax')}>← Back</button>
        <h2>Visuals</h2>
        <p>Aurora, Starfield, and Koi animations (placeholder screen).</p>
      </main>
    </div>
  );
}

export default RelaxVisuals;




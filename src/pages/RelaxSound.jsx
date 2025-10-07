import React from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import './Styles/RelaxMode.css';

function RelaxSound() {
  const navigate = useNavigate();
  return (
    <div className="relax-mode-page">
      <Navbar />
      <main className="relax-main">
        <button className="template-btn" onClick={() => navigate('/relax')}>← Back</button>
        <h2>Soundscapes</h2>
        <p>Choose a relaxing background: Rain, Forest, Ocean.</p>
        <div className="relax-template-row">
          <button className="template-btn">Rain</button>
          <button className="template-btn">Forest</button>
          <button className="template-btn">Ocean</button>
        </div>
      </main>
    </div>
  );
}

export default RelaxSound;




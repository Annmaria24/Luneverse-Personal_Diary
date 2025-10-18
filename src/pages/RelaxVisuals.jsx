import React from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import './Styles/RelaxMode.css';

function RelaxVisuals({ embedded = false }) {
  const navigate = useNavigate();
  const Content = (
    <>
      {!embedded && <button className="template-btn" onClick={() => navigate('/relax')}>← Back</button>}
      <h2>Visuals</h2>
      <p>Aurora, Starfield, and Koi animations (placeholder screen).</p>
    </>
  );

  if (embedded) return <div>{Content}</div>;
  return (
    <div className="relax-mode-page">
      <Navbar />
      <main className="relax-main">{Content}</main>
    </div>
  );
}

export default RelaxVisuals;




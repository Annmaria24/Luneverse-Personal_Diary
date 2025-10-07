import React, { useMemo, useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import Navbar from '../components/Navbar';
import './Styles/RelaxMode.css';

function RelaxBreathe() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [seconds, setSeconds] = useState(60);
  const [pattern, setPattern] = useState('resonant_55');
  const [phase, setPhase] = useState('inhale'); // inhale | hold1 | exhale | hold2
  const [running, setRunning] = useState(false);
  const tickRef = useRef(null);

  useEffect(() => {
    const preset = params.get('preset');
    // All sessions capped at 60s per requirement
    setSeconds(60);
    if (preset === 'reset_5') setPattern('box_breath_4');
    if (preset === 'quick_calm') setPattern('resonant_55');
  }, [params]);

  const title = useMemo(() => {
    if (pattern === 'box_breath_4') return 'Box Breathing';
    if (pattern === 'long_exhale_4_8') return 'Long Exhale Breathing';
    return 'Resonant Breathing';
  }, [pattern]);

  const timing = useMemo(() => {
    if (pattern === 'box_breath_4') return { inhale: 4, hold1: 4, exhale: 4, hold2: 4 };
    if (pattern === 'resonant_55') return { inhale: 5, hold1: 0, exhale: 6, hold2: 0 };
    return { inhale: 4, hold1: 0, exhale: 8, hold2: 0 };
  }, [pattern]);

  useEffect(() => {
    if (!running) return;
    let remainingInPhase = timing[phase];
    if (remainingInPhase === 0) {
      // skip zero-length phases
      setPhase((p) => (p === 'inhale' ? 'exhale' : p === 'exhale' ? 'inhale' : 'inhale'));
      return;
    }
    tickRef.current = setInterval(() => {
      remainingInPhase -= 1;
      setSeconds((s) => Math.max(0, s - 1));
      if (remainingInPhase <= 0) {
        setPhase((p) => {
          if (p === 'inhale') return timing.hold1 > 0 ? 'hold1' : 'exhale';
          if (p === 'hold1') return 'exhale';
          if (p === 'exhale') return timing.hold2 > 0 ? 'hold2' : 'inhale';
          return 'inhale';
        });
      }
    }, 1000);
    return () => clearInterval(tickRef.current);
  }, [running, phase, timing]);

  useEffect(() => {
    if (seconds === 0 && running) {
      setRunning(false);
    }
  }, [seconds, running]);

  const toggle = () => setRunning((r) => !r);
  const reset = (newPattern) => {
    if (newPattern) setPattern(newPattern);
    setSeconds(60);
    setPhase('inhale');
    setRunning(false);
  };

  return (
    <div className="relax-mode-page">
      <Navbar />
      <main className="relax-main">
        <button className="template-btn" onClick={() => navigate('/relax')}>← Back</button>
        <h2>{title}</h2>
        <div className="breathe-stage" style={{ position: 'relative' }}>
          <motion.div
            className="breathe-aura"
            animate={{
              scale: phase === 'inhale' ? 1.12 : phase === 'exhale' ? 0.88 : 1,
              opacity: phase.includes('hold') ? 0.95 : 1
            }}
            transition={{ duration: 1, ease: "easeInOut" }}
          />
          <motion.div
            className={`breathe-orb ${phase === 'exhale' ? 'dim' : ''}`}
            animate={{
              scale: phase === 'inhale' ? 1.1 : phase === 'exhale' ? 0.9 : 1
            }}
            transition={{ duration: 1, ease: "easeInOut" }}
            aria-label={`Phase: ${phase}`}
          />
          <div className="phase-label">{phase === 'inhale' ? 'Inhale' : phase === 'exhale' ? 'Exhale' : 'Hold'}</div>
          <div className="timer">{String(Math.floor(seconds / 60)).padStart(2, '0')}:{String(seconds % 60).padStart(2, '0')}</div>
          <div className="breathe-controls">
            <button className="template-btn" onClick={toggle}>{running ? 'Pause' : 'Start'}</button>
            <button className="template-btn" onClick={() => reset()}>Reset</button>
            <select className="select" value={pattern} onChange={(e) => reset(e.target.value)}>
              <option value="resonant_55">Resonant 5-6</option>
              <option value="box_breath_4">Box 4-4-4-4</option>
              <option value="long_exhale_4_8">Long Exhale 4-8</option>
            </select>
          </div>
          <div className="muted">Ends automatically at 60s</div>
        </div>
      </main>
    </div>
  );
}

export default RelaxBreathe;



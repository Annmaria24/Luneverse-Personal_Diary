import React, { useRef, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import './Styles/RelaxMode.css';

function FlowMode({ embedded = false }) {
  const navigate = useNavigate();
  const canvasRef = useRef(null);
  const ctxRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [color, setColor] = useState('#000000');
  const [brushSize, setBrushSize] = useState(5);
  const [tool, setTool] = useState('pen'); // 'pen' | 'brush' | 'eraser'
  const [savedPaintings, setSavedPaintings] = useState([]);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(null);

  useEffect(() => {
    const saved = JSON.parse(localStorage.getItem('paintings')) || [];
    setSavedPaintings(saved);
  }, []);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') setLightboxOpen(false);
      if (!lightboxOpen) return;
      if (e.key === 'ArrowRight') setLightboxIndex((i) => (i === null ? i : (i + 1) % savedPaintings.length));
      if (e.key === 'ArrowLeft') setLightboxIndex((i) => (i === null ? i : (i - 1 + savedPaintings.length) % savedPaintings.length));
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [lightboxOpen, savedPaintings.length]);

  useEffect(() => {
    const canvas = canvasRef.current;
    canvas.width = window.innerWidth * 0.7;
    canvas.height = window.innerHeight * 0.6;

    const ctx = canvas.getContext('2d');
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = color;
    ctx.lineWidth = brushSize;
    ctx.globalAlpha = 1.0;
    ctxRef.current = ctx;
  }, []);

  useEffect(() => {
    const ctx = ctxRef.current;
    if (ctx) {
      ctx.lineWidth = brushSize;
      if (tool === 'eraser') {
        ctx.globalAlpha = 1.0;
        ctx.globalCompositeOperation = 'destination-out';
      } else {
        ctx.globalCompositeOperation = 'source-over';
        ctx.strokeStyle = color;
        ctx.globalAlpha = tool === 'brush' ? 0.4 : 1.0; // soft brush opacity
      }
    }
  }, [color, brushSize, tool]);

  const startDrawing = (e) => {
    setIsDrawing(true);
    const ctx = ctxRef.current;
    ctx.beginPath();
    ctx.moveTo(e.nativeEvent.offsetX, e.nativeEvent.offsetY);
  };

  const draw = (e) => {
    if (!isDrawing) return;
    const ctx = ctxRef.current;

    // softer brush stroke
    if (tool === 'brush') {
      ctx.globalAlpha = 0.4;
    } else {
      ctx.globalAlpha = 1.0;
    }

    ctx.lineTo(e.nativeEvent.offsetX, e.nativeEvent.offsetY);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
    ctxRef.current.closePath();
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    const ctx = ctxRef.current;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  };

  const savePainting = () => {
    const canvas = canvasRef.current;
    const imageData = canvas.toDataURL('image/png');
    const date = new Date().toLocaleString();
    const newPainting = { date, imageData };

    const updated = [...savedPaintings, newPainting];
    setSavedPaintings(updated);
    localStorage.setItem('paintings', JSON.stringify(updated));

    alert('🎨 Painting saved!');
  };

  const buildEraserCursor = (size = 20) => {
    const radius = Math.max(8, Math.min(48, size));
    const svg = `<?xml version="1.0" encoding="UTF-8"?>
    <svg xmlns='http://www.w3.org/2000/svg' width='${radius}' height='${radius}' viewBox='0 0 ${radius} ${radius}'>
      <circle cx='${radius/2}' cy='${radius/2}' r='${radius/2 - 1}' fill='rgba(255,255,255,0.6)' stroke='rgba(124,58,237,0.9)' stroke-width='2'/>
    </svg>`;
    return `url("data:image/svg+xml;utf8,${encodeURIComponent(svg)}") ${Math.floor(radius/2)} ${Math.floor(radius/2)}, auto`;
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    if (tool === 'eraser') {
      canvas.style.cursor = buildEraserCursor(brushSize + 8);
    } else {
      canvas.style.cursor = 'crosshair';
    }
  }, [tool, brushSize]);

  const Content = (
    <>
      {!embedded && (
        <button className="template-btn" onClick={() => navigate('/relax')}>
          ← Back
        </button>
      )}
      <h2>Flow Mode 🎨</h2>
      <p className="relax-greeting">Express yourself through colors and strokes of emotion.</p>

        <div className="flow-section" style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          flexWrap: 'wrap',
          justifyContent: 'space-between',
          padding: '10px 12px',
          background: 'rgba(44,0,80,0.06)',
          borderRadius: '12px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.95rem' }}>
              🎨 Color:
              <input
                type="color"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                style={{
                  marginLeft: 6,
                  width: 28,
                  height: 28,
                  border: 'none',
                  background: 'none',
                  cursor: 'pointer',
                }}
              />
            </label>

            <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.95rem' }}>
              ✏️ Brush Size:
              <input
                type="range"
                min="1"
                max="50"
                value={brushSize}
                onChange={(e) => setBrushSize(Number(e.target.value))}
                style={{ marginLeft: 6, width: 160 }}
              />
              <span style={{ minWidth: 32 }}>{brushSize}px</span>
            </label>

            <div className="tool-buttons" style={{ display: 'flex', gap: 8 }}>
              <button
                className={tool === 'pen' ? 'active' : ''}
                onClick={() => setTool('pen')}
                style={{
                  background: tool === 'pen' ? '#db2777' : 'rgba(124,58,237,0.10)',
                  color: tool === 'pen' ? '#fff' : '#7c3aed',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '6px 12px',
                  fontWeight: 500,
                  cursor: 'pointer',
                  transition: 'background 0.2s',
                  fontSize: '0.9rem',
                }}
              >
                ✏️ Pen
              </button>
              <button
                className={tool === 'brush' ? 'active' : ''}
                onClick={() => setTool('brush')}
                style={{
                  background: tool === 'brush' ? '#db2777' : 'rgba(124,58,237,0.10)',
                  color: tool === 'brush' ? '#fff' : '#7c3aed',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '6px 12px',
                  fontWeight: 500,
                  cursor: 'pointer',
                  transition: 'background 0.2s',
                  fontSize: '0.9rem',
                }}
              >
                🖌️ Brush
              </button>
              <button
                className={tool === 'eraser' ? 'active' : ''}
                onClick={() => setTool('eraser')}
                style={{
                  background: tool === 'eraser' ? '#db2777' : 'rgba(124,58,237,0.10)',
                  color: tool === 'eraser' ? '#fff' : '#7c3aed',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '6px 12px',
                  fontWeight: 500,
                  cursor: 'pointer',
                  transition: 'background 0.2s',
                  fontSize: '0.9rem',
                }}
              >
                🧽 Eraser
              </button>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <button
              onClick={clearCanvas}
              style={{
                background: 'rgba(124,58,237,0.10)',
                color: '#7c3aed',
                border: 'none',
                borderRadius: '8px',
                padding: '6px 12px',
                fontWeight: 500,
                cursor: 'pointer',
                transition: 'background 0.2s',
                fontSize: '0.9rem'
              }}
            >
              🧽 Clear
            </button>
            <button
              onClick={savePainting}
              style={{
                background: 'linear-gradient(90deg, #db2777 0%, #7c3aed 100%)',
                color: '#fff',
                border: 'none',
                borderRadius: '8px',
                padding: '6px 16px',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'background 0.2s',
                fontSize: '0.95rem'
              }}
            >
              💾 Save
            </button>
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '32px' }}>
          <canvas
            ref={canvasRef}
            className="paint-canvas"
            style={{
              background: '#fff',
              borderRadius: '18px',
              boxShadow: '0 2px 16px 0 rgba(44,0,80,0.10)',
              border: '2px solid #e0c3fc',
              maxWidth: '100%',
              margin: '0 auto',
              display: 'block',
            }}
            onMouseDown={startDrawing}
            onMouseMove={draw}
            onMouseUp={stopDrawing}
            onMouseLeave={stopDrawing}
          ></canvas>
        </div>

        <h3 style={{ fontWeight: 600, fontSize: '1.2rem', marginBottom: 12 }}>
          🕒 Saved Paintings
        </h3>
        <div
          className="saved-paintings"
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '18px',
            marginBottom: '8px',
          }}
        >
          {savedPaintings.length === 0 ? (
            <p style={{ color: '#e0c3fc' }}>No saved paintings yet.</p>
          ) : (
            savedPaintings.map((p, i) => (
              <div
                key={i}
                className="saved-painting"
                style={{
                  background: 'rgba(44,0,80,0.10)',
                  borderRadius: '12px',
                  padding: '10px',
                  boxShadow: '0 2px 8px 0 rgba(44,0,80,0.08)',
                  maxWidth: '180px',
                  textAlign: 'center',
                }}
              >
                <p style={{ fontSize: '0.9em', color: '#7c3aed', marginBottom: 6 }}>
                  {p.date}
                </p>
                <img
                  src={p.imageData}
                  alt={`Painting ${i + 1}`}
                  style={{
                    width: '100%',
                    borderRadius: '8px',
                    background: '#fff',
                    border: '1px solid #e0c3fc',
                    cursor: 'zoom-in',
                    transition: 'transform 0.15s ease',
                  }}
                  onClick={() => { setLightboxIndex(i); setLightboxOpen(true); }}
                  onMouseOver={(e) => (e.currentTarget.style.transform = 'scale(1.02)')}
                  onMouseOut={(e) => (e.currentTarget.style.transform = 'none')}
                />
              </div>
            ))
          )}
        </div>
        {lightboxOpen && lightboxIndex !== null && (
          <div
            onClick={() => setLightboxOpen(false)}
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(0,0,0,0.7)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 1000,
              padding: '20px',
            }}
            role="dialog"
            aria-modal="true"
          >
            <div
              onClick={(e) => e.stopPropagation()}
              style={{
                maxWidth: '90vw',
                maxHeight: '85vh',
                borderRadius: '12px',
                overflow: 'hidden',
                boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
                background: '#fff',
                position: 'relative'
              }}
            >
              <button
                onClick={() => setLightboxOpen(false)}
                aria-label="Close"
                style={{
                  position: 'absolute',
                  top: 8,
                  right: 8,
                  width: 36,
                  height: 36,
                  borderRadius: '50%',
                  border: 'none',
                  background: 'rgba(0,0,0,0.4)',
                  color: '#fff',
                  fontSize: 20,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: 0,
                  lineHeight: 1
                }}
              >
                ×
              </button>

              <img
                src={savedPaintings[lightboxIndex]?.imageData}
                alt="Painting preview"
                style={{ display: 'block', maxWidth: '90vw', maxHeight: '85vh' }}
              />

              {/* Nav arrows */}
              <button
                onClick={() => setLightboxIndex((i) => (i - 1 + savedPaintings.length) % savedPaintings.length)}
                aria-label="Previous"
                style={{
                  position: 'absolute',
                  top: '50%',
                  left: 8,
                  transform: 'translateY(-50%)',
                  width: 40,
                  height: 40,
                  borderRadius: '50%',
                  border: 'none',
                  background: 'rgba(0,0,0,0.4)',
                  color: '#fff',
                  fontSize: 22,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: 0,
                  lineHeight: 1
                }}
              >
                ‹
              </button>
              <button
                onClick={() => setLightboxIndex((i) => (i + 1) % savedPaintings.length)}
                aria-label="Next"
                style={{
                  position: 'absolute',
                  top: '50%',
                  right: 8,
                  transform: 'translateY(-50%)',
                  width: 40,
                  height: 40,
                  borderRadius: '50%',
                  border: 'none',
                  background: 'rgba(0,0,0,0.4)',
                  color: '#fff',
                  fontSize: 22,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: 0,
                  lineHeight: 1
                }}
              >
                ›
              </button>
            </div>
          </div>
        )}
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

export default FlowMode;

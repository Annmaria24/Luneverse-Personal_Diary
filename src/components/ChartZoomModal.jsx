import React from 'react';
import LineBarTimeline from './charts/LineBarTimeline';
import '../pages/Styles/ChartZoomModal.css';

const ChartZoomModal = ({ type, data, onClose, formatSymptomName }) => {
  const scrollRef = React.useRef(null);
  if (!type) return null;

  const scrollCharts = (dir) => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: dir * 150, behavior: 'smooth' });
    }
  };

  const renderCycleDetail = () => {
    return (
      <div className="zoom-content cycle-detail-new">
        <div className="zoom-chart-layout">
          <button className="nav-side-btn prev" onClick={() => scrollCharts(-1)}>‹</button>
          <div className="zoom-chart-outer-container-new" ref={scrollRef}>
            <LineBarTimeline data={data} height={300} />
          </div>
          <button className="nav-side-btn next" onClick={() => scrollCharts(1)}>›</button>
        </div>
        <div className="zoom-legend">
          <div className="legend-item"><span className="legend-p-bar"></span> Cycle Length (Days)</div>
          <div className="legend-item"><span className="legend-p-dot"></span> Flow Intensity</div>
        </div>
      </div>
    );
  };

  const renderSymptomDetail = () => {
    const max = Math.max(1, ...data.map(i => i.count || 1));
    return (
      <div className="zoom-content symptom-detail-new">
        <div className="zoom-chart-layout">
          <button className="nav-side-btn prev" onClick={() => scrollCharts(-1)}>‹</button>
          <div className="zoom-chart-outer-container-new" ref={scrollRef}>
            <div style={{ width: Math.max(500, data.length * 80) }}>
              <svg viewBox={`0 0 ${Math.max(500, data.length * 80)} 250`} style={{ width: '100%', height: 250 }} preserveAspectRatio="xMidYMid meet">
                <line x1="20" y1={210} x2={Math.max(500, data.length * 80) - 20} y2={210} stroke="#e2e8f0" strokeWidth="2" />
                {data.map((i, idx) => {
                  const barWidth = 50;
                  const gap = 30;
                  const x = 40 + idx * (barWidth + gap);
                  const h = ((i.count || 1) / max) * 150 + 20;
                  const y = 210 - h;
                  return (
                    <g key={idx}>
                      <rect x={x} y={y} width={barWidth} height={h} rx="10" fill="url(#symptomGradient)" opacity="0.9" />
                      <text x={x + barWidth / 2} y={230} textAnchor="middle" fontSize="12" fill="#475569" fontWeight="bold">
                        {formatSymptomName(i.symptom)}
                      </text>
                      <text x={x + barWidth / 2} y={y - 12} textAnchor="middle" fontSize="14" fill="#7c3aed" fontWeight="800">
                        {i.count}
                      </text>
                    </g>
                  );
                })}
                <defs>
                  <linearGradient id="symptomGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#8b5cf6" />
                    <stop offset="100%" stopColor="#c084fc" />
                  </linearGradient>
                </defs>
              </svg>
            </div>
          </div>
          <button className="nav-side-btn next" onClick={() => scrollCharts(1)}>›</button>
        </div>
        <p className="zoom-subtitle">Showing symptom frequency from your tracking history.</p>
      </div>
    );
  };

  return (
    <div className="chart-zoom-overlay" onClick={onClose}>
      <div className="chart-zoom-modal" onClick={e => e.stopPropagation()}>
        <div className="zoom-header">
          <h3>{type === 'cycle' ? 'Cycle History Analytics' : 'Symptom Insights'}</h3>
          <button className="zoom-close" onClick={onClose}>×</button>
        </div>
        <div className="zoom-body">
          {type === 'cycle' ? renderCycleDetail() : renderSymptomDetail()}
        </div>
        <div className="zoom-footer">
          <p>This data is based on your last 6 tracked months.</p>
        </div>
      </div>
    </div>
  );
};

export default ChartZoomModal;

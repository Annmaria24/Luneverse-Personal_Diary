import React from 'react';

// data: [{ label: '2025-05', cycleLength: 30, periodLength: 5, flowAvg: 2 }]
const LineBarTimeline = ({ data = [], height = 160 }) => {
  const barWidth = 40;
  const gap = 12;
  const paddingX = 20;
  const totalWidth = Math.max(320, data.length * (barWidth + gap) + paddingX * 2);
  const maxCycle = Math.max(28, ...data.map(d => d.cycleLength || 0));
  const flowMax = 3; // 1..3

  return (
    <div className="chart-scroll-wrapper" style={{ overflowX: 'auto', width: '100%', paddingBottom: '10px' }}>
      <svg viewBox={`0 0 ${totalWidth} ${height}`} style={{ width: totalWidth, height, display: 'block' }}>
        {/* axes baseline */}
        <line x1="10" y1={height - 20} x2={totalWidth - 10} y2={height - 20} stroke="#e5e7eb" strokeWidth="2" />
        {data.map((d, idx) => {
          const x = paddingX + idx * (barWidth + gap);
          const barH = Math.max(6, Math.round(((d.cycleLength || 0) / maxCycle) * (height - 40)));
          const barY = height - 20 - barH;
          const flowY = height - 20 - ((d.flowAvg || 0) / (flowMax * 1.2)) * (height - 50) - 5;
          return (
            <g key={idx}>
              <rect x={x} y={barY} width={barWidth} height={barH} rx="6" fill="#8b5cf6" opacity="0.85" />
              <circle cx={x + barWidth / 2} cy={flowY} r="4" fill="#ec4899" stroke="white" strokeWidth="2" />
              <text x={x + barWidth / 2} y={height - 6} textAnchor="middle" fontSize="11" fill="#475569" fontWeight="500">{d.label}</text>
            </g>
          );
        })}
      </svg>
    </div>
  );
};

export default LineBarTimeline;








































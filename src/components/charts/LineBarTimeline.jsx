import React from 'react';

// data: [{ label: '2025-05', cycleLength: 30, periodLength: 5, flowAvg: 2 }]
const LineBarTimeline = ({ data = [], height = 160 }) => {
  const width = 320;
  const maxCycle = Math.max(28, ...data.map(d => d.cycleLength || 0));
  const barWidth = data.length > 0 ? Math.floor((width - 20) / data.length) - 6 : 20;
  const flowMax = 3; // 1..3

  return (
    <svg viewBox={`0 0 ${width} ${height}`} style={{ width: '100%', height }} preserveAspectRatio="none">
      {/* axes baseline */}
      <line x1="10" y1={height - 20} x2={width - 10} y2={height - 20} stroke="#e5e7eb" />
      {data.map((d, idx) => {
        const x = 10 + idx * (barWidth + 6);
        const barH = Math.max(4, Math.round(((d.cycleLength || 0) / maxCycle) * (height - 40)));
        const barY = height - 20 - barH;
        const flowY = height - 20 - ((d.flowAvg || 0) / flowMax) * (height - 40);
        return (
          <g key={idx}>
            <rect x={x} y={barY} width={barWidth} height={barH} rx="6" fill="#8b5cf6" opacity="0.85" />
            <circle cx={x + barWidth / 2} cy={flowY} r="3" fill="#ec4899" />
            <text x={x + barWidth / 2} y={height - 6} textAnchor="middle" fontSize="10" fill="#475569">{d.label}</text>
          </g>
        );
      })}
    </svg>
  );
};

export default LineBarTimeline;
















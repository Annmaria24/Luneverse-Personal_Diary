import React from 'react';

const ProgressDonut = ({ valuePct = 0, size = 160, label }) => {
  const stroke = 12;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const dash = Math.max(0, Math.min(100, valuePct)) / 100 * c;
  const rest = c - dash;

  return (
    <svg width="100%" height={size} viewBox={`0 0 ${size} ${size}`}>
      <g transform={`rotate(-90 ${size/2} ${size/2})`}>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="#e5e7eb" strokeWidth={stroke} />
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="#8b5cf6" strokeWidth={stroke} strokeLinecap="round" strokeDasharray={`${dash} ${rest}`} />
      </g>
      <text x="50%" y="50%" dominantBaseline="middle" textAnchor="middle" fontSize="18" fill="#374151">{Math.round(valuePct)}%</text>
      {label && <text x="50%" y="66%" dominantBaseline="middle" textAnchor="middle" fontSize="12" fill="#64748b">{label}</text>}
    </svg>
  );
};

export default ProgressDonut;







































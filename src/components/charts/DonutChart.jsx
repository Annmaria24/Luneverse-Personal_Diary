import React from 'react';

// data: [{ label, value, color }]
const DonutChart = ({ data = [], innerRadiusPct = 60, size = 180, centerLabel }) => {
  const total = data.reduce((s, d) => s + d.value, 0) || 1;
  const cx = size / 2, cy = size / 2, r = (size / 2) - 8;
  const innerR = (innerRadiusPct / 100) * r;
  let startAngle = -90;

  const toXY = (angleDeg, radius) => {
    const rad = (Math.PI / 180) * angleDeg;
    return [cx + radius * Math.cos(rad), cy + radius * Math.sin(rad)];
  };

  return (
    <svg width="100%" height={size} viewBox={`0 0 ${size} ${size}`}>
      {/* background ring */}
      <circle cx={cx} cy={cy} r={r} fill="#fff" stroke="#e5e7eb" strokeWidth="2" />
      {data.map((slice, idx) => {
        const sweep = (slice.value / total) * 360;
        const endAngle = startAngle + sweep;
        const [x1, y1] = toXY(startAngle, r);
        const [x2, y2] = toXY(endAngle, r);
        const largeArc = sweep > 180 ? 1 : 0;
        const path = `M ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2} L ${cx} ${cy} Z`;
        startAngle = endAngle;
        return <path key={idx} d={path} fill={slice.color || '#8b5cf6'} opacity="0.9" />;
      })}
      {/* inner cutout */}
      <circle cx={cx} cy={cy} r={innerR} fill="#fff" />
      <text x={cx} y={cy} dominantBaseline="middle" textAnchor="middle" fontSize="14" fill="#374151">
        {centerLabel || `${total}`}
      </text>
    </svg>
  );
};

export default DonutChart;
















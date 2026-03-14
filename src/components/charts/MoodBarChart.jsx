import React from 'react';

const MOOD_ORDER = ['Happy', 'Sad', 'Angry', 'Stressed', 'Calm', 'Neutral'];
const DEFAULT_COLORS = {
  Happy: '#10b981',
  Sad: '#3b82f6',
  Angry: '#ef4444',
  Stressed: '#f97316',
  Calm: '#06b6d4',
  Neutral: '#6b7280'
};

/**
 * Simple aggregated bar chart for mood distribution
 * X-axis: mood categories, Y-axis: count of entries
 */
const MoodBarChart = ({ moodCounts = {}, size = 220, barColors = {} }) => {
  const colors = { ...DEFAULT_COLORS, ...barColors };
  const maxCount = Math.max(...MOOD_ORDER.map(m => moodCounts[m] || 0), 1);
  const padding = { top: 10, right: 10, bottom: 30, left: 32 };
  const chartWidth = size - padding.left - padding.right;
  const chartHeight = size - padding.top - padding.bottom;
  const barGap = 4;
  const barCount = MOOD_ORDER.length;
  const barWidth = (chartWidth - barGap * (barCount - 1)) / barCount;

  return (
    <svg width="100%" height={size} viewBox={`0 0 ${size} ${size}`}>
      {/* Bars */}
      {MOOD_ORDER.map((mood, idx) => {
        const count = moodCounts[mood] || 0;
        const barHeight = maxCount > 0 ? (count / maxCount) * chartHeight : 0;
        const x = padding.left + idx * (barWidth + barGap);
        const y = padding.top + chartHeight - barHeight;

        return (
          <g key={mood}>
            <rect
              x={x}
              y={y}
              width={barWidth}
              height={Math.max(barHeight, 0)}
              fill={colors[mood] || '#6b7280'}
              rx="3"
              opacity="0.9"
            />
            <text
              x={x + barWidth / 2}
              y={padding.top + chartHeight + 14}
              textAnchor="middle"
              fontSize="10"
              fill="#64748b"
            >
              {mood}
            </text>
            {count > 0 && (
              <text
                x={x + barWidth / 2}
                y={y - 4}
                textAnchor="middle"
                fontSize="11"
                fontWeight="600"
                fill="#374151"
              >
                {count}
              </text>
            )}
          </g>
        );
      })}
      {/* Y-axis label */}
      <text x={8} y={padding.top + chartHeight / 2} textAnchor="middle" fontSize="9" fill="#94a3b8" transform={`rotate(-90, 8, ${padding.top + chartHeight / 2})`}>
        Count
      </text>
    </svg>
  );
};

export default MoodBarChart;

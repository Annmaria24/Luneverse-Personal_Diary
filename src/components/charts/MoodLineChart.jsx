import React, { useId } from 'react';

// Emotional scale: 0-5 (Sad to Happy)
const Y_MIN = 0;
const Y_MAX = 5;
const Y_LABELS = ['Sad', 'Angry', 'Stressed', 'Neutral', 'Calm', 'Happy'];

/**
 * Time-series line chart for emotional trends
 * X-axis: dates or weeks. Y-axis: emotional score 0-5.
 */
const MoodLineChart = ({ dataPoints = [], size = 260, showYLabels = true, showXLabels = true }) => {
  const gradientId = useId().replace(/:/g, '-');
  const areaGradientId = `area-${gradientId}`;

  if (dataPoints.length === 0) {
    return (
      <div className="mood-line-chart-empty">
        <p>No emotional data for this period</p>
      </div>
    );
  }

  const padding = { top: 20, right: 20, bottom: showXLabels ? 40 : 10, left: showYLabels ? 50 : 10 };
  const chartWidth = size - padding.left - padding.right;
  const chartHeight = size - padding.top - padding.bottom;

  const yMin = Y_MIN;
  const yMax = Y_MAX;
  const yRange = yMax - yMin;

  const points = dataPoints.map((p, i) => ({
    ...p,
    x: padding.left + (dataPoints.length > 1 ? (i / (dataPoints.length - 1)) * chartWidth : chartWidth / 2),
    y: padding.top + chartHeight - ((p.y - yMin) / yRange) * chartHeight
  }));

  const pathD = points.length > 1
    ? `M ${points.map(p => `${p.x} ${p.y}`).join(' L ')}`
    : `M ${points[0].x} ${points[0].y} L ${points[0].x} ${points[0].y}`;

  // Area path for gradient fill under the line
  const areaD = points.length > 1
    ? `${pathD} L ${points[points.length - 1].x} ${padding.top + chartHeight} L ${points[0].x} ${padding.top + chartHeight} Z`
    : "";

  return (
    <svg width="100%" height={size} viewBox={`0 0 ${size} ${size}`} className="mood-line-chart" style={{ overflow: 'visible' }}>
      <defs>
        <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#8b5cf6" />
          <stop offset="100%" stopColor="#ec4899" />
        </linearGradient>
        <linearGradient id={areaGradientId} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#8b5cf6" stopOpacity="0.15" />
          <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0.0" />
        </linearGradient>
      </defs>

      {/* Y-axis grid lines */}
      {[0, 1, 2, 3, 4, 5].map((val, idx) => {
        const y = padding.top + chartHeight - ((val - yMin) / yRange) * chartHeight;
        return (
          <g key={val}>
            <line
              x1={padding.left}
              y1={y}
              x2={padding.left + chartWidth}
              y2={y}
              stroke="#f1f5f9"
              strokeWidth="0.5"
            />
            {showYLabels && (
              <text
                x={padding.left - 8}
                y={y + 3}
                textAnchor="end"
                fontSize="10"
                fontWeight="500"
                fill="#94a3b8"
              >
                {Y_LABELS[val]}
              </text>
            )}
          </g>
        );
      })}

      {/* Area fill under the line */}
      {areaD && (
        <path d={areaD} fill={`url(#${areaGradientId})`} />
      )}

      {/* Line path */}
      <path
        d={pathD}
        fill="none"
        stroke={`url(#${gradientId})`}
        strokeWidth="3.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Data points (only show for current day or small datasets for clarity) */}
      {points.length < 15 && points.map((p, i) => (
        <g key={i}>
          <circle
            cx={p.x}
            cy={p.y}
            r="4.5"
            fill="#fff"
            stroke={i === points.length - 1 ? "#ec4899" : "#8b5cf6"}
            strokeWidth="2.5"
            style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))' }}
          />
        </g>
      ))}

      {/* X-axis simplified labels (distributed across timeline) */}
      {showXLabels && points.length > 1 && (
        <g className="x-axis-labels">
          {(() => {
            const labelIndices = [];
            const count = points.length;
            
            if (count <= 4) {
              // Show all labels if few points
              for (let i = 0; i < count; i++) labelIndices.push(i);
            } else {
              // Show 4 evenly distributed labels
              labelIndices.push(0);
              labelIndices.push(Math.floor(count / 3));
              labelIndices.push(Math.floor((2 * count) / 3));
              labelIndices.push(count - 1);
            }

            return labelIndices.map(idx => {
              const p = points[idx];
              const dateStr = dataPoints[idx].x;
              // Format date string if it's YYYY-MM-DD to MM-DD
              let displayDate = dateStr;
              if (dateStr.length === 7 && dateStr.includes('-')) {
                const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
                displayDate = months[parseInt(dateStr.split('-')[1]) - 1] || dateStr;
              } else if (dateStr.length === 10 && dateStr.includes('-')) {
                displayDate = dateStr.slice(5);
              }

              return (
                <text
                  key={idx}
                  x={p.x}
                  y={padding.top + chartHeight + 20}
                  textAnchor={idx === 0 ? "start" : idx === count - 1 ? "end" : "middle"}
                  fontSize="10"
                  fontWeight="600"
                  fill="#64748b"
                >
                  {displayDate}
                </text>
              );
            });
          })()}
        </g>
      )}
    </svg>
  );
};

export default MoodLineChart;

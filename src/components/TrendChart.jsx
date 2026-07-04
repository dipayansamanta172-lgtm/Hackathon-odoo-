import React from 'react';
import styles from './TrendChart.module.css';

export const TrendChart = ({ data = [] }) => {
  // SVG Dimensions
  const width = 600;
  const height = 100;
  const padding = 20;

  if (!data || data.length < 2) {
    return (
      <div className={styles.container}>
        <div className={styles.header}>
          <h3 className={styles.title}>Attendance Trends</h3>
          <span className={styles.sub}>Last 7 Days</span>
        </div>
        <div style={{ 
          height: '80px', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center', 
          color: 'var(--text-muted)', 
          fontWeight: 600,
          fontSize: '0.85rem'
        }}>
          No trend data available.
        </div>
      </div>
    );
  }

  // Map data to x, y coordinates
  const points = data.map((val, idx) => {
    const x = padding + (idx * (width - padding * 2)) / (data.length - 1);
    // Normalize val (0 to 60)
    const y = height - padding - (val / 60) * (height - padding * 2);
    return { x, y };
  });

  // Generate SVG path for a smooth cubic bezier curve
  const generateBezierPath = (pts) => {
    if (pts.length === 0) return '';
    let path = `M ${pts[0].x},${pts[0].y}`;
    for (let i = 0; i < pts.length - 1; i++) {
      const curr = pts[i];
      const next = pts[i + 1];
      // Control points
      const cp1x = curr.x + (next.x - curr.x) / 3;
      const cp1y = curr.y;
      const cp2x = curr.x + (2 * (next.x - curr.x)) / 3;
      const cp2y = next.y;
      path += ` C ${cp1x},${cp1y} ${cp2x},${cp2y} ${next.x},${next.y}`;
    }
    return path;
  };

  const linePath = generateBezierPath(points);
  const fillPath = `${linePath} L ${points[points.length - 1].x},${height} L ${points[0].x},${height} Z`;

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h3 className={styles.title}>Attendance Trends</h3>
        <span className={styles.sub}>Last 7 Days</span>
      </div>
      
      <div className={styles.chartWrapper}>
        <svg className={styles.svg} viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none">
          <defs>
            <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--primary-color)" stopOpacity="0.18" />
              <stop offset="100%" stopColor="var(--primary-color)" stopOpacity="0.00" />
            </linearGradient>
          </defs>
          
          {/* Horizontal Grid lines */}
          <line className={styles.gridLine} x1={padding} y1={height / 2} x2={width - padding} y2={height / 2} />
          <line className={styles.gridLine} x1={padding} y1={height - padding} x2={width - padding} y2={height - padding} />
          
          {/* Gradient Fill under line */}
          <path className={styles.gradient} d={fillPath} />
          
          {/* Main Stroke line */}
          <path className={styles.line} d={linePath} />
          
          {/* Vertices/Dots */}
          {points.map((pt, idx) => (
            <circle 
              key={idx} 
              className={styles.dot} 
              cx={pt.x} 
              cy={pt.y} 
              r={4.5} 
            />
          ))}
        </svg>
      </div>
    </div>
  );
};

export default TrendChart;

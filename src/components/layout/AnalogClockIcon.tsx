
"use client";

import React, { useState, useEffect } from 'react';

interface AnalogClockIconProps {
  time: Date;
  size?: number;
}

const AnalogClockIcon: React.FC<AnalogClockIconProps> = ({ time, size = 24 }) => {
  const [hourDeg, setHourDeg] = useState(0);
  const [minuteDeg, setMinuteDeg] = useState(0);
  const [secondDeg, setSecondDeg] = useState(0);

  useEffect(() => {
    const hours = time.getHours();
    const minutes = time.getMinutes();
    const seconds = time.getSeconds();

    setHourDeg((hours % 12) / 12 * 360 + minutes / 60 * 30 + 90); // +90 to offset initial rotation
    setMinuteDeg(minutes / 60 * 360 + seconds / 60 * 6 + 90);
    setSecondDeg(seconds / 60 * 360 + 90);
  }, [time]);

  const center = size / 2;
  const strokeWidth = Math.max(1, Math.floor(size / 12));
  const hourHandLength = center * 0.5;
  const minuteHandLength = center * 0.7;
  const secondHandLength = center * 0.8;

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="analog-clock-icon">
      {/* Clock face */}
      <circle cx={center} cy={center} r={center - strokeWidth / 2} fill="var(--card)" stroke="var(--foreground)" strokeWidth={strokeWidth / 2} />
      
      {/* Hour markers (optional, basic) */}
      {[0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330].map(angle => (
        <line
          key={`marker-${angle}`}
          x1={center}
          y1={strokeWidth * 1.5}
          x2={center}
          y2={strokeWidth * 2.5}
          stroke="var(--muted-foreground)"
          strokeWidth={strokeWidth / 2}
          transform={`rotate(${angle} ${center} ${center})`}
        />
      ))}

      {/* Hour Hand */}
      <line
        x1={center}
        y1={center}
        x2={center + hourHandLength}
        y2={center}
        stroke="var(--foreground)"
        strokeWidth={strokeWidth * 1.2}
        strokeLinecap="round"
        transform={`rotate(${hourDeg} ${center} ${center})`}
      />
      {/* Minute Hand */}
      <line
        x1={center}
        y1={center}
        x2={center + minuteHandLength}
        y2={center}
        stroke="var(--foreground)"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        transform={`rotate(${minuteDeg} ${center} ${center})`}
      />
      {/* Second Hand */}
      <line
        x1={center}
        y1={center}
        x2={center + secondHandLength}
        y2={center}
        stroke="var(--primary)" // Accent color for second hand
        strokeWidth={strokeWidth / 1.5}
        strokeLinecap="round"
        transform={`rotate(${secondDeg} ${center} ${center})`}
      />
      {/* Center dot */}
      <circle cx={center} cy={center} r={strokeWidth / 1.5} fill="var(--primary)" />
    </svg>
  );
};

export default AnalogClockIcon;

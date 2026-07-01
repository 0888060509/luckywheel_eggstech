import { motion } from "motion/react";
import React, { useEffect, useState } from "react";

interface Prize {
  id: number;
  name: string;
  label?: string;
  color: string;
}

interface WheelProps {
  prizes: Prize[];
  spinning: boolean;
  prizeId: number | null;
  onSpinEnd: () => void;
}

export default function Wheel({ prizes, spinning, prizeId, onSpinEnd }: WheelProps) {
  const [rotation, setRotation] = useState(0);

  useEffect(() => {
    if (spinning && prizeId !== null) {
      const prizeIndex = prizes.findIndex((p) => p.id === prizeId);
      if (prizeIndex === -1) return;

      const sliceAngle = 360 / prizes.length;
      // We want the center of the target slice to align with the top pointer (0 degrees)
      // The slice starts at prizeIndex * sliceAngle and ends at (prizeIndex + 1) * sliceAngle
      // Center of the slice is (prizeIndex + 0.5) * sliceAngle
      // To align this center with 0 degrees, we need to rotate backwards by that amount
      const targetAngle = 360 - ((prizeIndex + 0.5) * sliceAngle);
      
      const extraSpins = 360 * 5;
      
      // Calculate the difference from current rotation normalized to 360
      const currentMod = rotation % 360;
      let diff = targetAngle - currentMod;
      if (diff < 0) diff += 360;

      const newRotation = rotation + extraSpins + diff;
      setRotation(newRotation);
    }
  }, [spinning, prizeId, prizes]);

  if (!prizes || prizes.length === 0) return null;

  const getCoordinatesForPercent = (percent: number) => {
    const x = Math.cos(2 * Math.PI * percent);
    const y = Math.sin(2 * Math.PI * percent);
    return [x, y];
  };

  const slices = prizes.map((prize, index) => {
    const slicePercent = 1 / prizes.length;
    const startPercent = index * slicePercent;
    const endPercent = startPercent + slicePercent;
    
    // Rotate by -90deg (or -0.25 percent) so 0 angle is at the top
    const [startX, startY] = getCoordinatesForPercent(startPercent - 0.25);
    const [endX, endY] = getCoordinatesForPercent(endPercent - 0.25);
    
    // SVG arc path
    const largeArcFlag = slicePercent > 0.5 ? 1 : 0;
    const pathData = [
      `M 0 0`,
      `L ${startX} ${startY}`,
      `A 1 1 0 ${largeArcFlag} 1 ${endX} ${endY}`,
      `Z`,
    ].join(' ');

    // Calculate text position
    const textPercent = startPercent + slicePercent / 2;
    const [textX, textY] = getCoordinatesForPercent(textPercent - 0.25);

    return {
      prize,
      pathData,
      textX: textX * 0.65,
      textY: textY * 0.65,
      textAngle: textPercent * 360 - 90
    };
  });

  return (
    <div className="relative w-72 h-72 sm:w-96 sm:h-96 mx-auto drop-shadow-xl select-none">
      {/* Pointer */}
      <div className="absolute -top-4 left-1/2 -translate-x-1/2 z-10 w-8 h-10">
        <svg viewBox="0 0 100 100" fill="var(--color-tertiary)" className="w-full h-full drop-shadow-md">
          <path d="M50 100 L0 0 L100 0 Z" />
        </svg>
      </div>

      <motion.div
        className="w-full h-full rounded-full border-4 border-surface overflow-hidden relative shadow-inner"
        animate={{ rotate: rotation }}
        transition={{ duration: 5, ease: [0.1, 0.9, 0.2, 1], type: "tween" }}
        onAnimationComplete={() => {
          if (spinning) {
            onSpinEnd();
          }
        }}
      >
        <svg viewBox="-1 -1 2 2" className="w-full h-full transform -rotate-90">
           {/* We rotated the math by -90 already, but let's just keep the math simple and rotate the SVG group if needed. Actually we adjusted the math with -0.25. So no extra rotation needed on SVG container. */}
        </svg>
        <svg viewBox="-1 -1 2 2" className="w-full h-full absolute top-0 left-0">
          {slices.map((slice, i) => {
            const text = slice.prize.label || slice.prize.name;
            const words = text.split(' ');
            const lines = [];
            let currentLine = words[0] || '';
            for (let j = 1; j < words.length; j++) {
              if (currentLine.length + words[j].length + 1 <= 12) {
                currentLine += ' ' + words[j];
              } else {
                lines.push(currentLine);
                currentLine = words[j];
              }
            }
            lines.push(currentLine);
            const displayLines = lines.slice(0, 2);

            return (
            <g key={slice.prize.id}>
              <path d={slice.pathData} fill={slice.prize.color} />
              <text
                x={slice.textX}
                y={slice.textY}
                fill="white"
                fontSize={displayLines.length > 1 ? "0.09" : "0.11"}
                fontWeight="bold"
                textAnchor="middle"
                alignmentBaseline="middle"
                transform={`rotate(${slice.textAngle + 90}, ${slice.textX}, ${slice.textY})`}
                style={{ fontFamily: 'Nunito' }}
              >
                {displayLines.map((line, j) => (
                  <tspan 
                    key={j} 
                    x={slice.textX} 
                    dy={j === 0 ? (displayLines.length === 1 ? '0' : '-0.6em') : '1.2em'}
                  >
                    {line.length > 16 ? line.substring(0, 14) + '..' : line}
                  </tspan>
                ))}
              </text>
            </g>
          )})}
          {/* Center circle */}
          <circle cx="0" cy="0" r="0.15" fill="#FFF5FB" />
        </svg>
      </motion.div>
    </div>
  );
}

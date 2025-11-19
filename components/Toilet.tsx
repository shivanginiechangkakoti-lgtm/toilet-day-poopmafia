import React from 'react';
import { ColorType, ToiletTarget } from '../types';

interface ToiletProps {
  toilet: ToiletTarget;
}

const getColorStyles = (color: ColorType) => {
  switch (color) {
    case ColorType.BLUE: return { lid: 'fill-blue-400 stroke-blue-600', body: 'fill-white stroke-blue-800', glow: 'shadow-blue-400' };
    case ColorType.RED: return { lid: 'fill-red-400 stroke-red-600', body: 'fill-white stroke-red-800', glow: 'shadow-red-400' };
    case ColorType.GREEN: return { lid: 'fill-green-400 stroke-green-600', body: 'fill-white stroke-green-800', glow: 'shadow-green-400' };
  }
};

export const Toilet: React.FC<ToiletProps> = ({ toilet }) => {
  const styles = getColorStyles(toilet.color);
  const { width, height } = toilet.size;

  return (
    <div
      className={`absolute flex flex-col items-center justify-center transition-transform duration-200 ${toilet.isOpen ? 'scale-105' : 'scale-100'}`}
      style={{
        left: toilet.position.x,
        top: toilet.position.y,
        width: width,
        height: height,
        transform: 'translate(-50%, -50%)',
      }}
    >
      {/* Label */}
      <div className={`absolute -top-12 px-3 py-1 rounded-full text-white font-bold text-sm uppercase tracking-wider shadow-md ${styles.lid.split(' ')[0].replace('fill-', 'bg-')}`}>
        {toilet.color} Only
      </div>

      <svg width="100%" height="100%" viewBox="0 0 200 200" className="overflow-visible drop-shadow-xl">
        {/* Tank */}
        <rect x="50" y="20" width="100" height="60" rx="5" className={`${styles.body} stroke-2`} />
        
        {/* Flush Handle */}
        <rect x="130" y="30" width="15" height="5" rx="2" fill="#94a3b8" />

        {/* Bowl Base */}
        <path d="M 60 150 Q 60 190 100 190 Q 140 190 140 150 L 140 80 L 60 80 Z" className={`${styles.body} stroke-2`} />
        
        {/* Bowl Rim (Target Area) */}
        <ellipse cx="100" cy="80" rx="45" ry="15" className="fill-blue-200/50 stroke-slate-300 stroke-1" />

        {/* Lid - Animated */}
        <g className={`transition-all duration-300 origin-top ${toilet.isOpen ? '-rotate-90 opacity-80' : 'rotate-0'}`} style={{ transformOrigin: '100px 80px' }}>
           <ellipse cx="100" cy="80" rx="48" ry="18" className={`${styles.lid} stroke-2`} />
        </g>
        
        {/* Water swirl visual only visible when 'open' implies flushing potential */}
         {toilet.isOpen && (
           <path d="M 90 85 Q 100 95 110 85" fill="none" stroke="#3b82f6" strokeWidth="3" strokeLinecap="round" className="opacity-50" />
         )}
      </svg>
    </div>
  );
};

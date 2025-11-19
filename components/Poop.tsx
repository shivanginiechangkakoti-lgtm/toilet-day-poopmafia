import React from 'react';
import { ColorType, PoopItem } from '../types';

interface PoopProps {
  poop: PoopItem;
  onMouseDown: (id: string, e: React.MouseEvent | React.TouchEvent) => void;
}

export const Poop: React.FC<PoopProps> = ({ poop, onMouseDown }) => {
  if (poop.isFlushed) return null;

  const getTint = (color: ColorType) => {
    switch (color) {
      case ColorType.BLUE: return 'hue-rotate-[180deg] brightness-110'; // Brown -> Blueish
      case ColorType.RED: return 'hue-rotate-[320deg] brightness-90';  // Brown -> Reddish
      case ColorType.GREEN: return 'hue-rotate-[90deg] brightness-110'; // Brown -> Greenish
    }
  };

  // Calculate dynamic style for idle animation vs dragging
  const transformStyle = poop.isDragging 
    ? `translate(-50%, -50%) rotate(${poop.rotation}deg) scale(1.25)`
    : undefined; // Let CSS class handle idle float
    
  const animationClass = poop.isDragging ? '' : 'animate-[float_3s_ease-in-out_infinite]';

  return (
    <div
      onMouseDown={(e) => onMouseDown(poop.id, e)}
      onTouchStart={(e) => onMouseDown(poop.id, e)}
      className={`absolute cursor-grab active:cursor-grabbing select-none touch-none flex flex-col items-center justify-center
        ${poop.isDragging ? 'z-50 drop-shadow-2xl' : 'z-10 drop-shadow-md'}
        ${poop.shake ? 'animate-shake' : ''}
        ${animationClass}
        transition-transform duration-75
      `}
      style={{
        left: poop.position.x,
        top: poop.position.y,
        '--r': `${poop.rotation}deg`, // Custom property for the CSS animation
        transform: transformStyle,
      } as React.CSSProperties}
    >
      <div className="relative">
        {/* Emoji Filter wrapper */}
        <div className={`text-5xl md:text-6xl filter ${getTint(poop.color)}`}>
          💩
        </div>
        
        {/* Mafia Sunglasses */}
        <div className="absolute top-[18px] left-1/2 -translate-x-1/2 w-[80%] pointer-events-none opacity-90">
          <svg viewBox="0 0 100 30" className="drop-shadow-sm">
             <path d="M 5 5 L 45 5 L 45 25 C 45 25 30 30 5 20 Z" fill="black" />
             <path d="M 55 5 L 95 5 L 95 20 C 70 30 55 25 55 25 Z" fill="black" />
             <rect x="45" y="8" width="10" height="2" fill="black" />
          </svg>
          {/* Reflection */}
          <div className="absolute top-1 left-2 w-2 h-1 bg-white/30 -skew-x-12 rounded-sm"></div>
          <div className="absolute top-1 right-6 w-2 h-1 bg-white/30 -skew-x-12 rounded-sm"></div>
        </div>
      </div>
    </div>
  );
};
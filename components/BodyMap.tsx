
import React from 'react';
import { clsx } from 'clsx';

interface BodyMapProps {
  onPartClick: (part: string) => void;
  selectedParts: string[]; // Parts that have confirmed symptoms
}

const BodyMap: React.FC<BodyMapProps> = ({ onPartClick, selectedParts }) => {
  const getFill = (part: string) => selectedParts.includes(part) ? "#fb7185" : "#e2e8f0";
  const getHoverClass = "cursor-pointer hover:fill-indigo-200 transition-colors duration-200";

  return (
    <div className="relative w-full h-[400px] flex justify-center items-center">
      <svg viewBox="0 0 200 450" className="h-full w-auto drop-shadow-lg">
        <defs>
          <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="2" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {/* Head */}
        <g onClick={() => onPartClick('Head')} className={getHoverClass}>
           <circle cx="100" cy="50" r="35" fill={getFill('Head')} stroke="white" strokeWidth="2" />
           <text x="100" y="55" textAnchor="middle" fontSize="10" fill="#64748b" pointerEvents="none">Head</text>
        </g>

        {/* Neck */}
        <rect x="85" y="85" width="30" height="20" fill="#e2e8f0" />

        {/* Chest/Torso */}
        <g onClick={() => onPartClick('Chest')} className={getHoverClass}>
          <path d="M60,110 Q100,110 140,110 L140,200 Q100,200 60,200 Z" fill={getFill('Chest')} stroke="white" strokeWidth="2" />
          <text x="100" y="155" textAnchor="middle" fontSize="10" fill="#64748b" pointerEvents="none">Chest</text>
        </g>

        {/* Abdomen */}
        <g onClick={() => onPartClick('Abdomen')} className={getHoverClass}>
           <path d="M60,205 L140,205 L130,280 Q100,290 70,280 Z" fill={getFill('Abdomen')} stroke="white" strokeWidth="2" />
           <text x="100" y="245" textAnchor="middle" fontSize="10" fill="#64748b" pointerEvents="none">Abd</text>
        </g>

        {/* Left Arm (Viewer's Left) */}
        <g onClick={() => onPartClick('Limbs')} className={getHoverClass}>
          <rect x="25" y="110" width="30" height="140" rx="10" fill={getFill('Limbs')} stroke="white" strokeWidth="2" />
        </g>

        {/* Right Arm */}
        <g onClick={() => onPartClick('Limbs')} className={getHoverClass}>
          <rect x="145" y="110" width="30" height="140" rx="10" fill={getFill('Limbs')} stroke="white" strokeWidth="2" />
        </g>

        {/* Left Leg */}
        <g onClick={() => onPartClick('Limbs')} className={getHoverClass}>
          <rect x="70" y="285" width="25" height="150" rx="10" fill={getFill('Limbs')} stroke="white" strokeWidth="2" />
        </g>

        {/* Right Leg */}
        <g onClick={() => onPartClick('Limbs')} className={getHoverClass}>
           <rect x="105" y="285" width="25" height="150" rx="10" fill={getFill('Limbs')} stroke="white" strokeWidth="2" />
        </g>

      </svg>
      
      <div className="absolute bottom-4 right-4 bg-white/90 p-3 rounded-lg text-xs text-slate-500 shadow-sm border border-slate-100 backdrop-blur-sm max-w-[150px]">
        <p className="font-semibold text-indigo-600 mb-1">交互说明:</p>
        点击身体部位可记录详细症状并获取干预建议。
      </div>
    </div>
  );
};

export default BodyMap;

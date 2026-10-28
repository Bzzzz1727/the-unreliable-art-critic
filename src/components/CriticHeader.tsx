import React from 'react';
import { CriticStage } from '../types';
import { STAGE_CONFIG, getSubtleSystemAnomaly } from '../services/criticPersonality';

interface CriticHeaderProps {
  currentStage: CriticStage;
  anomalyTrigger?: number;
}

export const CriticHeader: React.FC<CriticHeaderProps> = ({ currentStage }) => {
  const stageInfo = STAGE_CONFIG[currentStage];
  const subtleAnomaly = getSubtleSystemAnomaly(currentStage);

  return (
    <div className="border border-[#292929] bg-[#030303] p-5 sm:p-7 space-y-4">
      {/* Top Monogram and System Coordinate */}
      <div className="flex items-center justify-between font-mono text-[11px] text-[#929292] border-b border-[#292929] pb-3">
        <div className="flex items-center gap-2">
          <span className="text-[#D71920] font-bold">[CRITIC // 01]</span>
          <span>EST. 1984</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-[#D71920] animate-pulse" />
          <span>CANONICAL REGISTRATION: VERIFIED</span>
        </div>
      </div>

      {/* Main Identity */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="font-serif text-3xl sm:text-4xl text-[#F5F5F5] font-bold tracking-tight">
              THE CRITIC
            </h3>
            <span className="cursor-blink" />
          </div>
          <p className="font-mono text-xs text-[#929292] tracking-wider uppercase mt-1">
            INDEPENDENT AUTHORITY ON EVERYTHING.
          </p>
        </div>

        {/* Dynamic Status Indicator */}
        <div className="border border-[#292929] px-3.5 py-2 bg-black font-mono text-xs space-y-0.5">
          <div className="text-[10px] text-[#929292] tracking-widest uppercase">
            PSYCHOMETRIC TENSION
          </div>
          <div className="text-[#D71920] font-bold flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 bg-[#D71920]" />
            <span>{stageInfo.statusLabel}</span>
          </div>
        </div>
      </div>

      {/* Stage Progression Level Bar (5 blocks) */}
      <div className="pt-2">
        <div className="flex items-center justify-between font-mono text-[10px] text-[#929292] mb-1.5">
          <span>EQUILIBRIUM MONITOR</span>
          <span>STAGE 0{currentStage} / 05 — {stageInfo.name}</span>
        </div>
        <div className="grid grid-cols-5 gap-1.5 h-1.5">
          {[1, 2, 3, 4, 5].map((lvl) => (
            <div
              key={lvl}
              className={`h-full transition-all duration-500 ${
                lvl <= currentStage
                  ? lvl >= 4
                    ? 'bg-[#D71920] animate-pulse'
                    : 'bg-[#D71920]'
                  : 'bg-[#181818]'
              }`}
            />
          ))}
        </div>
      </div>

      {/* Rare Subtle Anomaly Indicator */}
      {subtleAnomaly && (
        <div className="pt-2 font-mono text-[10px] text-[#D71920] border-t border-[#292929]/80 flex items-center gap-2 animate-pulse">
          <span>[SYSTEM ANOMALY]</span>
          <span className="text-[#929292]">{subtleAnomaly}</span>
        </div>
      )}
    </div>
  );
};

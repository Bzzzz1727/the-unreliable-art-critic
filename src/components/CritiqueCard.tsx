import React from 'react';
import { CritiqueData, CritiqueCategoryItem } from '../types';

interface CritiqueCardProps {
  critique: CritiqueData;
}

export const CritiqueCard: React.FC<CritiqueCardProps> = ({ critique }) => {
  const categories: CritiqueCategoryItem[] = [
    critique.firstImpression,
    critique.composition,
    critique.colourAndTexture,
    ...(critique.typography ? [critique.typography] : []),
    critique.concept
  ].filter(Boolean);

  return (
    <div className="space-y-6">
      {/* Editorial Section Header */}
      <div className="flex items-center justify-between border-b border-[#292929] pb-3 font-mono text-xs text-[#929292]">
        <span className="uppercase tracking-widest text-[#F5F5F5] font-bold">
          FORMAL CRITIQUE DOSSIER
        </span>
        <span className="text-[#D71920]">FILED AT {critique.generatedAt}</span>
      </div>

      {/* Structured Category Feedbacks */}
      <div className="space-y-6">
        {categories.map((cat, idx) => (
          <div
            key={cat.name}
            className="border border-[#292929] bg-black p-5 sm:p-6 transition-colors hover:border-[#404040]"
          >
            {/* Category title and score */}
            <div className="flex items-center justify-between border-b border-[#292929] pb-3 mb-4">
              <div className="flex items-center gap-3">
                <span className="font-mono text-xs text-[#929292]">0{idx + 1} //</span>
                <h4 className="font-mono text-sm sm:text-base font-bold text-[#F5F5F5] tracking-wider uppercase">
                  {cat.name}
                </h4>
              </div>

              {/* Score badge */}
              <div className="font-mono text-xs px-2.5 py-1 border border-[#292929] flex items-center gap-1.5 bg-[#080808]">
                <span className="text-[#929292]">RATING:</span>
                <span className="text-[#F5F5F5] font-bold">{cat.score}</span>
                <span className="text-[#929292]">/ 10</span>
              </div>
            </div>

            {/* Professional Criticism (Off-white) */}
            <div className="space-y-2">
              <div className="font-mono text-[10px] text-[#929292] uppercase tracking-wider">
                PROFESSIONAL ASSESSMENT
              </div>
              <p className="font-sans text-sm sm:text-base text-[#F5F5F5] leading-relaxed">
                {cat.professional}
              </p>
            </div>

            {/* Unreliable Commentary (Blood red, clearly labeled) */}
            {cat.unreliable && (
              <div className="mt-4 pt-4 border-t border-[#292929] space-y-1.5">
                <div className="font-mono text-[10px] text-[#D71920] uppercase tracking-widest font-bold flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 bg-[#D71920]" />
                  <span>UNRELIABLE OPINION</span>
                </div>
                <blockquote className="font-serif italic text-sm sm:text-base text-[#D71920] leading-relaxed pl-3 border-l-2 border-[#D71920]">
                  “{cat.unreliable}”
                </blockquote>
              </div>
            )}
          </div>
        ))}

        {/* 6. What Could Improve */}
        <div className="border border-[#292929] bg-black p-5 sm:p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-[#292929] pb-3">
            <div className="flex items-center gap-3">
              <span className="font-mono text-xs text-[#929292]">0{categories.length + 1} //</span>
              <h4 className="font-mono text-sm sm:text-base font-bold text-[#F5F5F5] tracking-wider uppercase">
                WHAT COULD IMPROVE
              </h4>
            </div>
            <span className="font-mono text-[11px] text-[#929292]">PRACTICAL CALIBRATION</span>
          </div>

          {/* Professional improvements */}
          <div className="space-y-2">
            <div className="font-mono text-[10px] text-[#929292] uppercase tracking-wider">
              FORMAL DIRECTIVES
            </div>
            <div className="font-sans text-sm sm:text-base text-[#F5F5F5] leading-relaxed whitespace-pre-line">
              {critique.whatCouldImprove.professional}
            </div>
          </div>

          {/* Unreliable demands */}
          {critique.whatCouldImprove.unreliable && (
            <div className="mt-4 pt-4 border-t border-[#292929] space-y-1.5">
              <div className="font-mono text-[10px] text-[#D71920] uppercase tracking-widest font-bold flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 bg-[#D71920]" />
                <span>UNRELIABLE OPINION</span>
              </div>
              <blockquote className="font-serif italic text-sm sm:text-base text-[#D71920] leading-relaxed pl-3 border-l-2 border-[#D71920]">
                “{critique.whatCouldImprove.unreliable}”
              </blockquote>
            </div>
          )}
        </div>

        {/* 7. The Verdict */}
        <div className="border-2 border-[#D71920] bg-[#070707] p-6 sm:p-8 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#292929] pb-4">
            <div>
              <span className="font-mono text-[11px] text-[#D71920] uppercase tracking-widest">
                OFFICIAL DECREE
              </span>
              <h4 className="font-serif text-2xl sm:text-3xl font-bold text-[#F5F5F5]">
                THE VERDICT
              </h4>
            </div>

            <div className="font-mono text-sm px-4 py-2 bg-black border border-[#D71920] flex items-center gap-2">
              <span className="text-[#929292]">OVERALL VERDICT:</span>
              <span className="text-xl font-bold text-[#F5F5F5]">
                {critique.verdict.overallScore}
              </span>
              <span className="text-[#929292]">/ 10</span>
            </div>
          </div>

          {/* Professional verdict */}
          <div className="space-y-2">
            <div className="font-mono text-[10px] text-[#929292] uppercase tracking-wider">
              INSTITUTIONAL FINDING
            </div>
            <p className="font-sans text-base sm:text-lg text-[#F5F5F5] leading-relaxed">
              {critique.verdict.professional}
            </p>
          </div>

          {/* Unreliable conclusion */}
          {critique.verdict.unreliable && (
            <div className="pt-4 border-t border-[#292929] space-y-1.5">
              <div className="font-mono text-[10px] text-[#D71920] uppercase tracking-widest font-bold flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 bg-[#D71920]" />
                <span>UNRELIABLE OPINION</span>
              </div>
              <blockquote className="font-serif italic text-base sm:text-lg text-[#D71920] leading-relaxed pl-3 border-l-2 border-[#D71920]">
                “{critique.verdict.unreliable}”
              </blockquote>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

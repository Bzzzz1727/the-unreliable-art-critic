import React from 'react';
import { ArrowDown } from 'lucide-react';

interface HeroSectionProps {
  onEnterGallery: () => void;
}

export const HeroSection: React.FC<HeroSectionProps> = ({ onEnterGallery }) => {
  return (
    <section className="relative min-h-[92vh] flex flex-col justify-between items-center px-4 sm:px-8 py-12 md:py-20 border-b border-[#292929]">
      {/* Top indicator tag */}
      <div className="w-full max-w-[1000px] flex items-center justify-between text-[#929292] font-mono text-xs tracking-widest uppercase">
        <span className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 bg-[#D71920]" />
          GALLERY ARCHIVE // VOL. 01
        </span>
        <span className="hidden sm:inline">SUBJECTIVITY INDEX: 99.4%</span>
      </div>

      {/* Main hero typography */}
      <div className="w-full max-w-[1000px] my-auto py-12">
        <div className="border-l-2 border-[#D71920] pl-6 md:pl-10 space-y-6">
          <h1 className="font-serif text-5xl sm:text-7xl md:text-8xl lg:text-9xl tracking-tight leading-[0.92] text-[#F5F5F5] font-bold">
            THE UNRELIABLE<br />
            <span className="italic font-normal">ART CRITIC.</span>
          </h1>

          <p className="font-mono text-sm sm:text-base md:text-lg text-[#929292] max-w-xl leading-relaxed pt-2">
            An art critique experience with questionable authority.
          </p>
        </div>

        {/* Small introduction quotation */}
        <div className="mt-12 md:mt-16 max-w-lg pl-6 md:pl-10">
          <blockquote className="font-serif text-lg sm:text-xl md:text-2xl text-[#F5F5F5] italic leading-snug border-l border-[#292929] pl-4">
            “Submit your work. Receive your verdict. Defend your decisions. Question mine.”
          </blockquote>

          {/* Enter gallery button */}
          <div className="mt-8 flex flex-wrap items-center gap-4">
            <button
              onClick={onEnterGallery}
              className="btn-primary group"
            >
              <span>[ ENTER THE GALLERY ]</span>
              <ArrowDown className="w-4 h-4 text-[#D71920] group-hover:text-white transition-transform group-hover:translate-y-0.5" />
            </button>

            <span className="font-mono text-xs text-[#929292]">
              Drag & drop • Direct analysis • 0 data retained
            </span>
          </div>
        </div>
      </div>

      {/* Footer-style exhibition banner */}
      <div className="w-full max-w-[1000px] pt-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 font-mono text-xs text-[#929292] border-t border-[#292929]">
        <div className="flex items-center gap-2">
          <span className="text-[#D71920]">●</span>
          <span>EXHIBITION 001 — AUTHORITY IS SUBJECTIVE</span>
        </div>
        <div className="text-[11px] text-[#929292]">
          DESIGN CRITIQUE SYSTEM // INSTITUTIONAL MONOCHROME
        </div>
      </div>
    </section>
  );
};

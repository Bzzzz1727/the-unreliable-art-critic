import React from 'react';
import { X, BookOpen } from 'lucide-react';

interface AboutModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AboutModal: React.FC<AboutModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="relative w-full max-w-2xl bg-black border border-[#292929] p-6 sm:p-8 space-y-6 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#292929] pb-4">
          <div className="flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-[#D71920]" />
            <h3 className="font-mono text-sm font-bold uppercase tracking-wider text-[#F5F5F5]">
              CURATORIAL STATEMENT // ABOUT
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-[#929292] hover:text-[#F5F5F5] transition-colors p-1"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="space-y-4 font-sans text-xs sm:text-sm text-[#929292] leading-relaxed">
          <p className="text-[#F5F5F5] font-serif text-lg sm:text-xl italic">
            “THE UNRELIABLE ART CRITIC is an interactive art critique experiment exploring the fragile boundary between aesthetic authority, institutional pretension, and creative autonomy.”
          </p>

          <p>
            The experience was built to challenge the clinical, obedient nature of modern conversational AI interfaces. Rather than offering polite, lukewarm flatteries, the critic behaves like a seasoned gallery director who has examined perhaps twelve thousand too many posters.
          </p>

          <div className="border-l-2 border-[#D71920] pl-4 space-y-2 py-1 text-[#F5F5F5]">
            <strong className="font-mono text-xs text-[#D71920] block uppercase">
              THE TWO MODES OF SPEECH:
            </strong>
            <p className="text-xs">
              <span className="text-[#F5F5F5] font-bold">1. Professional Criticism (Off-White):</span> Honest, constructive, and actionable graphic design feedback analyzing composition, tonal contrast, color hierarchy, and visual balance.
            </p>
            <p className="text-xs">
              <span className="text-[#D71920] font-bold">2. Unreliable Commentary (Blood Red):</span> Increasingly eccentric, metaphysical theories, absurd metaphors, and paranoid suspicions that intensify as you interrogate the critic.
            </p>
          </div>

          <p>
            Inspired by Swiss graphic design catalogues, independent brutalist art publishing, and the psychological horror of absolute institutional restraint.
          </p>
        </div>

        {/* Footer */}
        <div className="border-t border-[#292929] pt-4 flex items-center justify-between font-mono text-xs text-[#929292]">
          <span>EXHIBITION 001</span>
          <button
            onClick={onClose}
            className="btn-primary py-1.5 px-4 text-xs"
          >
            [ CLOSE STATEMENT ]
          </button>
        </div>
      </div>
    </div>
  );
};

import React from 'react';
import { X, ShieldAlert } from 'lucide-react';

interface RulesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const RulesModal: React.FC<RulesModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const rules = [
    {
      num: '01',
      title: 'AUTHORITY IS AN OPTICAL ILLUSION',
      desc: 'All judgements rendered in this gallery are purely subjective, including the judgements claiming to be objective.'
    },
    {
      num: '02',
      title: 'UNRELIABILITY ESCALATES UNDER INTERROGATION',
      desc: 'Challenging the critic forces him to defend his theoretical framework, accelerating his progression toward complete breakdown.'
    },
    {
      num: '03',
      title: 'THE CRITIC NEVER APOLOGIZES',
      desc: 'If a contradiction is exposed, the critic will not retract. He will simply re-contextualize the universe until he is correct.'
    },
    {
      num: '04',
      title: 'BLOOD RED BELONGS TO THE UNCONSCIOUS',
      desc: 'Text rendered in #F5F5F5 represents institutional design analysis. Text rendered in #D71920 represents metaphysical delusions.'
    },
    {
      num: '05',
      title: 'THE GEOMETRY OWES YOU NOTHING',
      desc: 'An artwork uploaded to this platform is surrendered to public examination. Defend it with formal rigor, or surrender the frame.'
    }
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="relative w-full max-w-2xl bg-black border border-[#292929] p-6 sm:p-8 space-y-6 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#292929] pb-4">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-[#D71920]" />
            <h3 className="font-mono text-sm font-bold uppercase tracking-wider text-[#F5F5F5]">
              GALLERY CANON // THE RULES
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-[#929292] hover:text-[#F5F5F5] transition-colors p-1"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Rules List */}
        <div className="space-y-4">
          {rules.map((rule) => (
            <div
              key={rule.num}
              className="border-l-2 border-[#292929] hover:border-[#D71920] pl-4 py-1 transition-colors space-y-1"
            >
              <div className="flex items-center gap-2 font-mono text-xs">
                <span className="text-[#D71920] font-bold">RULE {rule.num}</span>
                <span className="text-[#F5F5F5] font-bold">— {rule.title}</span>
              </div>
              <p className="font-sans text-xs sm:text-sm text-[#929292] leading-relaxed">
                {rule.desc}
              </p>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="border-t border-[#292929] pt-4 flex items-center justify-between font-mono text-xs text-[#929292]">
          <span>RATIFIED BY THE CURATORIAL COUNCIL</span>
          <button
            onClick={onClose}
            className="btn-primary py-1.5 px-4 text-xs"
          >
            [ I ACCEPT THE RULES ]
          </button>
        </div>
      </div>
    </div>
  );
};

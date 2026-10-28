import React from 'react';
import { AlertTriangle, X } from 'lucide-react';
import { playClick } from '../utils/soundEffects';

interface ResetConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export const ResetConfirmModal: React.FC<ResetConfirmModalProps> = ({
  isOpen,
  onClose,
  onConfirm
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs select-none">
      <div className="w-full max-w-sm bg-white border-2 border-[#222222] rounded-2xl p-5 shadow-sticker-lg anim-pop-in space-y-4">
        <div className="flex items-center justify-between border-b-2 border-[#222222] pb-2 font-mono text-xs">
          <div className="flex items-center gap-1.5 font-bold text-[#D71920]">
            <AlertTriangle className="w-4 h-4" />
            <span>RESET EXHIBITION SESSION?</span>
          </div>
          <button onClick={() => { playClick(); onClose(); }} className="text-[#737373] hover:text-[#171717]">
            <X className="w-4 h-4" />
          </button>
        </div>

        <p className="font-sans text-xs text-[#737373] leading-relaxed">
          This will purge the current artwork, critique dossier, and reset the critic back to <strong className="text-[#171717]">STAGE 01 (COMPOSED)</strong>.
        </p>

        <div className="border-t border-[#E8E6DF] pt-3 flex items-center justify-end gap-2 font-mono text-xs">
          <button
            onClick={() => { playClick(); onClose(); }}
            className="sticker-btn text-xs py-1 px-3"
          >
            CANCEL
          </button>
          <button
            onClick={() => {
              playClick();
              onConfirm();
              onClose();
            }}
            className="sticker-btn-accent text-xs py-1 px-3"
          >
            [ PURGE & RESET ]
          </button>
        </div>
      </div>
    </div>
  );
};

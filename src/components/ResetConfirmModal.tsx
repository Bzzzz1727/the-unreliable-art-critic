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
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-xs select-none"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          playClick();
          onClose();
        }
      }}
    >
      <div
        className="w-full max-w-sm border-t-2 sm:border-2 rounded-t-2xl sm:rounded-2xl p-5 shadow-sticker-lg anim-pop-in space-y-4"
        style={{
          backgroundColor: 'var(--panel)',
          borderColor: 'var(--border)',
          paddingBottom: 'max(1.25rem, env(safe-area-inset-bottom))'
        }}
      >
        <div className="w-10 h-1 rounded-full bg-border/80 mx-auto -mt-2 sm:hidden shrink-0" />

        <div
          className="flex items-center justify-between border-b pb-2 font-mono text-xs"
          style={{ borderColor: 'var(--border)' }}
        >
          <div className="flex items-center gap-1.5 font-bold text-accent">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>RESET EXHIBITION SESSION?</span>
          </div>
          <button
            onClick={() => { playClick(); onClose(); }}
            className="text-muted hover:text-text p-1 min-h-[32px] min-w-[32px] flex items-center justify-center"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <p className="font-sans text-xs text-muted leading-relaxed">
          This will purge the current artwork, critique dossier, and reset the critic back to <strong className="text-text">STAGE 01 (COMPOSED)</strong>.
        </p>

        <div
          className="border-t pt-3 flex items-center justify-end gap-2 font-mono text-xs"
          style={{ borderColor: 'var(--border)' }}
        >
          <button
            onClick={() => { playClick(); onClose(); }}
            className="sticker-btn text-xs py-2 px-3.5 min-h-[40px]"
          >
            CANCEL
          </button>
          <button
            onClick={() => {
              playClick();
              onConfirm();
              onClose();
            }}
            className="sticker-btn-accent text-xs py-2 px-3.5 min-h-[40px]"
          >
            [ PURGE & RESET ]
          </button>
        </div>
      </div>
    </div>
  );
};
export default ResetConfirmModal;

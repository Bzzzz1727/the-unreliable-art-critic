import React from 'react';
import { ExhibitionRecord as IExhibitionRecord } from '../types';
import { X, History, MessageSquare } from 'lucide-react';
import { playClick } from '../utils/soundEffects';

interface DossierModalProps {
  isOpen: boolean;
  onClose: () => void;
  record: IExhibitionRecord | null;
}

export const DossierModal: React.FC<DossierModalProps> = ({ isOpen, onClose, record }) => {
  // Support Escape key to close modal
  React.useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !record) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs select-none">
      <div
        className="w-full max-w-2xl border-2 rounded-2xl p-4 shadow-sticker-lg anim-pop-in space-y-3 max-h-[85dvh] flex flex-col"
        style={{
          backgroundColor: 'var(--panel)',
          borderColor: 'var(--border)'
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b pb-1.5 font-mono text-xs shrink-0" style={{ borderColor: 'var(--border)' }}>
          <div className="flex items-center gap-1.5 font-bold uppercase tracking-wider text-text">
            <History className="w-4 h-4 text-accent" />
            <span>EXHIBITION RECORD // ARCHIVE DOSSIER</span>
          </div>
          <button
            onClick={() => { playClick(); onClose(); }}
            className="text-muted hover:text-text"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Dossier Content */}
        <div className="overflow-y-auto panel-scroll flex-1 pr-1 space-y-3 font-sans text-xs">
          {/* Summary Box */}
          <div
            className="border rounded-xl p-2.5 flex items-center justify-between"
            style={{ backgroundColor: 'var(--bg)', borderColor: 'var(--border)' }}
          >
            <div className="flex items-center gap-2.5">
              <img
                src={record.artwork.dataUrl}
                alt="Thumbnail"
                className="artwork-preserve w-10 h-10 object-cover rounded border"
                style={{ borderColor: 'var(--border)' }}
              />
              <div className="font-mono text-[10px] space-y-0.5">
                <strong className="block text-text">{record.artwork.fileName}</strong>
                <span className="text-muted block">{record.artwork.category} • {record.artwork.analysis.aspectRatio}</span>
              </div>
            </div>

            <div className="text-right font-mono text-xs">
              <span className="text-[9px] text-muted block uppercase">RATIFIED SCORE</span>
              <span className="text-sm font-black text-accent block">
                {record.initialCritique.verdict.overallScore} / 10
              </span>
            </div>
          </div>

          {/* Timeline */}
          <div className="space-y-1.5">
            <span className="font-mono text-[9px] font-bold text-text uppercase block">
              CRITIC PSYCHOMETRIC TIMELINE:
            </span>
            <div className="space-y-1 font-mono text-[10px]">
              {record.stageLogs.map((log, index) => (
                <div
                  key={index}
                  className="border rounded-lg p-1.5 flex items-center justify-between"
                  style={{ backgroundColor: 'var(--panel)', borderColor: 'var(--border)' }}
                >
                  <div>
                    <span className="text-accent font-bold mr-1.5">[STAGE 0{log.stage}]</span>
                    <span className="text-text font-semibold">{log.label}</span>
                    <span className="text-muted ml-2 text-[9px]">— {log.reason}</span>
                  </div>
                  <span className="text-muted text-[8px]">{log.timestamp}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Exchanges Transcript */}
          {record.exchanges.length > 0 && (
            <div className="space-y-1.5 pt-2 border-t" style={{ borderColor: 'var(--border)' }}>
              <span className="font-mono text-[9px] font-bold text-text uppercase flex items-center gap-1.5">
                <MessageSquare className="w-3 h-3 text-accent" />
                INTERROGATION TRANSCRIPT ({record.exchanges.length} EXCHANGES):
              </span>

              <div className="space-y-1.5">
                {record.exchanges.map((ex) => (
                  <div
                    key={ex.id}
                    className="border rounded-xl p-2.5 space-y-1 text-xs"
                    style={{ backgroundColor: 'var(--bg)', borderColor: 'var(--border)' }}
                  >
                    <div className="flex items-center justify-between font-mono text-[8px] text-muted border-b pb-1" style={{ borderColor: 'var(--border)' }}>
                      <span className="font-bold text-accent uppercase">{ex.type}</span>
                      <span>STAGE 0{ex.stage} • {ex.timestamp}</span>
                    </div>

                    {ex.userMessage && (
                      <p className="font-sans italic text-text text-[11px]">
                        “{ex.userMessage}”
                      </p>
                    )}

                    <p className="font-sans text-muted text-[11px]">
                      {ex.criticReply}
                    </p>

                    {ex.unreliableNote && (
                      <p className="font-serif italic font-bold text-accent pt-1 border-t" style={{ borderColor: 'var(--border)' }}>
                        “{ex.unreliableNote}”
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="pt-2 border-t flex items-center justify-between font-mono text-xs text-muted shrink-0" style={{ borderColor: 'var(--border)' }}>
          <span>PERSISTED IN STORAGE</span>
          <button
            onClick={() => { playClick(); onClose(); }}
            className="sticker-btn text-xs py-0.5 px-3"
          >
            CLOSE
          </button>
        </div>
      </div>
    </div>
  );
};

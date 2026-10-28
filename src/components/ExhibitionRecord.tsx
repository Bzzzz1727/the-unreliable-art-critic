import React from 'react';
import { ExhibitionRecord as IExhibitionRecord } from '../types';
import { STAGE_CONFIG } from '../services/criticPersonality';
import { History, RotateCcw, Award, Check, MessageSquare } from 'lucide-react';

interface ExhibitionRecordProps {
  record: IExhibitionRecord;
  onResetSession: () => void;
  onUploadAnother: () => void;
}

export const ExhibitionRecord: React.FC<ExhibitionRecordProps> = ({
  record,
  onResetSession,
  onUploadAnother
}) => {
  const finalScore = record.initialCritique.verdict.overallScore;

  return (
    <section id="exhibition-record" className="w-full max-w-[1000px] mx-auto px-4 sm:px-8 py-16 border-t border-[#292929]">
      <div className="space-y-3 mb-10">
        <div className="font-mono text-xs text-[#D71920] tracking-widest uppercase flex items-center gap-2">
          <History className="w-3.5 h-3.5" />
          <span>SECTION 04 // PERMANENT ARCHIVE</span>
        </div>
        <h3 className="font-serif text-3xl sm:text-4xl md:text-5xl font-bold text-[#F5F5F5]">
          THE EXHIBITION RECORD
        </h3>
        <p className="font-mono text-xs text-[#929292]">
          Chronological transcript of all judgments, cross-examinations, and psychic shifts.
        </p>
      </div>

      <div className="border border-[#292929] bg-[#050505] p-6 sm:p-8 space-y-8">
        {/* Top Summary Banner */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 border-b border-[#292929] pb-6">
          <div className="flex items-center gap-4">
            <img
              src={record.artwork.dataUrl}
              alt="Artwork archive thumbnail"
              className="w-16 h-16 object-cover border border-[#292929]"
            />
            <div className="font-mono text-xs space-y-0.5">
              <span className="text-[#929292] block">DOSSIER</span>
              <span className="text-[#F5F5F5] font-bold block">{record.artwork.id}</span>
              <span className="text-[#929292] block">{record.artwork.category}</span>
            </div>
          </div>

          <div className="font-mono text-xs space-y-1">
            <span className="text-[#929292] block">FINAL CRITIC STATE</span>
            <span className="text-[#D71920] font-bold block">
              STAGE 0{record.currentStage} — {STAGE_CONFIG[record.currentStage].name}
            </span>
            <span className="text-[#929292] block text-[11px]">
              {STAGE_CONFIG[record.currentStage].statusLabel}
            </span>
          </div>

          <div className="font-mono text-xs space-y-1 md:text-right">
            <span className="text-[#929292] block">VERDICT RATIFICATION</span>
            <span className="text-xl font-bold text-[#F5F5F5] block">
              {finalScore} / 10
            </span>
            <span className="text-[#929292] block text-[10px]">LOCAL STORAGE PERSISTED</span>
          </div>
        </div>

        {/* State Evolution Log */}
        <div className="space-y-3">
          <h4 className="font-mono text-xs text-[#F5F5F5] uppercase tracking-wider font-bold">
            CRITIC PSYCHOMETRIC TIMELINE
          </h4>

          <div className="space-y-2">
            {record.stageLogs.map((log, index) => (
              <div
                key={index}
                className="flex items-start justify-between border-l-2 border-[#D71920] pl-3 py-1 font-mono text-xs"
              >
                <div>
                  <span className="text-[#F5F5F5] font-bold">{log.label}</span>
                  <span className="text-[#929292] block sm:inline sm:ml-2">
                    — {log.reason}
                  </span>
                </div>
                <span className="text-[#929292] text-[10px] shrink-0 ml-2">{log.timestamp}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Conversation & Interrogation Transcript */}
        {record.exchanges.length > 0 && (
          <div className="space-y-4 pt-4 border-t border-[#292929]">
            <h4 className="font-mono text-xs text-[#F5F5F5] uppercase tracking-wider font-bold flex items-center gap-2">
              <MessageSquare className="w-3.5 h-3.5 text-[#D71920]" />
              INTERROGATION TRANSCRIPT ({record.exchanges.length} EXCHANGES)
            </h4>

            <div className="space-y-4">
              {record.exchanges.map((ex) => (
                <div key={ex.id} className="border border-[#292929] p-4 bg-black space-y-3">
                  <div className="flex items-center justify-between font-mono text-[10px] text-[#929292] border-b border-[#292929] pb-2">
                    <span className="text-[#D71920] font-bold uppercase">
                      ACTION: {ex.type.toUpperCase()}
                    </span>
                    <span>AT {ex.timestamp} // STAGE 0{ex.stage}</span>
                  </div>

                  {ex.userMessage && (
                    <div className="space-y-1">
                      <span className="font-mono text-[10px] text-[#929292] uppercase block">
                        ARTIST STATEMENT / CHALLENGE:
                      </span>
                      <p className="font-sans text-xs text-[#F5F5F5] italic pl-2 border-l border-[#292929]">
                        “{ex.userMessage}”
                      </p>
                    </div>
                  )}

                  <div className="space-y-1">
                    <span className="font-mono text-[10px] text-[#929292] uppercase block">
                      CRITIC RATIONALE:
                    </span>
                    <p className="font-sans text-xs text-[#F5F5F5] leading-relaxed">
                      {ex.criticReply}
                    </p>
                  </div>

                  {ex.unreliableNote && (
                    <div className="pt-2 border-t border-[#292929]">
                      <span className="font-mono text-[9px] text-[#D71920] uppercase font-bold block">
                        UNRELIABLE OPINION:
                      </span>
                      <p className="font-serif italic text-xs text-[#D71920]">
                        “{ex.unreliableNote}”
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Action Controls: Restart or Upload Another */}
        <div className="pt-6 border-t border-[#292929] flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={onUploadAnother}
              className="btn-primary"
            >
              [ CRITIQUE ANOTHER PIECE ]
            </button>

            <button
              onClick={onResetSession}
              className="btn-secondary"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>RESET SESSION ARCHIVE</span>
            </button>
          </div>

          <span className="font-mono text-xs text-[#929292]">
            EXHIBITION 001 // CATALOGUED
          </span>
        </div>
      </div>
    </section>
  );
};

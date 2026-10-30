import React, { useEffect } from 'react';
import { Artwork, CritiqueData, BrutalTruthData } from '../types';
import { X, FileText, CheckCircle2, AlertCircle, Zap, Shield, Sparkles } from 'lucide-react';
import { playClick } from '../utils/soundEffects';

interface FullCritiqueModalProps {
  isOpen: boolean;
  onClose: () => void;
  artwork: Artwork | null;
  critique: CritiqueData | null;
  brutalTruth?: BrutalTruthData | null;
  theme?: 'day' | 'night';
}

export const FullCritiqueModal: React.FC<FullCritiqueModalProps> = ({
  isOpen,
  onClose,
  artwork,
  critique,
  brutalTruth,
  theme = 'day'
}) => {
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !critique || !artwork) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-5 bg-black/60 backdrop-blur-xs select-none"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          playClick();
          onClose();
        }
      }}
    >
      <div
        className="w-full max-w-2xl border-t-2 sm:border-2 rounded-t-2xl sm:rounded-2xl p-4 sm:p-6 shadow-sticker-lg anim-pop-in space-y-3 sm:space-y-4 max-h-[92dvh] sm:max-h-[88dvh] flex flex-col"
        style={{
          backgroundColor: 'var(--panel)',
          borderColor: 'var(--border)',
          paddingBottom: 'max(1rem, env(safe-area-inset-bottom))'
        }}
      >
        {/* Mobile Drag Indicator Handle */}
        <div className="w-10 h-1 rounded-full bg-border/80 mx-auto -mt-1 sm:hidden shrink-0" />

        {/* Header */}
        <div
          className="flex items-center justify-between border-b pb-2 font-mono text-xs shrink-0"
          style={{ borderColor: 'var(--border)' }}
        >
          <div className="flex items-center gap-2 font-bold uppercase tracking-wider text-text truncate">
            <FileText className="w-4 h-4 text-accent shrink-0" />
            <span className="truncate">CRITIQUE DOSSIER</span>
            <span className="hidden sm:inline">// COMPREHENSIVE AUDIT</span>
          </div>
          <button
            onClick={() => { playClick(); onClose(); }}
            className="text-muted hover:text-text p-1.5 rounded-lg transition-colors min-h-[36px] min-w-[36px] flex items-center justify-center"
            aria-label="Close Full Critique"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="overflow-y-auto panel-scroll flex-1 pr-1 space-y-4 font-sans text-xs">
          {/* Top Banner: Artwork Thumbnail & Score */}
          <div
            className="border-2 rounded-xl p-3 flex items-center justify-between shadow-xs"
            style={{ backgroundColor: 'var(--bg)', borderColor: 'var(--border)' }}
          >
            <div className="flex items-center gap-3">
              <img
                src={artwork.dataUrl}
                alt={artwork.fileName}
                className="artwork-preserve w-12 h-12 object-contain rounded-md border"
                style={{ borderColor: 'var(--border)' }}
              />
              <div className="font-mono text-[11px] space-y-0.5 text-left">
                <strong className="block text-text text-xs">{artwork.fileName}</strong>
                <span className="text-muted block">{artwork.category} • {artwork.analysis.aspectRatio}</span>
                <div className="flex items-center gap-1.5 pt-0.5">
                  <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-bold ${
                    critique.engineSource === 'gemini_vision'
                      ? 'text-accent bg-accent/10 border border-accent/20'
                      : 'text-text bg-border/40 border border-border'
                  }`}>
                    {critique.engineSource === 'gemini_vision' ? '● AI VISION (GEMINI 2.0 FLASH)' : '○ AUTONOMOUS CANVAS TELEMETRY'}
                  </span>
                </div>
              </div>
            </div>

            <div className="text-right flex flex-col items-end">
              <span className="font-mono text-[9px] text-muted block uppercase">RATIFIED SCORE</span>
              <div
                className="px-3 py-0.5 rounded-xl border-2 shadow-sticker flex items-baseline gap-1"
                style={{
                  backgroundColor: 'var(--accent)',
                  borderColor: 'var(--border)',
                  color: '#FFFFFF'
                }}
              >
                <span className="font-mono text-2xl font-black">{critique.verdict.overallScore}</span>
                <span className="font-mono text-xs font-bold opacity-80">/ 10</span>
              </div>
            </div>
          </div>

          {/* API Error notice if any */}
          {critique.apiError && (
            <div
              className="p-2.5 rounded-xl border flex items-center gap-2 text-xs font-mono"
              style={{
                backgroundColor: theme === 'night' ? '#200A0A' : '#FFF5F5',
                borderColor: 'var(--accent)',
                color: 'var(--accent)'
              }}
            >
              <AlertCircle className="w-4 h-4 shrink-0 text-accent" />
              <span><strong>Notice:</strong> Gemini Vision API returned: {critique.apiError}. Dossier generated via Local Canvas Telemetry Engine.</span>
            </div>
          )}

          {/* Primary Score Explanation */}
          {critique.verdict.scoreReason && (
            <div
              className="p-2.5 rounded-xl border font-sans text-xs leading-relaxed text-muted text-center"
              style={{ backgroundColor: 'var(--panel)', borderColor: 'var(--border)' }}
            >
              <strong className="text-text font-mono text-[9px] uppercase tracking-wider block mb-0.5">
                PRIMARY SCORE JUSTIFICATION:
              </strong>
              {critique.verdict.scoreReason}
            </div>
          )}

          {/* 1. First Impression */}
          <div
            className="border-2 rounded-xl p-3.5 space-y-1 text-left shadow-xs"
            style={{ backgroundColor: 'var(--bg)', borderColor: 'var(--border)' }}
          >
            <span className="font-mono text-[10px] font-bold text-accent uppercase tracking-wider block flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-accent" />
              FIRST IMPRESSION
            </span>
            <p className="font-sans text-sm font-semibold text-text leading-relaxed">
              “{critique.firstImpression?.professional || critique.verdict.firstImpression || critique.verdict.professional}”
            </p>
          </div>

          {/* 2. Structured Strengths & Weaknesses Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-left">
            {/* What Works */}
            <div
              className="border-2 rounded-xl p-3 space-y-1.5 shadow-xs"
              style={{ backgroundColor: 'var(--panel)', borderColor: 'var(--border)' }}
            >
              <div className="flex items-center gap-1.5 font-mono text-[10px] font-bold text-text uppercase">
                <CheckCircle2 className="w-3.5 h-3.5 text-accent" />
                <span>WHAT WORKS:</span>
              </div>
              <strong className="block text-text font-semibold text-xs">
                {critique.whatWorks?.title || "Key Formal Strength"}
              </strong>
              <p className="font-sans text-xs text-muted leading-relaxed">
                {critique.whatWorks?.evidence || critique.verdict.whatWorks || "Consistent visual balance and palette execution."}
              </p>
            </div>

            {/* Biggest Problem */}
            <div
              className="border-2 rounded-xl p-3 space-y-1.5 shadow-xs"
              style={{ backgroundColor: 'var(--panel)', borderColor: 'var(--border)' }}
            >
              <div className="flex items-center gap-1.5 font-mono text-[10px] font-bold text-accent uppercase">
                <AlertCircle className="w-3.5 h-3.5 text-accent" />
                <span>BIGGEST PROBLEM:</span>
              </div>
              <strong className="block text-accent font-semibold text-xs">
                {critique.biggestProblem?.title || "Primary Consequential Weakness"}
              </strong>
              <p className="font-sans text-xs text-muted leading-relaxed">
                {critique.biggestProblem?.evidence || critique.verdict.biggestProblem}
              </p>
              {critique.biggestProblem?.consequence && (
                <p className="font-sans text-[11px] text-text font-medium border-t pt-1" style={{ borderColor: 'var(--border)' }}>
                  <strong className="font-mono text-[9px] uppercase block text-muted">Impact:</strong>
                  {critique.biggestProblem.consequence}
                </p>
              )}
            </div>
          </div>

          {/* 3. What to Preserve */}
          {(critique.whatToPreserve || critique.verdict.whatToPreserve) && (
            <div
              className="border-2 rounded-xl p-3 space-y-1 text-left shadow-xs"
              style={{ backgroundColor: 'var(--panel)', borderColor: 'var(--border)' }}
            >
              <span className="font-mono text-[10px] font-bold text-text uppercase tracking-wider block flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-accent" />
                WHAT TO PRESERVE (DO NOT LOSE IN REVISION)
              </span>
              <p className="font-sans text-xs text-text leading-relaxed">
                {critique.whatToPreserve || critique.verdict.whatToPreserve}
              </p>
            </div>
          )}

          {/* 4. Other Important Issues (If genuinely material) */}
          {critique.otherIssues && critique.otherIssues.length > 0 && (
            <div
              className="border-2 rounded-xl p-3 space-y-2 text-left shadow-xs"
              style={{ backgroundColor: 'var(--panel)', borderColor: 'var(--border)' }}
            >
              <span className="font-mono text-[10px] font-bold text-muted uppercase tracking-wider block">
                OTHER IMPORTANT ISSUES:
              </span>
              <div className="space-y-1.5">
                {critique.otherIssues.map((issue, idx) => (
                  <div key={idx} className="border rounded-lg p-2 text-xs" style={{ borderColor: 'var(--border)' }}>
                    <strong className="block text-text font-semibold mb-0.5">{issue.title}</strong>
                    <p className="text-muted leading-relaxed">{issue.evidence}</p>
                    {issue.consequence && (
                      <p className="text-text text-[11px] mt-1 font-medium border-t pt-1" style={{ borderColor: 'var(--border)' }}>
                        <span className="font-mono text-[9px] text-muted uppercase mr-1">Impact:</span>
                        {issue.consequence}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 5. How to Improve It (Prioritized Recommendations) */}
          <div
            className="border-2 rounded-xl p-3 space-y-2 text-left shadow-xs"
            style={{ backgroundColor: 'var(--bg)', borderColor: 'var(--border)' }}
          >
            <span className="font-mono text-[10px] font-bold text-text uppercase tracking-wider block flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5 text-accent" />
              HOW TO IMPROVE IT (PRIORITIZED RECOMMENDATIONS)
            </span>
            {Array.isArray(critique.howToImprove) && critique.howToImprove.length > 0 ? (
              <div className="space-y-1.5">
                {critique.howToImprove.map((rec, idx) => (
                  <div key={idx} className="flex items-start gap-2 text-xs text-text">
                    <span className="font-mono text-[9px] font-bold text-accent shrink-0 mt-0.5">0{idx + 1}.</span>
                    <span className="leading-relaxed">{rec}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="font-sans text-xs text-text leading-relaxed">
                {critique.biggestProblem?.fix || critique.verdict.howToFixIt || critique.whatCouldImprove?.professional}
              </p>
            )}
          </div>

          {/* 4. Category-by-Category Analysis */}
          <div className="space-y-2 text-left">
            <span className="font-mono text-[10px] font-bold text-muted uppercase tracking-wider block">
              DETAILED CATEGORY AUDIT:
            </span>

            <div className="space-y-2">
              {/* COMPOSITION */}
              <div
                className="border rounded-xl p-2.5 space-y-1"
                style={{ backgroundColor: 'var(--panel)', borderColor: 'var(--border)' }}
              >
                <div className="flex items-center justify-between font-mono text-[10px] border-b pb-1" style={{ borderColor: 'var(--border)' }}>
                  <span className="font-bold text-text uppercase">COMPOSITION</span>
                  <span className="text-accent font-bold">SCORE: {critique.composition.score} / 10</span>
                </div>
                <p className="font-sans text-xs text-text leading-relaxed">
                  {critique.composition.professional}
                </p>
              </div>

              {/* COLOUR */}
              <div
                className="border rounded-xl p-2.5 space-y-1"
                style={{ backgroundColor: 'var(--panel)', borderColor: 'var(--border)' }}
              >
                <div className="flex items-center justify-between font-mono text-[10px] border-b pb-1" style={{ borderColor: 'var(--border)' }}>
                  <span className="font-bold text-text uppercase">COLOUR & CONTRAST</span>
                  <span className="text-accent font-bold">SCORE: {critique.colourAndTexture.score} / 10</span>
                </div>
                <p className="font-sans text-xs text-text leading-relaxed">
                  {critique.colourAndTexture.professional}
                </p>
              </div>

              {/* TYPE (if applicable) */}
              {critique.typography && (
                <div
                  className="border rounded-xl p-2.5 space-y-1"
                  style={{ backgroundColor: 'var(--panel)', borderColor: 'var(--border)' }}
                >
                  <div className="flex items-center justify-between font-mono text-[10px] border-b pb-1" style={{ borderColor: 'var(--border)' }}>
                    <span className="font-bold text-text uppercase">TYPOGRAPHY</span>
                    <span className="text-accent font-bold">SCORE: {critique.typography.score} / 10</span>
                  </div>
                  <p className="font-sans text-xs text-text leading-relaxed">
                    {critique.typography.professional}
                  </p>
                </div>
              )}

              {/* CONCEPT */}
              <div
                className="border rounded-xl p-2.5 space-y-1"
                style={{ backgroundColor: 'var(--panel)', borderColor: 'var(--border)' }}
              >
                <div className="flex items-center justify-between font-mono text-[10px] border-b pb-1" style={{ borderColor: 'var(--border)' }}>
                  <span className="font-bold text-text uppercase">CONCEPT & COMMUNICATION</span>
                  <span className="text-accent font-bold">SCORE: {critique.concept.score} / 10</span>
                </div>
                <p className="font-sans text-xs text-text leading-relaxed">
                  {critique.concept.professional}
                </p>
              </div>
            </div>
          </div>

          {/* 5. Brutal Truth Section (If Available) */}
          {brutalTruth && (
            <div
              className="border-2 rounded-xl p-3 space-y-2 text-left shadow-xs"
              style={{
                backgroundColor: theme === 'night' ? '#1F0B0B' : '#FFF5F5',
                borderColor: 'var(--accent)'
              }}
            >
              <div className="flex items-center gap-1.5 font-mono text-[10px] font-bold text-accent uppercase">
                <Zap className="w-3.5 h-3.5 text-accent" />
                <span>BRUTAL TRUTH AUDIT // UNVARNISHED REALITY:</span>
              </div>
              <p className="font-sans text-xs font-bold text-text leading-relaxed">
                “{brutalTruth.hardTruth}”
              </p>
              <div className="space-y-1 pt-1 font-mono text-[10px] text-muted">
                {brutalTruth.whatToFixFirst?.map((fix, idx) => (
                  <div key={idx} className="flex items-start gap-1.5">
                    <span className="text-accent font-bold">0{idx + 1}.</span>
                    <span>{fix}</span>
                  </div>
                ))}
              </div>
              {brutalTruth.whatToKeep && (
                <div className="pt-1.5 border-t text-[11px] font-sans text-text" style={{ borderColor: 'var(--border)' }}>
                  <span className="font-mono text-[9px] uppercase font-bold text-muted block">PRESERVE IN REVISION:</span>
                  {brutalTruth.whatToKeep}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div
          className="border-t pt-2 flex items-center justify-between font-mono text-xs shrink-0"
          style={{ borderColor: 'var(--border)' }}
        >
          <span className="text-[10px] text-muted">Press ESC or click outside to dismiss</span>
          <button
            onClick={() => { playClick(); onClose(); }}
            className="sticker-btn text-xs py-1 px-4 text-text hover:text-accent"
          >
            CLOSE
          </button>
        </div>
      </div>
    </div>
  );
};

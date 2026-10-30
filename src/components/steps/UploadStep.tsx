import React, { useState, useRef, DragEvent, ChangeEvent } from 'react';
import { ArtworkCategory, Artwork, CriticStage } from '../../types';
import { SAMPLE_ARTWORKS, svgToDataUrl } from '../../data/sampleArtworks';
import { analyzeImage } from '../../utils/imageAnalyzer';
import { playClick, playPop, playStamp } from '../../utils/soundEffects';
import { CriticPet, CharacterExpression } from '../CriticPet';
import { Upload, RefreshCw, X, Sparkles, ArrowRight } from 'lucide-react';

interface UploadStepProps {
  currentStage: CriticStage;
  onArtworkSubmitted: (artwork: Artwork) => void;
  speechText: string;
  forcedExpression: CharacterExpression | null;
  onExpressionChange: (expr: CharacterExpression) => void;
  onSpeechChange: (speech: string) => void;
  theme?: 'day' | 'night';
}

const CATEGORIES: ArtworkCategory[] = [
  'Poster',
  'Album cover',
  'Branding',
  'Illustration',
  'Photography',
  'Typography',
  'Other'
];

export const UploadStep: React.FC<UploadStepProps> = ({
  currentStage,
  onArtworkSubmitted,
  speechText,
  forcedExpression,
  onExpressionChange,
  onSpeechChange,
  theme = 'day'
}) => {
  const [dragActive, setDragActive] = useState<boolean>(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string>('');
  const [fileSizeFormatted, setFileSizeFormatted] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<ArtworkCategory>('Poster');
  const [statement, setStatement] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isCrossfading, setIsCrossfading] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const handleFile = (file: File) => {
    setErrorMessage(null);
    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml', 'image/gif'];
    if (!validTypes.includes(file.type)) {
      setErrorMessage(`Unsupported format. Please upload PNG, JPG, WEBP, SVG, or GIF.`);
      return;
    }

    if (file.size > 20 * 1024 * 1024) {
      setErrorMessage('File too large. Maximum size is 20MB.');
      return;
    }

    playPop();
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      if (result) {
        setIsCrossfading(true);
        setTimeout(() => {
          setPreviewUrl(result);
          setFileName(file.name);
          setFileSizeFormatted(formatFileSize(file.size));
          setIsCrossfading(false);
          onSpeechChange("SHOW ME.");
        }, 120);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleDrag = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') setDragActive(true);
    else if (e.type === 'dragleave') setDragActive(false);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const handleSelectSample = (sampleId: string) => {
    playClick();
    const found = SAMPLE_ARTWORKS.find((s) => s.id === sampleId);
    if (!found) return;

    const dataUrl = svgToDataUrl(found.svgContent);
    setIsCrossfading(true);
    setTimeout(() => {
      setPreviewUrl(dataUrl);
      setFileName(`${found.name.toLowerCase().replace(/[^a-z0-9]/g, '_')}.svg`);
      setFileSizeFormatted('28 KB');
      setSelectedCategory(found.category);
      setStatement(found.statement);
      setErrorMessage(null);
      setIsCrossfading(false);
      onSpeechChange("SHOW ME.");
    }, 120);
  };

  const handleClear = () => {
    playClick();
    setPreviewUrl(null);
    setFileName('');
    setFileSizeFormatted('');
    setErrorMessage(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
    onSpeechChange("Show me what you've made.");
  };

  const handleSubmit = async () => {
    if (!previewUrl) return;

    try {
      playStamp();
      const analysis = await analyzeImage(previewUrl);

      const newArtwork: Artwork = {
        id: `AC-${Date.now().toString().slice(-6)}`,
        dataUrl: previewUrl,
        fileName: fileName || 'untitled_work.png',
        fileSizeFormatted: fileSizeFormatted || '1.0 MB',
        category: selectedCategory,
        statement: statement.trim(),
        submittedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        analysis
      };

      onArtworkSubmitted(newArtwork);
    } catch (err) {
      console.error(err);
      setErrorMessage('Image analysis failed. Please try another image.');
    }
  };

  return (
    <div className="h-full w-full flex flex-col justify-between anim-step-enter select-none max-w-2xl mx-auto p-2 sm:p-4">
      {/* Top Floating Presence: Compact Critic */}
      <div className="shrink-0 flex items-center justify-center pt-1 pb-2">
        <CriticPet
          currentStage={currentStage}
          currentMoodLabel="MOOD: CURIOUS"
          speechText={speechText || (previewUrl ? "SHOW ME." : "Show me what you've made.")}
          forcedExpression={forcedExpression}
          onExpressionChange={onExpressionChange}
          onSpeechChange={onSpeechChange}
          theme={theme}
          size="sm"
          showBubble={true}
        />
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp,image/svg+xml,image/gif"
        onChange={handleChange}
        className="hidden"
      />

      {/* Central Content Stage */}
      <div className="flex-1 min-h-0 flex flex-col items-center justify-center my-1">
        {!previewUrl ? (
          /* Empty Dropzone Area */
          <div
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`w-full max-w-lg border-2 border-dashed rounded-2xl p-6 sm:p-8 flex flex-col items-center justify-center text-center cursor-pointer transition-all ${
              dragActive ? 'border-accent bg-panel/80 scale-[1.01]' : 'border-border hover:bg-panel/40'
            }`}
            style={{ backgroundColor: 'var(--panel)' }}
          >
            <div
              className="w-12 h-12 rounded-2xl border flex items-center justify-center mb-3 shadow-sticker anim-character-breathe"
              style={{
                backgroundColor: 'var(--bg)',
                borderColor: 'var(--border)'
              }}
            >
              <Upload className="w-5 h-5 text-accent" />
            </div>

            <h3 className="font-sans font-bold text-lg sm:text-xl text-text tracking-tight mb-1">
              Show me what you've made.
            </h3>
            <p className="font-sans text-xs text-muted max-w-xs">
              Drop art here or browse from your phone / photo library
            </p>

            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                fileInputRef.current?.click();
              }}
              className="sticker-btn mt-4 text-xs py-2 px-5 min-h-[42px] shadow-sticker hover:scale-105 active:scale-95"
            >
              [ Choose / Take Photo ]
            </button>
          </div>
        ) : (
          /* Staged Artwork Preview: Sized proportionally for phone and desktop */
          <div className="w-full flex flex-col items-center justify-center space-y-3">
            <div
              className={`w-[80%] max-w-[260px] sm:w-[45%] sm:max-w-[320px] max-h-[36vh] sm:max-h-[calc(100dvh-340px)] flex items-center justify-center p-2 rounded-xl border-2 shadow-sticker transition-opacity duration-200 ${
                isCrossfading ? 'opacity-0 scale-95' : 'anim-artwork-in opacity-100 scale-100'
              }`}
              style={{
                backgroundColor: 'var(--panel)',
                borderColor: 'var(--border)'
              }}
            >
              <img
                src={previewUrl}
                alt="Artwork preview"
                className="artwork-preserve max-h-[34vh] sm:max-h-[calc(100dvh-360px)] max-w-full w-auto object-contain rounded-lg"
              />
            </div>

            {/* Compact controls: Replace & Clear */}
            <div className="flex items-center gap-2 flex-wrap justify-center">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="sticker-btn py-1.5 px-3 text-[11px] min-h-[36px] flex items-center gap-1 text-text"
              >
                <RefreshCw className="w-3 h-3 text-muted" />
                <span>[ REPLACE ]</span>
              </button>
              <button
                type="button"
                onClick={handleClear}
                className="sticker-btn py-1.5 px-3 text-[11px] min-h-[36px] flex items-center gap-1 text-accent"
              >
                <X className="w-3 h-3" />
                <span>[ CLEAR ]</span>
              </button>
              <span className="font-mono text-[10px] text-muted block w-full text-center sm:inline sm:w-auto">
                {fileName} ({fileSizeFormatted})
              </span>
            </div>

            {/* Optional Statement & Category (Mobile-optimized input font size to prevent iOS zoom) */}
            <div className="w-full max-w-md flex flex-col sm:flex-row items-stretch sm:items-center gap-2 px-1">
              <input
                type="text"
                maxLength={90}
                value={statement}
                onChange={(e) => setStatement(e.target.value)}
                placeholder="Optional artist statement or context..."
                className="flex-1 border rounded-xl px-3 py-2 text-base sm:text-xs font-sans placeholder-muted focus:outline-none focus:border-accent min-h-[40px]"
                style={{
                  backgroundColor: 'var(--panel)',
                  borderColor: 'var(--border)',
                  color: 'var(--text)'
                }}
              />
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value as ArtworkCategory)}
                className="border rounded-xl px-2.5 py-2 font-mono text-base sm:text-[11px] font-bold text-text focus:outline-none focus:border-accent cursor-pointer min-h-[40px]"
                style={{
                  backgroundColor: 'var(--panel)',
                  borderColor: 'var(--border)'
                }}
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}
      </div>

      {/* Error Message if any */}
      {errorMessage && (
        <div
          className="mb-2 p-2 rounded-xl font-mono text-[10px] text-center border"
          style={{
            backgroundColor: 'var(--bg)',
            borderColor: 'var(--accent)',
            color: 'var(--accent)'
          }}
        >
          {errorMessage}
        </div>
      )}

      {/* Bottom Row */}
      <div className="shrink-0 pt-2 border-t border-border flex flex-col items-center gap-2">
        {!previewUrl ? (
          /* Samples Row with horizontal scroll on mobile */
          <div className="w-full flex flex-col sm:flex-row items-center justify-center gap-1.5 text-[10px] font-mono">
            <span className="text-muted flex items-center gap-1 font-bold shrink-0">
              <Sparkles className="w-3 h-3 text-accent" />
              SAMPLES:
            </span>
            <div className="w-full sm:w-auto flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1 px-2 justify-start sm:justify-center">
              {SAMPLE_ARTWORKS.map((sample) => (
                <button
                  key={sample.id}
                  onClick={() => handleSelectSample(sample.id)}
                  className="sticker-btn py-1 px-2.5 text-[9px] text-text whitespace-nowrap shrink-0 min-h-[32px]"
                >
                  [{sample.category.toUpperCase()}]
                </button>
              ))}
            </div>
          </div>
        ) : (
          /* Prominent Decision Button */
          <button
            onClick={handleSubmit}
            className="w-full max-w-md sticker-btn-accent text-sm sm:text-base py-3 px-6 min-h-[48px] flex items-center justify-center gap-2 shadow-sticker hover:scale-102 active:scale-98 transition-transform"
          >
            <span>[ LET THE CRITIC DECIDE ]</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
};

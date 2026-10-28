import React, { useState, useRef, useEffect, DragEvent, ChangeEvent } from 'react';
import { ArtworkCategory, Artwork } from '../types';
import { SAMPLE_ARTWORKS, svgToDataUrl } from '../data/sampleArtworks';
import { analyzeImage } from '../utils/imageAnalyzer';
import { playClick, playPop, playStamp } from '../utils/soundEffects';
import { Upload, X, RefreshCw, Sparkles, Send } from 'lucide-react';

interface StudioPanelProps {
  currentArtwork: Artwork | null;
  onArtworkSubmitted: (artwork: Artwork) => void;
  onRemoveArtwork: () => void;
  onImageSelected?: () => void;
  isLoading: boolean;
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

export const StudioPanel: React.FC<StudioPanelProps> = ({
  currentArtwork,
  onArtworkSubmitted,
  onRemoveArtwork,
  onImageSelected,
  isLoading,
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

  // Sync if artwork was restored from session
  useEffect(() => {
    if (currentArtwork) {
      setPreviewUrl(currentArtwork.dataUrl);
      setFileName(currentArtwork.fileName);
      setFileSizeFormatted(currentArtwork.fileSizeFormatted);
      setSelectedCategory(currentArtwork.category);
      setStatement(currentArtwork.statement);
    } else {
      setPreviewUrl(null);
      setFileName('');
      setFileSizeFormatted('');
      setStatement('');
    }
  }, [currentArtwork]);

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
          if (onImageSelected) onImageSelected();
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
      if (onImageSelected) onImageSelected();
    }, 120);
  };

  const handleClear = () => {
    playClick();
    setPreviewUrl(null);
    setFileName('');
    setFileSizeFormatted('');
    setErrorMessage(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
    onRemoveArtwork();
  };

  const handleSubmit = async () => {
    if (!previewUrl || isLoading) return;

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
    <div className="h-full flex flex-col sticker-card p-3 overflow-hidden relative">
      {/* Studio Stage Header */}
      <div className="flex items-center justify-between pb-1.5 border-b border-border font-mono text-[11px] shrink-0">
        <div className="flex items-center gap-1.5 font-bold text-text">
          <span className="w-2 h-2 rounded-full bg-accent" />
          <span>STUDIO STAGE</span>
          {previewUrl && (
            <span className="text-[10px] text-muted hidden sm:inline font-normal">
              — {fileName}
            </span>
          )}
        </div>

        <span
          className="text-[9px] px-1.5 py-0.5 rounded border font-bold"
          style={{
            backgroundColor: 'var(--bg)',
            borderColor: 'var(--border)',
            color: 'var(--muted)'
          }}
        >
          {previewUrl ? 'STAGE OCCUPIED' : 'AWAITING CANVAS'}
        </span>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp,image/svg+xml,image/gif"
        onChange={handleChange}
        className="hidden"
      />

      {/* Main Artwork Stage Area: Generous Negative Space like a Gallery Wall */}
      <div
        className="flex-1 my-2 flex items-center justify-center min-h-0 border-2 border-dashed border-border rounded-xl relative overflow-hidden p-3"
        style={{ backgroundColor: 'var(--bg)' }}
      >
        {!previewUrl ? (
          /* A. Empty State: Minimal, concise instruction, small icon, compact button */
          <div
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`w-full h-full flex flex-col items-center justify-center text-center p-4 cursor-pointer transition-colors rounded-lg ${
              dragActive ? 'bg-panel border-accent' : 'hover:bg-panel/40'
            }`}
          >
            {/* Small upload icon */}
            <div
              className="w-10 h-10 rounded-xl border flex items-center justify-center mb-2.5 shadow-xs"
              style={{
                backgroundColor: 'var(--panel)',
                borderColor: 'var(--border)'
              }}
            >
              <Upload className="w-4 h-4 text-accent" />
            </div>

            <p className="font-sans font-medium text-sm text-text">
              Drop your art here
            </p>
            <p className="font-sans text-xs text-muted mt-0.5">
              or browse from your device
            </p>

            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                fileInputRef.current?.click();
              }}
              className="sticker-btn mt-3 text-xs py-1 px-3 shadow-sticker hover:scale-105 active:scale-95"
            >
              Choose artwork
            </button>
          </div>
        ) : (
          /* B. Uploaded State: Smaller preview (~40-55% width), centered, generous negative space, zero filters */
          <div className="w-full h-full flex items-center justify-center relative p-2">
            <div
              className={`w-[52%] max-w-[280px] sm:max-w-[320px] max-h-[calc(100dvh-320px)] flex items-center justify-center p-1.5 rounded-lg border shadow-sticker transition-opacity duration-200 ${
                isCrossfading ? 'opacity-0 scale-98' : 'anim-artwork-in opacity-100 scale-100'
              }`}
              style={{
                backgroundColor: 'var(--panel)',
                borderColor: 'var(--border)'
              }}
            >
              <img
                src={previewUrl}
                alt="Uploaded artwork for critique"
                className="artwork-preserve max-h-[calc(100dvh-340px)] max-w-full w-auto object-contain rounded"
              />
            </div>
          </div>
        )}
      </div>

      {/* Error banner if any */}
      {errorMessage && (
        <div
          className="mb-1.5 p-1 rounded-lg font-mono text-[10px] text-center border"
          style={{
            backgroundColor: 'var(--bg)',
            borderColor: 'var(--accent)',
            color: 'var(--accent)'
          }}
        >
          {errorMessage}
        </div>
      )}

      {/* C. Compact Action Row & Controls */}
      <div className="shrink-0 space-y-2 pt-1 border-t border-border">
        {!previewUrl ? (
          /* Curated Sample Buttons when empty */
          <div className="flex items-center justify-between gap-1 text-[10px] font-mono">
            <span className="text-muted flex items-center gap-1 font-bold">
              <Sparkles className="w-3 h-3 text-accent" />
              SAMPLES:
            </span>
            <div className="flex items-center gap-1">
              {SAMPLE_ARTWORKS.map((sample) => (
                <button
                  key={sample.id}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleSelectSample(sample.id);
                  }}
                  className="sticker-btn py-0.5 px-2 text-[9px] text-text"
                >
                  [{sample.category.toUpperCase()}]
                </button>
              ))}
            </div>
          </div>
        ) : (
          /* Uploaded State Action Row + Optional Statement & Category */
          <div className="space-y-1.5">
            {/* Optional Statement & Category Inputs */}
            <div className="flex items-center gap-1.5">
              <input
                type="text"
                maxLength={90}
                value={statement}
                onChange={(e) => setStatement(e.target.value)}
                placeholder="Optional artist note or context..."
                className="flex-1 border rounded-lg px-2.5 py-1 text-xs font-sans placeholder-muted focus:outline-none focus:border-accent"
                style={{
                  backgroundColor: 'var(--panel)',
                  borderColor: 'var(--border)',
                  color: 'var(--text)'
                }}
              />

              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value as ArtworkCategory)}
                className="border rounded-lg px-2 py-1 font-mono text-[10px] font-bold text-text focus:outline-none focus:border-accent cursor-pointer"
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

            {/* Action Row: [ ANALYSE ] [ REPLACE ] [ CLEAR ] */}
            <div className="flex items-center gap-2">
              <button
                onClick={handleSubmit}
                disabled={isLoading}
                className="flex-1 sticker-btn-accent py-1.5 text-xs flex items-center justify-center gap-1.5 shadow-sticker"
              >
                {isLoading ? (
                  <span className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-white animate-ping" />
                    Inspecting the evidence...
                  </span>
                ) : (
                  <>
                    <Send className="w-3 h-3" />
                    <span>[ ANALYSE ]</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isLoading}
                className="sticker-btn py-1.5 px-2.5 text-xs text-text flex items-center gap-1"
                title="Choose a different image"
              >
                <RefreshCw className="w-3 h-3 text-muted" />
                <span>[ REPLACE ]</span>
              </button>

              <button
                type="button"
                onClick={handleClear}
                disabled={isLoading}
                className="sticker-btn py-1.5 px-2.5 text-xs text-accent flex items-center gap-1"
                title="Remove current artwork"
              >
                <X className="w-3 h-3" />
                <span>[ CLEAR ]</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

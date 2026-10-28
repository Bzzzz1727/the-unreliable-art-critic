import React, { useState, useRef, DragEvent, ChangeEvent } from 'react';
import { ArtworkCategory, Artwork } from '../types';
import { SAMPLE_ARTWORKS, svgToDataUrl } from '../data/sampleArtworks';
import { analyzeImage } from '../utils/imageAnalyzer';
import { Upload, X, RefreshCw, AlertCircle, Sparkles, Image as ImageIcon } from 'lucide-react';

interface UploadSectionProps {
  onArtworkReady: (artwork: Artwork) => void;
  isLoading: boolean;
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

export const UploadSection: React.FC<UploadSectionProps> = ({ onArtworkReady, isLoading }) => {
  const [dragActive, setDragActive] = useState<boolean>(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string>('');
  const [fileSizeFormatted, setFileSizeFormatted] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<ArtworkCategory>('Poster');
  const [statement, setStatement] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const handleFile = (file: File) => {
    setErrorMessage(null);

    // Validate type
    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml', 'image/gif'];
    if (!validTypes.includes(file.type)) {
      setErrorMessage(`UNSUPPORTED FILE FORMAT [${file.type || 'Unknown'}]. Please supply PNG, JPG, WEBP, SVG, or GIF.`);
      return;
    }

    // Validate size (max 20MB)
    if (file.size > 20 * 1024 * 1024) {
      setErrorMessage('FILE SIZE EXCEEDS LIMIT (20MB). The critic refuses to inspect overweight digital archives.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      if (result) {
        setPreviewUrl(result);
        setFileName(file.name);
        setFileSizeFormatted(formatFileSize(file.size));
      }
    };
    reader.onerror = () => {
      setErrorMessage('FAILED TO READ FILE. Please attempt another file or format.');
    };
    reader.readAsDataURL(file);
  };

  const handleDrag = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
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

  const handleRemove = () => {
    setPreviewUrl(null);
    setFileName('');
    setFileSizeFormatted('');
    setErrorMessage(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSelectSample = (sampleId: string) => {
    const found = SAMPLE_ARTWORKS.find((s) => s.id === sampleId);
    if (!found) return;

    const dataUrl = svgToDataUrl(found.svgContent);
    setPreviewUrl(dataUrl);
    setFileName(`${found.name.toLowerCase().replace(/[^a-z0-9]/g, '_')}.svg`);
    setFileSizeFormatted('28.4 KB');
    setSelectedCategory(found.category);
    setStatement(found.statement);
    setErrorMessage(null);
  };

  const handleSubmit = async () => {
    if (!previewUrl) {
      setErrorMessage('NO ARTWORK ATTACHED. The critic cannot render a verdict upon the void.');
      return;
    }

    try {
      setIsAnalyzing(true);
      setErrorMessage(null);

      // Perform real canvas analysis
      const analysis = await analyzeImage(previewUrl);

      const newArtwork: Artwork = {
        id: `AC-${Date.now().toString().slice(-6)}`,
        dataUrl: previewUrl,
        fileName: fileName || 'untitled_artifact.png',
        fileSizeFormatted: fileSizeFormatted || '1.2 MB',
        category: selectedCategory,
        statement: statement.trim(),
        submittedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        analysis
      };

      onArtworkReady(newArtwork);
    } catch (err) {
      console.error(err);
      setErrorMessage('ANALYSIS PIPELINE FAILURE. Please re-select the image.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <section id="gallery-upload" className="w-full max-w-[1000px] mx-auto px-4 sm:px-8 py-16">
      {/* Editorial Header */}
      <div className="mb-10 space-y-3">
        <div className="font-mono text-xs text-[#D71920] tracking-widest uppercase flex items-center gap-2">
          <span>SECTION 01</span>
          <span className="text-[#292929]">/</span>
          <span>SUBMISSION DOSSIER</span>
        </div>
        <h2 className="font-serif text-4xl sm:text-5xl md:text-6xl text-[#F5F5F5] font-bold">
          YOUR WORK, PLEASE.
        </h2>
        <p className="font-serif italic text-lg sm:text-xl text-[#929292] max-w-xl">
          “Every masterpiece begins as something someone else might misunderstand.”
        </p>
      </div>

      {/* Error alert if any */}
      {errorMessage && (
        <div className="mb-6 p-4 border border-[#D71920] bg-black text-[#D71920] font-mono text-xs flex items-start gap-3">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <span className="font-bold">CURATORIAL REJECTION:</span>
            <p className="text-[#F5F5F5]">{errorMessage}</p>
          </div>
        </div>
      )}

      {/* Main Upload Box */}
      {!previewUrl ? (
        <div
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          className={`relative border-2 border-dashed transition-all p-8 sm:p-14 text-center cursor-pointer ${
            dragActive
              ? 'border-[#D71920] bg-[#111111]'
              : 'border-[#292929] hover:border-[#F5F5F5] bg-black'
          }`}
          onClick={() => fileInputRef.current?.click()}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/png,image/jpeg,image/webp,image/svg+xml,image/gif"
            onChange={handleChange}
            className="hidden"
          />

          <div className="max-w-md mx-auto space-y-4">
            <div className="w-12 h-12 mx-auto border border-[#292929] flex items-center justify-center text-[#929292]">
              <Upload className="w-5 h-5 text-[#D71920]" />
            </div>

            <div>
              <p className="font-mono text-sm text-[#F5F5F5] tracking-wide">
                DRAG & DROP ARTWORK HERE, OR CLICK TO BROWSE
              </p>
              <p className="font-mono text-xs text-[#929292] mt-1">
                Accepts PNG, JPG, WEBP, SVG, GIF (Up to 20MB)
              </p>
            </div>

            <div className="pt-2">
              <span className="inline-block font-mono text-xs text-[#D71920] border border-[#D71920] px-4 py-1.5 hover:bg-[#D71920] hover:text-white transition-colors">
                [ SELECT LOCAL FILE ]
              </span>
            </div>
          </div>
        </div>
      ) : (
        /* Image Preview Gallery Frame */
        <div className="border border-[#292929] bg-[#050505] p-4 sm:p-8 space-y-6">
          <div className="flex items-center justify-between border-b border-[#292929] pb-3 text-xs font-mono text-[#929292]">
            <span className="flex items-center gap-2 text-[#F5F5F5]">
              <ImageIcon className="w-3.5 h-3.5 text-[#D71920]" />
              {fileName} ({fileSizeFormatted})
            </span>

            <div className="flex items-center gap-2">
              <button
                onClick={() => fileInputRef.current?.click()}
                className="hover:text-[#F5F5F5] flex items-center gap-1 transition-colors px-2 py-1 border border-[#292929]"
              >
                <RefreshCw className="w-3 h-3 text-[#929292]" />
                REPLACE
              </button>
              <button
                onClick={handleRemove}
                className="hover:text-[#D71920] flex items-center gap-1 transition-colors px-2 py-1 border border-[#292929]"
              >
                <X className="w-3 h-3 text-[#D71920]" />
                REMOVE
              </button>
            </div>
          </div>

          {/* Exhibition Gallery Frame (Preserves exact aspect ratio) */}
          <div className="w-full flex items-center justify-center p-4 sm:p-8 bg-black border border-[#292929]">
            <div className="relative border border-[#404040] shadow-2xl p-2 bg-[#0A0A0A]">
              <img
                src={previewUrl}
                alt="Uploaded submission"
                className="max-h-[550px] w-auto max-w-full object-contain mx-auto select-none"
              />
              <div className="absolute bottom-1 right-2 font-mono text-[9px] text-[#929292]">
                GALLERY FRAME // SECURE
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Or choose sample artwork if user has none */}
      {!previewUrl && (
        <div className="mt-4 pt-4 border-t border-[#292929] flex flex-wrap items-center justify-between gap-3 font-mono text-xs text-[#929292]">
          <span className="flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-[#D71920]" />
            OR TEST WITH A CURATED SAMPLE:
          </span>
          <div className="flex flex-wrap gap-2">
            {SAMPLE_ARTWORKS.map((sample) => (
              <button
                key={sample.id}
                onClick={() => handleSelectSample(sample.id)}
                className="border border-[#292929] px-2.5 py-1 text-xs text-[#F5F5F5] hover:border-[#D71920] hover:text-[#D71920] transition-colors"
              >
                [{sample.category.toUpperCase()}: {sample.name.split('—')[0].trim()}]
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Metadata inputs */}
      <div className="mt-10 grid grid-cols-1 md:grid-cols-3 gap-6 pt-6 border-t border-[#292929]">
        {/* Category Selector */}
        <div className="space-y-2">
          <label className="block font-mono text-xs text-[#929292] tracking-wider uppercase">
            ARTWORK CATEGORY
          </label>
          <div className="relative">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value as ArtworkCategory)}
              className="w-full bg-black border border-[#292929] px-3.5 py-2.5 text-[#F5F5F5] font-mono text-xs focus:border-[#D71920] focus:outline-none transition-colors cursor-pointer"
            >
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat} className="bg-black text-[#F5F5F5]">
                  {cat}
                </option>
              ))}
            </select>
          </div>
          <span className="block font-mono text-[10px] text-[#929292]">
            Assists critic with functional expectations
          </span>
        </div>

        {/* Artist statement */}
        <div className="md:col-span-2 space-y-2">
          <label className="block font-mono text-xs text-[#929292] tracking-wider uppercase">
            WHAT SHOULD I KNOW ABOUT THIS PIECE?
          </label>
          <input
            type="text"
            value={statement}
            onChange={(e) => setStatement(e.target.value)}
            placeholder="Concept, intended audience, design choices, or absolutely nothing..."
            className="w-full bg-black border border-[#292929] px-3.5 py-2.5 text-[#F5F5F5] font-sans text-xs sm:text-sm placeholder-[#929292] focus:border-[#D71920] focus:outline-none transition-colors"
          />
          <span className="block font-mono text-[10px] text-[#929292]">
            Optional. Statements may be used against you during cross-examination.
          </span>
        </div>
      </div>

      {/* Submit Button */}
      <div className="mt-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <button
          onClick={handleSubmit}
          disabled={!previewUrl || isLoading || isAnalyzing}
          className={`btn-primary w-full sm:w-auto px-8 py-3.5 ${
            !previewUrl ? 'opacity-40 cursor-not-allowed border-[#292929] text-[#929292]' : ''
          }`}
        >
          {isAnalyzing || isLoading ? (
            <span className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#D71920] animate-ping" />
              THE CRITIC IS STUDYING THE PIECE...
            </span>
          ) : (
            <span>[ SUBMIT FOR JUDGEMENT ]</span>
          )}
        </button>

        <span className="font-mono text-xs text-[#929292]">
          VERDICT IS NON-NEGOTIABLE • (OR PERHAPS IT IS)
        </span>
      </div>
    </section>
  );
};

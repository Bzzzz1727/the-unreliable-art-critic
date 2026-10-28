import React, { useState } from 'react';
import { Artwork } from '../types';
import { Maximize2, Minimize2, Eye } from 'lucide-react';

interface ArtworkPanelProps {
  artwork: Artwork;
  onReplaceClick?: () => void;
}

export const ArtworkPanel: React.FC<ArtworkPanelProps> = ({ artwork, onReplaceClick }) => {
  const [isZoomed, setIsZoomed] = useState<boolean>(false);

  return (
    <div className="space-y-6">
      {/* Artwork Display Frame */}
      <div className="border border-[#292929] bg-[#050505] p-3 sm:p-5">
        <div className="flex items-center justify-between pb-3 border-b border-[#292929] font-mono text-[11px] text-[#929292]">
          <span className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 bg-[#D71920]" />
            EXHIBIT ID: {artwork.id}
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsZoomed(!isZoomed)}
              className="hover:text-[#F5F5F5] transition-colors flex items-center gap-1 border border-[#292929] px-2 py-0.5"
              title="Toggle gallery zoom view"
            >
              {isZoomed ? <Minimize2 className="w-3 h-3" /> : <Maximize2 className="w-3 h-3" />}
              <span>{isZoomed ? 'SHRINK' : 'INSPECT'}</span>
            </button>
          </div>
        </div>

        {/* Framing */}
        <div className="my-4 bg-black border border-[#292929] p-3 sm:p-6 flex items-center justify-center overflow-hidden">
          <img
            src={artwork.dataUrl}
            alt={artwork.fileName}
            className={`max-w-full object-contain transition-all duration-300 ${
              isZoomed ? 'max-h-[85vh] scale-105' : 'max-h-[480px]'
            }`}
          />
        </div>

        {/* Basic caption */}
        <div className="flex items-center justify-between font-mono text-[10px] text-[#929292]">
          <span>{artwork.fileName}</span>
          <span>{artwork.fileSizeFormatted}</span>
        </div>
      </div>

      {/* Metadata & Statement Card */}
      <div className="border border-[#292929] bg-[#050505] p-4 sm:p-6 space-y-4 font-mono text-xs">
        <div className="text-[#929292] uppercase tracking-wider text-[11px] border-b border-[#292929] pb-2 flex items-center justify-between">
          <span>CURATORIAL ARCHIVE RECORD</span>
          <Eye className="w-3.5 h-3.5 text-[#D71920]" />
        </div>

        <div className="grid grid-cols-2 gap-3 text-[11px]">
          <div>
            <span className="text-[#929292] block">CATEGORY</span>
            <span className="text-[#F5F5F5] font-bold">{artwork.category.toUpperCase()}</span>
          </div>
          <div>
            <span className="text-[#929292] block">ASPECT RATIO</span>
            <span className="text-[#F5F5F5]">{artwork.analysis.aspectRatio}</span>
          </div>
          <div>
            <span className="text-[#929292] block">RESOLUTION</span>
            <span className="text-[#F5F5F5]">
              {artwork.analysis.width} × {artwork.analysis.height} PX
            </span>
          </div>
          <div>
            <span className="text-[#929292] block">SUBMITTED AT</span>
            <span className="text-[#F5F5F5]">{artwork.submittedAt}</span>
          </div>
        </div>

        {/* Dominant Palette extracted by real canvas pixel sampling */}
        <div className="pt-2 border-t border-[#292929]">
          <span className="text-[#929292] block mb-2 text-[10px] uppercase tracking-wider">
            CANVAS CHROMATIC DENSITY (EXTRACTED)
          </span>
          <div className="flex items-center gap-2">
            {artwork.analysis.dominantColors.map((hex, i) => (
              <div key={i} className="flex-1 group relative">
                <div
                  className="h-5 w-full border border-[#292929]"
                  style={{ backgroundColor: hex }}
                />
                <span className="block text-[9px] text-[#929292] font-mono mt-1 text-center truncate">
                  {hex}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Artist statement if present */}
        {artwork.statement && (
          <div className="pt-2 border-t border-[#292929]">
            <span className="text-[#929292] block mb-1 text-[10px] uppercase tracking-wider">
              ARTIST'S FILED TESTIMONY
            </span>
            <p className="font-serif italic text-sm text-[#F5F5F5] leading-relaxed border-l border-[#D71920] pl-3">
              “{artwork.statement}”
            </p>
          </div>
        )}

        {/* Curator caution note */}
        <div className="pt-2 border-t border-[#292929] text-[10px] text-[#929292] leading-tight">
          <span className="text-[#D71920] font-bold">NOTE: </span>
          The visual artifact is held in volatile memory. Physical evidence may be summoned during cross-examination.
        </div>
      </div>
    </div>
  );
};

import React, { useState, useEffect } from 'react';
import { ArchiveRecord } from '../types';
import {
  getAllArchiveRecords,
  deleteArchiveRecord,
  clearAllArchiveRecords
} from '../services/archiveStorage';
import {
  Search,
  ArrowLeft,
  Trash2,
  Calendar,
  Sparkles,
  ExternalLink,
  AlertTriangle,
  FolderArchive,
  ArrowUpDown
} from 'lucide-react';
import { playClick, playTrash } from '../utils/soundEffects';

interface ArchivePageProps {
  onReturnToCritic: () => void;
  onOpenRecord: (record: ArchiveRecord) => void;
  theme: 'day' | 'night';
}

export const ArchivePage: React.FC<ArchivePageProps> = ({
  onReturnToCritic,
  onOpenRecord,
  theme
}) => {
  const [records, setRecords] = useState<ArchiveRecord[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'highest' | 'lowest'>('newest');
  const [confirmClearOpen, setConfirmClearOpen] = useState<boolean>(false);
  const [selectedRecordForDetail, setSelectedRecordForDetail] = useState<ArchiveRecord | null>(null);

  // Load records on mount
  useEffect(() => {
    let isMounted = true;
    getAllArchiveRecords().then((items) => {
      if (isMounted) {
        setRecords(items);
        setIsLoading(false);
      }
    });
    return () => { isMounted = false; };
  }, []);

  const handleDeleteRecord = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    playTrash();
    await deleteArchiveRecord(id);
    setRecords((prev) => prev.filter((r) => r.id !== id));
    if (selectedRecordForDetail?.id === id) {
      setSelectedRecordForDetail(null);
    }
  };

  const handleClearAll = async () => {
    playTrash();
    await clearAllArchiveRecords();
    setRecords([]);
    setConfirmClearOpen(false);
    setSelectedRecordForDetail(null);
  };

  // Derive unique categories
  const categories = ['ALL', ...Array.from(new Set(records.map((r) => r.category).filter(Boolean)))];

  // Filter & Sort
  const filteredRecords = records
    .filter((r) => {
      const matchesSearch =
        r.fileName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.firstImpression.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = selectedCategory === 'ALL' || r.category.toLowerCase() === selectedCategory.toLowerCase();
      return matchesSearch && matchesCategory;
    })
    .sort((a, b) => {
      if (sortBy === 'newest') return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      if (sortBy === 'oldest') return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      if (sortBy === 'highest') return b.score - a.score;
      if (sortBy === 'lowest') return a.score - b.score;
      return 0;
    });

  return (
    <div
      className="h-full w-full flex flex-col justify-between overflow-hidden select-none"
      style={{ backgroundColor: 'var(--bg)', color: 'var(--text)' }}
    >
      {/* Subheader Toolbar */}
      <div
        className="shrink-0 border-b px-4 py-2.5 flex flex-wrap items-center justify-between gap-3"
        style={{ backgroundColor: 'var(--panel)', borderColor: 'var(--border)' }}
      >
        <div className="flex items-center gap-2">
          <button
            onClick={() => { playClick(); onReturnToCritic(); }}
            className="sticker-btn text-xs py-1 px-3 flex items-center gap-1.5 font-bold"
            title="Return to Critic"
          >
            <ArrowLeft className="w-3.5 h-3.5 text-accent" />
            <span>[ RETURN TO CRITIC ]</span>
          </button>
          <div className="h-4 w-[1px] bg-border mx-1 hidden sm:block" />
          <div className="flex items-center gap-1.5 font-mono text-xs">
            <FolderArchive className="w-4 h-4 text-accent" />
            <strong className="text-text uppercase font-bold">ARTWORK ARCHIVE</strong>
            <span className="text-muted text-[11px]">({records.length} records)</span>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Search Input */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-muted absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search filename or feedback..."
              className="pl-8 pr-3 py-1 text-xs font-mono rounded-xl border focus:outline-none focus:border-accent w-44 sm:w-56"
              style={{
                backgroundColor: 'var(--bg)',
                borderColor: 'var(--border)',
                color: 'var(--text)'
              }}
            />
          </div>

          {/* Sort Selector */}
          <div className="flex items-center gap-1 font-mono text-xs">
            <ArrowUpDown className="w-3.5 h-3.5 text-muted" />
            <select
              value={sortBy}
              onChange={(e: any) => setSortBy(e.target.value)}
              className="py-1 px-2 text-xs font-mono rounded-xl border focus:outline-none focus:border-accent"
              style={{
                backgroundColor: 'var(--bg)',
                borderColor: 'var(--border)',
                color: 'var(--text)'
              }}
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="highest">Highest Score</option>
              <option value="lowest">Lowest Score</option>
            </select>
          </div>

          {/* Clear Archive Button */}
          {records.length > 0 && (
            <button
              onClick={() => { playClick(); setConfirmClearOpen(true); }}
              className="sticker-btn text-[10px] py-1 px-2.5 text-muted hover:text-accent"
              title="Clear entire archive"
            >
              <Trash2 className="w-3 h-3 text-accent" />
              <span className="hidden sm:inline">CLEAR ARCHIVE</span>
            </button>
          )}
        </div>
      </div>

      {/* Category Filter Pills */}
      <div
        className="shrink-0 px-4 py-1.5 border-b flex items-center gap-1.5 overflow-x-auto panel-scroll"
        style={{ backgroundColor: 'var(--bg)', borderColor: 'var(--border)' }}
      >
        <span className="font-mono text-[9px] font-bold text-muted uppercase mr-1">CATEGORY:</span>
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => { playClick(); setSelectedCategory(cat); }}
            className={`font-mono text-[10px] px-2.5 py-0.5 rounded-lg border transition-all ${
              selectedCategory === cat
                ? 'bg-text text-bg border-text font-bold shadow-sticker'
                : 'bg-panel text-muted border-border hover:text-text'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Gallery Cards Grid */}
      <div className="flex-1 min-h-0 overflow-y-auto panel-scroll p-4 sm:p-6">
        {isLoading ? (
          <div className="h-full flex items-center justify-center font-mono text-xs text-muted">
            LOADING SAVED EXHIBITION RECORDS...
          </div>
        ) : filteredRecords.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center space-y-2 font-mono text-xs text-muted max-w-sm mx-auto">
            <FolderArchive className="w-8 h-8 text-muted/60" />
            <p className="font-bold text-text">NO ARCHIVE RECORDS FOUND</p>
            <p className="text-[11px] font-sans">
              {searchQuery || selectedCategory !== 'ALL'
                ? 'Try adjusting your search query or category filters.'
                : 'Artworks analyzed by the critic will be preserved here in high-resolution with their ratified scores and feedback.'}
            </p>
            <button
              onClick={() => { playClick(); onReturnToCritic(); }}
              className="sticker-btn-accent text-xs py-1.5 px-3 mt-2"
            >
              SUBMIT ARTWORK FOR CRITIQUE
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 max-w-7xl mx-auto">
            {filteredRecords.map((record) => (
              <div
                key={record.id}
                onClick={() => { playClick(); onOpenRecord(record); }}
                className="border-2 rounded-2xl overflow-hidden shadow-sticker flex flex-col group cursor-pointer hover:border-accent transition-all duration-200"
                style={{
                  backgroundColor: 'var(--panel)',
                  borderColor: 'var(--border)'
                }}
              >
                {/* Visual Thumbnail */}
                <div
                  className="relative h-44 sm:h-48 w-full border-b flex items-center justify-center p-3 overflow-hidden"
                  style={{ backgroundColor: 'var(--bg)', borderColor: 'var(--border)' }}
                >
                  <img
                    src={record.dataUrl}
                    alt={record.fileName}
                    className="artwork-preserve max-h-full max-w-full object-contain rounded-md transition-transform duration-300 group-hover:scale-105"
                  />

                  {/* Score Pill in Top Right */}
                  <div
                    className="absolute top-2.5 right-2.5 px-2 py-0.5 rounded-xl border-2 font-mono text-xs font-black shadow-sticker flex items-baseline gap-0.5"
                    style={{
                      backgroundColor: 'var(--accent)',
                      borderColor: 'var(--border)',
                      color: '#FFFFFF'
                    }}
                  >
                    <span>{record.score}</span>
                    <span className="text-[9px] font-bold opacity-80">/10</span>
                  </div>

                  {/* Category Pill in Top Left */}
                  <span
                    className="absolute top-2.5 left-2.5 px-2 py-0.5 rounded-lg border font-mono text-[9px] font-bold uppercase shadow-xs"
                    style={{
                      backgroundColor: 'var(--panel)',
                      borderColor: 'var(--border)',
                      color: 'var(--text)'
                    }}
                  >
                    {record.category}
                  </span>
                </div>

                {/* Card Meta & Excerpt */}
                <div className="p-3.5 flex-1 flex flex-col justify-between space-y-2 text-left">
                  <div>
                    <strong className="block text-text font-bold text-xs truncate group-hover:text-accent transition-colors">
                      {record.fileName}
                    </strong>
                    <div className="flex items-center gap-1 font-mono text-[9px] text-muted mt-0.5">
                      <Calendar className="w-2.5 h-2.5" />
                      <span>{new Date(record.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                    </div>

                    <p className="font-sans text-[11px] text-muted line-clamp-2 mt-2 leading-snug">
                      “{record.firstImpression || record.biggestProblem}”
                    </p>
                  </div>

                  {/* Actions Row */}
                  <div className="pt-2 border-t flex items-center justify-between font-mono text-[10px]" style={{ borderColor: 'var(--border)' }}>
                    <span className="text-accent font-bold flex items-center gap-1 group-hover:underline">
                      <ExternalLink className="w-3 h-3" />
                      VIEW CRITIQUE
                    </span>

                    <button
                      onClick={(e) => handleDeleteRecord(record.id, e)}
                      className="text-muted hover:text-accent p-1 rounded transition-colors"
                      title="Delete this record"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Confirmation Modal to Clear Archive */}
      {confirmClearOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div
            className="w-full max-w-sm border-2 rounded-2xl p-5 shadow-sticker-lg anim-pop-in space-y-3 text-left"
            style={{ backgroundColor: 'var(--panel)', borderColor: 'var(--border)' }}
          >
            <div className="flex items-center gap-2 font-mono text-xs font-bold text-accent">
              <AlertTriangle className="w-4 h-4" />
              <span>CLEAR ENTIRE ARTWORK ARCHIVE?</span>
            </div>
            <p className="font-sans text-xs text-text leading-relaxed">
              This will permanently delete all {records.length} saved artwork critique records from this browser. This action cannot be undone.
            </p>
            <div className="pt-2 border-t flex items-center justify-end gap-2 font-mono text-xs" style={{ borderColor: 'var(--border)' }}>
              <button
                onClick={() => { playClick(); setConfirmClearOpen(false); }}
                className="sticker-btn text-xs py-1 px-3"
              >
                CANCEL
              </button>
              <button
                onClick={handleClearAll}
                className="sticker-btn-accent text-xs py-1 px-3 font-bold"
              >
                CLEAR ALL
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

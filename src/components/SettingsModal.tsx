import React, { useState, useEffect } from 'react';
import {
  X,
  Sliders,
  CheckCircle,
  AlertTriangle,
  Key,
  Cpu,
  ShieldCheck,
  Brain,
  Trash2,
  Edit2,
  Save,
  Check,
  Info
} from 'lucide-react';
import { getStoredApiKey, saveStoredApiKey } from '../services/criticEngine';
import {
  getMemorySettings,
  saveMemorySettings,
  getAllMemories,
  updateMemory,
  deleteMemory,
  clearAllMemories
} from '../services/memoryStorage';
import { CriticMemoryItem } from '../types';
import { playClick, playTrash } from '../utils/soundEffects';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApiKeyUpdated: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose, onApiKeyUpdated }) => {
  const [activeTab, setActiveTab] = useState<'engine' | 'memory'>('engine');

  // Engine state
  const [apiKeyInput, setApiKeyInput] = useState<string>('');
  const [hasSavedKey, setHasSavedKey] = useState<boolean>(false);
  const [testStatus, setTestStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');
  const [testMessage, setTestMessage] = useState<string>('');

  // Memory state
  const [memoryEnabled, setMemoryEnabled] = useState<boolean>(true);
  const [memories, setMemories] = useState<CriticMemoryItem[]>([]);
  const [editingMemoryId, setEditingMemoryId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState<string>('');
  const [editDesc, setEditDesc] = useState<string>('');
  const [confirmClearMemory, setConfirmClearMemory] = useState<boolean>(false);

  useEffect(() => {
    if (isOpen) {
      const existing = getStoredApiKey();
      setApiKeyInput(existing);
      setHasSavedKey(Boolean(existing));
      setTestStatus('idle');
      setTestMessage('');

      const memSettings = getMemorySettings();
      setMemoryEnabled(memSettings.isEnabled);
      setMemories(getAllMemories());
      setEditingMemoryId(null);
      setConfirmClearMemory(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Engine Handlers
  const handleSaveKey = () => {
    playClick();
    saveStoredApiKey(apiKeyInput);
    setHasSavedKey(Boolean(apiKeyInput.trim()));
    onApiKeyUpdated();
    setTestMessage('Configuration saved in browser localStorage.');
    setTestStatus('success');
  };

  const handleClearKey = () => {
    playClick();
    saveStoredApiKey('');
    setApiKeyInput('');
    setHasSavedKey(false);
    onApiKeyUpdated();
    setTestMessage('Custom key cleared. Active: Local Neural Heuristic Engine.');
    setTestStatus('idle');
  };

  const handleTestConnection = async () => {
    if (!apiKeyInput.trim()) {
      setTestStatus('error');
      setTestMessage('Please input a Gemini API Key first.');
      return;
    }

    try {
      setTestStatus('testing');
      setTestMessage('Pinging Google Generative Language API...');

      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKeyInput.trim()}`
      );

      if (res.ok) {
        setTestStatus('success');
        setTestMessage('CONNECTION VERIFIED: Google Gemini API is accessible and authenticated.');
      } else {
        setTestStatus('error');
        setTestMessage(`CONNECTION REJECTED (${res.status}): Verify that the key is valid.`);
      }
    } catch (e: any) {
      setTestStatus('error');
      setTestMessage(`NETWORK ERROR: ${e?.message || 'Unable to reach Gemini API endpoint.'}`);
    }
  };

  // Memory Handlers
  const handleToggleMemory = () => {
    playClick();
    const next = !memoryEnabled;
    setMemoryEnabled(next);
    saveMemorySettings({ isEnabled: next });
  };

  const handleStartEditMemory = (m: CriticMemoryItem) => {
    playClick();
    setEditingMemoryId(m.id);
    setEditTitle(m.title);
    setEditDesc(m.description);
  };

  const handleSaveEditMemory = (id: string) => {
    playClick();
    updateMemory(id, {
      title: editTitle.trim(),
      description: editDesc.trim()
    });
    setMemories(getAllMemories());
    setEditingMemoryId(null);
  };

  const handleDeleteMemory = (id: string) => {
    playTrash();
    deleteMemory(id);
    setMemories(getAllMemories());
    if (editingMemoryId === id) setEditingMemoryId(null);
  };

  const handleClearAllMemory = () => {
    playTrash();
    clearAllMemories();
    setMemories([]);
    setConfirmClearMemory(false);
  };

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
        className="relative w-full max-w-xl border-t-2 sm:border-2 rounded-t-2xl sm:rounded-2xl p-4 sm:p-5 shadow-sticker-lg anim-pop-in space-y-3 sm:space-y-4 max-h-[92dvh] sm:max-h-[88dvh] flex flex-col"
        style={{
          backgroundColor: 'var(--panel)',
          borderColor: 'var(--border)',
          color: 'var(--text)',
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
          <div className="flex items-center gap-2">
            <Sliders className="w-4 h-4 text-accent" />
            <span className="font-bold uppercase tracking-wider text-text">CRITIC CONFIGURATION</span>
          </div>
          <button
            onClick={() => { playClick(); onClose(); }}
            className="text-muted hover:text-text p-1.5 rounded-lg transition-colors min-h-[36px] min-w-[36px] flex items-center justify-center"
            aria-label="Close Settings"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-1.5 border-b pb-1.5 shrink-0" style={{ borderColor: 'var(--border)' }}>
          <button
            onClick={() => { playClick(); setActiveTab('engine'); }}
            className={`font-mono text-xs font-bold px-3 py-1 rounded-xl border transition-all flex items-center gap-1.5 ${
              activeTab === 'engine'
                ? 'bg-text text-bg border-text shadow-sticker'
                : 'bg-panel text-muted border-border hover:text-text'
            }`}
          >
            <Cpu className="w-3.5 h-3.5 text-accent" />
            <span>[ AI ENGINE ]</span>
          </button>
          <button
            onClick={() => { playClick(); setActiveTab('memory'); }}
            className={`font-mono text-xs font-bold px-3 py-1 rounded-xl border transition-all flex items-center gap-1.5 ${
              activeTab === 'memory'
                ? 'bg-text text-bg border-text shadow-sticker'
                : 'bg-panel text-muted border-border hover:text-text'
            }`}
          >
            <Brain className="w-3.5 h-3.5 text-accent" />
            <span>[ CRITIC MEMORY ({memories.length}) ]</span>
          </button>
        </div>

        {/* Tab 1: AI Engine */}
        {activeTab === 'engine' && (
          <div className="overflow-y-auto panel-scroll flex-1 space-y-4 pr-1 font-mono text-xs">
            {/* Active Pipeline Status */}
            <div
              className="border-2 rounded-xl p-3 space-y-2"
              style={{ backgroundColor: 'var(--bg)', borderColor: 'var(--border)' }}
            >
              <div className="flex items-center justify-between border-b pb-1.5" style={{ borderColor: 'var(--border)' }}>
                <span className="text-[10px] text-muted uppercase">ACTIVE PIPELINE:</span>
                <span className="flex items-center gap-1.5 text-text font-bold text-[11px]">
                  {hasSavedKey ? (
                    <>
                      <Key className="w-3.5 h-3.5 text-accent" />
                      <span>GEMINI MULTIMODAL VISION API (CONNECTED)</span>
                    </>
                  ) : (
                    <>
                      <Cpu className="w-3.5 h-3.5 text-accent" />
                      <span>LOCAL AUTONOMOUS CANVAS ENGINE</span>
                    </>
                  )}
                </span>
              </div>

              <p className="font-sans text-[11px] text-muted leading-relaxed">
                {hasSavedKey
                  ? 'Transmits image base64 directly to Google Gemini 2.0 Flash for bespoke cloud vision analysis.'
                  : 'Runs 100% locally in your browser. Samples canvas telemetry (luminance, contrast, dimensions, color histogram) with zero network calls and zero rate limits.'}
              </p>
            </div>

            {/* Gemini API Key Section */}
            <div className="space-y-2">
              <label className="block text-[11px] font-bold text-text uppercase">
                GOOGLE GEMINI API KEY (OPTIONAL):
              </label>
              <div className="flex gap-2">
                <input
                  type="password"
                  value={apiKeyInput}
                  onChange={(e) => setApiKeyInput(e.target.value)}
                  placeholder="AIzaSy..."
                  className="flex-1 border-2 rounded-xl px-3 py-2 text-base sm:text-xs text-text font-mono focus:outline-none focus:border-accent min-h-[40px]"
                  style={{
                    backgroundColor: 'var(--bg)',
                    borderColor: 'var(--border)'
                  }}
                />
                <button
                  onClick={handleSaveKey}
                  className="sticker-btn-accent text-xs py-1.5 px-3 shrink-0"
                >
                  SAVE
                </button>
                {hasSavedKey && (
                  <button
                    onClick={handleClearKey}
                    className="sticker-btn text-xs py-1.5 px-2.5 shrink-0 text-accent"
                  >
                    CLEAR
                  </button>
                )}
              </div>

              <div className="flex items-center justify-between text-[10px] text-muted pt-0.5">
                <span className="flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3 text-accent" />
                  Saved strictly in your browser localStorage.
                </span>
                <button
                  onClick={handleTestConnection}
                  className="text-text underline font-bold hover:text-accent"
                >
                  [ TEST KEY ]
                </button>
              </div>
            </div>

            {/* Test Result Message */}
            {testMessage && (
              <div
                className="p-2.5 rounded-xl border-2 font-mono text-[10px] flex items-center gap-2"
                style={{
                  backgroundColor: testStatus === 'error' ? 'var(--bg)' : 'var(--panel)',
                  borderColor: testStatus === 'error' ? 'var(--accent)' : 'var(--border)',
                  color: testStatus === 'error' ? 'var(--accent)' : 'var(--text)'
                }}
              >
                {testStatus === 'success' && <CheckCircle className="w-3.5 h-3.5 text-text" />}
                {testStatus === 'error' && <AlertTriangle className="w-3.5 h-3.5 text-accent" />}
                <span>{testMessage}</span>
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Critic Memory */}
        {activeTab === 'memory' && (
          <div className="overflow-y-auto panel-scroll flex-1 space-y-3 pr-1 text-xs">
            {/* Memory Enable/Disable Switch & Explainer */}
            <div
              className="border-2 rounded-xl p-3 space-y-2 shadow-xs text-left"
              style={{ backgroundColor: 'var(--bg)', borderColor: 'var(--border)' }}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 font-mono">
                  <Brain className="w-4 h-4 text-accent" />
                  <strong className="text-text font-bold uppercase">PERSISTENT DESIGN MEMORY</strong>
                </div>

                <button
                  onClick={handleToggleMemory}
                  className={`font-mono text-xs font-bold px-3 py-1 rounded-xl border transition-all ${
                    memoryEnabled
                      ? 'bg-accent text-white border-border shadow-sticker'
                      : 'bg-panel text-muted border-border'
                  }`}
                >
                  {memoryEnabled ? 'ENABLED' : 'DISABLED'}
                </button>
              </div>

              <p className="font-sans text-[11px] text-muted leading-relaxed">
                The critic remembers your recurring design strengths, identified weaknesses, stated intentions, and aesthetic patterns across critiques. Stored strictly in your browser.
              </p>
            </div>

            {/* Privacy & Scope Disclaimer */}
            <div
              className="p-2.5 rounded-xl border flex items-start gap-2 font-sans text-[11px] text-muted text-left"
              style={{ backgroundColor: 'var(--panel)', borderColor: 'var(--border)' }}
            >
              <Info className="w-4 h-4 text-accent shrink-0 mt-0.5" />
              <span>
                Memory stores creative patterns only. No passwords, credentials, or personal information are ever recorded. Memory failure is non-fatal: the critic functions normally even if memory is disabled or cleared.
              </span>
            </div>

            {/* List of Remembered Preferences & Patterns */}
            <div className="space-y-2 text-left">
              <div className="flex items-center justify-between font-mono text-[10px] text-muted uppercase">
                <span>STORED KNOWLEDGE ({memories.length} ITEMS):</span>
                {memories.length > 0 && (
                  <button
                    onClick={() => setConfirmClearMemory(true)}
                    className="text-accent hover:underline font-bold"
                  >
                    CLEAR ALL MEMORY
                  </button>
                )}
              </div>

              {memories.length === 0 ? (
                <div
                  className="p-4 rounded-xl border text-center font-mono text-[11px] text-muted"
                  style={{ backgroundColor: 'var(--bg)', borderColor: 'var(--border)' }}
                >
                  No stored memories yet. As you submit artworks and defend design choices, the critic will record recurring patterns here.
                </div>
              ) : (
                <div className="space-y-2">
                  {memories.map((m) => (
                    <div
                      key={m.id}
                      className="border-2 rounded-xl p-3 shadow-xs space-y-1.5 transition-all"
                      style={{ backgroundColor: 'var(--panel)', borderColor: 'var(--border)' }}
                    >
                      <div className="flex items-center justify-between font-mono text-[10px]">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span
                            className="px-2 py-0.5 rounded-md border font-bold uppercase"
                            style={{
                              backgroundColor: m.source === 'user_stated' ? 'var(--accent)' : 'var(--bg)',
                              color: m.source === 'user_stated' ? '#FFFFFF' : 'var(--text)',
                              borderColor: 'var(--border)'
                            }}
                          >
                            {m.source.replace('_', ' ')}
                          </span>
                          {m.category && (
                            <span className="text-muted border px-1.5 py-0.5 rounded" style={{ borderColor: 'var(--border)' }}>
                              {m.category}
                            </span>
                          )}
                          <span className="text-muted">
                            Confidence: {Math.round(m.confidence * 100)}%
                          </span>
                        </div>

                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handleStartEditMemory(m)}
                            className="p-1 text-muted hover:text-text rounded"
                            title="Edit this memory item"
                          >
                            <Edit2 className="w-3 h-3" />
                          </button>
                          <button
                            onClick={() => handleDeleteMemory(m.id)}
                            className="p-1 text-muted hover:text-accent rounded"
                            title="Delete this memory item"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </div>

                      {editingMemoryId === m.id ? (
                        <div className="space-y-1.5 pt-1">
                          <input
                            type="text"
                            value={editTitle}
                            onChange={(e) => setEditTitle(e.target.value)}
                            className="w-full text-xs font-bold font-sans px-2 py-1 rounded border focus:outline-none focus:border-accent"
                            style={{ backgroundColor: 'var(--bg)', borderColor: 'var(--border)', color: 'var(--text)' }}
                          />
                          <textarea
                            value={editDesc}
                            onChange={(e) => setEditDesc(e.target.value)}
                            rows={2}
                            className="w-full text-xs font-sans px-2 py-1 rounded border focus:outline-none focus:border-accent"
                            style={{ backgroundColor: 'var(--bg)', borderColor: 'var(--border)', color: 'var(--text)' }}
                          />
                          <div className="flex justify-end gap-1.5 font-mono text-[10px]">
                            <button
                              onClick={() => setEditingMemoryId(null)}
                              className="sticker-btn text-[10px] py-0.5 px-2"
                            >
                              CANCEL
                            </button>
                            <button
                              onClick={() => handleSaveEditMemory(m.id)}
                              className="sticker-btn-accent text-[10px] py-0.5 px-2 flex items-center gap-1"
                            >
                              <Save className="w-2.5 h-2.5" />
                              SAVE
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div>
                          <strong className="block text-text font-sans font-bold text-xs">{m.title}</strong>
                          <p className="font-sans text-[11px] text-muted leading-relaxed">{m.description}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Confirmation to Clear All Memory */}
            {confirmClearMemory && (
              <div
                className="p-3 rounded-xl border-2 space-y-2 text-left"
                style={{ backgroundColor: 'var(--bg)', borderColor: 'var(--accent)' }}
              >
                <div className="flex items-center gap-1.5 font-mono text-xs font-bold text-accent">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  <span>CONFIRM: PURGE ALL CRITIC MEMORY?</span>
                </div>
                <p className="font-sans text-xs text-muted">
                  This will erase all recorded design patterns and preferences. Your saved artwork archive will NOT be affected.
                </p>
                <div className="flex justify-end gap-2 font-mono text-xs">
                  <button
                    onClick={() => setConfirmClearMemory(false)}
                    className="sticker-btn text-xs py-0.5 px-2.5"
                  >
                    CANCEL
                  </button>
                  <button
                    onClick={handleClearAllMemory}
                    className="sticker-btn-accent text-xs py-0.5 px-2.5"
                  >
                    CONFIRM PURGE
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Footer */}
        <div
          className="border-t pt-2 flex items-center justify-end font-mono text-xs shrink-0"
          style={{ borderColor: 'var(--border)' }}
        >
          <button
            onClick={() => { playClick(); onClose(); }}
            className="sticker-btn text-xs py-1 px-4 text-text hover:text-accent"
          >
            DONE
          </button>
        </div>
      </div>
    </div>
  );
};

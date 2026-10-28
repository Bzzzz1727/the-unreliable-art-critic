import { CriticMemoryItem, MemorySettings, Artwork, CritiqueData } from '../types';

const MEMORY_SETTINGS_KEY = 'CRITIC_MEMORY_SETTINGS_V1';
const MEMORIES_STORE_KEY = 'CRITIC_PERSISTENT_MEMORIES_V1';

/**
 * Retrieve memory settings. Defaults to enabled.
 */
export function getMemorySettings(): MemorySettings {
  try {
    const raw = localStorage.getItem(MEMORY_SETTINGS_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return { isEnabled: true };
}

/**
 * Update memory settings.
 */
export function saveMemorySettings(settings: MemorySettings): void {
  try {
    localStorage.setItem(MEMORY_SETTINGS_KEY, JSON.stringify(settings));
  } catch (err) {
    console.warn('Failed to save memory settings:', err);
  }
}

/**
 * Retrieve all stored memories.
 */
export function getAllMemories(): CriticMemoryItem[] {
  try {
    const raw = localStorage.getItem(MEMORIES_STORE_KEY);
    if (raw) {
      const items: CriticMemoryItem[] = JSON.parse(raw);
      // Sort newest first
      items.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
      return items;
    }
  } catch {}
  return [];
}

/**
 * Save or update a memory item.
 */
export function saveMemory(item: CriticMemoryItem): void {
  const all = getAllMemories().filter(m => m.id !== item.id);
  all.unshift(item);
  try {
    localStorage.setItem(MEMORIES_STORE_KEY, JSON.stringify(all));
  } catch (err) {
    console.warn('Failed to save memory item:', err);
  }
}

/**
 * Update partial memory fields.
 */
export function updateMemory(id: string, updates: Partial<CriticMemoryItem>): void {
  const all = getAllMemories();
  const index = all.findIndex(m => m.id === id);
  if (index !== -1) {
    all[index] = {
      ...all[index],
      ...updates,
      updatedAt: new Date().toISOString()
    };
    try {
      localStorage.setItem(MEMORIES_STORE_KEY, JSON.stringify(all));
    } catch (err) {
      console.warn('Failed to update memory:', err);
    }
  }
}

/**
 * Delete a single memory item by ID.
 */
export function deleteMemory(id: string): void {
  const filtered = getAllMemories().filter(m => m.id !== id);
  try {
    localStorage.setItem(MEMORIES_STORE_KEY, JSON.stringify(filtered));
  } catch (err) {
    console.warn('Failed to delete memory:', err);
  }
}

/**
 * Clear all memories.
 */
export function clearAllMemories(): void {
  try {
    localStorage.removeItem(MEMORIES_STORE_KEY);
  } catch {}
}

/**
 * Retrieve memories relevant to an artwork's category and visual properties.
 */
export function getRelevantMemories(category?: string, analysis?: any): CriticMemoryItem[] {
  const settings = getMemorySettings();
  if (!settings.isEnabled) return [];

  const all = getAllMemories();
  if (all.length === 0) return [];

  // Filter and rank:
  // 1. Matches artwork category
  // 2. High confidence patterns and user stated preferences
  const ranked = all.filter(m => {
    if (!category) return true;
    if (m.category && m.category.toLowerCase() === category.toLowerCase()) return true;
    if (m.source === 'user_stated') return true;
    return m.confidence >= 0.7;
  });

  return ranked.slice(0, 5);
}

/**
 * Automatically analyze a critique result and record or reinforce memory patterns.
 */
export function recordCritiqueToMemory(
  artwork: Artwork,
  critique: CritiqueData,
  userMessage?: string
): void {
  const settings = getMemorySettings();
  if (!settings.isEnabled) return;

  const now = new Date().toISOString();
  const existing = getAllMemories();

  // 1. Check if user stated a preference in interaction
  if (userMessage && userMessage.trim().length > 8) {
    const msg = userMessage.toLowerCase();
    let detectedPref: { title: string; desc: string } | null = null;

    if (msg.includes('asymmetry') || msg.includes('asymmetric')) {
      detectedPref = {
        title: 'Deliberate Asymmetrical Composition',
        desc: 'User stated an intentional preference for asymmetric balance and tension.'
      };
    } else if (msg.includes('minimal') || msg.includes('simplicity')) {
      detectedPref = {
        title: 'Minimalist Editorial Aesthetic',
        desc: 'User aims for high negative space and disciplined reduction.'
      };
    } else if (msg.includes('brutal') || msg.includes('raw') || msg.includes('harsh')) {
      detectedPref = {
        title: 'Brutalist & High-Contrast Direction',
        desc: 'User deliberately employs stark contrast and bold structural forms.'
      };
    }

    if (detectedPref) {
      const id = `mem_pref_${Date.now()}`;
      saveMemory({
        id,
        type: 'preference',
        source: 'user_stated',
        title: detectedPref.title,
        description: detectedPref.desc,
        category: artwork.category,
        confidence: 0.95,
        createdAt: now,
        updatedAt: now
      });
    }
  }

  // 2. Identify and track recurring design weaknesses
  if (critique.biggestProblem?.title) {
    const probTitle = critique.biggestProblem.title;
    // Check if a similar weakness memory already exists
    const match = existing.find(
      m => m.type === 'weakness' && m.title.toLowerCase().includes(probTitle.toLowerCase().slice(0, 15))
    );

    if (match) {
      // Reinforce existing pattern
      updateMemory(match.id, {
        confidence: Math.min(1.0, match.confidence + 0.15),
        description: `Recurring across multiple artworks in ${artwork.category}: ${critique.biggestProblem.evidence || match.description}`,
        updatedAt: now
      });
    } else {
      // Create new weakness pattern
      const id = `mem_weak_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`;
      saveMemory({
        id,
        type: 'weakness',
        source: 'observed_pattern',
        title: probTitle,
        description: `${critique.biggestProblem.evidence} — Impact: ${critique.biggestProblem.consequence || 'Visual competition.'}`,
        category: artwork.category,
        confidence: 0.75,
        createdAt: now,
        updatedAt: now
      });
    }
  }

  // 3. Track recurring strengths
  if (critique.whatWorks?.title) {
    const strengthTitle = critique.whatWorks.title;
    const match = existing.find(
      m => m.type === 'strength' && m.title.toLowerCase().includes(strengthTitle.toLowerCase().slice(0, 15))
    );

    if (match) {
      updateMemory(match.id, {
        confidence: Math.min(1.0, match.confidence + 0.1),
        updatedAt: now
      });
    } else {
      const id = `mem_str_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`;
      saveMemory({
        id,
        type: 'strength',
        source: 'observed_pattern',
        title: strengthTitle,
        description: critique.whatWorks.evidence,
        category: artwork.category,
        confidence: 0.7,
        createdAt: now,
        updatedAt: now
      });
    }
  }
}

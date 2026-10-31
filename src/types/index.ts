export type ArtworkCategory =
  | 'Poster'
  | 'Album cover'
  | 'Branding'
  | 'Illustration'
  | 'Photography'
  | 'Typography'
  | 'Other';

export interface ImageAnalysisData {
  width: number;
  height: number;
  aspectRatio: string;
  isPortrait: boolean;
  isLandscape: boolean;
  isSquare: boolean;
  dominantColors: string[];
  brightnessLevel: 'dark' | 'balanced' | 'bright';
  contrastLevel: 'subdued' | 'moderate' | 'extreme';
  estimatedComplexity: 'minimalist' | 'balanced' | 'dense';
  hasHighSaturation: boolean;
  horizontalBalance?: 'left-heavy' | 'centered' | 'right-heavy';
  verticalBalance?: 'top-heavy' | 'centered' | 'bottom-heavy';
  edgeDensity?: 'sparse-margins' | 'balanced-margins' | 'edge-crowded';
}

export interface Artwork {
  id: string;
  dataUrl: string;
  fileName: string;
  fileSizeFormatted: string;
  category: ArtworkCategory;
  statement: string;
  submittedAt: string;
  analysis: ImageAnalysisData;
}

export type CriticStage = 1 | 2 | 3 | 4 | 5;

export interface CriticStageInfo {
  stage: CriticStage;
  name: string;
  statusLabel: string;
  description: string;
  indicatorTone: string;
}

export interface CritiqueCategoryItem {
  name: string;
  score: number; // 1 to 10
  observation?: string; // Observation
  evidence?: string; // Visual evidence
  consequence?: string; // Design consequence
  fix?: string; // Specific fix
  professional: string;
  unreliable: string;
}

export interface CritiqueVerdict {
  professional: string;
  unreliable: string;
  overallScore: number;
  scoreReason?: string; // Explains primary justification for the score
  firstImpression?: string; // 1-2 direct sentences
  whatWorks?: string; // 1-2 specific strengths supported by visible evidence
  biggestProblem?: string; // The single most consequential weakness
  otherIssues?: string[]; // Up to two additional issues only when genuinely material
  howToFixIt?: string; // Concrete, actionable recommendation
  whatToPreserve?: string; // Strongest existing quality that should not be lost
  engineSource?: 'gemini_vision' | 'autonomous_heuristic';
  apiError?: string; // Captured error message if vision call failed
}

export interface CritiqueData {
  firstImpression: CritiqueCategoryItem;
  whatWorks?: {
    title: string;
    evidence: string;
  };
  biggestProblem?: {
    title: string;
    observation?: string;
    evidence: string;
    consequence: string;
    fix: string;
  };
  otherIssues?: {
    title: string;
    observation?: string;
    evidence: string;
    consequence?: string;
  }[];
  howToImprove?: string[];
  whatToPreserve?: string;
  engineSource?: 'gemini_vision' | 'autonomous_heuristic';
  apiError?: string; // Captured error message if vision call failed
  composition: CritiqueCategoryItem;
  colourAndTexture: CritiqueCategoryItem;
  typography: CritiqueCategoryItem | null; // null if artwork does not feature typography
  concept: CritiqueCategoryItem;
  craftAndExecution?: CritiqueCategoryItem;
  whatCouldImprove: {
    professional: string;
    unreliable: string;
  };
  verdict: CritiqueVerdict;
  generatedAt: string;
}

export interface RedesignDirection {
  number: string;
  code: 'RESTRAINT' | 'DISTORTION' | 'REINTERPRETATION';
  title: string;
  concept: string;
  whatChanges?: string; // What would change
  whyItWorks?: string; // Why it might work
  whatToPreserve?: string; // Which existing qualities should be preserved
  colourTreatment: string;
  composition: string;
  typography: string;
  textureAndEffects: string;
  actionableSteps: string[];
}

export interface BrutalTruthData {
  hardTruth: string; // The Hard Truth: One direct sentence identifying the most important weakness
  evidence: string[]; // The Evidence: 2 or 3 concrete observations from the artwork
  whyItsNotWorking: string; // Why It Isn't Working: Explain the actual impact of those problems
  whatToFixFirst: string[]; // What To Fix First: Three highest-priority changes in order
  whatToKeep: string; // What To Keep: Strongest existing element that should not be lost during revision
  engineSource?: 'gemini_vision' | 'autonomous_heuristic';
  // Optional backward compatibility
  strongestElements?: string[];
  keyImprovements?: string[];
  highestImpactChange?: string;
  directorNotes?: string;
}

export interface ConversationExchange {
  id: string;
  type: 'critique' | 'defense' | 'redesign' | 'challenge' | 'brutal_truth';
  userMessage?: string;
  criticReply: string;
  unreliableNote?: string;
  stage: CriticStage;
  timestamp: string;
  data?: any;
}

export interface ExhibitionRecord {
  artwork: Artwork;
  initialCritique: CritiqueData;
  exchanges: ConversationExchange[];
  currentStage: CriticStage;
  stageLogs: {
    stage: CriticStage;
    label: string;
    reason: string;
    timestamp: string;
  }[];
  finalVerdict?: string;
}

export type MemoryType = 'preference' | 'pattern' | 'weakness' | 'strength' | 'user_goal' | 'observation';
export type MemorySource = 'user_stated' | 'observed_pattern' | 'inference';

export interface CriticMemoryItem {
  id: string;
  type: MemoryType;
  source: MemorySource;
  title: string;
  description: string;
  category?: string;
  confidence: number; // 0.0 to 1.0
  createdAt: string;
  updatedAt: string;
}

export interface MemorySettings {
  isEnabled: boolean;
}

export interface ArchiveRecord {
  id: string;
  fileName: string;
  category: string;
  dataUrl: string; // Persistent base64 raster image data (never temporary object URL)
  createdAt: string;
  score: number;
  scoreReason?: string;
  firstImpression: string;
  whatWorks: string;
  biggestProblem: string;
  howToFixIt: string;
  whatToPreserve?: string;
  engineSource?: 'gemini_vision' | 'autonomous_heuristic';
  critique: CritiqueData;
  brutalTruth?: BrutalTruthData | null;
  exchanges?: ConversationExchange[];
}

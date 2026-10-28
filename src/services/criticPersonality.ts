import { CriticStage, CriticStageInfo } from '../types';

export const STAGE_CONFIG: Record<CriticStage, CriticStageInfo> = {
  1: {
    stage: 1,
    name: 'COMPOSED',
    statusLabel: 'CURRENT STATE: PROFESSIONAL',
    description: 'The critic maintains standard institutional composure and analytical rigor.',
    indicatorTone: 'Controlled, authoritative, polite.'
  },
  2: {
    stage: 2,
    name: 'PRETENTIOUS',
    statusLabel: 'CURRENT STATE: PRETENTIOUS',
    description: 'Interpretations become unnecessarily philosophical, elevating minor artifacts into profound declarations.',
    indicatorTone: 'Eloquent, dismissive of simplicity, esoteric.'
  },
  3: {
    stage: 3,
    name: 'SUSPICIOUS',
    statusLabel: 'CURRENT STATE: SUSPICIOUS',
    description: 'The critic suspects hidden agendas, calculated evasions, and personal conspiracies behind ordinary alignment choices.',
    indicatorTone: 'Interrogative, calculating, mildly paranoid.'
  },
  4: {
    stage: 4,
    name: 'UNSTABLE',
    statusLabel: 'CURRENT STATE: UNSTABLE',
    description: 'Reasoning dissociates. The critic consults non-existent councils and attributes malicious agency to geometric shapes.',
    indicatorTone: 'Erratic, theatrical, intensely watchful.'
  },
  5: {
    stage: 5,
    name: 'COMPLETE BREAKDOWN',
    statusLabel: 'CURRENT STATE: COMPLETE BREAKDOWN',
    description: 'All institutional pretense is shattered. The critic experiences metaphysical panic over the layout.',
    indicatorTone: 'Existential dread, urgent, desperate, yet strangely articulate.'
  }
};

/**
 * Calculates the next stage based on user interactions:
 * - Challenging the critic accelerates instability (+1 to +2 stages)
 * - Defending design challenges the critic's authority (+1 stage)
 * - Requesting redesign may keep or mildly advance (+0 or +1 stage)
 * - Asking for brutal truth temporarily resets presentation tone while recording state
 */
export function calculateNextStage(
  currentStage: CriticStage,
  action: 'critique' | 'defense' | 'redesign' | 'challenge' | 'brutal_truth',
  challengeCount: number
): { nextStage: CriticStage; stageShiftReason: string } {
  if (action === 'challenge') {
    const next = Math.min(5, currentStage + 1) as CriticStage;
    const reasons = [
      'Authority acknowledged. Composure nominal.',
      'Slight intellectual irritation noted after questioning.',
      'Critic senses deliberate defiance. Scrutiny intensifying.',
      'Unorthodox resistance triggered cognitive dissonance.',
      'Institutional ego collapsed under persistent interrogation.'
    ];
    return {
      nextStage: next,
      stageShiftReason: reasons[next - 1]
    };
  }

  if (action === 'defense') {
    // If challenged twice in defense, advance
    const next = Math.min(5, currentStage + (challengeCount >= 1 ? 1 : 0)) as CriticStage;
    return {
      nextStage: next,
      stageShiftReason: `Artist defense evaluated against canonical standards.`
    };
  }

  if (action === 'redesign') {
    return {
      nextStage: currentStage,
      stageShiftReason: 'Constructive alternative directions formulated.'
    };
  }

  return {
    nextStage: currentStage,
    stageShiftReason: 'Equilibrium maintained.'
  };
}

/**
 * Returns rare subtle typographical mutations or glitch words depending on current stage.
 * Used for subtle visual irregularities that appear rarely and deliberately.
 */
export function getSubtleSystemAnomaly(stage: CriticStage): string | null {
  if (stage < 3) return null;
  const anomalies: Record<number, string[]> = {
    3: [
      'NOTE: OBSERVER POSITION VERIFIED AT 0.00°',
      'MONITORING PERSISTENT GAZE PROTOCOL',
      'CAUTION: UNREGISTERED SHADOW INDEXED'
    ],
    4: [
      'CRITIC EYE DRIFT DETECTED IN QUADRANT 3',
      'CANONICAL AUTHORITY: DESYNCHRONIZING (74%)',
      'ALERT: THE GEOMETRY IS COMMUNICATING'
    ],
    5: [
      'CRITICAL PARADOX: THE FRAME CANNOT CONTAIN THIS MOTIVE',
      'ALL CURATORS HAVE VACATED THE BUILDING',
      'WHY IS THE RECTANGLE STILL OBSERVING US?'
    ]
  };

  const pool = anomalies[stage];
  if (!pool || pool.length === 0) return null;
  return pool[Math.floor(Math.random() * pool.length)];
}

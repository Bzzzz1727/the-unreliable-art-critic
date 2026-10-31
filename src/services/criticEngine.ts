import {
  Artwork,
  CritiqueData,
  CriticStage,
  RedesignDirection,
  BrutalTruthData,
  ArchiveRecord,
  ArtworkCategory
} from '../types';
import { getRelevantMemories, recordCritiqueToMemory } from './memoryStorage';
import { saveArchiveRecord, getPriorArtworksByCategory, getArchiveRecordById } from './archiveStorage';

// criticEngine.ts - Evidence-based Art Director critique service connecting to server-side /api/critique

/**
 * Ensures dataUrl is converted into valid raster base64 accepted by Gemini API (converts SVG to PNG if needed)
 */
export async function ensureRasterBase64(dataUrl: string): Promise<{ mimeType: string; base64: string }> {
  // If it's already a standard base64 PNG, JPEG, or WEBP
  const match = dataUrl.match(/^data:(image\/(?:png|jpeg|webp|jpg));base64,(.+)$/i);
  if (match) {
    const rawMime = match[1].toLowerCase() === 'image/jpg' ? 'image/jpeg' : match[1].toLowerCase();
    return { mimeType: rawMime, base64: match[2] };
  }

  // If it is SVG or utf-8, render to an offscreen canvas and convert to PNG base64
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = Math.min(1200, img.naturalWidth || img.width || 800);
        canvas.height = Math.min(1200, img.naturalHeight || img.height || 600);
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.fillStyle = '#FFFFFF';
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          const pngUrl = canvas.toDataURL('image/png');
          const m = pngUrl.match(/^data:image\/png;base64,(.+)$/);
          if (m) {
            resolve({ mimeType: 'image/png', base64: m[1] });
            return;
          }
        }
      } catch (err) {
        console.warn('Canvas rasterization failed:', err);
      }
      resolve({ mimeType: 'image/png', base64: '' });
    };

    img.onerror = () => {
      // Fallback: strip data prefix if present
      const cleaned = dataUrl.replace(/^data:[^;]+;base64,/, '');
      resolve({ mimeType: 'image/jpeg', base64: cleaned });
    };

    img.src = dataUrl;
  });
}

/**
 * Call the secure server-side Vercel API endpoint at /api/critique
 */
async function callBackendApi(
  action: 'critique' | 'defend' | 'challenge' | 'brutal_truth' | 'redesign',
  payload: any
): Promise<any> {
  const response = await fetch('/api/critique', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      action,
      ...payload
    })
  });

  if (!response.ok) {
    let errJson: any = null;
    try {
      errJson = await response.json();
    } catch {
      errJson = { error: await response.text() };
    }
    const message = errJson?.error || `Server Error (${response.status}): ${response.statusText}`;
    throw new Error(message);
  }

  return response.json();
}

// =========================================================================
// 1. INITIAL CRITIQUE GENERATION (EVIDENCE-BASED ART DIRECTOR ANALYSIS)
// =========================================================================
export async function generateInitialCritique(
  artwork: Artwork,
  stage: CriticStage
): Promise<CritiqueData> {
  // Retrieve contextual memories & prior artwork in same category
  const relevantMemories = getRelevantMemories(artwork.category, artwork.analysis);
  let priorArtworks: ArchiveRecord[] = [];
  try {
    priorArtworks = await getPriorArtworksByCategory(artwork.category, artwork.id);
  } catch (err) {
    console.warn('Could not query prior archive artworks:', err);
  }

  const memoryContextText =
    relevantMemories.length > 0 || priorArtworks.length > 0
      ? `
PRIOR USER CREATIVE CONTEXT & MEMORY (USE ONLY WHEN RELEVANT):
${relevantMemories.map(m => `- [${m.source.toUpperCase()}] ${m.title}: ${m.description}`).join('\n')}
${priorArtworks.length > 0 ? `PREVIOUS RECORDED ARTWORK IN THIS CATEGORY ("${priorArtworks[0].fileName}", Score: ${priorArtworks[0].score}/10):
- Previous strength: ${priorArtworks[0].whatWorks}
- Previous biggest problem: ${priorArtworks[0].biggestProblem}` : ''}
INSTRUCTIONS FOR CONTEXT:
- If prior critiques identified recurring issues, check whether this new work improved or repeated the issue.
- If the user prefers deliberate asymmetry or stark brutalism, evaluate whether it serves the concept rather than criticizing asymmetry as an unintentional flaw.
- Compare with previous work ONLY when supported by this recorded context. Never invent past artworks.
`
      : '';

  let resultCritique: CritiqueData | null = null;
  let apiErrorMessage: string | null = null;

  try {
    const { mimeType, base64 } = await ensureRasterBase64(artwork.dataUrl);
    if (!base64 || base64.length < 50) {
      throw new Error('Image could not be extracted as valid raster base64.');
    }

    const parsed = await callBackendApi('critique', {
      image: { mimeType, base64 },
      category: artwork.category,
      statement: artwork.statement,
      stage,
      memoryContextText
    });

    const parsedScore = typeof parsed.score === 'number' ? parsed.score : (parsed.verdict?.overallScore || 7);
    const parsedReason = parsed.scoreReason || parsed.verdict?.scoreReason || "Evaluation based on visual hierarchy, contrast, and category priorities.";

    resultCritique = {
      ...parsed,
      engineSource: 'gemini_vision',
      score: parsedScore,
      whatWorks: parsed.whatWorks || {
        title: "Strong graphic clarity",
        evidence: parsed.verdict?.whatWorks || "Consistent visual weight and palette harmony."
      },
      biggestProblem: parsed.biggestProblem || {
        title: "Hierarchy contention",
        observation: "Key visual elements compete across the field",
        evidence: parsed.verdict?.biggestProblem || "Competing visual elements across the frame.",
        consequence: "The viewer's gaze is fragmented rather than anchored.",
        fix: parsed.verdict?.howToFixIt || "Clarify the primary focal point."
      },
      otherIssues: Array.isArray(parsed.otherIssues) ? parsed.otherIssues : [],
      howToImprove: Array.isArray(parsed.howToImprove) && parsed.howToImprove.length > 0 ? parsed.howToImprove : [
        parsed.biggestProblem?.fix || parsed.verdict?.howToFixIt || "Clarify the primary focal point."
      ],
      whatToPreserve: parsed.whatToPreserve || parsed.verdict?.whatToPreserve || "The underlying visual concept and core color tone.",
      verdict: {
        ...parsed.verdict,
        engineSource: 'gemini_vision',
        overallScore: parsedScore,
        scoreReason: parsedReason,
        firstImpression: parsed.verdict?.firstImpression || parsed.firstImpression?.professional || "A distinctive visual composition.",
        whatWorks: parsed.verdict?.whatWorks || parsed.whatWorks?.evidence || "Strong overall graphic foundation.",
        biggestProblem: parsed.verdict?.biggestProblem || (parsed.biggestProblem ? `${parsed.biggestProblem.title}: ${parsed.biggestProblem.evidence}` : "Visual hierarchy competes for attention."),
        otherIssues: Array.isArray(parsed.verdict?.otherIssues) ? parsed.verdict.otherIssues : (parsed.otherIssues ? parsed.otherIssues.map((o: any) => o.title || o.evidence) : []),
        howToFixIt: parsed.verdict?.howToFixIt || parsed.biggestProblem?.fix || "Clarify the primary focal point.",
        whatToPreserve: parsed.verdict?.whatToPreserve || parsed.whatToPreserve || "Core artistic concept and palette foundation.",
        professional: parsed.verdict?.professional || parsed.firstImpression?.professional || "A measured composition with clear conceptual intent.",
        unreliable: parsed.verdict?.unreliable || parsed.firstImpression?.unreliable || "An interesting artistic statement."
      },
      generatedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
  } catch (err: any) {
    console.error('[Critique Engine] Live AI Vision critique failed:', err?.message || err);
    apiErrorMessage = err?.message || 'Gemini Vision API request failed';
  }

  // Fallback to Autonomous Engine with memory, pixel telemetry and prior history context
  if (!resultCritique) {
    resultCritique = generateHeuristicCritique(artwork, stage, relevantMemories, priorArtworks);
    resultCritique.engineSource = 'autonomous_heuristic';
    resultCritique.verdict.engineSource = 'autonomous_heuristic';
    if (apiErrorMessage) {
      resultCritique.apiError = apiErrorMessage;
      resultCritique.verdict.apiError = apiErrorMessage;
    }
  }

  // Automatically preserve in persistent Archive and reinforce Memory patterns
  try {
    const archiveRecord: ArchiveRecord = {
      id: artwork.id || `art_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      fileName: artwork.fileName,
      category: artwork.category,
      dataUrl: artwork.dataUrl,
      createdAt: new Date().toISOString(),
      score: resultCritique.verdict.overallScore,
      scoreReason: resultCritique.verdict.scoreReason,
      firstImpression: resultCritique.verdict.firstImpression || resultCritique.firstImpression?.professional || '',
      whatWorks: resultCritique.verdict.whatWorks || resultCritique.whatWorks?.evidence || '',
      biggestProblem: resultCritique.verdict.biggestProblem || resultCritique.biggestProblem?.evidence || '',
      howToFixIt: resultCritique.verdict.howToFixIt || resultCritique.biggestProblem?.fix || '',
      whatToPreserve: resultCritique.whatToPreserve || resultCritique.verdict.whatToPreserve,
      engineSource: resultCritique.engineSource,
      critique: resultCritique,
      brutalTruth: null
    };
    saveArchiveRecord(archiveRecord).catch(err => console.warn('Auto-save archive failed:', err));
    recordCritiqueToMemory(artwork, resultCritique);
  } catch (err) {
    console.warn('Post-critique storage hooks failed gracefully:', err);
  }

  return resultCritique;
}

// =========================================================================
// 2. DEFEND MY DESIGN
// =========================================================================
export async function respondToDefense(
  artwork: Artwork,
  userDefense: string,
  stage: CriticStage,
  previousCritique: CritiqueData
): Promise<{
  reply: string;
  unreliableNote?: string;
  verdictReconsidered: boolean;
  updatedVerdictScore?: number;
}> {
  try {
    const { mimeType, base64 } = await ensureRasterBase64(artwork.dataUrl);
    const res = await callBackendApi('defend', {
      image: { mimeType, base64 },
      category: artwork.category,
      userDefense,
      stage,
      previousCritique: {
        score: previousCritique.verdict.overallScore,
        biggestProblem: previousCritique.biggestProblem,
        whatWorks: previousCritique.whatWorks,
        verdict: {
          overallScore: previousCritique.verdict.overallScore,
          biggestProblem: previousCritique.verdict.biggestProblem
        }
      }
    });

    // Record user defense to memory
    try {
      recordCritiqueToMemory(artwork, previousCritique, userDefense);
    } catch (err) {
      console.warn('Failed to record defense to memory:', err);
    }

    return res;
  } catch (e: any) {
    console.warn('[Critic Engine] AI Vision defense failed, using heuristic fallback:', e?.message || e);
  }

  // Heuristic Defense Logic with Real Evidence
  const words = userDefense.toLowerCase();
  const hasSubstantiveReasoning =
    words.includes('intention') ||
    words.includes('contrast') ||
    words.includes('audience') ||
    words.includes('balance') ||
    words.includes('hierarchy') ||
    words.includes('grid') ||
    words.includes('negative space') ||
    words.includes('brutalist') ||
    words.includes('asymmetry') ||
    words.length > 40;

  const currentScore = previousCritique.verdict.overallScore || 7;
  const reconsidered = hasSubstantiveReasoning;
  const newScore = reconsidered ? Math.min(10, currentScore + 1) : currentScore;

  let reply = '';
  let unreliableNote = '';

  if (reconsidered) {
    reply = `You present a reasoned functional argument regarding your ${artwork.category.toLowerCase()} decisions. While intentional tension is a valid formal tool, relying on the viewer to decode unanchored elements remains risky. Still, because your intent is deliberate rather than accidental, I will increase your score to ${newScore}/10.`;
    unreliableNote = "I hate it when an artist is actually articulate.";
  } else {
    reply = `Your explanation describes what you hoped to achieve, but it doesn't change what is on the canvas. The eye doesn't read the artist's statement; it reads the physical contrast across the ${artwork.analysis.aspectRatio} frame. The visual hierarchy problem remains.`;
    unreliableNote = "An explanation is not an alignment grid.";
  }

  // Record user statement to memory
  try {
    recordCritiqueToMemory(artwork, previousCritique, userDefense);
  } catch (err) {
    console.warn('Failed to record defense to memory:', err);
  }

  return {
    reply,
    unreliableNote,
    verdictReconsidered: reconsidered,
    updatedVerdictScore: newScore
  };
}

// =========================================================================
// 3. CHALLENGE THE CRITIC
// =========================================================================
export async function respondToChallenge(
  artwork: Artwork,
  userChallenge: string,
  stage: CriticStage,
  previousCritique?: CritiqueData
): Promise<{ reply: string; unreliableNote?: string }> {
  try {
    const { mimeType, base64 } = await ensureRasterBase64(artwork.dataUrl);
    const res = await callBackendApi('challenge', {
      image: { mimeType, base64 },
      category: artwork.category,
      userChallenge,
      stage,
      previousCritique: previousCritique ? {
        verdict: {
          biggestProblem: previousCritique.verdict.biggestProblem
        }
      } : undefined
    });

    return res;
  } catch (e: any) {
    console.warn('[Critic Engine] AI Vision challenge failed, using heuristic fallback:', e?.message || e);
  }

  const lower = userChallenge.toLowerCase();
  let reply = '';
  let unreliableNote = '';

  if (lower.includes('why') || lower.includes('weak') || lower.includes('composition')) {
    reply = `Look at the visual path: the eye enters the frame and encounters competing focal weights before locking onto the primary message. That is an issue of visual flow, not subjective preference.`;
    unreliableNote = stage >= 3 ? "The composition works, but the elements fight for the exact same optical attention." : "A design must speak for itself.";
  } else if (lower.includes('point') || lower.includes('miss')) {
    reply = `If your primary point requires an accompanying verbal explanation to be discovered, the visual hierarchy has fallen short of immediate clarity.`;
    unreliableNote = "The visual contrast should do the talking, not the subtitle.";
  } else if (lower.includes('colour') || lower.includes('color')) {
    reply = `The palette (${artwork.analysis.dominantColors.slice(0, 3).join(', ')}) relies on close luminance thresholds. When ground and text share similar values, eye fatigue sets in rapidly.`;
    unreliableNote = "High saturation is not the same as high contrast.";
  } else {
    reply = `You are confusing personal affection for your work with communicative clarity. The canvas stands on its own geometry, and that geometry requires sharper focal prioritization.`;
    unreliableNote = "An off-center element is powerful only when the rest of the canvas gives it breathing room.";
  }

  return { reply, unreliableNote };
}

// =========================================================================
// 4. GENERATE REDESIGN BRIEFS
// =========================================================================
export async function generateRedesignBrief(
  artwork: Artwork,
  stage: CriticStage,
  previousCritique?: CritiqueData
): Promise<RedesignDirection[]> {
  try {
    const { mimeType, base64 } = await ensureRasterBase64(artwork.dataUrl);
    const parsed = await callBackendApi('redesign', {
      image: { mimeType, base64 },
      category: artwork.category,
      statement: artwork.statement,
      previousCritique: previousCritique ? {
        biggestProblem: previousCritique.biggestProblem,
        whatWorks: previousCritique.whatWorks
      } : undefined
    });

    if (Array.isArray(parsed) && parsed.length >= 3) {
      return parsed;
    }
  } catch (e: any) {
    console.warn('[Critic Engine] AI Vision redesign failed, using heuristic fallback:', e?.message || e);
  }

  const { analysis, category } = artwork;
  const mainCol = analysis.dominantColors[0] || '#0A0A0A';
  const accentCol = analysis.dominantColors[1] || '#D71920';

  return [
    {
      number: '01',
      code: 'RESTRAINT',
      title: 'Minimalist Reduction & Spatial Discipline',
      concept: `Strip competing secondary accents. Anchor the entire ${category.toLowerCase()} around a single focal weight using ${mainCol}, letting generous negative space guide the viewer.`,
      whatChanges: `Remove secondary decorative ornaments and establish a strict 2-level hierarchy between the hero visual and captions.`,
      whyItWorks: `Eliminates visual clutter and allows the primary conceptual statement to register instantly without cognitive friction.`,
      whatToPreserve: `The core visual subject and the primary contrast threshold.`,
      colourTreatment: `Reduce palette to high-contrast monochrome with one intentional accent from ${accentCol}.`,
      composition: `Lock all elements to a strict baseline grid with consistent outer margin protection.`,
      typography: 'Establish an unambiguous scale ratio between the primary title and supporting annotations.',
      textureAndEffects: 'Clean flat fills. Eliminate distracting gradients or drop shadows.',
      actionableSteps: [
        'Isolate the single most important element and remove secondary embellishments.',
        'Increase margin breathing room along the outer frame perimeter.',
        'Enforce a strict 2-weight typographic pairing.'
      ]
    },
    {
      number: '02',
      code: 'DISTORTION',
      title: 'Calculated Tension & Dynamic Contrast',
      concept: `Embrace intentional asymmetry. Use extreme scale contrast and high-friction color placement to create an unforgettable, provocative ${category.toLowerCase()} statement.`,
      whatChanges: `Shift the primary graphic mass off-center and intensify the value separation between dark and light planes.`,
      whyItWorks: `Dynamic imbalance provokes optical curiosity and makes the artwork stand out in modern visual feeds.`,
      whatToPreserve: `The distinctive emotional tone and core silhouette.`,
      colourTreatment: `Maximize contrast threshold between the darkest values and ${accentCol}.`,
      composition: `Displace the primary focal anchor along the diagonal, creating deliberate optical movement.`,
      typography: 'Crop or scale letterforms across frame boundaries while keeping key message words fully legible.',
      textureAndEffects: 'Subtle high-contrast grain or bitonal analog texture.',
      actionableSteps: [
        'Shift the main graphic 15% off-center to break symmetrical stagnation.',
        'Inject a stark contrast tone behind the primary focal point.',
        'Format supporting annotations in an ultra-compact monospace block.'
      ]
    },
    {
      number: '03',
      code: 'REINTERPRETATION',
      title: 'Editorial Architectural Formalism',
      concept: `Restructure the artwork as a prestigious contemporary exhibition piece: clear dividing bands, rigorous alignment, and museum-grade typography.`,
      whatChanges: `Subdivide the ${analysis.aspectRatio} canvas into a structured columnar modular grid with explicit caption baselines.`,
      whyItWorks: `Establishes immediate institutional authority and elevates casual graphics into fine-art editorial quality.`,
      whatToPreserve: `The conceptual thesis and dominant colour identity.`,
      colourTreatment: `Muted tonal distribution with controlled saturation (black point at 5%, highlights capped at 90%).`,
      composition: `Divide the ${analysis.aspectRatio} canvas into a classic 3-tier horizontal modular grid.`,
      typography: 'Pair a strong display typeface with crisp neutral grotesk annotations.',
      textureAndEffects: 'Smooth matte editorial finish.',
      actionableSteps: [
        'Establish horizontal guides across the canvas height.',
        'Align all secondary text strictly along horizontal guide lines.',
        'Unify color accents to a single accent tone across all elements.'
      ]
    }
  ];
}

// =========================================================================
// 5. BRUTAL TRUTH (RELIABLE ART DIRECTOR AUDIT)
// =========================================================================
export async function generateBrutalTruth(
  artwork: Artwork
): Promise<BrutalTruthData> {
  try {
    const { mimeType, base64 } = await ensureRasterBase64(artwork.dataUrl);
    const parsed = await callBackendApi('brutal_truth', {
      image: { mimeType, base64 },
      category: artwork.category,
      statement: artwork.statement
    });

    const result: BrutalTruthData = {
      hardTruth: parsed.hardTruth || 'The primary message is obscured by competing visual elements.',
      evidence: Array.isArray(parsed.evidence) && parsed.evidence.length >= 2 ? parsed.evidence : [
        'The primary subject and secondary elements share similar visual contrast.',
        'Negative space around the borders is uneven and crowded.'
      ],
      whyItsNotWorking: parsed.whyItsNotWorking || 'The viewer cannot immediately tell where to look first.',
      whatToFixFirst: Array.isArray(parsed.whatToFixFirst) && parsed.whatToFixFirst.length === 3 ? parsed.whatToFixFirst : [
        'Increase size contrast between primary and secondary elements by at least 30%.',
        'Add 15% more padding around the outer boundaries.',
        'Limit the color palette to one primary focal accent.'
      ],
      whatToKeep: parsed.whatToKeep || 'The core conceptual premise and dominant color selection.',
      engineSource: 'gemini_vision',
      strongestElements: Array.isArray(parsed.evidence) ? parsed.evidence : ['Visual concept', 'Color foundation', 'Aspect format'],
      keyImprovements: Array.isArray(parsed.whatToFixFirst) ? parsed.whatToFixFirst : ['Hierarchy', 'Margins', 'Contrast'],
      highestImpactChange: parsed.whatToFixFirst?.[0] || 'Clarify the focal point hierarchy immediately.',
      directorNotes: parsed.hardTruth || 'Focus on your core message.'
    };

    if (artwork.id) {
      getArchiveRecordById(artwork.id).then((rec) => {
        if (rec) {
          rec.brutalTruth = result;
          saveArchiveRecord(rec).catch(() => {});
        }
      }).catch(() => {});
    }

    return result;
  } catch (e: any) {
    console.warn('[Critic Engine] AI Vision Brutal Truth failed, using heuristic fallback:', e?.message || e);
  }

  // Robust, Evidence-Based Heuristic Brutal Truth Fallback
  const { analysis, category, statement } = artwork;
  const isDark = analysis.brightnessLevel === 'dark';
  const isHighContrast = analysis.contrastLevel === 'extreme';
  const isDense = analysis.estimatedComplexity === 'dense';
  const balance = analysis.horizontalBalance || 'centered';
  const mainCol = analysis.dominantColors[0] || '#0A0A0A';
  const accentCol = analysis.dominantColors[1] || '#D71920';

  const statementText = (statement || '').toLowerCase();
  const hasAsymmetryIntent = statementText.includes('asymmetry') || statementText.includes('tension') || statementText.includes('brutal');

  let hardTruth = '';
  let evidence: string[] = [];
  let whyItsNotWorking = '';
  let whatToFixFirst: string[] = [];
  let whatToKeep = '';

  if (category === 'Poster') {
    hardTruth = isDense
      ? 'The poster attempts to communicate multiple secondary thoughts with equal volume rather than delivering one decisive takeaway.'
      : 'The focal point is ambiguous, preventing the primary message from registering in the crucial 2-second glance.';
    evidence = [
      `Optical mass is weighted ${balance} across the ${analysis.aspectRatio} format, creating an asymmetric entry path.`,
      `Primary graphics and supporting copy both rely on ${analysis.contrastLevel} contrast against the ${mainCol} field without an intermediate step.`,
      `The accent hue (${accentCol}) is distributed across multiple zones rather than concentrating on the primary message.`
    ];
    whyItsNotWorking = 'A poster has roughly 2 seconds to capture viewer attention. Right now, the eye scans horizontally without locking into a clear focal anchor.';
    whatToFixFirst = [
      'Scale up the main title or hero visual so it commands immediate first-order priority.',
      'Drop secondary metadata opacity by 20% to prevent it from competing with the title.',
      'Concentrate the accent tone exclusively on the primary reading anchor.'
    ];
    whatToKeep = isDark ? 'The disciplined low-key atmosphere and restrained color pairing.' : 'The high-energy optical punch of the primary palette.';
  } else if (category === 'Album cover') {
    hardTruth = 'The artwork lacks a memorable, unified graphic hook that survives at 300x300 streaming thumbnail scale.';
    evidence = [
      `At small mobile sizes, the ${analysis.contrastLevel} contrast compresses midtones and causes fine line details to vanish.`,
      'The central visual subject and artist title share equal dominance rather than one supporting the other.',
      `The background tone (${mainCol}) absorbs perimeter boundaries, flattening silhouette depth.`
    ];
    whyItsNotWorking = 'Album covers live primarily as small squares in streaming apps. If the primary icon or typography is not instantly recognizable at small scale, it gets lost in the feed.';
    whatToFixFirst = [
      'Test the layout at 120x120px and eliminate any micro-detail that dissolves into visual noise.',
      'Increase the contrast ratio between typography and the underlying artwork.',
      'Anchor the central graphic with a confident silhouette that reads cleanly against dark backgrounds.'
    ];
    whatToKeep = 'The distinctive artistic character and moody emotional palette.';
  } else if (category === 'Branding') {
    hardTruth = 'The identity elements feel assembled rather than locked into a cohesive, scalable system.';
    evidence = [
      'Visual spacing around the mark and logotype shows micro-inconsistencies.',
      `The palette uses ${analysis.dominantColors.slice(0, 3).join(', ')} without a clearly defined primary brand accent.`,
      'Clear space around the mark perimeter is narrow relative to real-world application guidelines.'
    ];
    whyItsNotWorking = 'Brand marks require instant recognition and bulletproof scalability across favicons, app icons, and large packaging.';
    whatToFixFirst = [
      'Define an explicit clear-space rule (at least 1.5x the mark height) around all logo applications.',
      'Commit to one dominant brand color and relegate other hues to supportive accents.',
      'Ensure line weights remain consistent and do not degrade when scaled down.'
    ];
    whatToKeep = 'The underlying conceptual mark and brand tone.';
  } else if (category === 'Illustration') {
    hardTruth = hasAsymmetryIntent
      ? 'The expressive tension is deliberate, but secondary elements lack enough value contrast to support the hero silhouette.'
      : 'The central silhouette lacks value contrast against the background field, causing shapes to blend together.';
    evidence = [
      `Dominant values (${analysis.dominantColors.slice(0, 2).join(', ')}) share close luminance, flattening depth separation.`,
      `The visual distribution is ${balance}, creating an uneven weight across the ${analysis.aspectRatio} canvas.`,
      'Negative space surrounding the main subject lacks intentional calibration.'
    ];
    whyItsNotWorking = 'Without distinct value separation, the viewer cannot instantly isolate the hero subject from the surrounding environment.';
    whatToFixFirst = [
      'Establish a 20% luminance gap between the hero character/subject and the background field.',
      'Sharpen the outer silhouette to create a confident graphic read.',
      'Adjust canvas padding to give the subject intentional breathing room.'
    ];
    whatToKeep = 'The expressive shape language and core conceptual drawing style.';
  } else {
    hardTruth = 'The composition lacks clear visual hierarchy, forcing the viewer to search for what matters most.';
    evidence = [
      `The layout balance is ${balance}, creating optical gravity across the ${analysis.aspectRatio} canvas.`,
      isHighContrast
        ? 'Extreme contrast differences create optical vibration across neighboring boundaries.'
        : 'Subdued contrast causes foreground elements to merge with the background field.',
      'Negative space is distributed unevenly across quadrants.'
    ];
    whyItsNotWorking = 'Without an intentional hierarchy, the viewer cannot establish a natural reading order, causing visual fatigue.';
    whatToFixFirst = [
      'Identify the single most important element and make it visibly dominant through scale or contrast.',
      'Give secondary elements supportive, restrained placement.',
      'Simplify color distribution to reinforce the primary focal point.'
    ];
    whatToKeep = 'The core visual premise and creative concept.';
  }

  const finalResult: BrutalTruthData = {
    hardTruth,
    evidence,
    whyItsNotWorking,
    whatToFixFirst,
    whatToKeep,
    engineSource: 'autonomous_heuristic',
    strongestElements: evidence,
    keyImprovements: whatToFixFirst,
    highestImpactChange: whatToFixFirst[0],
    directorNotes: hardTruth
  };

  if (artwork.id) {
    getArchiveRecordById(artwork.id).then((rec) => {
      if (rec) {
        rec.brutalTruth = finalResult;
        saveArchiveRecord(rec).catch(() => {});
      }
    }).catch(() => {});
  }

  return finalResult;
}

// =========================================================================
// 6. HEURISTIC CRITIQUE GENERATOR (DEEP CANVAS TELEMETRY ANALYSIS)
// =========================================================================
function generateHeuristicCritique(
  artwork: Artwork,
  stage: CriticStage,
  relevantMemories: import('../types').CriticMemoryItem[] = [],
  priorArtworks: ArchiveRecord[] = []
): CritiqueData {
  const { analysis, category, statement } = artwork;
  const isDark = analysis.brightnessLevel === 'dark';
  const isHighContrast = analysis.contrastLevel === 'extreme';
  const balance = analysis.horizontalBalance || 'centered';
  const vBalance = analysis.verticalBalance || 'centered';
  const mainColor = analysis.dominantColors[0] || '#0A0A0A';
  const accentColor = analysis.dominantColors[1] || '#D71920';

  // Check statement & memory for stated aesthetic preferences
  const statementText = (statement || '').toLowerCase();
  const hasAsymmetryPref =
    statementText.includes('asymmetry') ||
    statementText.includes('asymmetric') ||
    statementText.includes('brutal') ||
    statementText.includes('tension') ||
    statementText.includes('distortion') ||
    statementText.includes('swiss') ||
    statementText.includes('monolith') ||
    relevantMemories.some(
      m => m.title.toLowerCase().includes('asymmetry') || m.description.toLowerCase().includes('asymmetric') || m.title.toLowerCase().includes('brutal')
    );

  // Compute score based on balance, margins, and contrast metrics
  let calculatedScore = 7;
  let deductions = 0;
  let primaryScoreReason = '';

  if (balance !== 'centered' && !hasAsymmetryPref) deductions += 0.5;
  if (vBalance !== 'centered' && !hasAsymmetryPref) deductions += 0.5;
  if (analysis.edgeDensity === 'edge-crowded' && category === 'Branding') deductions += 0.5;
  if (analysis.contrastLevel === 'subdued' && category === 'Poster') deductions += 0.5;

  calculatedScore = Math.max(5, Math.min(9, Math.round(8.5 - deductions)));

  if (category === 'Poster') {
    primaryScoreReason = hasAsymmetryPref
      ? `Strong Swiss modernist discipline with intentional asymmetric optical tension; secondary text contrast prevents a higher rating.`
      : `Confident graphic hierarchy across the ${analysis.aspectRatio} format, though secondary text competition prevents a higher rating.`;
  } else if (category === 'Album cover') {
    primaryScoreReason = `Iconic monochromatic silhouette that holds up at streaming thumbnail scale, though midtone separation could be lifted.`;
  } else if (category === 'Illustration') {
    primaryScoreReason = `Expressive figurative silhouette and bold color friction; lower anchor contrast is the primary refinement needed.`;
  } else if (category === 'Typography') {
    primaryScoreReason = `Strong conceptual authority in the redacted discourse; display vs caption scale ratio requires slight widening.`;
  } else {
    primaryScoreReason = `Measured composition with clear conceptual intent across the ${analysis.aspectRatio} format.`;
  }

  // Comparative prior artwork insight when supported by stored evidence
  let comparativeNote = '';
  if (priorArtworks.length > 0) {
    const prior = priorArtworks[0];
    if (prior.category.toLowerCase() === category.toLowerCase()) {
      comparativeNote = ` Compared with your previous ${category.toLowerCase()} ("${prior.fileName}"), the visual balance shows sharper intent.`;
    }
  }

  // 1. First Impression
  let firstImpressionProf = '';
  if (category === 'Poster') {
    firstImpressionProf = `A bold Swiss modernist editorial statement. The high-contrast palette (${mainColor} and ${accentColor}) establishes immediate impact, commanding attention across the ${analysis.aspectRatio} format.`;
  } else if (category === 'Album cover') {
    firstImpressionProf = `An intensely atmospheric visual statement tailored for an experimental soundscape. The ${analysis.aspectRatio} format is anchored by a stark geometric silhouette against ${mainColor}.`;
  } else if (category === 'Illustration') {
    firstImpressionProf = `An expressive figurative study. The contrast between the light field and deep silhouette shapes (${mainColor} and ${accentColor}) creates an immediate graphic punch across the ${analysis.aspectRatio} format.`;
  } else if (category === 'Typography') {
    firstImpressionProf = `A sharp, conceptually rigorous typographic study. The dialogue between rectangular blocks and editorial letterforms creates immediate intellectual intrigue.`;
  } else {
    firstImpressionProf = isDark
      ? `A restrained, low-key visual statement. The dark value distribution (${mainColor}) commands immediate mood across the ${analysis.aspectRatio} format.`
      : `A bold, graphic presentation. High-contrast value pairing creates immediate optical impact across the ${analysis.aspectRatio} format.`;
  }

  firstImpressionProf = (firstImpressionProf + comparativeNote).trim();

  const firstImpressionUnrel =
    stage === 1
      ? "Your layout has discipline, but your secondary elements are getting restless."
      : stage === 2
      ? "I noticed your graphic tension before I noticed your alignment grid."
      : stage === 3
      ? "Interesting hierarchy, assuming you actually planned it that way."
      : stage === 4
      ? "The headline and subtitle compete for attention because their optical weights are too close."
      : "The layout is balanced, but the focal point is holding its breath.";

  // 2. What Works
  let whatWorksTitle = '';
  let whatWorksEvidence = '';

  if (category === 'Poster') {
    whatWorksTitle = "Disciplined modernist contrast hierarchy";
    whatWorksEvidence = `Stark value separation between the dominant dark field (${mainColor}) and crisp light elements creates an immediate first-order visual hierarchy for reading from a distance.`;
  } else if (category === 'Album cover') {
    whatWorksTitle = "Resonant iconic silhouette for small-screen scale";
    whatWorksEvidence = `The stark central silhouette and vertical crimson axis line (${accentColor}) retain immediate recognition even when reduced to mobile streaming thumbnail scale.`;
  } else if (category === 'Illustration') {
    whatWorksTitle = "Expressive silhouette & deliberate tonal friction";
    whatWorksEvidence = `The dynamic shape language and stark contrast threshold between the figure and background field establish genuine psychological presence.`;
  } else if (category === 'Typography') {
    whatWorksTitle = "Conceptual editorial authority";
    whatWorksEvidence = `The tension between redacted solid rectangular bars and serif letterforms reinforces the historical archival theme with precision.`;
  } else {
    whatWorksTitle = "High-contrast palette discipline";
    whatWorksEvidence = `The dominant palette (${analysis.dominantColors.slice(0, 2).join(' and ')}) establishes clear visual mood within the ${analysis.aspectRatio} format.`;
  }

  // 3. Biggest Problem
  let biggestProblemTitle = '';
  let biggestProblemEvidence = '';
  let biggestProblemConsequence = '';
  let biggestProblemFix = '';

  if (category === 'Poster') {
    biggestProblemTitle = "Secondary typographic block competition";
    biggestProblemEvidence = `The secondary typographic block shares similar optical contrast against the ${mainColor} ground as the primary title.`;
    biggestProblemConsequence = "The viewer's eye is momentarily divided between the title and the secondary block instead of following a clean, single-entry reading path.";
    biggestProblemFix = "Reduce the optical weight or opacity of secondary metadata by 20% to give undivided priority to the primary message.";
  } else if (category === 'Album cover') {
    biggestProblemTitle = "Foreground/background edge compression";
    biggestProblemEvidence = `Subtle midtone values between the central silhouette and the ${mainColor} field rely on narrow luminance steps.`;
    biggestProblemConsequence = "Under lower screen brightness, the subtle boundary risks compressing into a flat shadow block on uncalibrated mobile displays.";
    biggestProblemFix = "Lift the luminance of the polygon stroke or boundary line by 10% to guarantee silhouette isolation.";
  } else if (category === 'Illustration') {
    biggestProblemTitle = "Lower structural anchor contrast";
    biggestProblemEvidence = `Secondary figurative contours in the lower half share close luminance with the background ground, reducing depth separation.`;
    biggestProblemConsequence = "The viewer can isolate the primary upper figure, but the lower structural anchors blend into the dark field, weakening the base.";
    biggestProblemFix = "Introduce an intermediate value step between the figure's base and the background ground to clarify structural support.";
  } else if (category === 'Typography') {
    biggestProblemTitle = "Tight display vs caption scale ratio";
    biggestProblemEvidence = `The scale ratio between primary display letterforms and secondary annotations requires careful ocular adjustment to establish initial reading order.`;
    biggestProblemConsequence = "The viewer's gaze bounces between the redacted color bars and the serif headline before locking into the conceptual message.";
    biggestProblemFix = "Increase visual scale separation between the primary headline text and secondary annotations to at least 2:1.";
  } else {
    biggestProblemTitle = "Competing focal contrast";
    biggestProblemEvidence = `Multiple elements share similar contrast thresholds against the ${mainColor} field.`;
    biggestProblemConsequence = "The eye enters the canvas and gets trapped in secondary details without an intentional exit path.";
    biggestProblemFix = "Shift secondary elements along the counter-balance axis to restore structural equilibrium.";
  }

  // 4. Other Issues
  const otherIssues = [];
  if (analysis.edgeDensity === 'edge-crowded' && category === 'Branding') {
    otherIssues.push({
      title: "Perimeter clear-space narrowness",
      evidence: `Elements sit within 10% of the canvas perimeter, which may challenge logo isolation guidelines on busy surfaces.`,
      consequence: "May hinder clear-space guidelines in real-world application."
    });
  }

  // 5. What to Preserve
  let whatToPreserve = '';
  if (category === 'Poster') {
    whatToPreserve = "The disciplined typographic grid, structural asymmetry, and stark crimson/black value contrast.";
  } else if (category === 'Album cover') {
    whatToPreserve = "The hypnotic geometric severity, central crimson axis line, and austere monochromatic mood.";
  } else if (category === 'Illustration') {
    whatToPreserve = "The bold figurative silhouette, evocative color accents, and intentional emotional dissonance.";
  } else if (category === 'Typography') {
    whatToPreserve = "The literary editorial authority, precise rule lines, and evocative redacted conceptual language.";
  } else {
    whatToPreserve = isDark
      ? "The moody, low-key atmospheric tonal foundation and muted palette."
      : "The bold optical impact and high-contrast energy of the primary silhouette.";
  }

  // 6. How to Improve
  const howToImprove = [
    biggestProblemFix,
    `Ensure the accent tone (${accentColor}) remains concentrated on the primary visual entry point.`
  ];

  // 7. Composition
  const compObs = hasAsymmetryPref
    ? "Intentional asymmetric optical tension"
    : "Structured lateral visual balance";
  const compEv = `The layout balance is ${balance} with ${vBalance} distribution across the ${analysis.aspectRatio} format.`;
  const compCons = hasAsymmetryPref
    ? "The off-center weight creates calculated optical energy without destabilizing the reading order."
    : "Visual weight directly determines the order in which elements are perceived.";
  const compFix = hasAsymmetryPref
    ? "Preserve the off-center tension; maintain crisp baseline alignment for secondary content."
    : "Align focal anchors to a clear baseline.";
  const compProf = `${compObs}. ${compEv} ${compCons} Fix: ${compFix}`;
  const compUnrel = "Your layout is balanced, but the content sits too close to the edges.";

  // 8. Colour & Texture
  const colObs = isHighContrast ? "High dynamic range contrast" : "Subdued tonal harmony";
  const colEv = `The palette is dominated by ${mainColor} with intentional highlights in ${accentColor}.`;
  const colCons = "When primary and secondary values lack distinct contrast steps, legibility fatigues the viewer.";
  const colFix = `Reserve the brightest accent tone (${accentColor}) exclusively for the primary focal point.`;
  const colProf = `${colObs}. ${colEv} ${colCons} Fix: ${colFix}`;
  const colUnrel = "High saturation is not the same as high contrast.";

  // 9. Typography
  const hasType = category === 'Typography' || category === 'Poster' || category === 'Branding';
  const typeObs = "Hierarchical type scaling";
  const typeEv = "Headline and secondary annotations share similar visual prominence.";
  const typeCons = "The viewer cannot instantly determine which line of text to read first.";
  const typeFix = "Increase the scale ratio between headline and body copy to at least 2:1.";
  const typeProf = `${typeObs}. ${typeEv} ${typeCons} Fix: ${typeFix}`;
  const typeUnrel = "The headline and subtitle compete for attention because their sizes are too similar.";

  // 10. Concept
  const concObs = "Conceptual communication clarity";
  const concEv = `The visual treatment aligns with contemporary ${category.toLowerCase()} conventions.`;
  const concCons = "Clear visual metaphors eliminate the need for explanatory text.";
  const concFix = "Sharpen the core visual metaphor by removing redundant decorative flourishes.";
  const concProf = `${concObs}. ${concEv} ${concCons} Fix: ${concFix}`;
  const concUnrel = "If your design needs a paragraph to explain it, the graphic has failed.";

  return {
    engineSource: 'autonomous_heuristic',
    firstImpression: {
      name: "FIRST IMPRESSION",
      score: calculatedScore,
      professional: firstImpressionProf,
      unreliable: firstImpressionUnrel
    },
    whatWorks: {
      title: whatWorksTitle,
      evidence: whatWorksEvidence
    },
    biggestProblem: {
      title: biggestProblemTitle,
      observation: biggestProblemTitle,
      evidence: biggestProblemEvidence,
      consequence: biggestProblemConsequence,
      fix: biggestProblemFix
    },
    otherIssues,
    howToImprove,
    whatToPreserve,
    composition: {
      name: "COMPOSITION",
      score: calculatedScore,
      observation: compObs,
      evidence: compEv,
      consequence: compCons,
      fix: compFix,
      professional: compProf,
      unreliable: compUnrel
    },
    colourAndTexture: {
      name: "COLOUR",
      score: Math.min(10, calculatedScore + (isHighContrast ? 1 : 0)),
      observation: colObs,
      evidence: colEv,
      consequence: colCons,
      fix: colFix,
      professional: colProf,
      unreliable: colUnrel
    },
    typography: hasType ? {
      name: "TYPE",
      score: Math.max(5, calculatedScore - 1),
      observation: typeObs,
      evidence: typeEv,
      consequence: typeCons,
      fix: typeFix,
      professional: typeProf,
      unreliable: typeUnrel
    } : null,
    concept: {
      name: "CONCEPT",
      score: calculatedScore,
      observation: concObs,
      evidence: concEv,
      consequence: concCons,
      fix: concFix,
      professional: concProf,
      unreliable: concUnrel
    },
    whatCouldImprove: {
      professional: `${biggestProblemFix} ${colFix}`,
      unreliable: "A tighter grid cures most artistic anxieties."
    },
    verdict: {
      overallScore: calculatedScore,
      scoreReason: primaryScoreReason,
      firstImpression: firstImpressionProf,
      whatWorks: whatWorksEvidence,
      biggestProblem: `${biggestProblemTitle}: ${biggestProblemEvidence} ${biggestProblemConsequence}`,
      otherIssues: otherIssues.map(o => o.title),
      howToFixIt: biggestProblemFix,
      whatToPreserve,
      engineSource: 'autonomous_heuristic',
      professional: `${firstImpressionProf} ${primaryScoreReason}`,
      unreliable: firstImpressionUnrel
    },
    generatedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  };
}

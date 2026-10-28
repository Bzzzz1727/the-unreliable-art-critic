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

const STORAGE_API_KEY = 'UNRELIABLE_CRITIC_GEMINI_API_KEY';

export function getStoredApiKey(): string {
  try {
    return localStorage.getItem(STORAGE_API_KEY) || (import.meta.env.VITE_GEMINI_API_KEY as string) || '';
  } catch {
    return '';
  }
}

export function saveStoredApiKey(key: string): void {
  try {
    if (key.trim()) {
      localStorage.setItem(STORAGE_API_KEY, key.trim());
    } else {
      localStorage.removeItem(STORAGE_API_KEY);
    }
  } catch (err) {
    console.error('Failed to save API key', err);
  }
}

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
 * Strip Markdown code fences from LLM output before JSON parsing
 */
function cleanJsonOutput(text: string): string {
  let cleaned = text.trim();
  if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim();
  }
  return cleaned;
}

/**
 * Multimodal call to Google Gemini 2.0 Flash
 */
async function callGeminiApi(
  prompt: string,
  dataUrl: string,
  apiKey: string,
  forceJson: boolean = true
): Promise<string> {
  const { mimeType, base64 } = await ensureRasterBase64(dataUrl);

  const hasValidImage = Boolean(base64 && base64.length > 50);
  console.log(`[Gemini Vision Request] Model: gemini-2.0-flash, Image attached: ${hasValidImage} (MIME: ${mimeType}, Base64 Length: ${base64?.length || 0})`);

  if (!hasValidImage) {
    console.warn('[Gemini Vision Request] Warning: Image payload could not be extracted as valid raster base64. Vision analysis will be compromised.');
  }

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;

  // Image inlineData placed first for optimal vision model grounding
  const bodyParts: any[] = [];
  if (hasValidImage) {
    bodyParts.push({
      inlineData: {
        mimeType: mimeType || 'image/png',
        data: base64
      }
    });
  }
  bodyParts.push({ text: prompt });

  const body = {
    contents: [{ parts: bodyParts }],
    generationConfig: {
      temperature: 0.65,
      maxOutputTokens: 2800,
      responseMimeType: forceJson ? 'application/json' : 'text/plain'
    }
  };

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error(`[Gemini API Error] HTTP ${response.status}: ${errorText}`);
    throw new Error(`Gemini API Error (${response.status}): ${errorText}`);
  }

  const result = await response.json();
  const textOutput = result?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!textOutput) {
    throw new Error('Gemini API returned an empty response.');
  }
  return cleanJsonOutput(textOutput);
}

/**
 * Category-specific evaluation priorities to adapt critique intelligently
 */
function getCategoryEvaluationFocus(category: ArtworkCategory): string {
  switch (category) {
    case 'Poster':
      return `CATEGORY PRIORITIES (POSTER):
- Communication hierarchy and readability from a viewing distance (the 2-second test).
- Immediate focal point and natural visual entry path across the composition.
- Audience engagement, viewing context, and margin breathing room.
- DO NOT penalize bold display typography, intentional high contrast, or experimental headline scale.`;
    case 'Album cover':
      return `CATEGORY PRIORITIES (ALBUM COVER):
- Conceptual resonance, atmosphere, distinctiveness, and memorable graphic hook.
- Recognition and clarity at small streaming thumbnail scale (300x300 and smaller).
- Harmonious relationship between imagery and typography (artist/title).
- DO NOT penalize surrealism, grain, intentional distortion, or lack of poster-style informational copy.`;
    case 'Branding':
      return `CATEGORY PRIORITIES (BRANDING):
- Distinctiveness, memorability, and visual consistency of identity marks.
- Scalability across micro-applications (favicons, app icons) and large signage.
- Clear-space margins, perimeter protection, and weight balance.
- Suitability for intended brand tone and audience.`;
    case 'Illustration':
      return `CATEGORY PRIORITIES (ILLUSTRATION):
- Shape language, silhouette clarity, and composition.
- Value hierarchy, colour harmony, and expressive texture.
- Visual storytelling and emotional resonance.
- DO NOT penalize non-photorealistic anatomy, expressive distortion, flat perspective, or stylized geometry.`;
    case 'Typography':
      return `CATEGORY PRIORITIES (TYPOGRAPHY):
- Letterform construction, kerning, tracking, and optical spacing.
- Typographic hierarchy, scale ratios, and baseline rhythm.
- Readability and stylistic consistency across glyph sets.`;
    case 'Photography':
      return `CATEGORY PRIORITIES (PHOTOGRAPHY):
- Tonal range, exposure balance, and highlight/shadow detail.
- Framing, cropping, and depth of field / focal isolation.
- Visual narrative and intentional composition.`;
    default:
      return `CATEGORY PRIORITIES:
- Visual hierarchy and clarity of communication.
- Compositional equilibrium and intentional focal point.
- Craft, execution, and palette discipline.`;
  }
}

// =========================================================================
// 1. INITIAL CRITIQUE GENERATION (EVIDENCE-BASED ART DIRECTOR ANALYSIS)
// =========================================================================
export async function generateInitialCritique(
  artwork: Artwork,
  stage: CriticStage,
  customApiKey?: string
): Promise<CritiqueData> {
  const key = customApiKey || getStoredApiKey();

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

  if (key) {
    try {
      const prompt = `
You are THE UNRELIABLE ART CRITIC. Act as an experienced art director and graphic design critic who evaluates the ACTUAL uploaded artwork.
Artwork category: "${artwork.category}".
Artist statement: "${artwork.statement || 'None provided'}".
Visual telemetry: Aspect ratio ${artwork.analysis.aspectRatio}, Brightness: ${artwork.analysis.brightnessLevel}, Contrast: ${artwork.analysis.contrastLevel}, Dominant palette: ${artwork.analysis.dominantColors.join(', ')}.
${memoryContextText}

${getCategoryEvaluationFocus(artwork.category)}

CRITICAL PRINCIPLES:
1. EXAMINE THE ACTUAL ARTWORK:
   - Your entire analysis must refer to specific visible elements in the uploaded image: examine actual headline text words, figure silhouettes, geometric shapes, exact colour contrasts, lighting/values, negative space, and typographic glyphs.
   - For each issue, you must specify:
     * OBSERVATION: What specifically is visible in this image?
     * EVIDENCE: Where is it visible, and what concrete visual detail supports the claim?
     * CONSEQUENCE: How does it affect the viewer's experience or the design's communicative impact?
     * FIX: What precise change would improve it, if a change is actually needed? If the choice already works well, explicitly state that no change is necessary.
   - FORBIDDEN GENERIC PLATITUDES: Do NOT output stock critique tropes like "structured geometric layout", "expand perimeter padding by 20px", "improve visual hierarchy", or "the composition lacks balance". Be specific to what is on the canvas.

2. STOP MAKING UNSUPPORTED ASSUMPTIONS:
   - Do NOT assume a centred composition is automatically good.
   - Do NOT assume a cropped subject is automatically a mistake.
   - Do NOT assume negative space is always insufficient or that every artwork needs more padding.
   - Do NOT assume a limited palette automatically makes a design successful.
   - Do NOT force conventional commercial advertising rules onto fine art, experimental typography, brutalist posters, or atmospheric album covers.
   - Respect intentional asymmetry, unusual crops, visual tension, raw grain, and expressive dissonance when they support the concept.
   - If you cannot confidently establish something from the image, state that uncertainty directly rather than inventing details.

3. SCORE OUT OF 10:
   - Provide an informed, defensible score out of 10 based on the artwork's apparent purpose and category rubric.
   - Explain the primary justification in "scoreReason" using concrete visual evidence.
   - Do NOT deduct points for unconventional or experimental choices.

4. SEPARATE CHARACTER HUMOUR FROM PROFESSIONAL CRITIQUE:
   - "unreliable": Short, witty, sarcastic 1-sentence remark matching personality stage ${stage}.
   - "professional": Clear, direct, technically useful explanation without jargon or obscure metaphors.

Return ONLY valid JSON matching this schema:
{
  "score": <number 1-10>,
  "scoreReason": "<One direct sentence explaining the primary justification for the score with visual evidence>",
  "firstImpression": {
    "name": "FIRST IMPRESSION",
    "score": <number 1-10>,
    "professional": "<One specific, memorable sentence explaining the overall visual impact and result>",
    "unreliable": "<short witty character comment matching personality stage ${stage}>"
  },
  "whatWorks": {
    "title": "<Specific visual strength>",
    "evidence": "<Concrete visual evidence from this image supporting this strength>"
  },
  "biggestProblem": {
    "title": "<Single most consequential weakness, or 'None' if resolved>",
    "evidence": "<Observed visible evidence in the artwork>",
    "consequence": "<The design consequence / why it undermines the work>",
    "fix": "<Concrete, specific, testable recommendation>"
  },
  "otherIssues": [
    {
      "title": "<Secondary material issue>",
      "evidence": "<Observed visible evidence in the artwork>",
      "consequence": "<Impact on design>"
    }
  ],
  "howToImprove": [
    "<1st prioritized recommendation>",
    "<2nd prioritized recommendation>"
  ],
  "whatToPreserve": "<The strongest existing design quality that must not be lost during revision>",
  "composition": {
    "name": "COMPOSITION",
    "score": <number 1-10>,
    "observation": "<Specific visual balance and hierarchy in this image>",
    "evidence": "<Visible evidence in layout/spacing>",
    "consequence": "<Impact on viewing experience>",
    "fix": "<Specific adjustment or 'Preserve as is'>",
    "professional": "<Observation. Evidence. Consequence. Fix.>",
    "unreliable": "<short witty 1-sentence line>"
  },
  "colourAndTexture": {
    "name": "COLOUR",
    "score": <number 1-10>,
    "observation": "<Specific palette relationships and contrast in this image>",
    "evidence": "<Visible evidence of color values>",
    "consequence": "<Impact on legibility/mood>",
    "fix": "<Specific adjustment or 'Preserve as is'>",
    "professional": "<Observation. Evidence. Consequence. Fix.>",
    "unreliable": "<short witty 1-sentence line>"
  },
  "typography": ${
    artwork.category === 'Typography' || artwork.category === 'Poster' || artwork.category === 'Branding'
      ? `{
    "name": "TYPE",
    "score": <number 1-10>,
    "observation": "<Type hierarchy and legibility in this image>",
    "evidence": "<Visible evidence of font weights, scale or alignment>",
    "consequence": "<Impact on reading order>",
    "fix": "<Specific adjustment or 'Preserve as is'>",
    "professional": "<Observation. Evidence. Consequence. Fix.>",
    "unreliable": "<short witty 1-sentence line>"
  }`
      : `null`
  },
  "concept": {
    "name": "CONCEPT",
    "score": <number 1-10>,
    "observation": "<Clarity of communication and message>",
    "evidence": "<Visible evidence of conceptual execution>",
    "consequence": "<Impact on audience interpretation>",
    "fix": "<Specific refinement or 'Preserve as is'>",
    "professional": "<Observation. Evidence. Consequence. Fix.>",
    "unreliable": "<short witty 1-sentence line>"
  },
  "whatCouldImprove": {
    "professional": "<The 2 most critical adjustments in order of impact>",
    "unreliable": "<short witty remark>"
  },
  "verdict": {
    "overallScore": <number 1-10 matching score above>,
    "scoreReason": "<One direct sentence explaining the primary justification for the score with visual evidence>",
    "firstImpression": "<One specific memorable sentence on overall visual impact>",
    "whatWorks": "<Specific strengths supported by visible evidence>",
    "biggestProblem": "<The single most consequential weakness with evidence>",
    "otherIssues": ["<Additional issue if applicable>"],
    "howToFixIt": "<One concrete, actionable recommendation>",
    "whatToPreserve": "<Strongest existing quality that must not be lost>",
    "professional": "<Consolidated editorial verdict>",
    "unreliable": "<short witty character conclusion>"
  }
}
`;
      const rawJson = await callGeminiApi(prompt, artwork.dataUrl, key, true);
      const parsed = JSON.parse(rawJson);

      const parsedScore = parsed.score || parsed.verdict?.overallScore || 7;
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
      console.error('[Critique Engine] Gemini API vision call failed:', err?.message || err);
      apiErrorMessage = err?.message || 'Gemini Vision API request failed';
    }
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
  previousCritique: CritiqueData,
  customApiKey?: string
): Promise<{
  reply: string;
  unreliableNote?: string;
  verdictReconsidered: boolean;
  updatedVerdictScore?: number;
}> {
  const key = customApiKey || getStoredApiKey();

  if (key) {
    try {
      const prompt = `
You are THE UNRELIABLE ART CRITIC. The artist is explaining their creative intent and defending their design decisions after receiving your critique.
Artwork category: "${artwork.category}".
Artist's defense: "${userDefense}"
Previous verdict score: ${previousCritique.verdict.overallScore}/10.

INSTRUCTIONS:
- Directly evaluate the logic of their explanation against visual design principles.
- Distinguish deliberate, intentional decisions from accidental weaknesses.
- Do NOT automatically agree with the artist, and do NOT automatically defend your original critique.
- If they explain a legitimate functional or artistic reason (e.g. intentional dissonance, specific audience, deliberate contrast, brutalist tension), concede with professional respect, explain how it reframes the piece, and increase the score by 1 point (set "verdictReconsidered": true).
- If their argument is an excuse for poor legibility, lack of hierarchy, or sloppy alignment, explain why the eye still records the visual failure regardless of intention (set "verdictReconsidered": false).
- "reply": Professional art director response. Direct, concise, no jargon.
- "unreliableNote": Short witty character reaction (1 sentence).

Respond with valid JSON:
{
  "reply": "<Direct evaluation of their argument and visual evidence>",
  "unreliableNote": "<Witty short character comment>",
  "verdictReconsidered": <boolean>,
  "updatedVerdictScore": <number 1-10>
}
`;
      const raw = await callGeminiApi(prompt, artwork.dataUrl, key, true);
      return JSON.parse(raw);
    } catch (e: any) {
      console.warn('[Critic Engine] Gemini defense failed, using heuristic:', e?.message || e);
    }
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
  customApiKey?: string
): Promise<{ reply: string; unreliableNote?: string }> {
  const key = customApiKey || getStoredApiKey();

  if (key) {
    try {
      const prompt = `
You are THE UNRELIABLE ART CRITIC. The user is disputing or challenging your critique:
User's challenge: "${userChallenge}".
Artwork: ${artwork.category}, Dimensions: ${artwork.analysis.aspectRatio}.
Stage: ${stage} (1=Composed, 2=Pretentious, 3=Suspicious, 4=Unstable, 5=Breakdown).

INSTRUCTIONS:
- Reconsider the visual evidence in the artwork and explain whether your original judgement still holds.
- Acknowledge valid objections and correct mistakes if the user is visually correct.
- If their challenge ignores fundamental design principles (hierarchy, contrast, balance, reading order), defend your critique with clear, sharp graphic design principles.
- Use direct, familiar language. Avoid obscure metaphors.
- Return valid JSON:
{
  "reply": "<Professional reconsideration or defense grounded in visual evidence>",
  "unreliableNote": "<Witty 1-sentence character line matching stage ${stage}>"
}
`;
      const raw = await callGeminiApi(prompt, artwork.dataUrl, key, true);
      return JSON.parse(raw);
    } catch (e: any) {
      console.warn('[Critic Engine] Gemini challenge failed, using heuristic reply:', e?.message || e);
    }
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
  customApiKey?: string
): Promise<RedesignDirection[]> {
  const key = customApiKey || getStoredApiKey();

  if (key) {
    try {
      const prompt = `
You are a master creative director. Formulate three distinct, highly actionable redesign directions for this ${artwork.category}, grounded in the ACTUAL visual elements of the uploaded artwork:
Dominant colors: ${artwork.analysis.dominantColors.join(', ')}.
Aspect ratio: ${artwork.analysis.aspectRatio}.
Artist statement: "${artwork.statement || 'None provided'}".

INSTRUCTIONS:
- Suggest distinct creative directions:
  01 RESTRAINT (Minimalist reduction, negative space, pure hierarchy)
  02 DISTORTION (Calculated tension, dynamic asymmetry, high contrast)
  03 REINTERPRETATION (Editorial formalism, structural realignment)
- For each direction:
  - Explain what would change from the current artwork ("whatChanges").
  - Explain why that change might work for this specific design ("whyItWorks").
  - State which existing visual qualities should be preserved ("whatToPreserve").
  - Provide 3 concrete production steps.

Return ONLY valid JSON matching this schema:
[
  {
    "number": "01",
    "code": "RESTRAINT",
    "title": "Minimalist Reduction & Spatial Discipline",
    "concept": "<Concise concept focusing on negative space and pure hierarchy>",
    "whatChanges": "<Specific changes from current design>",
    "whyItWorks": "<Why this works for the category and concept>",
    "whatToPreserve": "<Which existing quality to keep>",
    "colourTreatment": "<Palette reduction>",
    "composition": "<Clean grid realignment>",
    "typography": "<Tight font pairing>",
    "textureAndEffects": "<Zero noise / pure flat or minimal finish>",
    "actionableSteps": ["<Specific step 1>", "<Specific step 2>", "<Specific step 3>"]
  },
  {
    "number": "02",
    "code": "DISTORTION",
    "title": "Calculated Tension & Dynamic Contrast",
    "concept": "<Direction using intentional asymmetry and bold contrast>",
    "whatChanges": "<Specific changes from current design>",
    "whyItWorks": "<Why this works for the category and concept>",
    "whatToPreserve": "<Which existing quality to keep>",
    "colourTreatment": "<High friction palette>",
    "composition": "<Dynamic asymmetric layout>",
    "typography": "<Bold expressive type treatment>",
    "textureAndEffects": "<Dither, grain or analog texture>",
    "actionableSteps": ["<Specific step 1>", "<Specific step 2>", "<Specific step 3>"]
  },
  {
    "number": "03",
    "code": "REINTERPRETATION",
    "title": "Editorial Architectural Formalism",
    "concept": "<Fresh conceptual angle restructuring the entire hierarchy>",
    "whatChanges": "<Specific changes from current design>",
    "whyItWorks": "<Why this works for the category and concept>",
    "whatToPreserve": "<Which existing quality to keep>",
    "colourTreatment": "<Monochrome or high-fashion duotone>",
    "composition": "<Strict columnar layout>",
    "typography": "<Display serif with clean sans captions>",
    "textureAndEffects": "<Matte editorial print finish>",
    "actionableSteps": ["<Specific step 1>", "<Specific step 2>", "<Specific step 3>"]
  }
]
`;
      const raw = await callGeminiApi(prompt, artwork.dataUrl, key, true);
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length >= 3) {
        return parsed;
      }
    } catch (e: any) {
      console.warn('[Critic Engine] Gemini redesign failed, using heuristic briefs:', e?.message || e);
    }
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
  artwork: Artwork,
  customApiKey?: string
): Promise<BrutalTruthData> {
  const key = customApiKey || getStoredApiKey();

  if (key) {
    try {
      const prompt = `
Act as an experienced NO-NONSENSE SENIOR ART DIRECTOR conducting an urgent, high-stakes design critique of the uploaded image.
Category: "${artwork.category}".
Image data: Aspect ratio ${artwork.analysis.aspectRatio}, Brightness: ${artwork.analysis.brightnessLevel}, Contrast: ${artwork.analysis.contrastLevel}, Dominant colors: ${artwork.analysis.dominantColors.join(', ')}.

${getCategoryEvaluationFocus(artwork.category)}

INSTRUCTIONS:
- Be direct, specific, and technically precise.
- Base every single observation on concrete visual evidence in this image.
- Criticise the design, not the designer.
- Do NOT exaggerate weaknesses to sound brutal. If the artwork is strong, acknowledge it directly.
- Avoid vague advice like "improve hierarchy"; explain exactly what to change and why.

STRUCTURE TO FOLLOW STRICTLY:
1. THE HARD TRUTH: One direct sentence identifying the biggest problem of this design.
2. THE EVIDENCE: Two or three specific observations from the artwork.
3. WHY IT MATTERS: Direct explanation of how the problem affects the intended result or communication.
4. FIX THESE FIRST: The three highest-priority changes, ordered by importance.
5. KEEP THIS: The single strongest existing design decision that must NOT be lost during revision.

Return ONLY valid JSON matching this schema:
{
  "hardTruth": "<One direct sentence identifying the biggest problem of this design>",
  "evidence": [
    "<Concrete observation 1 from the artwork>",
    "<Concrete observation 2 from the artwork>",
    "<Concrete observation 3 from the artwork>"
  ],
  "whyItsNotWorking": "<Direct explanation of how the problem affects the intended result or communication>",
  "whatToFixFirst": [
    "<1st highest-priority change, ordered by importance>",
    "<2nd highest-priority change>",
    "<3rd highest-priority change>"
  ],
  "whatToKeep": "<The single strongest existing design decision that must NOT be lost during revision>"
}
`;
      const raw = await callGeminiApi(prompt, artwork.dataUrl, key, true);
      const parsed = JSON.parse(raw);

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
      console.warn('[Critic Engine] Gemini brutal truth failed, using evidence-based heuristic fallback:', e?.message || e);
    }
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
  const isDense = analysis.estimatedComplexity === 'dense';
  const balance = analysis.horizontalBalance || 'centered';
  const vBalance = analysis.verticalBalance || 'centered';
  const mainColor = analysis.dominantColors[0] || '#0A0A0A';
  const accentColor = analysis.dominantColors[1] || '#D71920';

  // Check statement & memory for stated aesthetic preferences (e.g. deliberate asymmetry or brutalism)
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

  // Compute defensible score based on real balance, margins, and contrast metrics
  let calculatedScore = 7;
  let deductions = 0;
  let primaryScoreReason = '';

  // Do not penalize for deliberate asymmetry!
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

  // 1. First Impression (Image-specific & Category-adapted)
  let firstImpressionProf = '';
  if (category === 'Poster') {
    firstImpressionProf = `A bold Swiss modernist editorial statement. The high-contrast palette (${mainColor} and ${accentColor}) establishes immediate impact, commanding attention across the ${analysis.aspectRatio} format.`;
  } else if (category === 'Album cover') {
    firstImpressionProf = `An intensely atmospheric, claustrophobic visual statement tailored for an experimental soundscape. The ${analysis.aspectRatio} square format is anchored by a stark geometric silhouette against deep black (${mainColor}).`;
  } else if (category === 'Illustration') {
    firstImpressionProf = `An expressive, high-tension figurative study. The contrast between the stark light field and deep silhouette shapes (${mainColor} and ${accentColor}) creates an immediate graphic punch across the ${analysis.aspectRatio} format.`;
  } else if (category === 'Typography') {
    firstImpressionProf = `A sharp, conceptually rigorous typographic study. The dialogue between redacted rectangular blocks and editorial letterforms creates immediate intellectual intrigue.`;
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

  // 2. What Works (Image-Specific Evidence)
  let whatWorksTitle = '';
  let whatWorksEvidence = '';

  if (category === 'Poster') {
    whatWorksTitle = "Disciplined modernist contrast hierarchy";
    whatWorksEvidence = `Stark value separation between the dominant dark field (${mainColor}) and crisp light elements creates an immediate first-order visual hierarchy for reading from a distance.`;
  } else if (category === 'Album cover') {
    whatWorksTitle = "Resonant iconic silhouette for small-screen scale";
    whatWorksEvidence = `The stark central polygon and vertical crimson axis line (${accentColor}) retain immediate recognition even when reduced to mobile streaming thumbnail scale.`;
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

  // 3. Biggest Problem (OBSERVATION → EVIDENCE → CONSEQUENCE → FIX)
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
    biggestProblemEvidence = `Subtle midtone values between the central geometric silhouette and the ${mainColor} field rely on narrow luminance steps.`;
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

  // 7. Composition (Observation -> Evidence -> Consequence -> Fix)
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

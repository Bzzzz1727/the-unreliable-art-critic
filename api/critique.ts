/**
 * Server-Side Gemini Vision API Endpoint for The Unreliable Art Critic
 * Deployed as a Vercel Serverless Function at /api/critique
 */

interface ImagePayload {
  mimeType: string;
  base64: string;
}

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

// In-memory sliding window rate limiting (per serverless instance)
const ipRateLimits = new Map<string, RateLimitEntry>();
const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute
const MAX_REQUESTS_PER_WINDOW = 10; // Max 10 requests/min per IP

// Concurrency limiter to protect free-tier quotas
let inFlightRequests = 0;
const MAX_CONCURRENT_REQUESTS = 3;

// Max payload size: 6MB (approx 8.5MB in base64 string)
const MAX_BASE64_LENGTH = 8.5 * 1024 * 1024;
const ALLOWED_MIME_TYPES = ['image/png', 'image/jpeg', 'image/webp'];

/**
 * Redact API key from any URL or error string before returning to client
 */
function sanitizeError(msg: string): string {
  if (!msg) return '';
  return msg
    .replace(/key=[a-zA-Z0-9_\-]+/g, 'key=[REDACTED]')
    .replace(/AIza[a-zA-Z0-9_\-]{35}/g, '[REDACTED]')
    .replace(/AQ\.[a-zA-Z0-9_\-]+/g, '[REDACTED]');
}

/**
 * Send JSON response supporting both Vercel response helper and standard Node ServerResponse
 */
function sendJson(res: any, status: number, data: any) {
  if (typeof res.status === 'function') {
    return res.status(status).json(data);
  }
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify(data));
}

/**
 * Rate limit check
 */
function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const entry = ipRateLimits.get(ip);

  // Periodically clean up expired entries
  if (ipRateLimits.size > 500) {
    for (const [key, val] of ipRateLimits.entries()) {
      if (now > val.resetTime) ipRateLimits.delete(key);
    }
  }

  if (!entry || now > entry.resetTime) {
    ipRateLimits.set(ip, { count: 1, resetTime: now + RATE_LIMIT_WINDOW_MS });
    return false;
  }

  if (entry.count >= MAX_REQUESTS_PER_WINDOW) {
    return true;
  }

  entry.count++;
  return false;
}

/**
 * Category-specific evaluation rubrics
 */
function getCategoryRubric(category: string): string {
  switch (category) {
    case 'Poster':
      return `CATEGORY PRIORITIES (POSTER):
- Communication hierarchy and readability from a viewing distance (the 2-second glance test).
- Immediate focal point and natural visual entry path across the composition.
- Margin breathing room, perimeter protection, and typographical scale.
- DO NOT penalize bold display typography, intentional high contrast, brutalist asymmetry, or experimental headline scale when purposeful.`;

    case 'Album cover':
      return `CATEGORY PRIORITIES (ALBUM COVER):
- Conceptual resonance, atmosphere, distinctiveness, and memorable graphic hook.
- Immediate recognition and clarity at small streaming thumbnail scale (300x300 and smaller).
- Harmonious relationship between imagery and typography (artist/title) if present.
- DO NOT penalize surrealism, grain, intentional distortion, low-fi aesthetics, or lack of commercial copy.`;

    case 'Branding':
      return `CATEGORY PRIORITIES (BRANDING):
- Distinctiveness, memorability, and visual consistency of identity marks.
- Scalability across micro-applications (favicons, app icons) and large signage.
- Clear-space margins, perimeter protection, and optical weight balance.
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
- Readability, font pairing, and stylistic consistency across glyph sets.`;

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

/**
 * Multimodal call to Google Gemini API
 */
async function callGemini(
  prompt: string,
  image: ImagePayload | null,
  apiKey: string,
  modelName: string,
  forceJson: boolean = true
): Promise<string> {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent`;

  const bodyParts: any[] = [];

  // Ground vision model with inline image payload first
  if (image && image.base64) {
    bodyParts.push({
      inlineData: {
        mimeType: image.mimeType,
        data: image.base64
      }
    });
  }

  bodyParts.push({ text: prompt });

  const body = {
    contents: [{ parts: bodyParts }],
    generationConfig: {
      temperature: 0.65,
      maxOutputTokens: 3500,
      responseMimeType: forceJson ? 'application/json' : 'text/plain'
    }
  };

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-goog-api-key': apiKey
    },
    body: JSON.stringify(body)
  });

  if (!response.ok) {
    const status = response.status;
    let errorDetails = '';
    try {
      const errJson = await response.json();
      errorDetails = errJson?.error?.message || JSON.stringify(errJson);
    } catch {
      errorDetails = await response.text();
    }

    if (status === 429) {
      throw new Error(`Gemini free-tier quota or rate limit exhausted (HTTP 429). Please wait a moment before trying again.`);
    } else if (status === 404) {
      throw new Error(`Gemini model "${modelName}" is not available for this API key. Verify model access in Google AI Studio.`);
    } else if (status === 400 || status === 403) {
      throw new Error(`Gemini API authentication failed (HTTP ${status}): ${sanitizeError(errorDetails)}`);
    } else {
      throw new Error(`Gemini API error (HTTP ${status}): ${sanitizeError(errorDetails)}`);
    }
  }

  const result = await response.json();
  const textOutput = result?.candidates?.[0]?.content?.parts?.[0]?.text;

  if (!textOutput) {
    throw new Error('Gemini API returned an empty response.');
  }

  let cleaned = textOutput.trim();
  if (forceJson && cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim();
  }
  return cleaned;
}

/**
 * Main Serverless Function Handler
 */
export default async function handler(req: any, res: any) {
  // CORS handling
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return sendJson(res, 204, {});
  }

  // Health check endpoint (GET)
  if (req.method === 'GET') {
    const hasKey = Boolean(process.env.GEMINI_API_KEY);
    const configuredModel = process.env.GEMINI_MODEL || 'gemini-3.5-flash-lite';
    return sendJson(res, 200, {
      status: 'online',
      service: 'The Unreliable Art Critic API',
      configured: hasKey,
      model: configuredModel
    });
  }

  if (req.method !== 'POST') {
    return sendJson(res, 405, { error: 'Method Not Allowed' });
  }

  // Abuse Protection: Client IP Rate Limiting
  const clientIp =
    (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() ||
    req.socket?.remoteAddress ||
    'anonymous';

  if (isRateLimited(clientIp)) {
    return sendJson(res, 429, {
      error: 'Rate limit exceeded. Please wait a moment before requesting another critique.'
    });
  }

  // Abuse Protection: In-flight concurrency guard
  if (inFlightRequests >= MAX_CONCURRENT_REQUESTS) {
    return sendJson(res, 503, {
      error: 'The Art Critic is currently analyzing multiple artworks. Please try again in a few seconds.'
    });
  }

  inFlightRequests++;

  try {
    // Parse request body safely
    let body = req.body;
    if (typeof body === 'string') {
      try {
        body = JSON.parse(body);
      } catch {
        return sendJson(res, 400, { error: 'Invalid JSON payload in request body.' });
      }
    } else if (!body && typeof req.on === 'function') {
      body = await new Promise((resolve, reject) => {
        let raw = '';
        req.on('data', (chunk: any) => { raw += chunk; });
        req.on('end', () => {
          try { resolve(JSON.parse(raw)); } catch (e) { resolve(null); }
        });
        req.on('error', reject);
      });
    }

    if (!body || typeof body !== 'object') {
      return sendJson(res, 400, { error: 'Request body must be a valid JSON object.' });
    }

    const { action, image, category = 'Poster', statement = '', stage = 1, memoryContextText = '', userDefense, userChallenge, previousCritique } = body;

    // Secure API Key resolution: Environment variable on server only (no client overrides)
    const apiKey = process.env.GEMINI_API_KEY?.trim();

    if (!apiKey) {
      return sendJson(res, 503, {
        error: 'GEMINI_API_KEY is not configured on the server. Please configure GEMINI_API_KEY in Vercel Environment Variables.'
      });
    }

    // Model selection: free-tier multimodal flash model
    const modelName = process.env.GEMINI_MODEL?.trim() || 'gemini-3.5-flash-lite';

    // Validate image payload
    if (image) {
      if (typeof image.base64 !== 'string') {
        return sendJson(res, 400, { error: 'Image base64 data must be a string.' });
      }

      if (image.base64.length > MAX_BASE64_LENGTH) {
        return sendJson(res, 413, { error: 'Image exceeds maximum allowable size (6MB). Please upload a smaller image.' });
      }

      const mime = (image.mimeType || '').toLowerCase();
      if (!ALLOWED_MIME_TYPES.includes(mime)) {
        return sendJson(res, 400, { error: `Unsupported image MIME type "${mime}". Supported: ${ALLOWED_MIME_TYPES.join(', ')}` });
      }
    }

    // -------------------------------------------------------------------------
    // ACTION 1: INITIAL CRITIQUE
    // -------------------------------------------------------------------------
    if (action === 'critique' || action === 'initial_critique') {
      if (!image || !image.base64) {
        return sendJson(res, 400, { error: 'An image is required to generate a visual critique.' });
      }

      const prompt = `
You are THE UNRELIABLE ART CRITIC. Act as an experienced, sharp, highly discerning art director and graphic design critic who evaluates the ACTUAL uploaded artwork.
Artwork category: "${category}".
Artist statement: "${statement || 'None provided'}".
${memoryContextText ? `\n${memoryContextText}\n` : ''}

${getCategoryRubric(category)}

CRITICAL INSTRUCTIONS & REASONING STRUCTURE:
1. EXAMINE THE ACTUAL ARTWORK:
   - Your entire analysis must refer to concrete, visible elements in this uploaded image: examine actual headline text words, figure silhouettes, color values, layout spacing, letterforms, and negative space.
   - For every criticism, follow this exact reasoning structure:
     * OBSERVATION: What specifically is visible in this image?
     * VISUAL EVIDENCE: Where is it located, and what concrete visual detail demonstrates this?
     * CONSEQUENCE: How does it impact the viewer's experience or communicative clarity?
     * RECOMMENDATION: What precise, testable change would improve it? (Or if effective, state why it works).
   - FORBIDDEN GENERIC PLATITUDES: Do NOT output stock critique tropes like "expand perimeter padding by 20px", "improve visual hierarchy", "the composition lacks balance", or arbitrary metric deductions. Be specific to what is on the canvas.

2. RECOGNIZE INTENTIONAL UNCONVENTIONAL CHOICES:
   - Do NOT penalize deliberate asymmetry, brutalist tension, stark minimalism, distressed textures, or expressive typography when they serve the concept.
   - Distinguish deliberate stylistic dissonance from sloppy execution.
   - If you cannot verify a detail from the image, state that directly rather than inventing visual elements.

3. SCORE OUT OF 10:
   - Provide an honest, defensible score out of 10 based on the category priorities and execution.
   - Justify the score in "scoreReason" with direct visual evidence.

4. SEPARATE CHARACTER HUMOUR FROM PROFESSIONAL CRITIQUE:
   - "unreliable": Short, witty, sarcastic 1-sentence remark matching personality stage ${stage}.
   - "professional": Direct, clear, technically useful design evaluation without confusing jargon.

Return ONLY valid JSON matching this exact structure:
{
  "score": <number 1-10>,
  "scoreReason": "<One direct sentence explaining the primary justification for the score with visual evidence>",
  "firstImpression": {
    "name": "FIRST IMPRESSION",
    "score": <number 1-10>,
    "professional": "<One specific, memorable sentence explaining the overall visual impact and result>",
    "unreliable": "<Short witty character comment matching personality stage ${stage}>"
  },
  "whatWorks": {
    "title": "<Specific visual strength>",
    "evidence": "<Concrete visual evidence from this image supporting this strength>"
  },
  "biggestProblem": {
    "title": "<Single most consequential weakness, or 'None' if resolved>",
    "observation": "<Specific observation in this image>",
    "evidence": "<Concrete visual evidence from the artwork>",
    "consequence": "<The design consequence / why it undermines the work>",
    "fix": "<Concrete, specific, testable recommendation>"
  },
  "otherIssues": [
    {
      "title": "<Secondary material issue>",
      "evidence": "<Concrete visual evidence>",
      "consequence": "<Impact on design>"
    }
  ],
  "howToImprove": [
    "<1st prioritized actionable recommendation>",
    "<2nd prioritized actionable recommendation>"
  ],
  "whatToPreserve": "<The strongest existing design quality that must not be lost during revision>",
  "composition": {
    "name": "COMPOSITION",
    "score": <number 1-10>,
    "observation": "<Specific visual balance and hierarchy observed in this image>",
    "evidence": "<Concrete visible evidence in layout/spacing>",
    "consequence": "<Impact on visual flow and reading order>",
    "fix": "<Specific adjustment or 'Preserve as is'>",
    "professional": "<Observation. Evidence. Consequence. Fix.>",
    "unreliable": "<Short witty 1-sentence remark>"
  },
  "colourAndTexture": {
    "name": "COLOUR",
    "score": <number 1-10>,
    "observation": "<Specific palette relationships and contrast in this image>",
    "evidence": "<Concrete visible evidence of color values/hues>",
    "consequence": "<Impact on legibility/mood>",
    "fix": "<Specific adjustment or 'Preserve as is'>",
    "professional": "<Observation. Evidence. Consequence. Fix.>",
    "unreliable": "<Short witty 1-sentence remark>"
  },
  "typography": ${
    category === 'Typography' || category === 'Poster' || category === 'Branding'
      ? `{
    "name": "TYPE",
    "score": <number 1-10>,
    "observation": "<Type hierarchy and legibility observed in this image>",
    "evidence": "<Concrete visible evidence of font scale, weights, or alignment>",
    "consequence": "<Impact on reading order>",
    "fix": "<Specific adjustment or 'Preserve as is'>",
    "professional": "<Observation. Evidence. Consequence. Fix.>",
    "unreliable": "<Short witty 1-sentence remark>"
  }`
      : `null`
  },
  "concept": {
    "name": "CONCEPT",
    "score": <number 1-10>,
    "observation": "<Clarity of communication and message>",
    "evidence": "<Concrete visible evidence of conceptual execution>",
    "consequence": "<Impact on audience interpretation>",
    "fix": "<Specific refinement or 'Preserve as is'>",
    "professional": "<Observation. Evidence. Consequence. Fix.>",
    "unreliable": "<Short witty 1-sentence remark>"
  },
  "whatCouldImprove": {
    "professional": "<The 2 most critical adjustments in order of impact>",
    "unreliable": "<Short witty remark>"
  },
  "verdict": {
    "overallScore": <number 1-10 matching score above>,
    "scoreReason": "<One direct sentence explaining score justification with visual evidence>",
    "firstImpression": "<One specific memorable sentence on overall visual impact>",
    "whatWorks": "<Specific strengths supported by visible evidence>",
    "biggestProblem": "<The single most consequential weakness with evidence>",
    "otherIssues": ["<Additional issue if applicable>"],
    "howToFixIt": "<One concrete, actionable recommendation>",
    "whatToPreserve": "<Strongest existing quality that must not be lost>",
    "professional": "<Consolidated editorial verdict>",
    "unreliable": "<Short witty character conclusion>"
  }
}
`;

      const rawJson = await callGemini(prompt, image, apiKey, modelName, true);
      const parsed = JSON.parse(rawJson);
      return sendJson(res, 200, { ...parsed, engineSource: 'gemini_vision', model: modelName });
    }

    // -------------------------------------------------------------------------
    // ACTION 2: DEFEND MY DESIGN
    // -------------------------------------------------------------------------
    if (action === 'defend') {
      if (!userDefense || typeof userDefense !== 'string') {
        return sendJson(res, 400, { error: 'Artist defense statement is required.' });
      }

      const prompt = `
You are THE UNRELIABLE ART CRITIC. The artist is defending their design decisions after receiving your critique.
Artwork category: "${category}".
Artist's defense: "${userDefense}"
Previous verdict score: ${previousCritique?.verdict?.overallScore || previousCritique?.score || 7}/10.
${previousCritique?.biggestProblem?.title ? `Previous biggest problem identified: "${previousCritique.biggestProblem.title}: ${previousCritique.biggestProblem.evidence || ''}"` : ''}

INSTRUCTIONS:
- Directly evaluate the logic of their explanation against the actual visual evidence in the uploaded image.
- Distinguish deliberate, intentional decisions from accidental weaknesses.
- If they explain a legitimate functional or artistic reason (e.g. intentional dissonance, specific audience, deliberate contrast, brutalist tension) that is confirmed by the artwork, concede with professional respect and increase the score by 1 point (set "verdictReconsidered": true).
- If their argument is merely an excuse for poor legibility, lack of hierarchy, or sloppy alignment, explain why the eye still records the visual failure regardless of intention (set "verdictReconsidered": false).
- "reply": Professional art director response. Direct, concise, grounded in visible elements.
- "unreliableNote": Short witty character reaction (1 sentence).

Respond with valid JSON:
{
  "reply": "<Direct evaluation of their argument and visible canvas evidence>",
  "unreliableNote": "<Witty short character comment>",
  "verdictReconsidered": <boolean>,
  "updatedVerdictScore": <number 1-10>
}
`;

      const rawJson = await callGemini(prompt, image || null, apiKey, modelName, true);
      const parsed = JSON.parse(rawJson);
      return sendJson(res, 200, parsed);
    }

    // -------------------------------------------------------------------------
    // ACTION 3: CHALLENGE THE CRITIC
    // -------------------------------------------------------------------------
    if (action === 'challenge') {
      if (!userChallenge || typeof userChallenge !== 'string') {
        return sendJson(res, 400, { error: 'User challenge statement is required.' });
      }

      const prompt = `
You are THE UNRELIABLE ART CRITIC. The user is disputing or challenging your critique:
User's challenge: "${userChallenge}".
Artwork category: "${category}".
Stage: ${stage} (1=Composed, 2=Pretentious, 3=Suspicious, 4=Unstable, 5=Breakdown).
${previousCritique?.verdict?.biggestProblem ? `Your previous critique: "${previousCritique.verdict.biggestProblem}"` : ''}

INSTRUCTIONS:
- Re-examine the actual visual evidence in the uploaded artwork.
- If the user's challenge points out a genuine nuance you missed or if their objection is visually supported by the artwork, acknowledge it and adjust your critique.
- If their challenge ignores fundamental design principles (hierarchy, contrast, balance, reading order), defend your critique using concrete visible elements in the piece.
- Use direct language grounded in graphic design principles.
- Return valid JSON:
{
  "reply": "<Professional reconsideration or defense grounded in visible image elements>",
  "unreliableNote": "<Witty 1-sentence character line matching stage ${stage}>"
}
`;

      const rawJson = await callGemini(prompt, image || null, apiKey, modelName, true);
      const parsed = JSON.parse(rawJson);
      return sendJson(res, 200, parsed);
    }

    // -------------------------------------------------------------------------
    // ACTION 4: BRUTAL TRUTH
    // -------------------------------------------------------------------------
    if (action === 'brutal_truth') {
      if (!image || !image.base64) {
        return sendJson(res, 400, { error: 'An image is required for Brutal Truth analysis.' });
      }

      const prompt = `
Act as an experienced NO-NONSENSE SENIOR ART DIRECTOR conducting an urgent, high-stakes design critique of the uploaded image.
Category: "${category}".
Statement: "${statement || 'None provided'}".

${getCategoryRubric(category)}

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

      const rawJson = await callGemini(prompt, image, apiKey, modelName, true);
      const parsed = JSON.parse(rawJson);
      return sendJson(res, 200, { ...parsed, engineSource: 'gemini_vision' });
    }

    // -------------------------------------------------------------------------
    // ACTION 5: REDESIGN BRIEFS
    // -------------------------------------------------------------------------
    if (action === 'redesign') {
      if (!image || !image.base64) {
        return sendJson(res, 400, { error: 'An image is required to formulate redesign briefs.' });
      }

      const prompt = `
You are a master creative director. Formulate three distinct, highly actionable redesign directions for this ${category}, grounded in the ACTUAL visual elements of the uploaded artwork:
Artist statement: "${statement || 'None provided'}".
${previousCritique?.biggestProblem?.evidence ? `Key flaw to resolve: "${previousCritique.biggestProblem.title}: ${previousCritique.biggestProblem.evidence}"` : ''}

INSTRUCTIONS:
- Formulate three distinct creative directions:
  01 RESTRAINT (Minimalist reduction, negative space, pure hierarchy)
  02 DISTORTION (Calculated tension, dynamic asymmetry, high contrast)
  03 REINTERPRETATION (Editorial formalism, structural realignment)
- For each direction:
  - Explain what specifically would change from the current artwork ("whatChanges").
  - Explain why that change works for this specific design and category ("whyItWorks").
  - State which existing visual qualities should be preserved ("whatToPreserve").
  - Provide 3 concrete, actionable production steps.

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

      const rawJson = await callGemini(prompt, image, apiKey, modelName, true);
      const parsed = JSON.parse(rawJson);
      return sendJson(res, 200, parsed);
    }

    return sendJson(res, 400, { error: `Unknown action "${action}". Valid actions: critique, defend, challenge, brutal_truth, redesign` });
  } catch (error: any) {
    console.error('[API Critique Error]:', error?.message || error);
    const sanitizedMsg = sanitizeError(error?.message || 'Internal server error while analyzing artwork.');
    return sendJson(res, 500, { error: sanitizedMsg });
  } finally {
    inFlightRequests = Math.max(0, inFlightRequests - 1);
  }
}

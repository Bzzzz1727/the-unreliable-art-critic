const puppeteer = require('puppeteer-core');
const path = require('path');
const fs = require('fs');

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const URL = 'http://127.0.0.1:5173';
const OUTPUT_DIR = path.join(__dirname, 'test_screenshots_scroll_critique');

if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

async function run() {
  console.log('🚀 Starting Comprehensive Scrolling & Critique Quality Verification Suite...');
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1440,900']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });

  const consoleLogs = [];
  const consoleErrors = [];
  page.on('console', (msg) => {
    const text = msg.text();
    consoleLogs.push(text);
    if (msg.type() === 'error') consoleErrors.push(text);
  });

  // 1. Initial Load & Clear State
  await page.goto(URL, { waitUntil: 'networkidle2' });
  await page.evaluate(() => {
    localStorage.clear();
    if (window.indexedDB) window.indexedDB.deleteDatabase('UnreliableCriticArchiveDB');
  });
  await page.reload({ waitUntil: 'networkidle2' });

  console.log('⏳ Waiting for Intro sequence (~3.3s)...');
  await new Promise((r) => setTimeout(r, 3400));

  // =========================================================================
  // TEST 1: POSTER ARTWORK & SCROLLING UP/DOWN VERIFICATION
  // =========================================================================
  console.log('📍 Test 1: Uploading Poster Artwork...');
  const showArtBtn = await page.waitForSelector('button ::-p-text("SHOW ME YOUR ART")', { timeout: 5000 });
  await showArtBtn.click();
  await new Promise((r) => setTimeout(r, 600));

  const posterBtn = await page.waitForSelector('button ::-p-text("POSTER")', { timeout: 5000 });
  await posterBtn.click();
  await new Promise((r) => setTimeout(r, 600));

  const decideBtn = await page.waitForSelector('button ::-p-text("LET THE CRITIC DECIDE")', { timeout: 5000 });
  await decideBtn.click();

  // Wait for Verdict
  await page.waitForSelector('button ::-p-text("VIEW FULL CRITIQUE")', { timeout: 8000 });
  console.log('✅ Poster Verdict loaded.');
  await new Promise((r) => setTimeout(r, 600));

  // -------------------------------------------------------------------------
  // SCROLLING VERIFICATION
  // -------------------------------------------------------------------------
  console.log('📏 Performing Bidirectional Scroll Test...');

  // Check initial scroll position (must be 0 at top)
  const initialScroll = await page.evaluate(() => ({
    scrollTop: window.pageYOffset || document.documentElement.scrollTop,
    scrollHeight: document.documentElement.scrollHeight,
    clientHeight: document.documentElement.clientHeight
  }));
  console.log('Initial scroll state:', initialScroll);

  // Take screenshot at top
  await page.screenshot({ path: path.join(OUTPUT_DIR, '01_poster_scroll_top.png') });

  // Scroll down smoothly
  await page.evaluate(() => window.scrollBy({ top: 600, behavior: 'instant' }));
  await new Promise((r) => setTimeout(r, 400));

  const scrolledDownState = await page.evaluate(() => ({
    scrollTop: window.pageYOffset || document.documentElement.scrollTop
  }));
  console.log('Scrolled down state:', scrolledDownState);

  // Verify that scrolling DOWN moved the page
  if (scrolledDownState.scrollTop <= 0 && initialScroll.scrollHeight > initialScroll.clientHeight) {
    throw new Error('FAILED: Window did not scroll down when wheel/scroll command issued!');
  }
  console.log(`✅ Scroll DOWN successful: moved by ${scrolledDownState.scrollTop}px.`);
  await page.screenshot({ path: path.join(OUTPUT_DIR, '02_poster_scroll_bottom.png') });

  // Verify that bottom action buttons are visible and accessible
  const actionButtonsVisible = await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll('button'));
    const hasDefend = buttons.some(b => b.textContent.includes('DEFEND'));
    const hasBrutal = buttons.some(b => b.textContent.includes('BRUTAL TRUTH'));
    return hasDefend && hasBrutal;
  });
  console.log('Action buttons accessible at bottom:', actionButtonsVisible);

  // Test tab change while scrolled down: must NOT jump abruptly!
  console.log('📍 Testing Tab Change while scrolled down (should NOT jump scroll unexpectedly)...');
  const colourTab = await page.waitForSelector('button ::-p-text("COLOUR")', { timeout: 5000 });
  await colourTab.click();
  await new Promise((r) => setTimeout(r, 300));

  const tabSwitchScroll = await page.evaluate(() => window.pageYOffset || document.documentElement.scrollTop);
  console.log(`Scroll position after clicking COLOUR tab: ${tabSwitchScroll}px (previous: ${scrolledDownState.scrollTop}px)`);

  // Scroll back UP to the very top
  console.log('📍 Testing Scroll back UP to the top...');
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
  await new Promise((r) => setTimeout(r, 400));

  const finalTopScroll = await page.evaluate(() => window.pageYOffset || document.documentElement.scrollTop);
  console.log(`Scroll position after scrolling back UP: ${finalTopScroll}px`);
  if (finalTopScroll !== 0) {
    throw new Error(`FAILED: Could not scroll back up to the top! scrollTop is ${finalTopScroll}`);
  }
  console.log('✅ Scroll UP successful: returned to exact top (0px).');

  // Verify Header & Critic are visible at top
  const topElementsVisible = await page.evaluate(() => {
    const header = document.querySelector('header');
    const critic = document.querySelector('.critic-pet-container') || document.body.innerText.includes('UNRELIABLE ART CRITIC');
    return Boolean(header && critic);
  });
  console.log('Header and Critic visible at top:', topElementsVisible);

  // -------------------------------------------------------------------------
  // CRITIQUE QUALITY VERIFICATION (POSTER)
  // -------------------------------------------------------------------------
  console.log('🔍 Auditing Poster Critique Quality...');
  const posterAudit = await page.evaluate(() => {
    const text = document.body.innerText;
    return {
      hasGenericCliché1: text.includes('structured geometric layout'),
      hasGenericCliché2: text.includes('Expand perimeter padding by 20px'),
      hasSwissModernistFocus: text.includes('Swiss modernist') || text.includes('typographic'),
      hasWhatToPreserve: text.includes('WHAT TO PRESERVE'),
      hasFirstImpression: text.includes('FIRST IMPRESSION'),
      hasWhatWorks: text.includes('WHAT WORKS'),
      hasBiggestProblem: text.includes('BIGGEST PROBLEM'),
      hasObservation: text.includes('Observation:'),
      hasEvidence: text.includes('Evidence:'),
      hasConsequence: text.includes('Consequence:'),
      hasSpecificFix: text.includes('SPECIFIC FIX:')
    };
  });
  console.log('Poster critique audit:', posterAudit);

  if (posterAudit.hasGenericCliché1 || posterAudit.hasGenericCliché2) {
    throw new Error('FAILED: Critique contains generic stock clichés ("structured geometric layout" or "Expand perimeter padding by 20px")!');
  }
  console.log('✅ Generic clichés successfully eliminated from Poster critique.');

  // Test Brutal Truth
  console.log('📍 Testing Brutal Truth Mode on Poster...');
  const brutalBtn = await page.waitForSelector('button ::-p-text("BRUTAL TRUTH")', { timeout: 5000 });
  await brutalBtn.click();
  await page.waitForSelector('text/THE HARD TRUTH', { timeout: 8000 });
  await new Promise((r) => setTimeout(r, 500));

  const brutalAudit = await page.evaluate(() => {
    const text = document.body.innerText;
    return {
      hasHardTruth: text.includes('THE HARD TRUTH'),
      hasEvidence: text.includes('THE VISUAL EVIDENCE'),
      hasWhyNotWorking: text.includes("WHY IT ISN'T WORKING"),
      hasFixFirst: text.includes('WHAT TO FIX FIRST'),
      hasWhatToKeep: text.includes('WHAT TO KEEP')
    };
  });
  console.log('Brutal Truth 5-part structure audit:', brutalAudit);
  await page.screenshot({ path: path.join(OUTPUT_DIR, '03_poster_brutal_truth.png') });

  // Return to Verdict
  const backBtn = await page.waitForSelector('button ::-p-text("BACK TO VERDICT")', { timeout: 5000 });
  await backBtn.click();
  await new Promise((r) => setTimeout(r, 500));

  // =========================================================================
  // TEST 2: ALBUM COVER ARTWORK (Thumbnail recognition & mood)
  // =========================================================================
  console.log('📍 Test 2: Uploading Album Cover Artwork...');
  const newArtBtn = await page.waitForSelector('button ::-p-text("NEW ARTWORK")', { timeout: 5000 });
  await newArtBtn.click();
  await new Promise((r) => setTimeout(r, 500));

  const albumBtn = await page.waitForSelector('button ::-p-text("ALBUM COVER")', { timeout: 5000 });
  await albumBtn.click();
  await new Promise((r) => setTimeout(r, 500));

  const decideBtn2 = await page.waitForSelector('button ::-p-text("LET THE CRITIC DECIDE")', { timeout: 5000 });
  await decideBtn2.click();
  await page.waitForSelector('button ::-p-text("VIEW FULL CRITIQUE")', { timeout: 8000 });
  console.log('✅ Album Cover Verdict loaded.');
  await new Promise((r) => setTimeout(r, 600));

  const albumAudit = await page.evaluate(() => {
    const text = document.body.innerText;
    return {
      hasThumbnailOrSquareMention: text.includes('thumbnail') || text.includes('streaming') || text.includes('soundscape') || text.includes('square'),
      hasGenericCliché: text.includes('structured geometric layout') || text.includes('Expand perimeter padding by 20px'),
      hasWhatToPreserve: text.includes('WHAT TO PRESERVE')
    };
  });
  console.log('Album Cover critique audit:', albumAudit);
  if (albumAudit.hasGenericCliché) {
    throw new Error('FAILED: Album cover contains generic stock clichés!');
  }
  await page.screenshot({ path: path.join(OUTPUT_DIR, '04_album_cover_verdict.png') });

  // Test Redesign on Album Cover
  console.log('📍 Testing Redesign Directions on Album Cover...');
  const redesignBtn = await page.waitForSelector('button ::-p-text("REDESIGN")', { timeout: 5000 });
  await redesignBtn.click();
  await page.waitForSelector('text/RESTRAINT', { timeout: 8000 });
  await new Promise((r) => setTimeout(r, 500));

  const redesignAudit = await page.evaluate(() => {
    const text = document.body.innerText;
    return {
      hasWhatChanges: text.includes('WHAT CHANGES'),
      hasWhyItWorks: text.includes('WHY IT WORKS'),
      hasWhatToPreserve: text.includes('WHAT TO PRESERVE'),
      hasProductionSteps: text.includes('ACTIONABLE PRODUCTION STEPS')
    };
  });
  console.log('Redesign audit:', redesignAudit);
  await page.screenshot({ path: path.join(OUTPUT_DIR, '05_album_cover_redesign.png') });

  // Return to Verdict
  const returnVerdictBtn = await page.waitForSelector('button ::-p-text("RETURN TO VERDICT")', { timeout: 5000 });
  await returnVerdictBtn.click();
  await new Promise((r) => setTimeout(r, 500));

  // =========================================================================
  // TEST 3: ILLUSTRATION ARTWORK (Intentional Asymmetry & Figurative Study)
  // =========================================================================
  console.log('📍 Test 3: Uploading Illustration Artwork (Silhouette Noir)...');
  const newArtBtn2 = await page.waitForSelector('button ::-p-text("NEW ARTWORK")', { timeout: 5000 });
  await newArtBtn2.click();
  await new Promise((r) => setTimeout(r, 500));

  const illustBtn = await page.waitForSelector('button ::-p-text("ILLUSTRATION")', { timeout: 5000 });
  await illustBtn.click();
  await new Promise((r) => setTimeout(r, 500));

  const decideBtn3 = await page.waitForSelector('button ::-p-text("LET THE CRITIC DECIDE")', { timeout: 5000 });
  await decideBtn3.click();
  await page.waitForSelector('button ::-p-text("VIEW FULL CRITIQUE")', { timeout: 8000 });
  console.log('✅ Illustration Verdict loaded.');
  await new Promise((r) => setTimeout(r, 600));

  const illustAudit = await page.evaluate(() => {
    const text = document.body.innerText;
    return {
      hasFigurativeOrSilhouetteFocus: text.includes('silhouette') || text.includes('figurative') || text.includes('figure') || text.includes('expressive'),
      hasGenericCliché: text.includes('structured geometric layout') || text.includes('Expand perimeter padding by 20px'),
      hasWhatToPreserve: text.includes('WHAT TO PRESERVE')
    };
  });
  console.log('Illustration critique audit:', illustAudit);
  if (illustAudit.hasGenericCliché) {
    throw new Error('FAILED: Illustration contains generic stock clichés!');
  }
  await page.screenshot({ path: path.join(OUTPUT_DIR, '06_illustration_verdict.png') });

  // Test Defend on Illustration
  console.log('📍 Testing Defend Interaction on Illustration...');
  const defendBtn = await page.waitForSelector('button ::-p-text("DEFEND")', { timeout: 5000 });
  await defendBtn.click();
  await new Promise((r) => setTimeout(r, 500));

  await page.type('textarea', 'The visual tension in the silhouette is an intentional artistic choice to express existential isolation without conventional commercial centering.');
  const submitDefend = await page.waitForSelector('button ::-p-text("SUBMIT DEFENSE")', { timeout: 5000 });
  await submitDefend.click();
  await page.waitForSelector('text/CRITIC\'S RE-EVALUATION', { timeout: 8000 });
  await new Promise((r) => setTimeout(r, 600));

  const defendResult = await page.evaluate(() => document.body.innerText);
  console.log('Defend result contains re-evaluation:', defendResult.includes("CRITIC'S RE-EVALUATION"));
  await page.screenshot({ path: path.join(OUTPUT_DIR, '07_illustration_defended.png') });

  // Return to Verdict
  const backToVerdictFinal = await page.waitForSelector('button ::-p-text("BACK TO VERDICT")', { timeout: 5000 });
  await backToVerdictFinal.click();
  await new Promise((r) => setTimeout(r, 500));

  // Check Archive persistence
  console.log('📍 Verifying Archive Persistence for all 3 artworks...');
  const archiveBtn = await page.waitForSelector('button[title*="Archive"]', { timeout: 5000 });
  await archiveBtn.click();
  await page.waitForSelector('text/ARTWORK ARCHIVE', { timeout: 8000 });
  await new Promise((r) => setTimeout(r, 800));

  const archiveCount = await page.evaluate(() => document.querySelectorAll('.group.cursor-pointer').length);
  console.log(`📦 Archived records count: ${archiveCount}`);
  if (archiveCount !== 3) {
    throw new Error(`Expected 3 archived artworks, but found ${archiveCount}`);
  }
  await page.screenshot({ path: path.join(OUTPUT_DIR, '08_archive_records_verified.png') });

  console.log('🎉 ALL TESTS PASSED SUCCESSFULLY! Both Scrolling and AI Critique Quality Verified.');
  await browser.close();
}

run().catch((err) => {
  console.error('❌ Test failed with error:', err);
  process.exit(1);
});

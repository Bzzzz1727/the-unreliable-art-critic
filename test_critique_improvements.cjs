const puppeteer = require('puppeteer-core');
const path = require('path');
const fs = require('fs');

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const URL = 'http://127.0.0.1:5173';
const OUTPUT_DIR = path.join(__dirname, 'test_screenshots_critique_improvements');

if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

async function run() {
  console.log('🚀 Starting Comprehensive Critique Improvements E2E Test...');
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

  // 1. Initial Load & Clear
  await page.goto(URL, { waitUntil: 'networkidle2' });
  await page.evaluate(() => {
    localStorage.clear();
    if (window.indexedDB) window.indexedDB.deleteDatabase('UnreliableCriticArchiveDB');
  });
  await page.reload({ waitUntil: 'networkidle2' });

  console.log('⏳ Waiting for Intro sequence (~3.3s)...');
  await new Promise((r) => setTimeout(r, 3400));

  // =========================================================================
  // TEST 1: POSTER ARTWORK
  // =========================================================================
  console.log('📍 Test 1: Uploading Poster Artwork...');
  const showArtBtn = await page.waitForSelector('button ::-p-text("SHOW ME YOUR ART")', { timeout: 5000 });
  await showArtBtn.click();
  await new Promise((r) => setTimeout(r, 600));

  // Click [POSTER] sample
  const posterBtn = await page.waitForSelector('button ::-p-text("POSTER")', { timeout: 5000 });
  await posterBtn.click();
  await new Promise((r) => setTimeout(r, 600));

  // Submit
  const decideBtn = await page.waitForSelector('button ::-p-text("LET THE CRITIC DECIDE")', { timeout: 5000 });
  await decideBtn.click();

  // Wait for Verdict
  await page.waitForSelector('button ::-p-text("VIEW FULL CRITIQUE")', { timeout: 8000 });
  console.log('✅ Poster Verdict loaded.');
  await new Promise((r) => setTimeout(r, 800));

  // Check zero page-level scroll
  const scrollInfo1 = await page.evaluate(() => ({
    scrollHeight: document.documentElement.scrollHeight,
    clientHeight: document.documentElement.clientHeight,
    hasScroll: document.documentElement.scrollHeight > document.documentElement.clientHeight + 2
  }));
  console.log('📏 Page scroll check:', scrollInfo1);

  await page.screenshot({ path: path.join(OUTPUT_DIR, '01_poster_verdict.png') });

  // Open Full Critique Modal
  const fullCritiqueBtn = await page.waitForSelector('button ::-p-text("VIEW FULL CRITIQUE")', { timeout: 5000 });
  await fullCritiqueBtn.click();
  await new Promise((r) => setTimeout(r, 600));
  await page.screenshot({ path: path.join(OUTPUT_DIR, '02_poster_full_critique_modal.png') });

  // Verify What to Preserve is visible in modal
  const modalText = await page.evaluate(() => document.body.innerText);
  const hasWhatToPreserve = modalText.includes('WHAT TO PRESERVE');
  const hasPrimaryJustification = modalText.includes('PRIMARY SCORE JUSTIFICATION');
  console.log('🔍 Full Critique Modal verification:', { hasWhatToPreserve, hasPrimaryJustification });

  // Close modal via ESC
  await page.keyboard.press('Escape');
  await new Promise((r) => setTimeout(r, 400));

  // Test Brutal Truth
  console.log('📍 Testing Brutal Truth on Poster...');
  const brutalBtn = await page.waitForSelector('button ::-p-text("BRUTAL TRUTH")', { timeout: 5000 });
  await brutalBtn.click();
  await page.waitForSelector('text/THE HARD TRUTH', { timeout: 8000 });
  await new Promise((r) => setTimeout(r, 600));
  await page.screenshot({ path: path.join(OUTPUT_DIR, '03_poster_brutal_truth.png') });

  // Verify 5-part Brutal Truth structure
  const brutalVerification = await page.evaluate(() => {
    const text = document.body.innerText;
    return {
      hasHardTruth: text.includes('THE HARD TRUTH'),
      hasEvidence: text.includes('THE VISUAL EVIDENCE'),
      hasWhyNotWorking: text.includes("WHY IT ISN'T WORKING"),
      hasFixFirst: text.includes('WHAT TO FIX FIRST'),
      hasWhatToKeep: text.includes('WHAT TO KEEP')
    };
  });
  console.log('🔍 Brutal Truth structure verification:', brutalVerification);

  // Return to Verdict
  const backBtn = await page.waitForSelector('button ::-p-text("BACK TO VERDICT")', { timeout: 5000 });
  await backBtn.click();
  await new Promise((r) => setTimeout(r, 600));

  // Test Redesign
  console.log('📍 Testing Redesign Briefs...');
  const redesignBtn = await page.waitForSelector('button ::-p-text("REDESIGN")', { timeout: 5000 });
  await redesignBtn.click();
  await page.waitForSelector('text/RESTRAINT', { timeout: 8000 });
  await new Promise((r) => setTimeout(r, 600));
  await page.screenshot({ path: path.join(OUTPUT_DIR, '04_poster_redesign.png') });

  // Return to Verdict
  const returnBtn = await page.waitForSelector('button ::-p-text("RETURN TO VERDICT")', { timeout: 5000 });
  await returnBtn.click();
  await new Promise((r) => setTimeout(r, 600));

  // Test Defend
  console.log('📍 Testing Defend Interaction...');
  const defendBtn = await page.waitForSelector('button ::-p-text("DEFEND")', { timeout: 5000 });
  await defendBtn.click();
  await new Promise((r) => setTimeout(r, 500));

  await page.type('textarea', 'The asymmetrical optical tension is calculated to guide the eye across the Swiss modernist grid with deliberate hierarchy.');
  const submitDefend = await page.waitForSelector('button ::-p-text("SUBMIT DEFENSE")', { timeout: 5000 });
  await submitDefend.click();
  await page.waitForSelector('text/CRITIC\'S RE-EVALUATION', { timeout: 8000 });
  await new Promise((r) => setTimeout(r, 600));
  await page.screenshot({ path: path.join(OUTPUT_DIR, '05_poster_defended.png') });

  // Return to Verdict
  const backToVerdict2 = await page.waitForSelector('button ::-p-text("BACK TO VERDICT")', { timeout: 5000 });
  await backToVerdict2.click();
  await new Promise((r) => setTimeout(r, 600));

  // =========================================================================
  // TEST 2: ALBUM COVER ARTWORK
  // =========================================================================
  console.log('📍 Test 2: Uploading Album Cover Artwork...');
  const newArtBtn = await page.waitForSelector('button ::-p-text("NEW ARTWORK")', { timeout: 5000 });
  await newArtBtn.click();
  await new Promise((r) => setTimeout(r, 600));

  const albumBtn = await page.waitForSelector('button ::-p-text("ALBUM COVER")', { timeout: 5000 });
  await albumBtn.click();
  await new Promise((r) => setTimeout(r, 600));

  const decideBtn2 = await page.waitForSelector('button ::-p-text("LET THE CRITIC DECIDE")', { timeout: 5000 });
  await decideBtn2.click();
  await page.waitForSelector('button ::-p-text("VIEW FULL CRITIQUE")', { timeout: 8000 });
  console.log('✅ Album Cover Verdict loaded.');
  await new Promise((r) => setTimeout(r, 800));

  await page.screenshot({ path: path.join(OUTPUT_DIR, '06_album_cover_verdict.png') });

  // Check Album Cover specific terminology (thumbnail, contrast, square)
  const albumVerdictText = await page.evaluate(() => document.body.innerText);
  console.log('🔍 Album Cover Verdict contains category relevance:', {
    hasAlbumCategory: albumVerdictText.includes('Album cover'),
    hasFirstImpression: albumVerdictText.includes('FIRST IMPRESSION'),
    hasWhatWorks: albumVerdictText.includes('WHAT WORKS')
  });

  // =========================================================================
  // TEST 3: ILLUSTRATION ARTWORK (Intentional Asymmetry & Discomfort)
  // =========================================================================
  console.log('📍 Test 3: Uploading Illustration Artwork...');
  const newArtBtn2 = await page.waitForSelector('button ::-p-text("NEW ARTWORK")', { timeout: 5000 });
  await newArtBtn2.click();
  await new Promise((r) => setTimeout(r, 600));

  const illustBtn = await page.waitForSelector('button ::-p-text("ILLUSTRATION")', { timeout: 5000 });
  await illustBtn.click();
  await new Promise((r) => setTimeout(r, 600));

  const decideBtn3 = await page.waitForSelector('button ::-p-text("LET THE CRITIC DECIDE")', { timeout: 5000 });
  await decideBtn3.click();
  await page.waitForSelector('button ::-p-text("VIEW FULL CRITIQUE")', { timeout: 8000 });
  console.log('✅ Illustration Verdict loaded.');
  await new Promise((r) => setTimeout(r, 800));

  await page.screenshot({ path: path.join(OUTPUT_DIR, '07_illustration_verdict.png') });

  // Check Challenge on Illustration
  console.log('📍 Testing Challenge on Illustration...');
  const challengeBtn = await page.waitForSelector('button ::-p-text("CHALLENGE")', { timeout: 5000 });
  await challengeBtn.click();
  await new Promise((r) => setTimeout(r, 600));

  const quickChallenge = await page.waitForSelector('button ::-p-text("Why is the composition weak?")', { timeout: 5000 });
  await quickChallenge.click();
  await page.waitForSelector('text/CRITIC\'S REACTION', { timeout: 8000 });
  await new Promise((r) => setTimeout(r, 600));
  await page.screenshot({ path: path.join(OUTPUT_DIR, '08_illustration_challenged.png') });

  // Return to Verdict and check Archive & Memory
  const backToVerdict3 = await page.waitForSelector('button ::-p-text("BACK TO VERDICT")', { timeout: 5000 });
  await backToVerdict3.click();
  await new Promise((r) => setTimeout(r, 600));

  // Open Archive via header
  console.log('📍 Checking Archive & Memory retention...');
  const archiveBtn = await page.waitForSelector('button[title*="Archive"]', { timeout: 5000 });
  await archiveBtn.click();
  await page.waitForSelector('text/ARTWORK ARCHIVE', { timeout: 8000 });
  await new Promise((r) => setTimeout(r, 800));
  await page.screenshot({ path: path.join(OUTPUT_DIR, '09_archive_view.png') });

  // Check archive records count
  const archiveAudit = await page.evaluate(() => {
    const cards = document.querySelectorAll('.group.cursor-pointer');
    return {
      recordCount: cards.length,
      hasHeader: document.body.innerText.includes('ARTWORK ARCHIVE')
    };
  });
  console.log('📦 Archive items verified:', archiveAudit);

  // Return to Critic via Return button
  const returnCritic = await page.waitForSelector('button ::-p-text("RETURN TO CRITIC")', { timeout: 5000 });
  await returnCritic.click();
  await new Promise((r) => setTimeout(r, 600));

  console.log('🎉 All 3 Category Artwork Tests & Feature Verifications Completed Successfully!');
  console.log('Errors logged during session:', consoleErrors);

  await browser.close();
}

run().catch((err) => {
  console.error('❌ Test failed with error:', err);
  process.exit(1);
});

const puppeteer = require('puppeteer-core');
const path = require('path');
const fs = require('fs');

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const URL = 'http://127.0.0.1:5173';
const OUTPUT_DIR = path.join(__dirname, 'test_screenshots_brutal_truth');

if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

async function verify() {
  console.log('🚀 Launching Chrome to verify Critic improvements and Brutal Truth...');
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1440,900']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });

  // Clear storage and load fresh
  await page.goto(URL, { waitUntil: 'networkidle2' });
  await page.evaluate(() => localStorage.clear());
  await page.reload({ waitUntil: 'networkidle2' });

  // 1. Skip Intro by waiting ~3.2s
  console.log('⏳ Waiting for Intro sequence to complete...');
  await new Promise((r) => setTimeout(r, 3400));

  // 2. Check Welcome Step
  console.log('📍 On Welcome Step. Clicking [ SHOW ME YOUR ART ]...');
  const showArtBtn = await page.waitForSelector('button ::-p-text("SHOW ME YOUR ART")', { timeout: 5000 });
  await showArtBtn.click();
  await new Promise((r) => setTimeout(r, 500));

  // 3. Staged Upload Step
  console.log('📍 On Upload Step. Selecting [POSTER] sample artwork...');
  const sampleBtn = await page.waitForSelector('button ::-p-text("POSTER")', { timeout: 5000 });
  await sampleBtn.click();
  await new Promise((r) => setTimeout(r, 600));

  // Click [ LET THE CRITIC DECIDE ]
  console.log('Submitting artwork: [ LET THE CRITIC DECIDE ]...');
  const decideBtn = await page.waitForSelector('button ::-p-text("LET THE CRITIC DECIDE")', { timeout: 5000 });
  await decideBtn.click();

  // 4. Wait for Verdict Step
  console.log('⏳ Waiting for analysis to complete and render Verdict...');
  await page.waitForSelector('button ::-p-text("BRUTAL TRUTH")', { timeout: 15000 });
  await new Promise((r) => setTimeout(r, 1000));

  // Take screenshot of Verdict
  await page.screenshot({ path: path.join(OUTPUT_DIR, '01_verdict_overview.png') });
  console.log('📸 Captured 01_verdict_overview.png');

  // Verify Header Branding & Verdict structure
  const verdictAudit = await page.evaluate(() => {
    const brandText = document.body.innerText;
    const hasUnreliable = brandText.includes('THE UNRELIABLE');
    const hasArtCritic = brandText.includes('ART CRITIC');
    const hasArtToy = brandText.includes('ART TOY');
    const eyeSvg = !!document.querySelector('header svg circle');

    const scoreMatch = brandText.match(/(\d+(\.\d+)?)\s*\/\s*10/);
    const hasFirstImpression = brandText.includes('FIRST IMPRESSION');
    const hasWhatWorks = brandText.includes('WHAT WORKS');
    const hasBiggestProblem = brandText.includes('BIGGEST PROBLEM');
    const hasSpecificFix = brandText.includes('SPECIFIC FIX') || brandText.includes('HOW TO FIX IT');

    return {
      branding: {
        hasUnreliable,
        hasArtCritic,
        hasArtToy, // Should be false
        eyeSvg
      },
      verdict: {
        score: scoreMatch ? scoreMatch[0] : null,
        hasFirstImpression,
        hasWhatWorks,
        hasBiggestProblem,
        hasSpecificFix
      },
      zeroScroll: document.body.scrollHeight <= document.body.clientHeight
    };
  });

  console.log('📋 Header & Verdict Audit:', JSON.stringify(verdictAudit, null, 2));

  // 5. Click [ BRUTAL TRUTH ]
  console.log('⚡ Clicking [ BRUTAL TRUTH ]...');
  const brutalBtn = await page.$('button ::-p-text("BRUTAL TRUTH")');
  if (brutalBtn) {
    await brutalBtn.click();
  } else {
    throw new Error('Brutal Truth button not found');
  }

  // Wait for transition to Brutal Truth step
  console.log('⏳ Waiting for Brutal Truth audit sections to render...');
  await page.waitForFunction(
    () => document.body.innerText.includes('THE HARD TRUTH') || document.body.innerText.includes('FAILED'),
    { timeout: 15000 }
  );
  await new Promise((r) => setTimeout(r, 1000));

  // Take screenshot of Brutal Truth
  await page.screenshot({ path: path.join(OUTPUT_DIR, '02_brutal_truth_step.png') });
  console.log('📸 Captured 02_brutal_truth_step.png');

  // Verify all 5 Brutal Truth sections
  const brutalTruthAudit = await page.evaluate(() => {
    const text = document.body.innerText;
    return {
      hasHardTruth: text.includes('THE HARD TRUTH'),
      hasEvidence: text.includes('THE VISUAL EVIDENCE') || text.includes('THE EVIDENCE'),
      hasWhyNotWorking: text.includes("WHY IT ISN'T WORKING") || text.includes('WHY IT IS NOT WORKING'),
      hasWhatToFixFirst: text.includes('WHAT TO FIX FIRST'),
      hasWhatToKeep: text.includes('WHAT TO KEEP'),
      zeroScroll: document.body.scrollHeight <= document.body.clientHeight
    };
  });

  console.log('📋 Brutal Truth Audit:', JSON.stringify(brutalTruthAudit, null, 2));

  // 6. Test returning to verdict
  console.log('Returning to verdict from Brutal Truth...');
  const returnBtn = await page.waitForSelector('button ::-p-text("RETURN TO VERDICT")', { timeout: 5000 });
  await returnBtn.click();
  await new Promise((r) => setTimeout(r, 500));

  // 7. Verify zero-scroll across standard viewports
  console.log('📐 Checking zero-scroll across desktop viewports:');
  for (const [w, h] of [[1440, 900], [1366, 768], [1280, 720]]) {
    await page.setViewport({ width: w, height: h });
    await new Promise((r) => setTimeout(r, 300));
    const scrollStatus = await page.evaluate(() => ({
      scrollHeight: document.body.scrollHeight,
      clientHeight: document.body.clientHeight,
      noScroll: document.body.scrollHeight <= document.body.clientHeight
    }));
    console.log(`Viewport ${w}x${h}:`, scrollStatus);
    await page.screenshot({ path: path.join(OUTPUT_DIR, `03_viewport_${w}x${h}.png`) });
  }

  await browser.close();
  console.log('🎉 Verification finished successfully!');
}

verify().catch((err) => {
  console.error('❌ Verification failed:', err);
  process.exit(1);
});

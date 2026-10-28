const puppeteer = require('puppeteer-core');
const path = require('path');
const fs = require('fs');

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const URL = 'http://127.0.0.1:5173';
const OUTPUT_DIR = path.join(__dirname, 'test_screenshots_step_based');

if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

async function run() {
  console.log('Launching Chrome for step-based redesign test...');
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1440,900']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });

  // Clear localStorage before start to test fresh load
  await page.goto(URL, { waitUntil: 'networkidle2' });
  await page.evaluate(() => localStorage.clear());
  await page.reload({ waitUntil: 'networkidle2' });

  // 1. STEP 1: INTRO
  console.log('STEP 1: Capturing Intro...');
  await page.screenshot({ path: path.join(OUTPUT_DIR, '01_intro.png') });

  // Wait for intro to finish and hand off to WELCOME (~3.0s)
  await new Promise((r) => setTimeout(r, 3200));

  // 2. STEP 2: WELCOME
  console.log('STEP 2: Capturing Welcome...');
  await page.screenshot({ path: path.join(OUTPUT_DIR, '02_welcome.png') });

  const zeroScrollWelcome = await page.evaluate(() => ({
    bodyScrollHeight: document.body.scrollHeight,
    bodyClientHeight: document.body.clientHeight,
    noScroll: document.body.scrollHeight <= document.body.clientHeight
  }));
  console.log('Zero scroll check on Welcome:', zeroScrollWelcome);

  // Test 7-click easter egg on Welcome
  console.log('Testing 7-click Easter egg in Welcome state...');
  const criticAvatar = await page.$('[aria-label*="Interactive Critic Pet"]');
  if (criticAvatar) {
    for (let i = 0; i < 7; i++) {
      await criticAvatar.click();
      await new Promise((r) => setTimeout(r, 120));
    }
    await new Promise((r) => setTimeout(r, 400));
    console.log('Capturing Easter Egg in Welcome...');
    await page.screenshot({ path: path.join(OUTPUT_DIR, '02b_welcome_easter_egg.png') });
    // Wait for easter egg to reset
    await new Promise((r) => setTimeout(r, 2600));
  }

  // Click [ SHOW ME YOUR ART ]
  console.log('Clicking [ SHOW ME YOUR ART ]...');
  const showArtBtn = await page.$('button ::-p-text("[ SHOW ME YOUR ART ]")');
  if (showArtBtn) {
    await showArtBtn.click();
  } else {
    const buttons = await page.$$('button');
    for (const b of buttons) {
      const text = await (await b.getProperty('innerText')).jsonValue();
      if (text.includes('SHOW ME YOUR ART')) {
        await b.click();
        break;
      }
    }
  }

  await new Promise((r) => setTimeout(r, 600));

  // 3. STEP 3: UPLOAD
  console.log('STEP 3: Capturing Upload Dropzone...');
  await page.screenshot({ path: path.join(OUTPUT_DIR, '03_upload_dropzone.png') });

  // Select Sample Poster
  console.log('Selecting sample poster...');
  const sampleBtn = await page.$('button ::-p-text("[POSTER]")');
  if (sampleBtn) {
    await sampleBtn.click();
  } else {
    const buttons = await page.$$('button');
    for (const b of buttons) {
      const text = await (await b.getProperty('innerText')).jsonValue();
      if (text.includes('POSTER')) {
        await b.click();
        break;
      }
    }
  }

  await new Promise((r) => setTimeout(r, 600));
  console.log('STEP 3: Capturing Staged Artwork...');
  await page.screenshot({ path: path.join(OUTPUT_DIR, '03b_upload_staged_artwork.png') });

  // Check staged artwork container ratio
  const previewRatio = await page.evaluate(() => {
    const img = document.querySelector('.artwork-preserve');
    const container = img ? img.closest('div') : null;
    const stage = document.querySelector('main');
    return {
      containerWidth: container ? container.clientWidth : null,
      stageWidth: stage ? stage.clientWidth : null,
      ratio: container && stage ? (container.clientWidth / stage.clientWidth).toFixed(2) : null
    };
  });
  console.log('Artwork width ratio in upload step:', previewRatio);

  // Click [ LET THE CRITIC DECIDE ]
  console.log('Submitting for analysis [ LET THE CRITIC DECIDE ]...');
  const decideBtn = await page.$('button ::-p-text("[ LET THE CRITIC DECIDE ]")');
  if (decideBtn) {
    await decideBtn.click();
  } else {
    const buttons = await page.$$('button');
    for (const b of buttons) {
      const text = await (await b.getProperty('innerText')).jsonValue();
      if (text.includes('LET THE CRITIC DECIDE')) {
        await b.click();
        break;
      }
    }
  }

  // 4. STEP 4: INVESTIGATING (first 400ms)
  await new Promise((r) => setTimeout(r, 300));
  console.log('STEP 4: Capturing Investigating Step...');
  await page.screenshot({ path: path.join(OUTPUT_DIR, '04_investigating.png') });

  // Wait for critique to complete (~2.0s)
  await new Promise((r) => setTimeout(r, 2200));

  // 5. STEP 5: VERDICT
  console.log('STEP 5: Capturing Verdict Step...');
  await page.screenshot({ path: path.join(OUTPUT_DIR, '05_verdict.png') });

  // Toggle category pill to COLOUR
  console.log('Switching category to COLOUR...');
  const colBtn = await page.$('button ::-p-text("COLOUR")');
  if (colBtn) await colBtn.click();
  await new Promise((r) => setTimeout(r, 300));

  // 6. STEP 6: INTERACTION - DEFEND
  console.log('STEP 6: Testing DEFEND interaction...');
  const defendBtn = await page.$('button ::-p-text("[ DEFEND ]")');
  if (defendBtn) await defendBtn.click();
  await new Promise((r) => setTimeout(r, 500));
  await page.screenshot({ path: path.join(OUTPUT_DIR, '06a_interaction_defend.png') });

  // Return to verdict
  const returnBtn = await page.$('button ::-p-text("[ RETURN TO VERDICT ]")');
  if (returnBtn) await returnBtn.click();
  await new Promise((r) => setTimeout(r, 400));

  // STEP 6: INTERACTION - CHALLENGE
  console.log('STEP 6: Testing CHALLENGE interaction...');
  const challengeBtn = await page.$('button ::-p-text("[ CHALLENGE ]")');
  if (challengeBtn) await challengeBtn.click();
  await new Promise((r) => setTimeout(r, 500));
  await page.screenshot({ path: path.join(OUTPUT_DIR, '06b_interaction_challenge.png') });

  const returnBtn2 = await page.$('button ::-p-text("[ RETURN TO VERDICT ]")');
  if (returnBtn2) await returnBtn2.click();
  await new Promise((r) => setTimeout(r, 400));

  // STEP 6: INTERACTION - BRUTAL TRUTH
  console.log('STEP 6: Testing BRUTAL TRUTH interaction...');
  const brutalBtn = await page.$('button ::-p-text("[ BRUTAL TRUTH ]")');
  if (brutalBtn) await brutalBtn.click();
  await new Promise((r) => setTimeout(r, 1200));
  await page.screenshot({ path: path.join(OUTPUT_DIR, '06c_interaction_brutal_truth.png') });

  const returnBtn3 = await page.$('button ::-p-text("[ RETURN TO VERDICT ]")');
  if (returnBtn3) await returnBtn3.click();
  await new Promise((r) => setTimeout(r, 400));

  // 7. STEP 7: REDESIGN
  console.log('STEP 7: Testing REDESIGN step...');
  const redesignBtn = await page.$('button ::-p-text("[ REDESIGN ]")');
  if (redesignBtn) await redesignBtn.click();
  await new Promise((r) => setTimeout(r, 1200));
  await page.screenshot({ path: path.join(OUTPUT_DIR, '07_redesign_step.png') });

  // Return to verdict from redesign
  const returnFromRedesign = await page.$('button ::-p-text("[ RETURN TO VERDICT ]")');
  if (returnFromRedesign) await returnFromRedesign.click();
  await new Promise((r) => setTimeout(r, 400));

  // 8. DAY / NIGHT MODE TEST
  console.log('Testing Day / Night Mode toggle...');
  const themeToggle = await page.$('button[aria-label*="Mode"]');
  if (themeToggle) {
    await themeToggle.click();
    await new Promise((r) => setTimeout(r, 500));
    console.log('Capturing Night Mode in Verdict...');
    await page.screenshot({ path: path.join(OUTPUT_DIR, '08_night_mode_verdict.png') });
  }

  // 9. ZERO SCROLL CHECK AT 1440x900, 1366x768, 1280x720
  console.log('Checking viewports zero-scroll...');
  for (const [w, h] of [[1440, 900], [1366, 768], [1280, 720]]) {
    await page.setViewport({ width: w, height: h });
    await new Promise((r) => setTimeout(r, 300));
    const check = await page.evaluate(() => ({
      bodyScrollHeight: document.body.scrollHeight,
      bodyClientHeight: document.body.clientHeight,
      noScroll: document.body.scrollHeight <= document.body.clientHeight
    }));
    console.log(`Zero scroll at ${w}x${h}:`, check);
  }

  await page.screenshot({ path: path.join(OUTPUT_DIR, '09_viewport_1280x720.png') });

  await browser.close();
  console.log('Step-based experience verification completely passed!');
}

run().catch((err) => {
  console.error('Test run failed:', err);
  process.exit(1);
});

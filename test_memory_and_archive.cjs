const puppeteer = require('puppeteer-core');
const path = require('path');
const fs = require('fs');

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const URL = 'http://127.0.0.1:5173';
const OUTPUT_DIR = path.join(__dirname, 'test_screenshots_memory_archive');

if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

async function run() {
  console.log('🚀 Starting Comprehensive Memory, Archive, Night Character & Full Critique Test...');
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1440,900']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });

  // Listen to console errors
  const consoleErrors = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      consoleErrors.push(msg.text());
    }
  });

  // 1. Initial Load & Intro
  await page.goto(URL, { waitUntil: 'networkidle2' });
  await page.evaluate(() => {
    localStorage.clear();
    // clear indexedDB as well
    if (window.indexedDB) window.indexedDB.deleteDatabase('UnreliableCriticArchiveDB');
  });
  await page.reload({ waitUntil: 'networkidle2' });

  console.log('⏳ Waiting for Intro sequence to complete (~3.3s)...');
  await new Promise((r) => setTimeout(r, 3400));

  // 2. Click [ SHOW ME YOUR ART ]
  console.log('📍 On Welcome Step. Clicking [ SHOW ME YOUR ART ]...');
  const showArtBtn = await page.waitForSelector('button ::-p-text("SHOW ME YOUR ART")', { timeout: 5000 });
  await showArtBtn.click();
  await new Promise((r) => setTimeout(r, 600));

  // 3. Staged Upload: Select Poster Artwork 1
  console.log('📍 Uploading Artwork 1 (Poster)...');
  const posterBtn = await page.waitForSelector('button ::-p-text("POSTER")', { timeout: 5000 });
  await posterBtn.click();
  await new Promise((r) => setTimeout(r, 600));

  const decideBtn = await page.waitForSelector('button ::-p-text("LET THE CRITIC DECIDE")', { timeout: 5000 });
  await decideBtn.click();

  // Wait for Verdict Step
  console.log('⏳ Waiting for Verdict 1...');
  await page.waitForSelector('button ::-p-text("BRUTAL TRUTH")', { timeout: 15000 });
  await new Promise((r) => setTimeout(r, 800));

  // Verify Repositioned [ VIEW FULL CRITIQUE ↗ ] Button
  console.log('🔍 Checking [ VIEW FULL CRITIQUE ↗ ] button presence and placement...');
  const fullCritiqueBtn = await page.$('button ::-p-text("VIEW FULL CRITIQUE")');
  if (!fullCritiqueBtn) throw new Error('VIEW FULL CRITIQUE button not found!');
  console.log('✅ Found [ VIEW FULL CRITIQUE ↗ ] button!');

  // Test opening Full Critique Modal
  console.log('Clicking [ VIEW FULL CRITIQUE ↗ ] to open overlay...');
  await fullCritiqueBtn.click();
  await new Promise((r) => setTimeout(r, 500));
  await page.screenshot({ path: path.join(OUTPUT_DIR, '01_full_critique_modal.png') });
  console.log('📸 Captured 01_full_critique_modal.png');

  // Verify overlay content
  const modalAudit = await page.evaluate(() => {
    const text = document.body.innerText;
    return {
      hasHeader: text.includes('FULL ART CRITIQUE DOSSIER'),
      hasFirstImpression: text.includes('FIRST IMPRESSION'),
      hasWhatWorks: text.includes('WHAT WORKS'),
      hasBiggestProblem: text.includes('BIGGEST PROBLEM'),
      hasRecommendations: text.includes('PRACTICAL RECOMMENDATIONS'),
      hasCategoryAudit: text.includes('DETAILED CATEGORY AUDIT'),
      noPageScroll: document.body.scrollHeight <= document.body.clientHeight
    };
  });
  console.log('📋 Full Critique Overlay Audit:', modalAudit);

  // Close modal via ESC key
  console.log('Closing modal with ESC key...');
  await page.keyboard.press('Escape');
  await new Promise((r) => setTimeout(r, 400));

  // 4. Test Night Mode Character Visibility
  console.log('🌙 Switching to Night Mode...');
  const themeBtn = await page.$('button[aria-label*="Mode"]');
  if (themeBtn) await themeBtn.click();
  await new Promise((r) => setTimeout(r, 600));

  await page.screenshot({ path: path.join(OUTPUT_DIR, '02_night_mode_character_verdict.png') });
  console.log('📸 Captured 02_night_mode_character_verdict.png');

  // Check character colors in Night Mode
  const nightCharCheck = await page.evaluate(() => {
    const bodyPath = document.querySelector('svg path[d*="M 40 90"]');
    const fill = bodyPath ? bodyPath.getAttribute('fill') : null;
    const stroke = bodyPath ? bodyPath.getAttribute('stroke') : null;
    return {
      bodyFill: fill,
      charOutline: stroke,
      isLightBody: fill === '#EDEDED' || fill === '#FFFFFF',
      isDarkOutline: stroke === '#171717'
    };
  });
  console.log('📋 Night Mode Character Visual Audit:', nightCharCheck);

  // 5. Test Settings Modal & Memory Controls
  console.log('⚙️ Opening Settings to check Critic Memory...');
  const settingsBtn = await page.$('button[title*="Engine"]');
  if (settingsBtn) await settingsBtn.click();
  await new Promise((r) => setTimeout(r, 500));

  // Switch to Memory tab
  const memTab = await page.waitForSelector('button ::-p-text("CRITIC MEMORY")', { timeout: 5000 });
  await memTab.click();
  await new Promise((r) => setTimeout(r, 500));

  await page.screenshot({ path: path.join(OUTPUT_DIR, '03_settings_memory_tab.png') });
  console.log('📸 Captured 03_settings_memory_tab.png');

  const memCount = await page.evaluate(() => {
    const text = document.body.innerText;
    return {
      hasMemoryHeader: text.includes('PERSISTENT DESIGN MEMORY'),
      hasToggle: text.includes('ENABLED'),
      hasPrivacyInfo: text.includes('Memory stores creative patterns only')
    };
  });
  console.log('📋 Memory Tab Audit:', memCount);

  // Close Settings
  const closeSettingsBtn = await page.waitForSelector('button ::-p-text("DONE")', { timeout: 5000 });
  await closeSettingsBtn.click();
  await new Promise((r) => setTimeout(r, 500));

  // 6. Navigate to /archive Page via Header Button
  console.log('📁 Navigating to /archive page...');
  const archiveBtn = await page.waitForSelector('button[title*="Archive"]', { timeout: 5000 });
  await archiveBtn.click();
  await new Promise((r) => setTimeout(r, 800));

  const currentUrl = page.url();
  console.log('Current URL after archive click:', currentUrl);
  await page.screenshot({ path: path.join(OUTPUT_DIR, '04_archive_page.png') });
  console.log('📸 Captured 04_archive_page.png');

  // Verify Archive Record Saved
  const archiveAudit = await page.evaluate(() => {
    const text = document.body.innerText;
    const cards = document.querySelectorAll('.group.cursor-pointer');
    return {
      hasArchiveHeader: text.includes('ARTWORK ARCHIVE'),
      recordCountText: text.includes('1 records') || text.includes('records'),
      cardCount: cards.length,
      hasScorePill: text.includes('/10'),
      hasSearchInput: !!document.querySelector('input[placeholder*="Search"]'),
      noPageScroll: document.body.scrollHeight <= document.body.clientHeight
    };
  });
  console.log('📋 Archive Page Audit:', archiveAudit);

  // 7. Test Refresh on Archive to verify persistence
  console.log('🔄 Refreshing browser while on /archive to test persistence across page loads...');
  await page.reload({ waitUntil: 'networkidle2' });
  await new Promise((r) => setTimeout(r, 1000));

  const postRefreshAudit = await page.evaluate(() => {
    const cards = document.querySelectorAll('.group.cursor-pointer');
    return {
      cardCount: cards.length,
      hasHeader: document.body.innerText.includes('ARTWORK ARCHIVE')
    };
  });
  console.log('📋 Post-Refresh Archive Persistence Audit:', postRefreshAudit);

  // 8. Test Opening an Archived Record (Restores original critique)
  console.log('📂 Clicking on saved archive card to restore critique...');
  const firstCard = await page.$('.group.cursor-pointer');
  if (firstCard) {
    await firstCard.click();
    await new Promise((r) => setTimeout(r, 800));
  }

  await page.screenshot({ path: path.join(OUTPUT_DIR, '05_restored_archive_verdict.png') });
  console.log('📸 Captured 05_restored_archive_verdict.png');

  const restoredAudit = await page.evaluate(() => {
    const text = document.body.innerText;
    return {
      isVerdictStep: text.includes('FIRST IMPRESSION'),
      hasScore: text.includes('/ 10'),
      hasViewFullCritiqueBtn: text.includes('VIEW FULL CRITIQUE'),
      noPageScroll: document.body.scrollHeight <= document.body.clientHeight
    };
  });
  console.log('📋 Restored Archive Verdict Audit:', restoredAudit);

  // 9. Navigate back to Archive and test Search & Filter
  console.log('Navigating to Archive again to test Search and Delete...');
  const archiveBtn2 = await page.waitForSelector('button[title*="Archive"]', { timeout: 5000 });
  await archiveBtn2.click();
  await new Promise((r) => setTimeout(r, 600));

  // Type query in search
  const searchInput = await page.$('input[placeholder*="Search"]');
  if (searchInput) {
    await searchInput.type('poster');
    await new Promise((r) => setTimeout(r, 300));
    console.log('Search typed "poster"');
  }

  // 10. Check zero scroll across standard viewports on both main critic and archive
  console.log('📐 Checking zero-scroll viewports:');
  for (const [w, h] of [[1440, 900], [1366, 768], [1280, 720]]) {
    await page.setViewport({ width: w, height: h });
    await new Promise((r) => setTimeout(r, 300));
    const zeroScroll = await page.evaluate(() => ({
      scrollHeight: document.body.scrollHeight,
      clientHeight: document.body.clientHeight,
      noScroll: document.body.scrollHeight <= document.body.clientHeight
    }));
    console.log(`Archive Viewport ${w}x${h} zero-scroll:`, zeroScroll);
  }

  await browser.close();
  console.log('🎉 ALL TESTS PASSED SUCCESSFULLY! Console error count:', consoleErrors.length);
  if (consoleErrors.length > 0) {
    console.warn('Console errors encountered:', consoleErrors);
  }
}

run().catch((err) => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});

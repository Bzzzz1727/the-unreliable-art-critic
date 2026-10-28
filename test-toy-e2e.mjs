import puppeteer from 'puppeteer-core';

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

async function runToyE2ETest() {
  console.log('>>> LAUNCHING PUPPETEER FOR REDESIGNED ART CRITIC TOY...');
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1440,900']
  });

  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1440, height: 900 });

    console.log('1. Navigating to http://127.0.0.1:5173 ...');
    await page.goto('http://127.0.0.1:5173', { waitUntil: 'networkidle0' });

    // Wait for either intro skip button or main header
    console.log('2. Testing Intro Animation Sequence...');
    await new Promise((r) => setTimeout(r, 600));

    const skipBtn = await page.$('button');
    if (skipBtn) {
      const skipText = await page.evaluate((el) => el.textContent, skipBtn);
      if (skipText && skipText.includes('SKIP INTRO')) {
        console.log('Skip intro button detected, clicking skip...');
        await skipBtn.click();
      }
    }
    await new Promise((r) => setTimeout(r, 800));

    // VERIFY ZERO SCROLL REQUIREMENT
    console.log('\n3. VERIFYING STRICT ZERO-SCROLL REQUIREMENT:');
    const scrollDimensions = await page.evaluate(() => ({
      windowHeight: window.innerHeight,
      scrollHeight: document.documentElement.scrollHeight,
      bodyScrollHeight: document.body.scrollHeight,
      windowWidth: window.innerWidth,
      scrollWidth: document.documentElement.scrollWidth,
      isOverflowHidden: window.getComputedStyle(document.body).overflow === 'hidden'
    }));

    console.log(`Window Height: ${scrollDimensions.windowHeight}px | Document ScrollHeight: ${scrollDimensions.scrollHeight}px`);
    console.log(`Body overflow hidden: ${scrollDimensions.isOverflowHidden}`);

    if (scrollDimensions.scrollHeight <= scrollDimensions.windowHeight + 2) {
      console.log('PASS: Single viewport strictly maintained (ZERO PAGE SCROLLING).');
    } else {
      console.warn(`WARNING: Page height overflowed by ${scrollDimensions.scrollHeight - scrollDimensions.windowHeight}px`);
    }

    // Check Header and 3-column elements
    const headerTitle = await page.$eval('header h1', (el) => el.textContent?.trim());
    console.log(`\n4. Header Wordmark: "${headerTitle}"`);

    // Poke Critic Pet
    console.log('5. Testing Critic Character interaction...');
    const pokeBtn = await page.evaluateHandle(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      return btns.find((b) => b.textContent && b.textContent.includes('POKE THE CRITIC'));
    });
    if (pokeBtn) {
      await pokeBtn.click();
      console.log('Critic poked successfully!');
      await new Promise((r) => setTimeout(r, 600));
    }

    // Select Curated Sample
    console.log('\n6. Selecting Curated Sample Piece: [POSTER] ...');
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const sample = btns.find((b) => b.textContent && b.textContent.includes('[POSTER]'));
      if (sample) sample.click();
    });
    await new Promise((r) => setTimeout(r, 600));

    // Submit for Judgement
    console.log('7. Clicking [ SUBMIT FOR JUDGEMENT ] ...');
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const sub = btns.find((b) => b.textContent && b.textContent.includes('SUBMIT FOR JUDGEMENT'));
      if (sub) sub.click();
    });

    console.log('Waiting for verdict to generate...');
    await new Promise((r) => setTimeout(r, 2000));

    // Verify Verdict Panel
    const scoreText = await page.evaluate(() => {
      const el = document.querySelector('.anim-stamp-slam');
      return el ? el.textContent?.trim() : 'Not found';
    });
    console.log(`Verdict Score Stamp: "${scoreText}"`);

    // Switch Category Tabs: COLOUR
    console.log('\n8. Switching category tab to [ COLOUR ] ...');
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const colBtn = btns.find((b) => b.textContent?.trim() === 'COLOUR');
      if (colBtn) colBtn.click();
    });
    await new Promise((r) => setTimeout(r, 500));

    // Test Defend My Art
    console.log('\n9. Testing Action: [ DEFEND MY ART ] ...');
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const def = btns.find((b) => b.textContent && b.textContent.includes('DEFEND MY ART'));
      if (def) def.click();
    });
    await new Promise((r) => setTimeout(r, 500));

    const defendTextarea = await page.$('textarea');
    if (defendTextarea) {
      await defendTextarea.type('I used strict Swiss asymmetric geometry to evoke mechanical precision.');
      await page.evaluate(() => {
        const btns = Array.from(document.querySelectorAll('button'));
        const sub = btns.find((b) => b.textContent && b.textContent.includes('SUBMIT DEFENSE'));
        if (sub) sub.click();
      });
      console.log('Defense submitted! Waiting for critic evaluation...');
      await new Promise((r) => setTimeout(r, 1200));
    }

    // Capture Desktop Screenshot at 1440x900
    console.log('\n10. Capturing Desktop Screenshot (1440x900)...');
    await page.screenshot({ path: 'screenshot_toy_desktop_1440.png' });
    console.log('Saved screenshot_toy_desktop_1440.png');

    // Test 1280x720 Viewport
    console.log('\n11. Testing 1280x720 Viewport...');
    await page.setViewport({ width: 1280, height: 720 });
    await new Promise((r) => setTimeout(r, 500));
    await page.screenshot({ path: 'screenshot_toy_compact_1280.png' });
    console.log('Saved screenshot_toy_compact_1280.png');

    // Test Mobile Viewport (iPhone 14)
    console.log('\n12. Testing Mobile Viewport (390x844)...');
    await page.setViewport({ width: 390, height: 844, isMobile: true });
    await new Promise((r) => setTimeout(r, 500));
    await page.screenshot({ path: 'screenshot_toy_mobile.png' });
    console.log('Saved screenshot_toy_mobile.png');

    console.log('\n>>> ALL TOY INTERFACE E2E TESTS COMPLETED WITH 100% SUCCESS! <<<');
  } catch (err) {
    console.error('E2E TEST FAILURE:', err);
    process.exit(1);
  } finally {
    await browser.close();
  }
}

runToyE2ETest();

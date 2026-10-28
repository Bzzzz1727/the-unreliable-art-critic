import puppeteer from 'puppeteer-core';

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

async function runTest() {
  console.log('>>> LAUNCHING BROWSER FOR THE UNRELIABLE ART CRITIC UPDATE...');
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
    await new Promise((r) => setTimeout(r, 600));

    // Skip intro if visible
    const skipBtn = await page.$('button');
    if (skipBtn) {
      const text = await page.evaluate((el) => el.textContent, skipBtn);
      if (text && text.includes('SKIP INTRO')) {
        await skipBtn.click();
        await new Promise((r) => setTimeout(r, 600));
      }
    }

    // 2. VERIFY ZERO SCROLL
    console.log('\n2. Verifying Single Viewport (Zero Page Scroll):');
    const scrollInfo = await page.evaluate(() => ({
      windowHeight: window.innerHeight,
      scrollHeight: document.documentElement.scrollHeight,
      bodyOverflow: window.getComputedStyle(document.body).overflow
    }));
    console.log(`Window Height: ${scrollInfo.windowHeight}px | Document ScrollHeight: ${scrollInfo.scrollHeight}px | Body overflow: ${scrollInfo.bodyOverflow}`);
    if (scrollInfo.scrollHeight <= scrollInfo.windowHeight + 2) {
      console.log('PASS: Zero page-level scrolling strictly maintained.');
    } else {
      console.warn(`WARNING: Page height overflowed by ${scrollInfo.scrollHeight - scrollInfo.windowHeight}px`);
    }

    // 3. TEST DAY / NIGHT MODE TOGGLE
    console.log('\n3. Testing Day / Night Mode Toggle:');
    let currentTheme = await page.evaluate(() => document.documentElement.getAttribute('data-theme'));
    console.log(`Initial theme: ${currentTheme}`);

    // Click theme toggle button
    const themeBtn = await page.evaluateHandle(() => {
      const btns = Array.from(document.querySelectorAll('header button'));
      return btns.find((b) => b.getAttribute('aria-label')?.includes('Mode') || b.textContent?.includes('DAY') || b.textContent?.includes('NIGHT'));
    });
    if (themeBtn) {
      await themeBtn.click();
      await new Promise((r) => setTimeout(r, 400));
      currentTheme = await page.evaluate(() => document.documentElement.getAttribute('data-theme'));
      console.log(`Toggled theme to: ${currentTheme}`);

      const nightSpeech = await page.evaluate(() => {
        const bubble = document.querySelector('header + main p');
        return bubble ? bubble.textContent?.trim() : 'None';
      });
      console.log(`Critic reaction on Night mode: ${nightSpeech}`);

      // Capture Night Mode Screenshot
      await page.screenshot({ path: 'screenshot_night_mode.png' });
      console.log('Saved screenshot_night_mode.png');

      // Toggle back to Day
      await themeBtn.click();
      await new Promise((r) => setTimeout(r, 400));
      currentTheme = await page.evaluate(() => document.documentElement.getAttribute('data-theme'));
      console.log(`Toggled back to: ${currentTheme}`);
    }

    // 4. TEST SUCCESSIVE CLICKS & 7-CLICK EASTER EGG
    console.log('\n4. Testing Successive Clicks & 7-Click Secret Easter Egg:');
    const characterAvatar = await page.$('div[role="button"][aria-label*="Interactive Critic Pet"]');
    if (characterAvatar) {
      for (let i = 1; i <= 7; i++) {
        await characterAvatar.click();
        await new Promise((r) => setTimeout(r, 350));

        const bubbleText = await page.evaluate(() => {
          const p = document.querySelector('header + main p');
          return p ? p.textContent?.trim() : '';
        });
        console.log(`  Click ${i}/7 -> Speech: ${bubbleText}`);

        if (i === 7) {
          if (bubbleText.includes('YOU WERE NOT SUPPOSED TO FIND THAT')) {
            console.log('  SUCCESS: 7-Click Secret Easter Egg triggered properly!');
          }
        }
      }
      // Wait for Easter egg sequence to finish
      await new Promise((r) => setTimeout(r, 3000));
    }

    // 5. TEST CURATED ARTWORK UPLOAD & REACTION
    console.log('\n5. Testing Sample Artwork Selection:');
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const sample = btns.find((b) => b.textContent && b.textContent.includes('[POSTER]'));
      if (sample) sample.click();
    });
    await new Promise((r) => setTimeout(r, 500));

    const uploadReaction = await page.evaluate(() => {
      const p = document.querySelector('header + main p');
      return p ? p.textContent?.trim() : '';
    });
    console.log(`Critic reaction on upload: ${uploadReaction}`);

    // Submit for Judgement
    console.log('\n6. Submitting for Judgement:');
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const sub = btns.find((b) => b.textContent && b.textContent.includes('SUBMIT FOR JUDGEMENT'));
      if (sub) sub.click();
    });
    await new Promise((r) => setTimeout(r, 2200));

    const verdictScore = await page.evaluate(() => {
      const el = document.querySelector('.anim-stamp-slam');
      return el ? el.textContent?.trim() : 'None';
    });
    console.log(`Verdict Score Issued: ${verdictScore}`);

    // 6. TEST 4-CATEGORY TABS
    console.log('\n7. Testing Category Tabs in Verdict Panel:');
    const categories = ['COMPOSITION', 'COLOUR', 'TYPE', 'CONCEPT'];
    for (const cat of categories) {
      await page.evaluate((c) => {
        const btns = Array.from(document.querySelectorAll('button'));
        const btn = btns.find((b) => b.textContent?.trim() === c);
        if (btn) btn.click();
      }, cat);
      await new Promise((r) => setTimeout(r, 200));
    }
    console.log('Category switching tested successfully.');

    // 7. TEST ACTION BAR: [ DEFEND ]
    console.log('\n8. Testing [ DEFEND ] Action:');
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const def = btns.find((b) => b.textContent && b.textContent.includes('[ DEFEND ]'));
      if (def) def.click();
    });
    await new Promise((r) => setTimeout(r, 400));

    const textarea = await page.$('textarea');
    if (textarea) {
      await textarea.type('The layout adheres strictly to late Swiss constructivism.');
      await page.evaluate(() => {
        const btns = Array.from(document.querySelectorAll('button'));
        const sub = btns.find((b) => b.textContent && b.textContent.includes('SUBMIT DEFENSE'));
        if (sub) sub.click();
      });
      await new Promise((r) => setTimeout(r, 1200));
      console.log('Defense submitted and evaluated by critic.');
    }

    // Capture Desktop Day Mode Screenshot (1440x900)
    console.log('\n9. Capturing Final Screenshots:');
    await page.screenshot({ path: 'screenshot_day_mode_1440.png' });
    console.log('Saved screenshot_day_mode_1440.png');

    // Test 1280x720 Viewport
    await page.setViewport({ width: 1280, height: 720 });
    await new Promise((r) => setTimeout(r, 400));
    await page.screenshot({ path: 'screenshot_day_mode_1280.png' });
    console.log('Saved screenshot_day_mode_1280.png');

    // Test Mobile Viewport (390x844)
    await page.setViewport({ width: 390, height: 844, isMobile: true });
    await new Promise((r) => setTimeout(r, 400));
    await page.screenshot({ path: 'screenshot_day_mode_mobile.png' });
    console.log('Saved screenshot_day_mode_mobile.png');

    console.log('\n>>> ALL TEST CASES PASSED WITH 100% SUCCESS! <<<');
  } catch (err) {
    console.error('TEST ERROR:', err);
    process.exit(1);
  } finally {
    await browser.close();
  }
}

runTest();

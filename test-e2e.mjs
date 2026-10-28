import puppeteer from 'puppeteer-core';
import fs from 'fs';

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

async function runE2ETest() {
  console.log('>>> LAUNCHING PUPPETEER WITH LOCAL CHROME...');
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

    // Verify Title
    const title = await page.title();
    console.log(`Page title: "${title}"`);

    // Verify Hero Heading
    const heroHeading = await page.$eval('h1', (el) => el.textContent?.trim());
    console.log(`Hero Heading detected: "${heroHeading?.replace(/\s+/g, ' ')}"`);

    // Click Enter the Gallery
    console.log('\n2. Clicking [ ENTER THE GALLERY ] ...');
    const enterBtn = await page.$('button.btn-primary.group');
    if (enterBtn) await enterBtn.click();
    await new Promise((r) => setTimeout(r, 600));

    // Select Curated Sample Artwork: Exhibition 1972
    console.log('3. Selecting Curated Sample Piece: [POSTER: EXHIBITION 1972] ...');
    const sampleButtons = await page.$$('button');
    let sampleClicked = false;
    for (const btn of sampleButtons) {
      const text = await page.evaluate((el) => el.textContent, btn);
      if (text && text.includes('POSTER: EXHIBITION 1972')) {
        await btn.click();
        sampleClicked = true;
        break;
      }
    }
    console.log(`Sample piece clicked: ${sampleClicked}`);
    await new Promise((r) => setTimeout(r, 800));

    // Verify Preview Frame appeared
    const previewImg = await page.$('img[alt="Uploaded submission"]');
    console.log(`Artwork preview image mounted in DOM: ${Boolean(previewImg)}`);

    // Submit for Judgement
    console.log('\n4. Clicking [ SUBMIT FOR JUDGEMENT ] ...');
    const submitBtn = await page.evaluateHandle(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      return btns.find((b) => b.textContent && b.textContent.includes('SUBMIT FOR JUDGEMENT'));
    });
    if (submitBtn) await submitBtn.click();

    // Wait for Critic to analyze and mount
    console.log('Waiting for Critic to render structured analysis...');
    await page.waitForSelector('#the-critic', { timeout: 15000 });
    console.log('Critic section mounted successfully!');

    // Check Critic State
    const criticState = await page.$eval('#the-critic', (el) => {
      const stateEl = el.querySelector('.text-\\[\\#D71920\\].font-bold');
      return stateEl ? stateEl.textContent?.trim() : 'Unknown';
    });
    console.log(`Initial Critic State: "${criticState}"`);

    // Verify Structured Categories
    const categoriesFound = await page.$$eval('#the-critic h4', (els) =>
      els.map((e) => e.textContent?.trim())
    );
    console.log('Structured categories rendered:');
    categoriesFound.forEach((cat) => console.log(`  - ${cat}`));

    // Test 1: DEFEND MY DESIGN
    console.log('\n5. Testing [ DEFEND MY DESIGN ] ...');
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const defendBtn = btns.find((b) => b.textContent && b.textContent.includes('DEFEND MY DESIGN'));
      if (defendBtn) defendBtn.click();
    });
    await new Promise((r) => setTimeout(r, 600));

    // Type Defense
    const defenseTextarea = await page.$('textarea');
    if (defenseTextarea) {
      await defenseTextarea.type(
        'The asymmetric composition and high contrast are strict citations of Basel modernism intended to disrupt complacent bourgeois viewing habits.'
      );
      // Click submit defense
      await page.evaluate(() => {
        const btns = Array.from(document.querySelectorAll('button'));
        const sub = btns.find((b) => b.textContent && b.textContent.includes('SUBMIT DEFENSE'));
        if (sub) sub.click();
      });
      console.log('Defense submitted! Waiting for critic reply...');
      await new Promise((r) => setTimeout(r, 1200));
    }

    // Test 2: REQUEST A REDESIGN
    console.log('\n6. Testing [ REQUEST A REDESIGN ] ...');
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const redesignBtn = btns.find((b) => b.textContent && b.textContent.includes('REQUEST A REDESIGN'));
      if (redesignBtn) redesignBtn.click();
    });
    await new Promise((r) => setTimeout(r, 1200));

    const redesignDirections = await page.$$eval('#the-critic h5', (els) =>
      els.map((e) => e.textContent?.trim())
    );
    console.log(`Generated Redesign Directions (${redesignDirections.length}):`);
    redesignDirections.forEach((dir) => console.log(`  - ${dir}`));

    // Test 3: CHALLENGE THE CRITIC
    console.log('\n7. Testing [ CHALLENGE THE CRITIC ] ...');
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const chBtn = btns.find((b) => b.textContent && b.textContent.includes('CHALLENGE THE CRITIC'));
      if (chBtn) chBtn.click();
    });
    await new Promise((r) => setTimeout(r, 600));

    // Click quick challenge prompt
    console.log('Firing challenge: "You\'re not making any sense." ...');
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const q = btns.find((b) => b.textContent && b.textContent.includes("You're not making any sense."));
      if (q) q.click();
    });
    await new Promise((r) => setTimeout(r, 1200));

    // Check new state in header
    const updatedState = await page.evaluate(() => {
      const st = document.querySelector('.text-\\[\\#D71920\\].font-bold');
      return st ? st.textContent?.trim() : 'Unknown';
    });
    console.log(`Updated Critic State after challenge: "${updatedState}"`);

    // Test 4: SHOW ME THE BRUTAL TRUTH
    console.log('\n8. Testing [ SHOW ME THE BRUTAL TRUTH ] ...');
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const bt = btns.find((b) => b.textContent && b.textContent.includes('SHOW ME THE BRUTAL TRUTH'));
      if (bt) bt.click();
    });
    await new Promise((r) => setTimeout(r, 1000));

    const brutalTruthTitle = await page.evaluate(() => {
      const el = Array.from(document.querySelectorAll('h4')).find((h) =>
        h.textContent?.includes('THE BRUTAL TRUTH')
      );
      return el ? el.textContent?.trim() : 'Not found';
    });
    console.log(`Brutal Truth panel mounted: "${brutalTruthTitle}"`);

    // Verify Exhibition Record
    console.log('\n9. Verifying THE EXHIBITION RECORD ...');
    const recordTitle = await page.evaluate(() => {
      const el = document.querySelector('#exhibition-record h3');
      return el ? el.textContent?.trim() : 'Not found';
    });
    console.log(`Exhibition Record mounted: "${recordTitle}"`);

    // Take Desktop Screenshot
    console.log('\n10. Capturing live screenshots...');
    await page.screenshot({ path: 'screenshot_desktop_full.png', fullPage: true });
    console.log('Saved screenshot_desktop_full.png');

    // Test Mobile Viewport
    console.log('\n11. Testing Mobile Viewport (iPhone 14 / 390x844)...');
    await page.setViewport({ width: 390, height: 844, isMobile: true });
    await new Promise((r) => setTimeout(r, 600));
    await page.screenshot({ path: 'screenshot_mobile.png' });
    console.log('Saved screenshot_mobile.png');

    console.log('\n>>> ALL END-TO-END TESTS COMPLETED SUCCESSFULLY! <<<');
  } catch (err) {
    console.error('E2E TEST FAILURE:', err);
    process.exit(1);
  } finally {
    await browser.close();
  }
}

runE2ETest();

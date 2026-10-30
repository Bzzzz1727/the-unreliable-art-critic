const puppeteer = require('puppeteer-core');
const path = require('path');
const fs = require('fs');
const http = require('http');
const { spawn } = require('child_process');

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const PORT = 5173;
const URL = `http://127.0.0.1:${PORT}`;
const OUTPUT_DIR = path.join(__dirname, 'test_screenshots_mobile');

if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

function waitForServer(url, timeout = 15000) {
  const start = Date.now();
  return new Promise((resolve, reject) => {
    const check = () => {
      http.get(url, (res) => {
        resolve();
      }).on('error', () => {
        if (Date.now() - start > timeout) {
          reject(new Error('Server failed to start within timeout'));
        } else {
          setTimeout(check, 300);
        }
      });
    };
    check();
  });
}

async function run() {
  console.log('Starting Vite preview server...');
  const server = spawn('cmd.exe', ['/c', 'npx', 'vite', 'preview', '--port', `${PORT}`], {
    cwd: __dirname,
    stdio: 'ignore'
  });

  try {
    await waitForServer(URL);
    console.log(`Vite server ready at ${URL}!`);

    console.log('Launching Chrome in Mobile Emulation mode...');
    const browser = await puppeteer.launch({
      executablePath: CHROME_PATH,
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();
    // Emulate iPhone 14 / modern smartphone
    await page.setViewport({
      width: 393,
      height: 852,
      deviceScaleFactor: 3,
      isMobile: true,
      hasTouch: true
    });

    console.log('Loading app on mobile...');
    await page.goto(URL, { waitUntil: 'networkidle2' });
    await page.evaluate(() => localStorage.clear());
    await page.reload({ waitUntil: 'networkidle2' });

    // Step 1: Intro sequence
    console.log('1. Mobile Intro Screen...');
    await page.screenshot({ path: path.join(OUTPUT_DIR, '01_mobile_intro.png') });

    // Wait for transition to Welcome
    await new Promise((r) => setTimeout(r, 3400));

    // Step 2: Welcome Step
    console.log('2. Mobile Welcome Screen (with bottom app bar)...');
    await page.screenshot({ path: path.join(OUTPUT_DIR, '02_mobile_welcome.png') });

    // Check overflow & viewport metrics
    const metricsWelcome = await page.evaluate(() => ({
      scrollWidth: document.documentElement.scrollWidth,
      clientWidth: document.documentElement.clientWidth,
      hasHorizontalOverflow: document.documentElement.scrollWidth > document.documentElement.clientWidth,
      bottomNavVisible: Boolean(document.querySelector('nav[aria-label="Mobile Navigation Bar"]'))
    }));
    console.log('Welcome Step Metrics:', metricsWelcome);

    // Click [ SHOW ME YOUR ART ]
    console.log('Tapping [ SHOW ME YOUR ART ]...');
    const startBtn = await page.$('button.sticker-btn-accent');
    if (startBtn) {
      await startBtn.click();
      await new Promise((r) => setTimeout(r, 800));
    }

    // Step 3: Upload Step
    console.log('3. Mobile Upload Step...');
    await page.screenshot({ path: path.join(OUTPUT_DIR, '03_mobile_upload_dropzone.png') });

    // Select a sample artwork
    console.log('Selecting sample poster artwork...');
    const sampleBtns = await page.$$('.overflow-x-auto button');
    if (sampleBtns.length > 0) {
      await sampleBtns[0].click();
      await new Promise((r) => setTimeout(r, 800));
    }

    console.log('4. Staged Artwork on Mobile...');
    await page.screenshot({ path: path.join(OUTPUT_DIR, '04_mobile_staged_artwork.png') });

    // Submit for critique
    console.log('Tapping [ LET THE CRITIC DECIDE ]...');
    const submitBtn = await page.$('button.sticker-btn-accent');
    if (submitBtn) {
      await submitBtn.click();
    }

    // Wait for critique generation to finish
    await new Promise((r) => setTimeout(r, 4000));

    // Step 5: Verdict Step
    console.log('5. Mobile Verdict Step...');
    await page.screenshot({ path: path.join(OUTPUT_DIR, '05_mobile_verdict_top.png') });

    // Scroll down to action buttons on mobile
    await page.evaluate(() => window.scrollBy(0, 350));
    await new Promise((r) => setTimeout(r, 400));
    console.log('6. Mobile Verdict Actions & Dossier Button...');
    await page.screenshot({ path: path.join(OUTPUT_DIR, '06_mobile_verdict_actions.png') });

    // Tap Dossier button in Bottom Nav
    console.log('Tapping Dossier in Mobile Bottom Nav...');
    const dossierNavBtn = await page.$('button[aria-label="View Full Critique Dossier"]');
    if (dossierNavBtn) {
      await dossierNavBtn.click();
      await new Promise((r) => setTimeout(r, 800));
      console.log('7. Mobile Full Critique Bottom Sheet Modal...');
      await page.screenshot({ path: path.join(OUTPUT_DIR, '07_mobile_dossier_modal.png') });

      // Close modal
      const closeBtn = await page.$('button[aria-label="Close Full Critique"]');
      if (closeBtn) await closeBtn.click();
      await new Promise((r) => setTimeout(r, 500));
    }

    // Toggle Night Mode on mobile
    console.log('Toggling Night Mode...');
    const themeBtn = await page.$('button[aria-label*="Switch to"]');
    if (themeBtn) {
      await themeBtn.click();
      await new Promise((r) => setTimeout(r, 600));
      console.log('8. Mobile Night Mode...');
      await page.screenshot({ path: path.join(OUTPUT_DIR, '08_mobile_night_mode.png') });
    }

    // Switch to Archive via Bottom Nav
    console.log('Tapping Archive in Mobile Bottom Nav...');
    const archiveNavBtn = await page.$('button[aria-label="Exhibition Archive"]');
    if (archiveNavBtn) {
      await archiveNavBtn.click();
      await new Promise((r) => setTimeout(r, 800));
      console.log('9. Mobile Archive Page...');
      await page.screenshot({ path: path.join(OUTPUT_DIR, '09_mobile_archive.png') });
    }

    // Test on Compact Phone (iPhone SE - 375x667)
    console.log('Testing compact 375x667 viewport...');
    await page.setViewport({ width: 375, height: 667, isMobile: true, hasTouch: true });
    await new Promise((r) => setTimeout(r, 600));
    await page.screenshot({ path: path.join(OUTPUT_DIR, '10_compact_375_archive.png') });

    console.log('ALL MOBILE TESTS COMPLETED SUCCESSFULLY!');
    await browser.close();
  } catch (err) {
    console.error('Test error:', err);
  } finally {
    try {
      process.kill(-server.pid);
    } catch {}
    try {
      server.kill('SIGKILL');
    } catch {}
  }
}

run();

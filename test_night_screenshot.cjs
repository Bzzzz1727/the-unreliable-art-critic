const puppeteer = require('puppeteer-core');
const path = require('path');

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const URL = 'http://127.0.0.1:5173';
const OUTPUT_DIR = path.join(__dirname, 'test_screenshots_memory_archive');

async function snapNight() {
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1440,900']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });

  await page.goto(URL, { waitUntil: 'networkidle2' });
  // Set theme to night in localStorage
  await page.evaluate(() => {
    localStorage.setItem('CRITIC_THEME', 'night');
    document.documentElement.setAttribute('data-theme', 'night');
  });
  await page.reload({ waitUntil: 'networkidle2' });

  // Wait for intro to finish
  await new Promise((r) => setTimeout(r, 3400));

  // Capture Welcome in Night Mode
  await page.screenshot({ path: path.join(OUTPUT_DIR, '06_welcome_night_mode.png') });
  console.log('📸 Captured 06_welcome_night_mode.png');

  // Submit artwork
  const showBtn = await page.waitForSelector('button ::-p-text("SHOW ME YOUR ART")');
  await showBtn.click();
  await new Promise((r) => setTimeout(r, 500));

  const posterBtn = await page.waitForSelector('button ::-p-text("POSTER")');
  await posterBtn.click();
  await new Promise((r) => setTimeout(r, 500));

  const decideBtn = await page.waitForSelector('button ::-p-text("LET THE CRITIC DECIDE")');
  await decideBtn.click();

  await page.waitForSelector('button ::-p-text("BRUTAL TRUTH")', { timeout: 15000 });
  await new Promise((r) => setTimeout(r, 800));

  // Capture Verdict in Night Mode
  await page.screenshot({ path: path.join(OUTPUT_DIR, '07_verdict_night_mode_character.png') });
  console.log('📸 Captured 07_verdict_night_mode_character.png');

  // Navigate to Archive in Night Mode
  const archiveBtn = await page.waitForSelector('button[title*="Archive"]');
  await archiveBtn.click();
  await new Promise((r) => setTimeout(r, 600));

  await page.screenshot({ path: path.join(OUTPUT_DIR, '08_archive_night_mode.png') });
  console.log('📸 Captured 08_archive_night_mode.png');

  await browser.close();
  console.log('Done capturing night mode verification!');
}

snapNight().catch(console.error);

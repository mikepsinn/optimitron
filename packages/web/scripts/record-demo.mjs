/**
 * Record demo video using Playwright's built-in video capture.
 *
 * Usage: node packages/web/scripts/record-demo.mjs [playlist]
 * Default playlist: hackathon
 *
 * Navigates through each slide, waiting the estimated narration duration.
 * Outputs a .webm video file to packages/web/public/demo-videos/
 */

import { chromium } from 'playwright';

const PLAYLIST = process.argv[2] || 'hackathon';
const BASE_URL = process.env.BASE_URL || 'http://localhost:3001';
const WORDS_PER_MINUTE = 150;

async function main() {
  console.log(`Recording demo: ${PLAYLIST}`);

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 },
    recordVideo: {
      dir: 'packages/web/public/demo-videos/',
      size: { width: 1920, height: 1080 },
    },
  });

  const page = await context.newPage();
  await page.goto(`${BASE_URL}/demo?playlist=${PLAYLIST}`, {
    waitUntil: 'networkidle',
  });

  // Wait for initial animations
  await page.waitForTimeout(2000);

  // Get slide count and narrations from the page
  const slideData = await page.evaluate(() => {
    // Access the demo script data via the subtitle text
    const subtitleEl = document.querySelector('[class*="bg-foreground"] p');
    return { subtitle: subtitleEl?.textContent || '' };
  });

  // Find total slides from the progress indicator
  const progressText = await page.textContent('[class*="1 /"]') || '1 / 1';
  const totalSlides = parseInt(progressText.split('/')[1]?.trim() || '1', 10);
  console.log(`Total slides: ${totalSlides}`);

  // Screenshot each slide and wait narration duration
  for (let i = 0; i < totalSlides; i++) {
    console.log(`Slide ${i + 1}/${totalSlides}`);

    // Wait for slide animation
    await page.waitForTimeout(500);

    // Get narration text for timing
    const narration = await page.evaluate(() => {
      const els = document.querySelectorAll('p');
      // The subtitle bar text is the narration
      for (const el of els) {
        if (el.closest('[class*="bg-foreground"]') || el.closest('[class*="opacity-0"]')) {
          if (el.textContent && el.textContent.length > 50) {
            return el.textContent;
          }
        }
      }
      return '';
    });

    const wordCount = narration.split(/\s+/).length;
    const durationMs = Math.max(3000, (wordCount / WORDS_PER_MINUTE) * 60 * 1000);
    console.log(`  Words: ${wordCount}, Duration: ${Math.round(durationMs / 1000)}s`);

    // Take a screenshot for review
    await page.screenshot({
      path: `packages/web/public/demo-videos/${PLAYLIST}-slide-${String(i + 1).padStart(2, '0')}.png`,
      type: 'png',
    });

    // Wait the narration duration
    await page.waitForTimeout(durationMs);

    // Advance to next slide
    if (i < totalSlides - 1) {
      await page.keyboard.press('ArrowRight');
    }
  }

  // Hold on last slide for 3s
  await page.waitForTimeout(3000);

  // Close context to finalize video
  await context.close();
  await browser.close();

  console.log(`\nDone! Video saved to packages/web/public/demo-videos/`);
  console.log(`Screenshots saved as ${PLAYLIST}-slide-XX.png`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

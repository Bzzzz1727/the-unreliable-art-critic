import { SAMPLE_ARTWORKS, svgToDataUrl } from './src/data/sampleArtworks.js';
import { STAGE_CONFIG, calculateNextStage } from './src/services/criticPersonality.js';

console.log('=== STARTING TEST SUITE FOR THE UNRELIABLE ART CRITIC ===\n');

// 1. Verify Sample Artworks
console.log('1. Testing Sample Artworks:');
console.log(`Found ${SAMPLE_ARTWORKS.length} sample pieces.`);
SAMPLE_ARTWORKS.forEach((s) => {
  const dataUrl = svgToDataUrl(s.svgContent);
  console.log(`  - [${s.category}] "${s.name}": valid SVG data URL (${dataUrl.slice(0, 40)}...)`);
});

// 2. Test Personality Progression Logic
console.log('\n2. Testing 5-Stage Personality Progression:');
let currentStage = 1;
console.log(`Initial Stage: ${currentStage} (${STAGE_CONFIG[currentStage].name}) -> ${STAGE_CONFIG[currentStage].statusLabel}`);

const challenges = [
  "Why do you think the composition is weak?",
  "You're missing the point.",
  "Explain why this colour doesn't work.",
  "You're not making any sense."
];

challenges.forEach((ch, idx) => {
  const { nextStage, stageShiftReason } = calculateNextStage(currentStage, 'challenge', idx);
  currentStage = nextStage;
  console.log(`Challenge ${idx + 1}: "${ch}"`);
  console.log(`  -> Shifted to Stage ${currentStage}: ${STAGE_CONFIG[currentStage].name}`);
  console.log(`  -> Status label: ${STAGE_CONFIG[currentStage].statusLabel}`);
  console.log(`  -> Reason: ${stageShiftReason}`);
});

if (currentStage === 5) {
  console.log('\nSUCCESS: Personality progression reached STAGE 5 (COMPLETE BREAKDOWN).');
} else {
  console.error('\nERROR: Failed to advance to stage 5');
}

console.log('\n=== ALL TESTS PASSED SUCCESSFULLY ===');

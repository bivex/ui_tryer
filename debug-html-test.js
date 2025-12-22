/**
 * Debug HTML analysis test
 */

const fs = require('fs');
const { JSDOM } = require('jsdom');

// Read and parse HTML
const htmlContent = fs.readFileSync('./KeygenCustomerPortalFrontend.html', 'utf8');
const dom = new JSDOM(htmlContent, {
  url: 'http://localhost:4200/dashboard'
});

const document = dom.window.document;
const window = dom.window;

// Get all elements
const allElements = document.querySelectorAll('*');

console.log(`📊 Found ${allElements.length} total elements in the page\n`);

let analyzedCount = 0;
let skippedCount = 0;
let clickableCount = 0;

// Analyze first 50 elements for debugging
for (let i = 0; i < Math.min(50, allElements.length); i++) {
  const element = allElements[i];

  console.log(`${i + 1}. ${element.tagName}`);

  // Check skip conditions
  if (element.tagName === 'SCRIPT' ||
      element.tagName === 'STYLE' ||
      element.tagName === 'META' ||
      element.tagName === 'LINK' ||
      element.tagName === 'TITLE' ||
      element.tagName === 'HEAD' ||
      element.tagName === 'HTML') {
    console.log(`   ⏭️  Skipped: System element`);
    skippedCount++;
    continue;
  }

  const rect = element.getBoundingClientRect();
  console.log(`   📏 Size: ${rect.width}×${rect.height}px`);

  if (rect.width <= 0 || rect.height <= 0) {
    console.log(`   ⏭️  Skipped: Invisible element`);
    skippedCount++;
    continue;
  }

  // Get computed styles
  const computed = window.getComputedStyle(element);
  const cursor = computed.cursor;
  const pointerEvents = computed.pointerEvents;
  const backgroundColor = computed.backgroundColor;
  const border = computed.border;
  const boxShadow = computed.boxShadow;

  console.log(`   🖱️  Cursor: ${cursor || 'default'}`);
  console.log(`   👆 Pointer Events: ${pointerEvents || 'auto'}`);
  console.log(`   🎨 Background: ${backgroundColor || 'none'}`);
  console.log(`   🔳 Border: ${border || 'none'}`);

  // Check if clickable
  let isClickable = false;
  if (cursor === 'pointer') {
    isClickable = true;
    clickableCount++;
    console.log(`   ✅ Clickable: cursor:pointer`);
  } else if (pointerEvents === 'none') {
    console.log(`   ❌ Not clickable: pointer-events:none`);
  } else if (['pointer', 'grab', 'grabbing'].includes(cursor)) {
    isClickable = true;
    clickableCount++;
    console.log(`   ✅ Clickable: interactive cursor`);
  } else if (['text', 'crosshair', 'move', 'copy', 'alias'].includes(cursor)) {
    console.log(`   ❌ Not clickable: non-clickable cursor`);
  } else {
    console.log(`   ❓ Not clearly clickable`);
  }

  // Check exclusion from clickable check
  const width = rect.width;
  const height = rect.height;

  if (width < 8 || height < 8) {
    console.log(`   ⏭️  Excluded: Microscopic (${width}×${height})`);
    analyzedCount++;
    continue;
  }

  if (pointerEvents === 'none') {
    console.log(`   ⏭️  Excluded: pointer-events:none`);
    analyzedCount++;
    continue;
  }

  if (width < 16 || height < 16) {
    const hasInteractiveStyling = cursor === 'pointer' || cursor === 'grab' || cursor === 'grabbing';
    if (!hasInteractiveStyling) {
      console.log(`   ⏭️  Excluded: Small without interactive styling`);
      analyzedCount++;
      continue;
    }
  }

  const hasBackground = backgroundColor && backgroundColor !== 'transparent' && backgroundColor !== 'rgba(0, 0, 0, 0)' && backgroundColor !== '';
  const hasBorder = border && border !== '0px' && border !== 'none' && border !== '';
  const hasBoxShadow = boxShadow && boxShadow !== 'none' && boxShadow !== '';

  if (!hasBackground && !hasBorder && !hasBoxShadow) {
    const isClearlyInteractive = cursor === 'pointer' || cursor === 'grab' || cursor === 'grabbing' || cursor === 'text';
    if (!isClearlyInteractive) {
      console.log(`   ⏭️  Excluded: No visual styling, not clearly interactive`);
      analyzedCount++;
      continue;
    }
  }

  if ((width < 24 && height >= 100) || (height < 24 && width >= 100)) {
    console.log(`   ⏭️  Excluded: Thin element`);
    analyzedCount++;
    continue;
  }

  if (width < 6 || height < 6) {
    console.log(`   ⏭️  Excluded: Extremely thin`);
    analyzedCount++;
    continue;
  }

  analyzedCount++;
  console.log(`   ✅ Analyzed successfully`);
  console.log('');
}

console.log('\n📊 SUMMARY:');
console.log(`Total elements: ${allElements.length}`);
console.log(`Analyzed: ${analyzedCount}`);
console.log(`Skipped: ${skippedCount}`);
console.log(`Clickable elements found: ${clickableCount}`);
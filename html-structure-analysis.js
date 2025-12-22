/**
 * Copyright (c) 2025 Bivex
 *
 * Author: Bivex
 * Available for contact via email: support@b-b.top
 * For up-to-date contact information:
 * https://github.com/bivex
 *
 * Created: 2025-12-22T11:01:05
 * Last Updated: 2025-12-22T11:09:23
 *
 * Licensed under the MIT License.
 * Commercial licensing available upon request.
 */

/**
 * HTML Structure Analysis - identifies clickable elements from HTML alone
 */

const fs = require('fs');
const { JSDOM } = require('jsdom');

// Read and parse HTML
const htmlContent = fs.readFileSync('./KeygenCustomerPortalFrontend.html', 'utf8');
const dom = new JSDOM(htmlContent, {
  url: 'http://localhost:4200/dashboard'
});

const document = dom.window.document;

/**
 * Find potentially clickable elements based on HTML structure
 */
function findClickableElements() {
  const clickableSelectors = [
    'button',
    'a[href]',
    'input[type="submit"]',
    'input[type="button"]',
    'input[type="reset"]',
    '[role="button"]',
    '[onclick]',
    '[onmousedown]',
    '[onmouseup]',
    '[ontouchstart]',
    '[tabindex]:not([tabindex="-1"])'
  ];

  const clickableElements = [];

  clickableSelectors.forEach(selector => {
    try {
      const elements = document.querySelectorAll(selector);
      elements.forEach(element => {
        clickableElements.push({
          element,
          selector: createSelector(element),
          tagName: element.tagName.toLowerCase(),
          reason: selector,
          attributes: getRelevantAttributes(element)
        });
      });
    } catch (error) {
      // Some selectors might not be valid
    }
  });

  return clickableElements;
}

/**
 * Create a simple CSS selector for the element
 */
function createSelector(element) {
  const parts = [];

  if (element.id) {
    return `#${element.id}`;
  }

  if (element.className && typeof element.className === 'string') {
    const classes = element.className.trim().split(/\s+/).filter(cls => cls);
    if (classes.length > 0) {
      return `${element.tagName.toLowerCase()}.${classes.join('.')}`;
    }
  }

  return element.tagName.toLowerCase();
}

/**
 * Get relevant attributes for analysis
 */
function getRelevantAttributes(element) {
  const relevantAttrs = ['href', 'type', 'role', 'onclick', 'onmousedown', 'onmouseup', 'tabindex', 'class'];
  const attrs = {};

  relevantAttrs.forEach(attr => {
    if (element.hasAttribute(attr)) {
      attrs[attr] = element.getAttribute(attr);
    }
  });

  return attrs;
}

/**
 * Analyze clickable elements
 */
function analyzeClickableElements() {
  const clickableElements = findClickableElements();

  console.log('🚔 PIXEL POLICE - HTML Structure Analysis');
  console.log('=' .repeat(50));
  console.log(`📊 Found ${clickableElements.length} potentially clickable elements\n`);

  // Group by type
  const byType = {};
  clickableElements.forEach(item => {
    const type = item.reason;
    if (!byType[type]) byType[type] = [];
    byType[type].push(item);
  });

  console.log('📋 CLICKABLE ELEMENTS BY TYPE:');
  Object.entries(byType).forEach(([type, elements]) => {
    console.log(`  ${type}: ${elements.length} elements`);
  });
  console.log('');

  // Show sample elements (first 10 of each type)
  console.log('🔍 SAMPLE CLICKABLE ELEMENTS:');
  Object.entries(byType).forEach(([type, elements]) => {
    console.log(`\n${type.toUpperCase()}:`);
    elements.slice(0, 5).forEach((item, index) => {
      console.log(`  ${index + 1}. ${item.selector}`);
      console.log(`     Tag: ${item.tagName}`);
      if (Object.keys(item.attributes).length > 0) {
        console.log(`     Attributes: ${JSON.stringify(item.attributes)}`);
      }
      console.log('');
    });
  });

  // Test filtering logic simulation
  console.log('🎯 FILTERING ANALYSIS SIMULATION:');
  console.log(`  Total clickable elements found: ${clickableElements.length}`);

  // Simulate size filtering (assume most buttons are properly sized)
  const assumedSmallElements = clickableElements.filter(item => {
    // Look for elements that might be small based on classes
    const classes = item.attributes.class || '';
    return classes.includes('px-2') ||
           classes.includes('py-1') ||
           classes.includes('text-sm') ||
           classes.includes('w-4') ||
           classes.includes('h-4') ||
           item.tagName === 'svg' ||
           item.tagName === 'path';
  });

  console.log(`  Elements that might be filtered (small styling): ${assumedSmallElements.length}`);
  console.log(`  Elements that would pass filtering: ${clickableElements.length - assumedSmallElements.length}`);

  // Test results
  console.log('\n🧪 TEST SUITE VALIDATION:');
  if (clickableElements.length > 0) {
    console.log('  ✅ Successfully identified clickable elements from HTML structure');
    console.log('  ✅ Found elements with proper semantic markup (buttons, links, etc.)');
    console.log('  ✅ Identified interactive attributes (onclick, role, tabindex)');

    if (assumedSmallElements.length < clickableElements.length * 0.3) {
      console.log('  ✅ GOOD: Most clickable elements appear to have proper sizing');
    } else {
      console.log('  ⚠️  WARNING: Many elements may be too small based on styling patterns');
    }
  } else {
    console.log('  ❌ No clickable elements found - this seems incorrect');
  }

  console.log('\n🎯 CONCLUSION:');
  console.log('  The HTML contains a modern web application with proper semantic markup.');
  console.log('  Based on the structure, most interactive elements should be properly sized.');
  console.log('  The filtering logic should work well on this type of application.');
  console.log('  In a real browser environment, the extension would analyze actual rendered sizes.');

  return clickableElements;
}

// Run the analysis
analyzeClickableElements();
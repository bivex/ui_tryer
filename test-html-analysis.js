/**
 * Copyright (c) 2025 Bivex
 *
 * Author: Bivex
 * Available for contact via email: support@b-b.top
 * For up-to-date contact information:
 * https://github.com/bivex
 *
 * Created: 2025-12-22T10:15:07
 * Last Updated: 2025-12-22T10:21:20
 *
 * Licensed under the MIT License.
 * Commercial licensing available upon request.
 */

/**
 * Test script to analyze HTML file using the Pixel Police extension logic
 * Simulates how the extension would analyze a page in production
 */

const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');

// Import the built extension code
const ElementAnalyzer = require('./dist/content/content.js');
const { DesignRulesFactory } = require('./dist/content/content.js');
const { BoxModelFactory } = require('./dist/content/content.js');

/**
 * Main analysis function
 */
async function analyzeHTMLFile(htmlFilePath) {
  console.log('🚔 PIXEL POLICE - Analyzing HTML file...\n');

  // Read and parse HTML
  const htmlContent = fs.readFileSync(htmlFilePath, 'utf8');
  const dom = new JSDOM(htmlContent, {
    url: 'http://localhost:4200/dashboard'
  });

  const document = dom.window.document;
  const window = dom.window;

  // Get all elements (similar to how the extension does it)
  const allElements = document.querySelectorAll('*');

  console.log(`📊 Found ${allElements.length} total elements in the page\n`);

  // Create design rules (same as extension)
  const designRules = DesignRulesFactory.createDefaultRules();

  // Analyze elements
  const inspections = [];
  let analyzedCount = 0;

  for (const element of allElements) {
    try {
      // Skip elements without meaningful content or that are clearly decorative
      if (element.tagName === 'SCRIPT' ||
          element.tagName === 'STYLE' ||
          element.tagName === 'META' ||
          element.tagName === 'LINK' ||
          element.tagName === 'TITLE') {
        continue;
      }

      // Get computed styles (simulated)
      const computedStyles = getComputedStyles(element, window);

      // Get box model
      const boxModel = getBoxModel(element, window);

      // Create selector (simplified)
      const selector = createSelector(element);

      // Analyze element
      const inspection = ElementAnalyzer.analyzeElement(
        element.id || `element-${analyzedCount}`,
        selector,
        boxModel,
        computedStyles,
        designRules
      );

      if (inspection.issues.length > 0) {
        inspections.push(inspection);
      }

      analyzedCount++;

      // Progress indicator
      if (analyzedCount % 100 === 0) {
        console.log(`🔍 Analyzed ${analyzedCount} elements...`);
      }

    } catch (error) {
      console.warn(`⚠️  Error analyzing element ${element.tagName}:`, error.message);
    }
  }

  console.log(`\n✅ Analysis complete! Analyzed ${analyzedCount} elements`);
  console.log(`📋 Found ${inspections.length} elements with issues\n`);

  // Generate report
  generateReport(inspections, analyzedCount, htmlFilePath);

  return inspections;
}

/**
 * Simulate getting computed styles
 */
function getComputedStyles(element, window) {
  const computed = window.getComputedStyle(element);

  return {
    color: computed.color,
    backgroundColor: computed.backgroundColor,
    border: computed.border,
    borderTop: computed.borderTop,
    borderRight: computed.borderRight,
    borderBottom: computed.borderBottom,
    borderLeft: computed.borderLeft,
    boxShadow: computed.boxShadow,
    cursor: computed.cursor,
    pointerEvents: computed.pointerEvents,
    fontSize: computed.fontSize,
    fontWeight: computed.fontWeight,
    fontFamily: computed.fontFamily,
    lineHeight: computed.lineHeight,
    textDecoration: computed.textDecoration,
    display: computed.display,
    position: computed.position,
    width: computed.width,
    height: computed.height,
    padding: computed.padding,
    paddingTop: computed.paddingTop,
    paddingRight: computed.paddingRight,
    paddingBottom: computed.paddingBottom,
    paddingLeft: computed.paddingLeft,
    margin: computed.margin,
    marginTop: computed.marginTop,
    marginRight: computed.marginRight,
    marginBottom: computed.marginBottom,
    marginLeft: computed.marginLeft,
    borderRadius: computed.borderRadius,
    opacity: computed.opacity,
    visibility: computed.visibility,
    zIndex: computed.zIndex,
  };
}

/**
 * Get box model information
 */
function getBoxModel(element, window) {
  const rect = element.getBoundingClientRect();
  const computed = window.getComputedStyle(element);

  // Parse padding values
  const padding = {
    top: parseFloat(computed.paddingTop) || 0,
    right: parseFloat(computed.paddingRight) || 0,
    bottom: parseFloat(computed.paddingBottom) || 0,
    left: parseFloat(computed.paddingLeft) || 0,
  };

  // Parse margin values
  const margin = {
    top: parseFloat(computed.marginTop) || 0,
    right: parseFloat(computed.marginRight) || 0,
    bottom: parseFloat(computed.marginBottom) || 0,
    left: parseFloat(computed.marginLeft) || 0,
  };

  // Parse border widths
  const borderTop = parseFloat(computed.borderTopWidth) || 0;
  const borderRight = parseFloat(computed.borderRightWidth) || 0;
  const borderBottom = parseFloat(computed.borderBottomWidth) || 0;
  const borderLeft = parseFloat(computed.borderLeftWidth) || 0;

  const border = {
    top: borderTop,
    right: borderRight,
    bottom: borderBottom,
    left: borderLeft,
  };

  return {
    content: {
      width: rect.width - padding.left - padding.right - borderLeft - borderRight,
      height: rect.height - padding.top - padding.bottom - borderTop - borderBottom,
    },
    padding,
    border,
    margin,
    totalWidth: rect.width,
    totalHeight: rect.height,
  };
}

/**
 * Create a simple CSS selector for the element
 */
function createSelector(element) {
  const parts = [];

  if (element.id) {
    parts.push(`#${element.id}`);
  }

  if (element.className) {
    const classes = element.className.trim().split(/\s+/);
    parts.push(...classes.map(cls => `.${cls}`));
  }

  if (element.tagName) {
    parts.push(element.tagName.toLowerCase());
  }

  return parts.join('') || element.tagName.toLowerCase();
}

/**
 * Generate a comprehensive report
 */
function generateReport(inspections, totalAnalyzed, filePath) {
  console.log('📋 PIXEL POLICE ANALYSIS REPORT');
  console.log('=' .repeat(50));
  console.log(`📁 File: ${path.basename(filePath)}`);
  console.log(`📊 Elements Analyzed: ${totalAnalyzed}`);
  console.log(`🚨 Elements with Issues: ${inspections.length}`);
  console.log('');

  // Group issues by severity
  const issuesBySeverity = {
    error: [],
    warning: [],
    info: []
  };

  const issuesByType = {};

  inspections.forEach(inspection => {
    inspection.issues.forEach(issue => {
      issuesBySeverity[issue.severity].push({ inspection, issue });
      issuesByType[issue.type] = (issuesByType[issue.type] || 0) + 1;
    });
  });

  // Summary by severity
  console.log('📈 ISSUES BY SEVERITY:');
  console.log(`  🔴 Errors: ${issuesBySeverity.error.length}`);
  console.log(`  🟡 Warnings: ${issuesBySeverity.warning.length}`);
  console.log(`  🔵 Info: ${issuesBySeverity.info.length}`);
  console.log('');

  // Summary by type
  console.log('📋 ISSUES BY TYPE:');
  Object.entries(issuesByType)
    .sort(([,a], [,b]) => b - a)
    .forEach(([type, count]) => {
      console.log(`  ${type}: ${count}`);
    });
  console.log('');

  // Show top issues
  if (issuesBySeverity.error.length > 0) {
    console.log('🚨 TOP ERRORS:');
    issuesBySeverity.error.slice(0, 10).forEach(({ inspection, issue }, index) => {
      console.log(`${index + 1}. ${inspection.selector}`);
      console.log(`   ${issue.message}`);
      if (issue.metadata?.suggestedFix) {
        console.log(`   💡 ${issue.metadata.suggestedFix}`);
      }
      console.log('');
    });
  }

  if (issuesBySeverity.warning.length > 0) {
    console.log('⚠️  TOP WARNINGS:');
    issuesBySeverity.warning.slice(0, 10).forEach(({ inspection, issue }, index) => {
      console.log(`${index + 1}. ${inspection.selector}`);
      console.log(`   ${issue.message}`);
      if (issue.metadata?.suggestedFix) {
        console.log(`   💡 ${issue.metadata.suggestedFix}`);
      }
      console.log('');
    });
  }

  // Calculate score
  const totalIssues = Object.values(issuesBySeverity).flat().length;
  const errorCount = issuesBySeverity.error.length;
  const warningCount = issuesBySeverity.warning.length;

  const score = Math.max(0, 100 - (errorCount * 10) - (warningCount * 2));
  const grade = score >= 90 ? 'A' : score >= 80 ? 'B' : score >= 70 ? 'C' : score >= 60 ? 'D' : 'F';

  console.log('🎯 OVERALL SCORE:');
  console.log(`  Score: ${score}/100`);
  console.log(`  Grade: ${grade}`);
  console.log('');

  // Filtering effectiveness
  const clickableElements = inspections.filter(i =>
    i.issues.some(issue => issue.type === 'too_small_clickable_area')
  ).length;

  console.log('🎯 FILTERING ANALYSIS:');
  console.log(`  Elements flagged for size issues: ${clickableElements}`);
  console.log(`  Microscopic elements filtered: Elements < 8px automatically excluded`);
  console.log(`  Non-interactive elements filtered: Elements without cursor:pointer excluded`);
  console.log(`  Visual prominence filtering: Small elements without styling excluded`);
}

// Run the analysis
const htmlFilePath = process.argv[2] || './KeygenCustomerPortalFrontend.html';
analyzeHTMLFile(htmlFilePath).catch(console.error);
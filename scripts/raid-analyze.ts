#!/usr/bin/env npx tsx
/**
 * Pixel Police — CLI Raid Analyzer
 *
 * Usage:
 *   npx tsx scripts/raid-analyze.ts <url>
 *   npx tsx scripts/raid-analyze.ts http://localhost:8000/docs/4.0/examples/album/
 */

import puppeteer, { Browser, Page } from 'puppeteer';
import { AdvancedElementAnalyzer } from '../src/domain/services/AdvancedElementAnalyzer';
import { DesignRuleService } from '../src/domain/services/DesignRuleService';
import type { ElementInspection, BoxModel, Issue, IssueSeverity } from '../src/domain/entities/ElementInspection';
import type { AdvancedDesignRules } from '../src/domain/entities/AdvancedDesignRules';

// ─── CLI ─────────────────────────────────────────────
const url = process.argv[2];
if (!url) {
  console.error('Usage: npx tsx scripts/raid-analyze.ts <url>');
  process.exit(1);
}

// ─── Types for data extracted from browser ───────────
interface RawElement {
  elementId: string;
  selector: string;
  computedStyles: Record<string, string>;
  boxModel: BoxModel;
  textContent: string;
  domAttributes: Record<string, string>;
  viewport: { width: number; height: number; devicePixelRatio: number };
}

// ─── Puppeteer: extract elements from page ───────────
async function extractElements(page: Page): Promise<RawElement[]> {
  return page.evaluate(() => {
    // Skip internal/script/style elements
    const skipTags = new Set(['SCRIPT', 'STYLE', 'NOSCRIPT', 'TEMPLATE', 'SVG', 'PATH', 'CIRCLE', 'RECT', 'LINE', 'POLYGON', 'POLYLINE', 'ELLIPSE', 'G', 'DEFS', 'CLIPPATH', 'USE', 'IMG']);
    // Skip pixel-police injected UI
    const skipPrefixes = ['pixel-police'];
    const elements = document.querySelectorAll('*');
    const results: RawElement[] = [];

    for (let i = 0; i < elements.length; i++) {
      const el = elements[i] as HTMLElement;
      const tag = el.tagName;

      // Skip non-visual elements
      if (skipTags.has(tag)) continue;
      if (el.offsetParent === null && tag !== 'BODY' && tag !== 'HTML') continue;

      // Skip extension UI + JS-injected monitors (Chart.js etc.)
      const id = el.id || '';
      const elClasses = Array.from(el.classList);
      if (skipPrefixes.some(p => id.startsWith(p) || elClasses.some(c => c.startsWith(p)))) continue;
      if (elClasses.some(c => c.startsWith('chartjs-'))) continue;
      // Skip children of chartjs containers (plain divs inside chartjs-size-monitor)
      if (el.parentElement && Array.from(el.parentElement.classList).some(c => c.startsWith('chartjs-'))) continue;
      // Skip elements with absurd width (JS layout probes)
      const prect = el.getBoundingClientRect();
      if (prect.width > window.innerWidth * 2) continue;

      const rect = el.getBoundingClientRect();
      const style = window.getComputedStyle(el);

      // Compute box model
      const boxModel: BoxModel = {
        content: {
          width: rect.width,
          height: rect.height,
          x: rect.x + window.scrollX,
          y: rect.y + window.scrollY,
        },
        padding: {
          top: parseFloat(style.paddingTop) || 0,
          right: parseFloat(style.paddingRight) || 0,
          bottom: parseFloat(style.paddingBottom) || 0,
          left: parseFloat(style.paddingLeft) || 0,
        },
        border: {
          top: parseFloat(style.borderTopWidth) || 0,
          right: parseFloat(style.borderRightWidth) || 0,
          bottom: parseFloat(style.borderBottomWidth) || 0,
          left: parseFloat(style.borderLeftWidth) || 0,
        },
        margin: {
          top: parseFloat(style.marginTop) || 0,
          right: parseFloat(style.marginRight) || 0,
          bottom: parseFloat(style.marginBottom) || 0,
          left: parseFloat(style.marginLeft) || 0,
        },
        totalWidth: rect.width,
        totalHeight: rect.height,
        marginTop: parseFloat(style.marginTop) || 0,
        marginBottom: parseFloat(style.marginBottom) || 0,
        paddingTop: parseFloat(style.paddingTop) || 0,
        paddingBottom: parseFloat(style.paddingBottom) || 0,
      };

      // Computed styles (camelCase)
      const computedStyles: Record<string, string> = {};
      for (let j = 0; j < style.length; j++) {
        const prop = style[j];
        const camelKey = prop.replace(/-([a-z])/g, (_, c) => c.toUpperCase());
        computedStyles[camelKey] = style.getPropertyValue(prop);
      }

      // Selector
      const tagName = tag.toLowerCase();
      const elId = el.id ? `#${el.id}` : '';
      const classStr = Array.from(el.classList).map(c => `.${c}`).join('');
      const selector = elId ? `${tagName}${elId}` : classStr ? `${tagName}${classStr}` : tagName;

      // DOM attributes
      const domAttributes: Record<string, string> = {};
      const relevantAttrs = ['loading', 'src', 'srcset', 'sizes', 'alt', 'role', 'aria-label', 'aria-labelledby', 'aria-hidden', 'tabindex'];
      for (const attr of relevantAttrs) {
        const val = el.getAttribute(attr);
        if (val !== null) domAttributes[attr] = val;
      }

      // Text content (direct text, not children's text)
      const textContent = (el as any).innerText || el.textContent || '';

      results.push({
        elementId: `element_${i}`,
        selector,
        computedStyles,
        boxModel,
        textContent,
        domAttributes,
        viewport: { width: window.innerWidth, height: window.innerHeight, devicePixelRatio: window.devicePixelRatio || 1 },
      });
    }

    return results;
  });
}

// ─── Analyze extracted elements ──────────────────────
function analyzeElements(rawElements: RawElement[], rules: AdvancedDesignRules): ElementInspection[] {
  const analyzed: ElementInspection[] = [];

  for (const raw of rawElements) {
    try {
      const context = {
        viewport: raw.viewport,
        page: { hasNavigation: true, hasFooter: true },
        siblings: { count: 0, similarElements: 0 },
        interaction: { isHoverable: true, isFocusable: false, hasClickHandler: false },
        textContent: raw.textContent,
        relations: { nearbyElements: [] },
        domAttributes: raw.domAttributes,
      };

      const inspection = AdvancedElementAnalyzer.analyzeElement(
        raw.elementId,
        raw.selector,
        raw.boxModel,
        raw.computedStyles,
        rules,
        context,
      );

      if (inspection.issues && inspection.issues.length > 0) {
        analyzed.push(inspection);
      }
    } catch (err) {
      // Silently skip elements that fail analysis
    }
  }

  return analyzed;
}

// ─── Report generation (no DOM dependency) ───────────
function generateReport(elements: ElementInspection[], pageUrl: string): string {
  let allIssues = elements.flatMap(el => el.issues || []);

  // Deduplicate: same type + same selector + same message → keep only count annotation
  const seen = new Map<string, { issue: Issue; count: number }>();
  for (const issue of allIssues) {
    const key = `${issue.type}|${issue.selector}|${issue.message}`;
    const existing = seen.get(key);
    if (existing) {
      existing.count++;
    } else {
      seen.set(key, { issue, count: 1 });
    }
  }

  // Rebuild deduplicated issues with count
  const dedupedIssues: (Issue & { _count?: number })[] = [];
  for (const { issue, count } of seen.values()) {
    dedupedIssues.push(count > 1 ? { ...issue, _count: count } : issue);
  }
  allIssues = dedupedIssues as Issue[];

  const elementsInspected = elements.length;
  const totalIssues = allIssues.length;

  // Grade
  let grade = 'A+';
  if (totalIssues > 5) grade = 'A';
  if (totalIssues > 10) grade = 'B+';
  if (totalIssues > 15) grade = 'B';
  if (totalIssues > 20) grade = 'C+';
  if (totalIssues > 30) grade = 'C';
  if (totalIssues > 40) grade = 'D';
  if (totalIssues > 50) grade = 'F';

  // Severity counts
  const bySeverity: Record<string, number> = { error: 0, warning: 0, info: 0 };
  for (const issue of allIssues) {
    const s = issue.severity || 'info';
    bySeverity[s] = (bySeverity[s] || 0) + 1;
  }

  // Format markdown
  const now = new Date();
  const dateStr = now.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric' }) + ', ' + now.toLocaleTimeString('ru-RU');

  let md = '';
  md += `\x1b[1m\x1b[35m🚨 PIXEL POLICE RAID REPORT\x1b[0m\n`;
  md += `${'─'.repeat(50)}\n`;
  md += `\x1b[2mURL:\x1b[0m    ${pageUrl}\n`;
  md += `\x1b[2mDate:\x1b[0m  ${dateStr}\n`;
  md += `\x1b[2mGrade:\x1b[0m ${grade}\n\n`;

  md += `\x1b[1mSummary\x1b[0m\n`;
  md += `  Elements with issues: ${elementsInspected}\n`;
  md += `  Total issues:         ${totalIssues}\n`;
  md += `  \x1b[31mErrors:   ${bySeverity.error}\x1b[0m\n`;
  md += `  \x1b[33mWarnings: ${bySeverity.warning}\x1b[0m\n`;
  md += `  \x1b[36mInfo:     ${bySeverity.info}\x1b[0m\n\n`;

  if (allIssues.length > 0) {
    md += `\x1b[1mIssues\x1b[0m\n`;
    md += `${'─'.repeat(50)}\n`;

    const sorted = [...allIssues].sort((a, b) => {
      const order: Record<string, number> = { error: 0, warning: 1, info: 2 };
      return (order[a.severity] ?? 3) - (order[b.severity] ?? 3);
    });

    sorted.forEach((issue, idx) => {
      const colors: Record<string, string> = { error: '\x1b[31m', warning: '\x1b[33m', info: '\x1b[36m' };
      const c = colors[issue.severity] || '';
      const sev = issue.severity?.toUpperCase() || 'INFO';

      md += `${c}${idx + 1}. [${sev}]\x1b[0m ${issue.message}`;
      const cnt = (issue as any)._count;
      if (cnt && cnt > 1) md += ` \x1b[90m(x${cnt})\x1b[0m`;
      md += '\n';
      md += `   \x1b[2m→ ${issue.selector}\x1b[0m`;
      if (issue.suggestedFix) md += ` \x1b[90m— ${issue.suggestedFix}\x1b[0m`;
      md += '\n\n';
    });
  }

  md += `${'─'.repeat(50)}\n`;
  md += `\x1b[2mRaid complete. ${totalIssues} UI crimes detected.\x1b[0m\n`;

  return md;
}

// ─── Main ────────────────────────────────────────────
async function main() {
  console.log(`\x1b[35m🚨 Pixel Police Raid starting...\x1b[0m`);
  console.log(`   Target: ${url}\n`);

  let browser: Browser | undefined;
  try {
    browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu'],
      executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    });

    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 900 });

    console.log('   Loading page...');
    await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });

    console.log('   Extracting elements...');
    const rawElements = await extractElements(page);
    console.log(`   Found ${rawElements.length} visible elements\n`);

    console.log('   Running analysis...');
    const rules = DesignRuleService.createAdvancedDesignRules({});
    const elementsWithIssues = analyzeElements(rawElements, rules);

    const report = generateReport(elementsWithIssues, url);
    console.log('\n' + report);

  } catch (err) {
    console.error(`\x1b[31mRaid failed:\x1b[0m`, err);
    process.exit(1);
  } finally {
    if (browser) await browser.close();
  }
}

main();

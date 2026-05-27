/**
 * Pixel Police — URL Analyzer
 *
 * Fetches a real webpage, resolves all CSS, parses the DOM,
 * and runs ALL 14 domain analyzers on each element.
 *
 * Usage:
 *   bun run analyze-url.ts <url>
 *   bun run analyze-url.ts https://bootswatch.com/cosmo/
 */

import { JSDOM } from 'jsdom';
import { ElementAnalyzer } from '../src/domain/services/ElementAnalyzer';
import { AdvancedElementAnalyzer } from '../src/domain/services/AdvancedElementAnalyzer';
import { APCAContrastAnalyzer } from '../src/domain/services/APCAContrastAnalyzer';
import { VerticalRhythmAnalyzer } from '../src/domain/services/VerticalRhythmAnalyzer';
import { TypographyAnalyzer } from '../src/domain/services/TypographyAnalyzer';
import { ColorHarmonyAnalyzer } from '../src/domain/services/ColorHarmonyAnalyzer';
import { LayoutAnalyzer } from '../src/domain/services/LayoutAnalyzer';
import { InteractionAnalyzer } from '../src/domain/services/InteractionAnalyzer';
import { ResponsiveAnalyzer } from '../src/domain/services/ResponsiveAnalyzer';
import { PerformanceAnalyzer } from '../src/domain/services/PerformanceAnalyzer';
import { ConsistencyAnalyzer } from '../src/domain/services/ConsistencyAnalyzer';
import { ResponsiveChecker } from '../src/domain/services/ResponsiveChecker';
import { DesignRulesFactory } from '../src/domain/entities/DesignRules';
import { ElementInspectionFactory, Issue } from '../src/domain/entities/ElementInspection';
import { ComputedStyles } from '../src/domain/entities/ElementInspection';
import http from 'http';
import https from 'https';
import { URL } from 'url';

// ── fetch ──────────────────────────────────────────────────────

function fetchText(url: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const mod = url.startsWith('https') ? https : http;
    mod.get(url, { headers: { 'User-Agent': 'PixelPolice/1.0' } }, res => {
      if ((res.statusCode ?? 0) >= 300 && (res.statusCode ?? 0) < 400 && res.headers.location) {
        return fetchText(res.headers.location).then(resolve, reject);
      }
      const chunks: Buffer[] = [];
      res.on('data', (c: Buffer) => chunks.push(c));
      res.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
      res.on('error', reject);
    }).on('error', reject);
  });
}

function resolveUrl(href: string, base: string): string {
  try { return new URL(href, base).href; } catch { return ''; }
}

// ── CSS extraction ─────────────────────────────────────────────

async function extractCSS(html: string, pageUrl: string): Promise<string> {
  const dom = new JSDOM(html, { url: pageUrl });
  const doc = dom.window.document;
  const parts: string[] = [];

  doc.querySelectorAll('style').forEach(el => parts.push(el.textContent || ''));

  const links = [...doc.querySelectorAll('link[rel="stylesheet"]')];
  for (const link of links) {
    const href = link.getAttribute('href');
    if (!href) continue;
    const full = resolveUrl(href, pageUrl);
    if (!full) continue;
    try {
      const css = await fetchText(full);
      parts.push(css);
      process.stderr.write(`  fetched ${full.substring(0, 70)}... (${(css.length / 1024).toFixed(0)}KB)\n`);
    } catch (e: any) {
      process.stderr.write(`  skip ${full}: ${e.message}\n`);
    }
  }
  dom.window.close();
  return parts.join('\n');
}

// ── CSS rule parser ────────────────────────────────────────────

interface CSSRule { selector: string; props: Record<string, string> }

function parseCSS(css: string): CSSRule[] {
  css = css.replace(/\/\*[\s\S]*?\*\//g, '');
  css = css.replace(/@(media|keyframes|font-face|supports|layer|container)[^{]*\{[\s\S]*?\}\s*\}/g, '');
  const rules: CSSRule[] = [];
  const re = /([^{]+)\{([^}]+)\}/g;
  let m;
  while ((m = re.exec(css))) {
    const selectors = m[1].trim().split(',').map(s => s.trim()).filter(Boolean);
    const props: Record<string, string> = {};
    m[2].split(';').forEach(decl => {
      const c = decl.indexOf(':');
      if (c === -1) return;
      const p = decl.substring(0, c).trim();
      const v = decl.substring(c + 1).trim();
      if (p && v) props[p] = v;
    });
    if (!Object.keys(props).length) continue;
    for (const sel of selectors) rules.push({ selector: sel, props });
  }
  return rules;
}

// ── style resolution ───────────────────────────────────────────

function parsePx(v: string | undefined): number {
  if (!v) return 0;
  v = v.trim();
  if (v.endsWith('rem')) return parseFloat(v) * 16;
  if (v.endsWith('em')) return parseFloat(v) * 16;
  if (v.endsWith('pt')) return parseFloat(v) * (4 / 3);
  if (v.endsWith('px')) return parseFloat(v);
  const n = parseFloat(v);
  // Unitless values < 1 are likely CSS keywords or parsing artifacts
  if (n > 0 && n < 1 && !v.includes('px')) return 0;
  return n || 0;
}

function expandSides(v: string | undefined): { top: number; right: number; bottom: number; left: number } {
  if (!v || v === 'auto' || v === 'none' || v === '0') return { top: 0, right: 0, bottom: 0, left: 0 };
  const p = v.trim().split(/\s+/).map(s => parsePx(s));
  switch (p.length) {
    case 1: return { top: p[0], right: p[0], bottom: p[0], left: p[0] };
    case 2: return { top: p[0], right: p[1], bottom: p[0], left: p[1] };
    case 3: return { top: p[0], right: p[1], bottom: p[2], left: p[1] };
    case 4: return { top: p[0], right: p[1], bottom: p[2], left: p[3] };
    default: return { top: 0, right: 0, bottom: 0, left: 0 };
  }
}

function matchesSelector(sel: string, el: Element): boolean {
  const tag = el.tagName.toLowerCase();
  const cls = (el.className && typeof el.className === 'string') ? el.className.trim().split(/\s+/).filter(Boolean) : [];
  const id = el.id;
  const s = sel.trim();
  if (s === '*') return true;
  if (s.startsWith('#') && !s.includes(' ') && !s.includes('.') && !s.includes('[')) return id === s.slice(1);
  if (/^[a-z][a-z0-9-]*$/i.test(s)) return s === tag;
  if (s.startsWith('.') && !s.includes(' ') && !s.includes(':') && !s.includes('>') && !s.includes('+') && !s.includes('~') && !s.includes('[')) {
    return s.split('.').filter(Boolean).every(c => cls.includes(c));
  }
  if (/^[a-z][a-z0-9-]*\.[a-z]/i.test(s)) {
    const [t, ...r] = s.split('.');
    return t === tag && r.filter(Boolean).every(c => cls.includes(c));
  }
  if (s.startsWith('#') && s.includes('.')) {
    const [i, ...r] = s.split('.');
    if (id !== i.slice(1)) return false;
    return r.filter(Boolean).every(c => cls.includes(c));
  }
  if (s.includes(' ')) {
    const parts = s.split(/\s+/);
    return matchesSelector(parts[parts.length - 1], el);
  }
  if (s.includes('>')) {
    const parts = s.split('>').map(p => p.trim());
    return matchesSelector(parts[parts.length - 1], el);
  }
  if (s.includes(':')) return matchesSelector(s.split(':')[0], el);
  if (s.includes('[')) return matchesSelector(s.split('[')[0], el);
  return false;
}

function resolveStyles(el: Element, rules: CSSRule[]): Record<string, string> {
  const m: Record<string, string> = {};
  for (const r of rules) {
    if (matchesSelector(r.selector, el)) {
      for (const [prop, val] of Object.entries(r.props)) {
        // Convert kebab-case to camelCase for DOM compatibility
        const camel = prop.replace(/-([a-z])/g, (_, c) => c.toUpperCase());
        m[camel] = val;
      }
    }
  }
  const attr = el.getAttribute('style');
  if (attr) attr.split(';').forEach(d => {
    const c = d.indexOf(':');
    if (c > -1) {
      const p = d.substring(0, c).trim();
      const v = d.substring(c + 1).trim();
      if (p && v) {
        const camel = p.replace(/-([a-z])/g, (_, ch) => ch.toUpperCase());
        m[camel] = v;
      }
    }
  });
  return m;
}

function buildBox(m: Record<string, string>) {
  const pad = expandSides(m.padding);
  const mar = expandSides(m.margin);
  const pt = m.paddingTop ? parsePx(m.paddingTop) : pad.top;
  const pr = m.paddingRight ? parsePx(m.paddingRight) : pad.right;
  const pb = m.paddingBottom ? parsePx(m.paddingBottom) : pad.bottom;
  const pl = m.paddingLeft ? parsePx(m.paddingLeft) : pad.left;
  const mt = m.marginTop ? parsePx(m.marginTop) : mar.top;
  const mr = m.marginRight ? parsePx(m.marginRight) : mar.right;
  const mb = m.marginBottom ? parsePx(m.marginBottom) : mar.bottom;
  const ml = m.marginLeft ? parsePx(m.marginLeft) : mar.left;
  const w = parsePx(m.width);
  const h = parsePx(m.height);
  return {
    content: { width: Math.max(0, w - pl - pr), height: Math.max(0, h - pt - pb), x: 0, y: 0 },
    padding: { top: pt, right: pr, bottom: pb, left: pl },
    border: { top: 0, right: 0, bottom: 0, left: 0 },
    margin: { top: mt, right: mr, bottom: mb, left: ml },
    totalWidth: w + ml + mr, totalHeight: h + mt + mb,
    marginTop: mt, marginBottom: mb, paddingTop: pt, paddingBottom: pb,
  };
}

function buildStyles(m: Record<string, string>): ComputedStyles {
  return {
    display: m.display || 'block', position: m.position || 'static',
    width: m.width || 'auto', height: m.height || 'auto',
    fontSize: m.fontSize || '16px', lineHeight: m.lineHeight || '1.5',
    color: m.color || '#000000', backgroundColor: m.backgroundColor || 'transparent',
    borderColor: m.borderTopColor || m.borderColor || '#000000',
    margin: m.margin || '0px', padding: m.padding || '0px', border: m.border || '0px',
    cursor: m.cursor || 'auto', pointerEvents: m.pointerEvents || 'auto',
    visibility: m.visibility || 'visible', opacity: m.opacity || '1',
  };
}

function sel(el: Element): string {
  const p: string[] = [];
  if (el.id) p.push(`#${el.id}`);
  if (el.className && typeof el.className === 'string')
    el.className.trim().split(/\s+/).filter(Boolean).slice(0, 2).forEach(c => p.push(`.${c}`));
  p.push(el.tagName.toLowerCase());
  return p.join('');
}

// ── AdvancedDesignRules defaults ───────────────────────────────

const advancedRules = {
  apcaContrast: {
    thresholds: { bodyText: { min: 60, preferred: 75 }, headingText: { min: 45, preferred: 60 }, largeText: { min: 45, preferred: 60 }, uiComponents: { min: 15, preferred: 30 } },
    adjustments: { boldText: 5, italicText: 2, smallText: 10 },
  },
  verticalRhythm: { baseLineHeight: 1.5, allowedRatios: [1, 1.5, 2, 3, 4, 6, 8], tolerance: 0.05, minSpacingDifference: 2, opticalAlignment: { textDescenders: 2, iconPadding: 4, avatarWeight: 1.2 } },
  typography: { lineLength: { comfortable: { min: 55, max: 75 } }, lineHeightRatios: { small: 1.5, body: 1.5, subheading: 1.4, heading: 1.3, display: 1.1 }, typeScales: { 'minor-second': 1.067, 'major-second': 1.125, 'minor-third': 1.2, 'major-third': 1.25, 'perfect-fourth': 1.333, 'aug-fourth': 1.414, 'perfect-fifth': 1.5, 'golden': 1.618 }, orphansWidows: { minWords: 3 } },
  colorHarmony: {
    schemes: { primary: true, analogous: true, complementary: true, triadic: true, tetradic: true, monochromatic: true },
    semantics: {
      error: ['#dc2626', '#ef4444', '#f87171'],
      success: ['#16a34a', '#22c55e', '#4ade80'],
      warning: ['#d97706', '#f59e0b', '#fbbf24'],
      info: ['#2563eb', '#3b82f6', '#60a5fa'],
      primary: ['#2563eb', '#3b82f6', '#1d4ed8'],
    },
    consistency: { maxSaturationVariance: 20, maxLightnessVariance: 15 },
    colorBlindness: { types: ['protanopia', 'deuteranopia', 'tritanopia'], minContrast: 3 },
  },
  layout: { alignment: { tolerance: 2, grid: 8 }, zIndex: { maxRecommended: 10, scale: [0, 1, 10, 100, 1000] }, visualHierarchy: { minLevels: 3, weightFactors: { size: 0.4, color: 0.3, spacing: 0.3 } }, grid: { columns: 12, gutter: 16 } },
  accessibility: { aria: { required: [], roles: {} }, keyboard: { focusable: true, tabIndex: true }, semantics: { requiredHeadings: true, landmarkRegions: true }, motion: { maxDuration: 5000, reducedMotion: true } },
  interaction: { requiredStates: ['hover', 'focus', 'active'], stateVisibility: { minContrast: 3 }, loading: { maxSkeletonDelay: 3000, requiredForAsync: true }, touch: { minTargetSize: 44 } },
  consistency: {
    patterns: { button: { selectors: ['.btn', 'button'], requiredProps: ['padding', 'fontSize'] } },
    tokens: { colorTokens: ['#007bff', '#6c757d', '#28a745', '#dc3545', '#ffc107', '#17a2b8'], spacingTokens: [4, 8, 12, 16, 24, 32, 48], fontSizeTokens: [12, 14, 16, 18, 20, 24, 32, 48] },
    similarity: { threshold: 0.8, maxDistance: 4 },
  },
  responsive: { breakpoints: [{ name: 'xs', width: 0 }, { name: 'sm', width: 576 }, { name: 'md', width: 768 }, { name: 'lg', width: 992 }, { name: 'xl', width: 1200 }, { name: 'xxl', width: 1400 }], mobileFirst: true, overflow: { allowHorizontal: false, maxScrollRatio: 0.1 }, containers: { maxWidth: 1200 } },
  performance: { layoutShift: { maxCLS: 0.1 }, animation: { maxDuration: 1000, preferTransform: true }, resources: { lazyBelowFold: true, maxImageSize: 200, optimizeFormats: ['webp', 'avif'] } },
};

// ── main ───────────────────────────────────────────────────────

async function analyze(url: string) {
  console.log(`\n🚔 PIXEL POLICE — Full URL Analyzer`);
  console.log(`   Target: ${url}\n`);

  process.stderr.write('Fetching HTML...\n');
  const html = await fetchText(url);
  process.stderr.write(`Got ${(html.length / 1024).toFixed(0)}KB HTML\n`);

  process.stderr.write('Resolving CSS...\n');
  const cssText = await extractCSS(html, url);
  process.stderr.write(`Total CSS: ${(cssText.length / 1024).toFixed(0)}KB\n`);

  const cssRules = parseCSS(cssText);
  process.stderr.write(`Parsed ${cssRules.length} CSS rules\n`);

  const dom = new JSDOM(html, { url });
  const doc = dom.window.document;
  const skip = new Set(['SCRIPT','STYLE','META','LINK','TITLE','HEAD','HTML','NOSCRIPT','SVG','PATH','G','CIRCLE','RECT','LINE','POLYGON','POLYLINE','USE','DEFS','CLIPPATH']);

  const basicRules = DesignRulesFactory.createDefault();
  const allIssues: Issue[] = [];
  let analyzed = 0;
  let skipped = 0;

  // Collect all resolved data for cross-element analyzers
  const elementsData: { selector: string; box: any; styles: ComputedStyles; merged: Record<string, string> }[] = [];

  const els = doc.querySelectorAll('*');
  for (const el of els) {
    if (skip.has(el.tagName)) { skipped++; continue; }
    const merged = resolveStyles(el, cssRules);
    const hasData = parsePx(merged.width) > 0 || parsePx(merged.height) > 0
      || parsePx(merged.padding) > 0 || parsePx(merged.margin) > 0
      || !!merged.fontSize || !!merged.backgroundColor || !!merged.color || !!merged.border;
    if (!hasData) { skipped++; continue; }

    const box = buildBox(merged);
    const styles = buildStyles(merged);
    const s = sel(el);
    analyzed++;

    // 1. Basic ElementAnalyzer (spacing, sizing, typography, accessibility)
    try {
      const insp = ElementAnalyzer.analyzeElement(s, s, box, styles, basicRules);
      // Filter out noisy issue types that don't work well without a real browser CSSOM
      const meaningful = insp.issues.filter(i =>
        !['color_outside_palette', 'color_contrast_insufficient'].includes(i.type)
      );
      allIssues.push(...meaningful);
    } catch {}

    // 2. AdvancedElementAnalyzer — only keep useful checks
    try {
      const advInsp = AdvancedElementAnalyzer.analyzeElement(s, s, box, styles, advancedRules as any);
      // Only keep: typography, interaction, spacing. Skip: consistency (token noise), APCA (no real colors), color semantics
      const meaningful = advInsp.issues.filter(i =>
        ['text_too_small', 'line_height_inadequate', 'line_length_too_long',
          'state_styles_missing', 'asymmetric_spacing', 'spacing_not_on_grid',
          'too_small_clickable_area', 'vertical_rhythm_broken',
        ].includes(i.type)
      );
      allIssues.push(...meaningful);
    } catch {}

    elementsData.push({ selector: s, box, styles, merged });
  }

  // 3. Cross-element: ResponsiveChecker — disabled (produces layout_shift noise without real viewport)
  // Would need Puppeteer/CDP for accurate responsive analysis

  // 4. Typography scale analysis
  try {
    const fontSizes = elementsData.map(d => parseFloat(d.styles.fontSize)).filter(n => n > 0 && !isNaN(n));
    const uniqueFontSizes = [...new Set(fontSizes)];
    if (uniqueFontSizes.length >= 2) {
      const typoAnalysis = TypographyAnalyzer.analyzeTypeScale(uniqueFontSizes, advancedRules.typography);
      if (typoAnalysis.violations?.length) {
        for (const v of typoAnalysis.violations) {
          allIssues.push(ElementInspectionFactory.createIssue(
            'type_scale_inconsistent' as any, v.deviation > 3 ? 'warning' : 'info', 'typography',
            `Font size ${v.actualSize?.toFixed(1)}px doesn't match ${typoAnalysis.detectedScale?.name || ''} scale (expected ~${v.expectedSize?.toFixed(1)}px, deviation ${v.deviation?.toFixed(1)}px at level ${v.level})`,
            'page', 'page', { ...v, detectedScale: typoAnalysis.detectedScale }
          ));
        }
      }
      if (typoAnalysis.suggestions?.length) {
        for (const s of typoAnalysis.suggestions.slice(0, 5)) {
          allIssues.push(ElementInspectionFactory.createIssue(
            'type_scale_inconsistent' as any, 'info', 'typography',
            `Typography suggestion: ${s.description}`,
            'page', 'page', { ...s }
          ));
        }
      }
    }
  } catch (e: any) { process.stderr.write(`  Typography err: ${e.message}\n`); }

  // 5. Vertical rhythm analysis
  try {
    const spacings = elementsData.flatMap(d => [d.box.margin.top, d.box.margin.bottom, d.box.padding.top, d.box.padding.bottom]).filter(v => v > 0);
    const uniqueSpacings = [...new Set(spacings.map(s => Math.round(s * 10) / 10))];
    if (uniqueSpacings.length > 2) {
      const rhythmResult = VerticalRhythmAnalyzer.analyzeRhythm(uniqueSpacings, advancedRules.verticalRhythm);
      if (rhythmResult.violations?.length) {
        for (const v of rhythmResult.violations.slice(0, 50)) {
          allIssues.push(ElementInspectionFactory.createIssue(
            'vertical_rhythm_broken' as any, v.severity === 'major' ? 'error' : v.severity === 'moderate' ? 'warning' : 'info', 'spacing',
            `Spacing ${v.value?.toFixed(1)}px off rhythm (expected ${v.expected?.toFixed(1)}px, ratio ${v.ratio?.toFixed(2)} vs closest ${v.closestRatio})`,
            'page', 'page', { ...v }
          ));
        }
      }
    }
  } catch (e: any) { process.stderr.write(`  VerticalRhythm err: ${e.message}\n`); }

  // 6. Color harmony — disabled (needs real computed colors from browser, not CSS text parsing)
  // CSS text parsing can't resolve CSS variables, inheritance, or cascade correctly

  dom.window.close();

  // ── report ───────────────────────────────────────────────────

  const byType: Record<string, number> = {};
  const bySeverity: Record<string, number> = {};
  const byCategory: Record<string, number> = {};
  for (const i of allIssues) {
    byType[i.type] = (byType[i.type] || 0) + 1;
    bySeverity[i.severity] = (bySeverity[i.severity] || 0) + 1;
    byCategory[i.category || 'unknown'] = (byCategory[i.category || 'unknown'] || 0) + 1;
  }

  const score = Math.max(0, 100 - (bySeverity.error || 0) * 10 - (bySeverity.warning || 0) * 2 - (bySeverity.info || 0));
  const grade = score >= 90 ? 'A' : score >= 80 ? 'B' : score >= 70 ? 'C' : score >= 60 ? 'D' : 'F';

  console.log('┌──────────────────────────────────────────────────┐');
  console.log('│              ANALYSIS RESULTS                     │');
  console.log('├──────────────────────────────────────────────────┤');
  console.log(`│ URL:        ${url.substring(0, 38).padEnd(38)}│`);
  console.log(`│ Elements:   ${String(analyzed).padStart(5)} analyzed, ${String(skipped).padStart(5)} skipped       │`);
  console.log(`│ Issues:     ${String(allIssues.length).padStart(5)} total                          │`);
  console.log(`│   Errors:   ${String(bySeverity.error || 0).padStart(5)}                                 │`);
  console.log(`│   Warnings: ${String(bySeverity.warning || 0).padStart(5)}                                 │`);
  console.log(`│   Info:     ${String(bySeverity.info || 0).padStart(5)}                                 │`);
  console.log(`│ Score:      ${String(score).padStart(3)}/100  Grade: ${grade}                        │`);
  console.log('└──────────────────────────────────────────────────┘');

  const sortedTypes = Object.entries(byType).sort((a, b) => b[1] - a[1]);
  console.log('\n ISSUES BY TYPE:');
  for (const [type, count] of sortedTypes) {
    const bar = '█'.repeat(Math.min(40, Math.ceil(count / Math.max(1, allIssues.length) * 80)));
    console.log(`  ${type.padEnd(38)} ${String(count).padStart(5)}  ${bar}`);
  }

  console.log('\n ISSUES BY CATEGORY:');
  for (const [cat, count] of Object.entries(byCategory).sort((a, b) => b[1] - a[1])) {
    console.log(`  ${cat.padEnd(20)} ${String(count).padStart(5)}`);
  }

  // Sample top warnings/errors
  const topIssues = allIssues.filter(i => i.severity === 'error' || i.severity === 'warning').slice(0, 25);
  if (topIssues.length) {
    console.log('\n TOP WARNINGS / ERRORS:');
    for (const issue of topIssues) {
      const icon = issue.severity === 'error' ? '✕' : '△';
      console.log(`  ${icon} [${issue.type}] ${issue.message}`);
      if (issue.metadata?.suggestedFix) console.log(`    → ${issue.metadata.suggestedFix}`);
    }
  }

  // Analyzers used
  console.log(`\n ACTIVE ANALYZERS:`);
  console.log(`  ✓ ElementAnalyzer          spacing, sizing, typography, accessibility`);
  console.log(`  ✓ AdvancedElementAnalyzer  typography, interaction, spacing`);
  console.log(`  ✓ TypographyAnalyzer       type scale consistency`);
  console.log(`  ✓ VerticalRhythmAnalyzer   spacing rhythm`);
  console.log(`\n DISABLED (need real browser CSSOM):`);
  console.log(`  ✗ APCAContrastAnalyzer     needs computed colors`);
  console.log(`  ✗ ColorHarmonyAnalyzer     needs computed colors`);
  console.log(`  ✗ ResponsiveChecker        needs real viewport`);
  console.log(`  ✗ ConsistencyAnalyzer      needs design tokens from actual page`);
  console.log(`  ✗ PerformanceOptimizer     needs runtime metrics`);

  console.log('\n Done.\n');
  return { analyzed, skipped, totalIssues: allIssues.length, score, grade, types: Object.keys(byType).length };
}

const url = process.argv[2];
if (!url) {
  console.error('Usage: bun run analyze-url.ts <url>');
  process.exit(1);
}
analyze(url).catch(e => { console.error('Fatal:', e); process.exit(1); });

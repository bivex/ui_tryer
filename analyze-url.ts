/**
 * Pixel Police — URL Analyzer
 *
 * Fetches a real webpage, resolves all CSS (inline + external),
 * parses the DOM, and runs every domain analyzer on each element.
 *
 * Usage:
 *   bun run analyze-url.ts <url>
 *   bun run analyze-url.ts https://bootswatch.com/cosmo/
 */

import { JSDOM } from 'jsdom';
import { ElementAnalyzer } from './src/domain/services/ElementAnalyzer';
import { DesignRulesFactory } from './src/domain/entities/DesignRules';
import { ComputedStyles } from './src/domain/entities/ElementInspection';
import http from 'http';
import https from 'https';
import { URL } from 'url';

// ── fetch helpers ──────────────────────────────────────────────

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

  const cssParts: string[] = [];

  // Inline <style> blocks
  doc.querySelectorAll('style').forEach(el => {
    cssParts.push(el.textContent || '');
  });

  // External <link rel="stylesheet">
  const links = [...doc.querySelectorAll('link[rel="stylesheet"]')];
  for (const link of links) {
    const href = link.getAttribute('href');
    if (!href) continue;
    const fullUrl = resolveUrl(href, pageUrl);
    if (!fullUrl) continue;
    try {
      const css = await fetchText(fullUrl);
      cssParts.push(css);
      process.stderr.write(`  fetched ${fullUrl.substring(0, 80)}... (${(css.length / 1024).toFixed(0)}KB)\n`);
    } catch (e: any) {
      process.stderr.write(`  skip ${fullUrl}: ${e.message}\n`);
    }
  }

  dom.window.close();
  return cssParts.join('\n');
}

// ── CSS rule parser (minimal but handles most selectors) ───────

interface CSSRule {
  selector: string;
  props: Record<string, string>;
}

function parseCSS(css: string): CSSRule[] {
  css = css.replace(/\/\*[\s\S]*?\*\//g, '');
  // Remove @media / @keyframes blocks for simplicity
  css = css.replace(/@media[^{]*\{[\s\S]*?\}\s*\}/g, '');
  css = css.replace(/@keyframes[\s\S]*?\}\s*\}/g, '');
  css = css.replace(/@font-face[\s\S]*?\}\s*\}/g, '');
  css = css.replace(/@-\w+[\s\S]*?\}\s*\}/g, '');

  const rules: CSSRule[] = [];
  const re = /([^{]+)\{([^}]+)\}/g;
  let m;
  while ((m = re.exec(css))) {
    const selectors = m[1].trim().split(',').map(s => s.trim()).filter(Boolean);
    const props: Record<string, string> = {};
    m[2].split(';').forEach(decl => {
      const colon = decl.indexOf(':');
      if (colon === -1) return;
      const prop = decl.substring(0, colon).trim();
      const val = decl.substring(colon + 1).trim();
      if (prop && val) props[prop] = val;
    });
    if (Object.keys(props).length === 0) continue;
    for (const sel of selectors) {
      rules.push({ selector: sel, props });
    }
  }
  return rules;
}

// ── style resolution ───────────────────────────────────────────

function parsePx(v: string | undefined, baseFontSize = 16): number {
  if (!v) return 0;
  v = v.trim();
  if (v.endsWith('rem')) {
    return parseFloat(v) * baseFontSize;
  }
  if (v.endsWith('em') && !v.endsWith('rem')) {
    return parseFloat(v) * baseFontSize;
  }
  if (v.endsWith('px')) {
    return parseFloat(v);
  }
  if (v.endsWith('pt')) {
    return parseFloat(v) * (4 / 3);
  }
  const n = parseFloat(v);
  return isNaN(n) ? 0 : n;
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
  const classes = (el.className && typeof el.className === 'string')
    ? el.className.trim().split(/\s+/).filter(Boolean) : [];
  const id = el.id;

  const s = sel.trim();

  // Universal
  if (s === '*') return true;
  // ID
  if (s.startsWith('#') && !s.includes(' ') && !s.includes('.')) return id === s.slice(1);
  // Tag
  if (/^[a-z][a-z0-9]*$/i.test(s)) return s === tag;
  // .class
  if (s.startsWith('.') && !s.includes(' ') && !s.includes(':') && !s.includes('>') && !s.includes('+') && !s.includes('~')) {
    return s.split('.').filter(Boolean).every(c => classes.includes(c));
  }
  // tag.class
  if (/^[a-z][a-z0-9]*\.[a-z]/i.test(s)) {
    const [t, ...rest] = s.split('.');
    return t === tag && rest.filter(Boolean).every(c => classes.includes(c));
  }
  // #id.class
  if (s.startsWith('#') && s.includes('.')) {
    const [idPart, ...rest] = s.split('.');
    if (id !== idPart.slice(1)) return false;
    return rest.filter(Boolean).every(c => classes.includes(c));
  }
  // Descendant: "A B" — check if last part matches
  if (s.includes(' ')) {
    const parts = s.split(/\s+/);
    const last = parts[parts.length - 1];
    return matchesSelector(last, el);
  }
  // Child: "A > B"
  if (s.includes('>')) {
    const parts = s.split('>').map(p => p.trim());
    const last = parts[parts.length - 1];
    return matchesSelector(last, el);
  }
  // Pseudo-class/element: strip and retry
  if (s.includes(':')) {
    const base = s.split(':')[0];
    return matchesSelector(base, el);
  }
  // Attribute selectors: strip and retry
  if (s.includes('[')) {
    const base = s.split('[')[0];
    return matchesSelector(base, el);
  }

  return false;
}

function resolveStyles(el: Element, cssRules: CSSRule[]): Record<string, string> {
  const merged: Record<string, string> = {};

  // Apply rules in order (last wins — simple cascade approximation)
  for (const rule of cssRules) {
    if (matchesSelector(rule.selector, el)) {
      Object.assign(merged, rule.props);
    }
  }

  // Inline styles override everything
  const styleAttr = el.getAttribute('style');
  if (styleAttr) {
    styleAttr.split(';').forEach(decl => {
      const colon = decl.indexOf(':');
      if (colon === -1) return;
      const prop = decl.substring(0, colon).trim();
      const val = decl.substring(colon + 1).trim();
      if (prop && val) merged[prop] = val;
    });
  }

  return merged;
}

function buildBox(merged: Record<string, string>) {
  const padSides = expandSides(merged.padding);
  const marSides = expandSides(merged.margin);
  const pt = merged.paddingTop ? parsePx(merged.paddingTop) : padSides.top;
  const pr = merged.paddingRight ? parsePx(merged.paddingRight) : padSides.right;
  const pb = merged.paddingBottom ? parsePx(merged.paddingBottom) : padSides.bottom;
  const pl = merged.paddingLeft ? parsePx(merged.paddingLeft) : padSides.left;
  const mt = merged.marginTop ? parsePx(merged.marginTop) : marSides.top;
  const mr = merged.marginRight ? parsePx(merged.marginRight) : marSides.right;
  const mb = merged.marginBottom ? parsePx(merged.marginBottom) : marSides.bottom;
  const ml = merged.marginLeft ? parsePx(merged.marginLeft) : marSides.left;
  const w = parsePx(merged.width);
  const h = parsePx(merged.height);

  return {
    content: { width: Math.max(0, w - pl - pr), height: Math.max(0, h - pt - pb), x: 0, y: 0 },
    padding: { top: pt, right: pr, bottom: pb, left: pl },
    border: { top: 0, right: 0, bottom: 0, left: 0 },
    margin: { top: mt, right: mr, bottom: mb, left: ml },
    totalWidth: w + ml + mr,
    totalHeight: h + mt + mb,
    marginTop: mt, marginBottom: mb, paddingTop: pt, paddingBottom: pb,
  };
}

function buildStyles(merged: Record<string, string>): ComputedStyles {
  return {
    display: merged.display || 'block',
    position: merged.position || 'static',
    width: merged.width || 'auto',
    height: merged.height || 'auto',
    fontSize: merged.fontSize || '16px',
    lineHeight: merged.lineHeight || '1.5',
    color: merged.color || '#000000',
    backgroundColor: merged.backgroundColor || 'transparent',
    borderColor: merged.borderTopColor || merged.borderColor || '#000000',
    margin: merged.margin || '0px',
    padding: merged.padding || '0px',
    border: merged.border || '0px',
    cursor: merged.cursor || 'auto',
    pointerEvents: merged.pointerEvents || 'auto',
    visibility: merged.visibility || 'visible',
    opacity: merged.opacity || '1',
  };
}

function buildSelector(el: Element): string {
  const parts: string[] = [];
  if (el.id) parts.push(`#${el.id}`);
  if (el.className && typeof el.className === 'string') {
    el.className.trim().split(/\s+/).filter(Boolean).slice(0, 2).forEach(c => parts.push(`.${c}`));
  }
  parts.push(el.tagName.toLowerCase());
  return parts.join('');
}

// ── main analysis ──────────────────────────────────────────────

async function analyzeUrl(url: string) {
  console.log(`\n PIXEL POLICE  — URL Analyzer`);
  console.log(` Target: ${url}\n`);

  // 1. Fetch HTML
  process.stderr.write('Fetching HTML...\n');
  const html = await fetchText(url);
  process.stderr.write(`Got ${(html.length / 1024).toFixed(0)}KB HTML\n`);

  // 2. Extract CSS
  process.stderr.write('Resolving CSS...\n');
  const cssText = await extractCSS(html, url);
  process.stderr.write(`Total CSS: ${(cssText.length / 1024).toFixed(0)}KB\n`);

  // 3. Parse CSS rules
  const cssRules = parseCSS(cssText);
  process.stderr.write(`Parsed ${cssRules.length} CSS rules\n`);

  // 4. Parse DOM
  const dom = new JSDOM(html, { url });
  const doc = dom.window.document;
  const skip = new Set(['SCRIPT', 'STYLE', 'META', 'LINK', 'TITLE', 'HEAD', 'HTML', 'NOSCRIPT', 'SVG', 'PATH', 'G', 'CIRCLE', 'RECT', 'LINE', 'POLYGON', 'POLYLINE', 'USE', 'DEFS', 'CLIPPATH']);

  // 5. Analyze
  const rules = DesignRulesFactory.createDefault();
  const allResults: { selector: string; issues: any[] }[] = [];
  let analyzed = 0;
  let skipped = 0;

  const elements = doc.querySelectorAll('*');
  for (const el of elements) {
    if (skip.has(el.tagName)) { skipped++; continue; }

    try {
      const merged = resolveStyles(el, cssRules);

      // Skip elements with no meaningful resolved styles
      const hasSize = parsePx(merged.width) > 0 || parsePx(merged.height) > 0;
      const hasSpacing = parsePx(merged.padding) > 0 || parsePx(merged.margin) > 0
        || parsePx(merged.paddingTop) > 0 || parsePx(merged.marginTop) > 0;
      const hasTypography = !!merged.fontSize || !!merged.lineHeight;
      const hasVisual = !!merged.backgroundColor || !!merged.color || !!merged.border;

      if (!hasSize && !hasSpacing && !hasTypography && !hasVisual) { skipped++; continue; }

      const box = buildBox(merged);
      const styles = buildStyles(merged);
      const sel = buildSelector(el);

      const inspection = ElementAnalyzer.analyzeElement(sel, sel, box, styles, rules);
      analyzed++;

      if (inspection.issues.length > 0) {
        allResults.push({ selector: sel, issues: inspection.issues });
      }
    } catch {
      skipped++;
    }
  }

  dom.window.close();

  // 6. Report
  const allIssues = allResults.flatMap(r => r.issues);
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

  console.log('┌─────────────────────────────────────────────┐');
  console.log('│            ANALYSIS RESULTS                  │');
  console.log('├─────────────────────────────────────────────┤');
  console.log(`│ URL:           ${url.substring(0, 30).padEnd(30)}│`);
  console.log(`│ Elements:      ${String(analyzed).padStart(5)} analyzed, ${String(skipped).padStart(5)} skipped│`);
  console.log(`│ Issues:        ${String(allIssues.length).padStart(5)} total                        │`);
  console.log(`│   Errors:      ${String(bySeverity.error || 0).padStart(5)}                              │`);
  console.log(`│   Warnings:    ${String(bySeverity.warning || 0).padStart(5)}                              │`);
  console.log(`│   Info:        ${String(bySeverity.info || 0).padStart(5)}                              │`);
  console.log(`│ Score:         ${String(score).padStart(3)}/100  Grade: ${grade}                   │`);
  console.log('└─────────────────────────────────────────────┘');

  console.log('\n ISSUES BY TYPE:');
  const sortedTypes = Object.entries(byType).sort((a, b) => b[1] - a[1]);
  for (const [type, count] of sortedTypes) {
    const bar = '█'.repeat(Math.min(40, Math.ceil(count / Math.max(1, allIssues.length) * 40)));
    console.log(`  ${type.padEnd(35)} ${String(count).padStart(4)}  ${bar}`);
  }

  console.log('\n ISSUES BY CATEGORY:');
  for (const [cat, count] of Object.entries(byCategory).sort((a, b) => b[1] - a[1])) {
    console.log(`  ${cat.padEnd(20)} ${String(count).padStart(4)}`);
  }

  // Top offenders
  console.log('\n TOP OFFENDING ELEMENTS:');
  const topOffenders = [...allResults]
    .sort((a, b) => b.issues.length - a.issues.length)
    .slice(0, 15);
  for (const r of topOffenders) {
    const types = [...new Set(r.issues.map((i: any) => i.type))].join(', ');
    console.log(`  ${r.selector.padEnd(45)} ${String(r.issues.length).padStart(2)} issues — ${types}`);
  }

  console.log('\n TOP WARNINGS/ERRORS:');
  const errorWarnings = allIssues
    .filter(i => i.severity === 'error' || i.severity === 'warning')
    .slice(0, 20);
  for (const issue of errorWarnings) {
    const icon = issue.severity === 'error' ? '✕' : '△';
    console.log(`  ${icon} [${issue.type}] ${issue.message}`);
    if (issue.metadata?.suggestedFix) {
      console.log(`    → ${issue.metadata.suggestedFix}`);
    }
  }

  console.log('\n Done.\n');
  return { analyzed, skipped, totalIssues: allIssues.length, score, grade };
}

// ── run ────────────────────────────────────────────────────────

const url = process.argv[2];
if (!url) {
  console.error('Usage: bun run analyze-url.ts <url>');
  console.error('  bun run analyze-url.ts https://bootswatch.com/cosmo/');
  process.exit(1);
}

analyzeUrl(url).catch(e => {
  console.error('Fatal:', e.message);
  process.exit(1);
});

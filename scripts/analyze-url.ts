/**
 * Pixel Police — URL Analyzer (Direct UseCase Integration)
 *
 * This tool runs the actual extension UseCases in a Node.js environment
 * to provide analysis results identical to the Chrome extension.
 */

import { JSDOM } from 'jsdom';
import fs from 'fs';
import http from 'http';
import https from 'https';
import { URL } from 'url';

import { AdvancedInspectElementUseCase } from '../src/application/use-cases/AdvancedInspectElementUseCase';
import { DesignRulesFactory } from '../src/domain/entities/DesignRules';
import { ElementInspectionFactory, Issue } from '../src/domain/entities/ElementInspection';
import { VerticalRhythmAnalyzer } from '../src/domain/services/VerticalRhythmAnalyzer';
import { TypographyAnalyzer } from '../src/domain/services/TypographyAnalyzer';

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

function parsePx(v: string | undefined, baseFontSize: number = 16): number {
  if (!v) return 0;
  v = v.trim();
  if (v === '0') return 0;
  if (v.endsWith('rem')) return parseFloat(v) * baseFontSize;
  if (v.endsWith('em')) return parseFloat(v) * baseFontSize;
  if (v.endsWith('pt')) return parseFloat(v) * (4 / 3);
  if (v.endsWith('px')) return parseFloat(v);
  if (v === 'inherit' || v === 'initial' || v === 'unset') return 0;
  const n = parseFloat(v);
  if (!isNaN(n) && !v.match(/[a-z%]/i)) return n;
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
  const classes = el.getAttribute('class') || '';
  const cls = classes.trim().split(/\s+/).filter(Boolean);
  const id = el.id;
  const s = sel.trim().replace(/:hover|:focus|:active/g, '');
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
  const scoredRules = rules.map(r => {
    let score = 0;
    if (r.selector.includes('#')) score += 100;
    if (r.selector.includes('.')) score += 10;
    if (r.selector.match(/^[a-z]/i)) score += 1;
    return { ...r, score };
  }).sort((a, b) => a.score - b.score);

  const inheritedProps = ['color', 'font-family', 'font-size', 'line-height', 'text-align'];
  if (el.parentElement) {
    const parentStyles = (el.parentElement as any)._resolvedStyles || {};
    for (const p of inheritedProps) {
      const camel = p.replace(/-([a-z])/g, (_, c) => c.toUpperCase());
      if (parentStyles[camel]) m[camel] = parentStyles[camel];
    }
  }

  for (const r of scoredRules) {
    if (matchesSelector(r.selector, el)) {
      for (const [prop, val] of Object.entries(r.props)) {
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
  (el as any)._resolvedStyles = m;
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

function buildStyles(m: Record<string, string>): any {
  return {
    display: m.display || 'block', position: m.position || 'static',
    width: m.width || 'auto', height: m.height || 'auto',
    fontSize: m.fontSize || '16px', lineHeight: m.lineHeight || '1.5',
    fontFamily: m.fontFamily || 'sans-serif', fontWeight: m.fontWeight || '400',
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
  const classes = el.getAttribute('class');
  if (classes) {
    classes.trim().split(/\s+/).filter(Boolean).slice(0, 3).forEach(c => p.push(`.${c}`));
  }
  const tag = el.tagName.toLowerCase();
  return p.length === 0 ? tag : `${tag}${p.join('')}`;
}

const advancedRules = {
  apcaContrast: { thresholds: { bodyText: { min: 60, preferred: 75 }, headingText: { min: 45, preferred: 60 }, largeText: { min: 45, preferred: 60 }, uiComponents: { min: 15, preferred: 30 } }, adjustments: { boldText: 5, italicText: 2, smallText: 10 } },
  verticalRhythm: { baseLineHeight: 1.5, allowedRatios: [1, 1.5, 2, 3, 4, 6, 8], tolerance: 0.05, minSpacingDifference: 2, opticalAlignment: { textDescenders: 2, iconPadding: 4, avatarWeight: 1.2 } },
  typography: { lineLength: { comfortable: { min: 55, max: 75 } }, lineHeightRatios: { small: 1.5, body: 1.5, subheading: 1.4, heading: 1.3, display: 1.1 }, typeScales: { 'minor-second': 1.067, 'major-second': 1.125, 'minor-third': 1.2, 'major-third': 1.25, 'perfect-fourth': 1.333, 'aug-fourth': 1.414, 'perfect-fifth': 1.5, 'golden': 1.618 }, orphansWidows: { minWords: 3 } },
  colorHarmony: { schemes: { primary: true }, semantics: { error: ['#dc2626'], success: ['#16a34a'] }, consistency: { maxSaturationVariance: 20 }, colorBlindness: { types: ['protanopia'], minContrast: 3 } },
  layout: { alignment: { tolerance: 2, grid: 8 }, zIndex: { maxRecommended: 10 }, visualHierarchy: { minLevels: 3 }, grid: { columns: 12, gutter: 16 } },
  accessibility: { aria: { required: [], roles: {} }, keyboard: { focusable: true }, semantics: { requiredHeadings: true }, motion: { maxDuration: 5000 } },
  interaction: { requiredStates: ['hover', 'focus'], stateVisibility: { minContrast: 3 }, touch: { minTargetSize: 44 } },
  consistency: { patterns: { button: { selectors: ['.btn'], requiredProps: ['padding'] } }, tokens: { colorTokens: [], spacingTokens: [8, 16], fontSizeTokens: [16] }, similarity: { threshold: 0.8 } },
  responsive: { breakpoints: [{ name: 'md', width: 768 }], mobileFirst: true, containers: { maxWidth: 1200 } },
  performance: { layoutShift: { maxCLS: 0.1 }, animation: { maxDuration: 1000 }, resources: { lazyBelowFold: true } },
};

// ── main ───────────────────────────────────────────────────────

async function analyze(url: string) {
  console.log(`\n🚔 PIXEL POLICE — UseCase-Powered Analyzer`);
  console.log(`   Target: ${url}\n`);

  const html = await fetchText(url);
  const cssText = await extractCSS(html, url);
  const cssRules = parseCSS(cssText);

  const dom = new JSDOM(html, { url });
  const doc = dom.window.document;
  const skip = new Set(['SCRIPT','STYLE','META','LINK','TITLE','HEAD','HTML','NOSCRIPT','SVG']);

  const inspectUseCase = new AdvancedInspectElementUseCase();
  const allIssues: Issue[] = [];
  let analyzedCount = 0;
  let skippedCount = 0;

  const els = doc.querySelectorAll('*');
  for (const el of els) {
    if (skip.has(el.tagName)) { skippedCount++; continue; }
    const merged = resolveStyles(el, cssRules);
    const hasData = parsePx(merged.width) > 0 || parsePx(merged.height) > 0 || parsePx(merged.padding) > 0 || !!merged.fontSize;
    if (!hasData) { skippedCount++; continue; }

    const box = buildBox(merged);
    const styles = buildStyles(merged);
    const s = sel(el);
    analyzedCount++;

    const contextData = {
      viewport: { width: 1920, height: 1080, devicePixelRatio: 1 },
      parent: el.parentElement ? {
        display: (el.parentElement as any)._resolvedStyles?.display || 'block',
        width: parsePx((el.parentElement as any)._resolvedStyles?.width),
        height: parsePx((el.parentElement as any)._resolvedStyles?.height),
      } : undefined,
      siblings: {
        count: el.parentElement ? el.parentElement.children.length - 1 : 0,
        similarElements: el.parentElement ? Array.from(el.parentElement.children).filter(c => c.tagName === el.tagName).length - 1 : 0
      },
      page: { hasNavigation: !!doc.querySelector('nav'), hasFooter: !!doc.querySelector('footer') },
      interaction: {
        isHoverable: ['A', 'BUTTON'].includes(el.tagName),
        isFocusable: ['A', 'BUTTON'].includes(el.tagName),
        hasClickHandler: true
      }
    };

    try {
      const result = await inspectUseCase.execute({
        elementId: `el_${analyzedCount}`,
        selector: s,
        boxModel: box as any,
        computedStyles: styles as any,
        rules: advancedRules as any,
        contextData: contextData as any
      });
      allIssues.push(...result.inspection.issues);
    } catch (e: any) {
      process.stderr.write(`  Err ${s}: ${e.message}\n`);
    }
  }

  const bySeverity: Record<string, number> = {};
  const byCategory: Record<string, number> = {};
  for (const i of allIssues) {
    bySeverity[i.severity] = (bySeverity[i.severity] || 0) + 1;
    byCategory[i.category] = (byCategory[i.category] || 0) + 1;
  }

  const score = Math.max(0, 100 - (bySeverity.error || 0) * 10 - (bySeverity.warning || 0) * 2);
  const grade = score >= 90 ? 'A' : score >= 80 ? 'B' : score >= 70 ? 'C' : 'F';

  console.log('┌──────────────────────────────────────────────────┐');
  console.log(`│ Score: ${String(score).padStart(3)}/100  Grade: ${grade}  Issues: ${allIssues.length} │`);
  console.log('└──────────────────────────────────────────────────┘');

  const reportDir = './reports';
  if (!fs.existsSync(reportDir)) fs.mkdirSync(reportDir);
  const reportPath = `${reportDir}/report_${Date.now()}.md`;
  let md = `# Report: ${url}\nScore: ${score} (${grade})\n\n`;
  for (const [cat, count] of Object.entries(byCategory)) md += `- ${cat}: ${count}\n`;
  fs.writeFileSync(reportPath, md);
  console.log(`📄 Saved to: ${reportPath}\n`);
  dom.window.close();
}

const target = process.argv[2];
if (!target) { console.error('Usage: tsx scripts/analyze-url.ts <url>'); process.exit(1); }
analyze(target).catch(e => { console.error(e); process.exit(1); });

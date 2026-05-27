/**
 * Integration test: runs Pixel Police analyzers against real HTML pages.
 *
 * Part 1: CSS parsing + DOM analysis against real HTML files.
 * Part 2: Constructed scenarios that test clickable size, typography,
 *         and color checks directly (since our mini CSS parser can't
 *         resolve all selector types the way a browser CSSOM would).
 */

import { ElementAnalyzer } from '../src/domain/services/ElementAnalyzer';
import { DesignRulesFactory } from '../src/domain/entities/DesignRules';
import { ComputedStyles } from '../src/domain/entities/ElementInspection';
import fs from 'fs';
import path from 'path';

// ---- Mini CSS parser for extracting styles from <style> blocks ----

function parseStylesheet(css: string): Map<string, Record<string, string>> {
  const rules = new Map<string, Record<string, string>>();
  css = css.replace(/\/\*[\s\S]*?\*\//g, '');
  const re = /([^{]+)\{([^}]+)\}/g;
  let m;
  while ((m = re.exec(css))) {
    const selectors = m[1].trim().split(',').map(s => s.trim());
    const props: Record<string, string> = {};
    m[2].split(';').forEach(decl => {
      const [prop, ...rest] = decl.split(':');
      if (prop && rest.length) props[prop.trim()] = rest.join(':').trim();
    });
    selectors.forEach(sel => {
      const existing = rules.get(sel) || {};
      rules.set(sel, { ...existing, ...props });
    });
  }
  return rules;
}

function parsePx(val: string | undefined): number {
  if (!val) return 0;
  const n = parseFloat(val);
  return isNaN(n) ? 0 : n;
}

function expandSides(val: string | undefined): { top: number; right: number; bottom: number; left: number } {
  if (!val || val === 'auto' || val === 'none' || val === '0') return { top: 0, right: 0, bottom: 0, left: 0 };
  const parts = val.trim().split(/\s+/).map(parsePx);
  switch (parts.length) {
    case 1: return { top: parts[0], right: parts[0], bottom: parts[0], left: parts[0] };
    case 2: return { top: parts[0], right: parts[1], bottom: parts[0], left: parts[1] };
    case 3: return { top: parts[0], right: parts[1], bottom: parts[2], left: parts[1] };
    case 4: return { top: parts[0], right: parts[1], bottom: parts[2], left: parts[3] };
    default: return { top: 0, right: 0, bottom: 0, left: 0 };
  }
}

function resolveColor(val: string | undefined): string {
  if (!val) return '';
  if (/^#[0-9a-f]{3}$/i.test(val)) {
    return `#${val[1]}${val[1]}${val[2]}${val[2]}${val[3]}${val[3]}`;
  }
  return val;
}

function buildBoxAndStyles(
  el: Element,
  classStyles: Map<string, Record<string, string>>,
  inlineStyles: Record<string, string>
) {
  const merged: Record<string, string> = {};
  const tag = el.tagName.toLowerCase();
  const classes = (el.className && typeof el.className === 'string')
    ? el.className.trim().split(/\s+/).filter(Boolean) : [];

  classStyles.forEach((props, selector) => {
    const sel = selector.trim();
    if (sel === '*') { Object.assign(merged, props); return; }
    if (sel === tag) { Object.assign(merged, props); return; }
    // Single class
    if (sel.startsWith('.') && !sel.includes(' ') && !sel.includes('>') && !sel.includes(':')) {
      const required = sel.split('.').filter(Boolean);
      if (required.every(c => classes.includes(c))) { Object.assign(merged, props); return; }
    }
    // Descendant: ".parent tag" or ".parent .child"
    if (sel.includes(' ')) {
      const parts = sel.split(/\s+/);
      const last = parts[parts.length - 1];
      if (last.startsWith('.') && classes.includes(last.slice(1))) { Object.assign(merged, props); return; }
      if (last === tag) { Object.assign(merged, props); return; }
    }
    // tag.class
    if (sel.includes(tag) && sel.includes('.')) {
      const cls = sel.replace(tag, '').split('.').filter(Boolean);
      if (cls.every(c => classes.includes(c))) { Object.assign(merged, props); return; }
    }
  });

  Object.assign(merged, inlineStyles);

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

  const box = {
    content: { width: Math.max(0, w - pl - pr), height: Math.max(0, h - pt - pb), x: 0, y: 0 },
    padding: { top: pt, right: pr, bottom: pb, left: pl },
    border: { top: 0, right: 0, bottom: 0, left: 0 },
    margin: { top: mt, right: mr, bottom: mb, left: ml },
    totalWidth: w + ml + mr,
    totalHeight: h + mt + mb,
    marginTop: mt, marginBottom: mb, paddingTop: pt, paddingBottom: pb,
  };

  const styles: ComputedStyles = {
    display: merged.display || 'block',
    position: merged.position || 'static',
    width: merged.width || 'auto',
    height: merged.height || 'auto',
    fontSize: merged.fontSize || '16px',
    lineHeight: merged.lineHeight || '1.5',
    color: resolveColor(merged.color) || '#000000',
    backgroundColor: resolveColor(merged.backgroundColor) || 'transparent',
    borderColor: resolveColor(merged.borderColor) || '#000000',
    margin: merged.margin || '0px',
    padding: merged.padding || '0px',
    border: merged.border || '0px',
    cursor: merged.cursor || 'auto',
    pointerEvents: merged.pointerEvents || 'auto',
    visibility: merged.visibility || 'visible',
    opacity: merged.opacity || '1',
  };

  return { box, styles };
}

function sel(el: Element): string {
  const p: string[] = [];
  if (el.id) p.push(`#${el.id}`);
  if (el.className && typeof el.className === 'string') {
    el.className.trim().split(/\s+/).filter(Boolean).forEach(c => p.push(`.${c}`));
  }
  p.push(el.tagName.toLowerCase());
  return p.join('');
}

function analyzeHTML(html: string) {
  document.open();
  document.write(html);
  document.close();

  const classStyles = new Map<string, Record<string, string>>();
  document.querySelectorAll('style').forEach(s => {
    parseStylesheet(s.textContent || '').forEach((props, selector) => classStyles.set(selector, props));
  });

  const rules = DesignRulesFactory.createDefault();
  const skip = new Set(['SCRIPT', 'STYLE', 'META', 'LINK', 'TITLE', 'HEAD', 'HTML']);
  const results: { selector: string; issues: any[] }[] = [];

  document.querySelectorAll('*').forEach(el => {
    if (skip.has(el.tagName)) return;
    const inline: Record<string, string> = {};
    const styleAttr = el.getAttribute('style');
    if (styleAttr) {
      styleAttr.split(';').forEach(decl => {
        const [prop, ...rest] = decl.split(':');
        if (prop && rest.length) inline[prop.trim()] = rest.join(':').trim();
      });
    }
    try {
      const { box, styles } = buildBoxAndStyles(el, classStyles, inline);
      const s = sel(el);
      const inspection = ElementAnalyzer.analyzeElement(s, s, box, styles, rules);
      if (inspection.issues.length > 0) {
        results.push({ selector: s, issues: inspection.issues });
      }
    } catch {}
  });
  return results;
}

// ============================================================
// Part 1: test-bad-design.html (parsed from real file)
// ============================================================

const badHTML = fs.readFileSync(path.resolve(__dirname, '../test-bad-design.html'), 'utf8');

describe('Real HTML: test-bad-design.html', () => {
  const results = analyzeHTML(badHTML);
  const allIssues = results.flatMap(r => r.issues);

  it('finds issues on the page', () => {
    expect(results.length).toBeGreaterThan(0);
    expect(allIssues.length).toBeGreaterThan(10);
  });

  it('detects off-grid spacing (7px, 13px, 9px, etc.)', () => {
    const spacing = allIssues.filter(i => i.type === 'spacing_not_on_grid');
    expect(spacing.length).toBeGreaterThan(5);
  });

  it('detects asymmetric spacing', () => {
    const asym = allIssues.filter(i => i.type === 'asymmetric_spacing');
    expect(asym.length).toBeGreaterThan(0);
  });

  it('flags elements with multiple issues', () => {
    const multi = results.filter(r => r.issues.length >= 2);
    expect(multi.length).toBeGreaterThan(0);
  });

  it('has valid severities on all issues', () => {
    for (const issue of allIssues) {
      expect(['error', 'warning', 'info']).toContain(issue.severity);
    }
  });
});

// ============================================================
// Part 2: Constructed scenarios for checks that need full CSSOM
// ============================================================

const rules = DesignRulesFactory.createDefault();

function makeBox(w: number, h: number, mt = 0, mr = 0, mb = 0, ml = 0, pt = 0, pr = 0, pb = 0, pl = 0) {
  return {
    content: { width: w - pl - pr, height: h - pt - pb, x: 0, y: 0 },
    padding: { top: pt, right: pr, bottom: pb, left: pl },
    border: { top: 0, right: 0, bottom: 0, left: 0 },
    margin: { top: mt, right: mr, bottom: mb, left: ml },
    totalWidth: w + ml + mr,
    totalHeight: h + mt + mb,
    marginTop: mt, marginBottom: mb, paddingTop: pt, paddingBottom: pb,
  };
}

function makeStyles(overrides: Partial<ComputedStyles> = {}): ComputedStyles {
  return {
    display: 'block', position: 'static', width: 'auto', height: 'auto',
    fontSize: '16px', lineHeight: '1.5', color: '#000000',
    backgroundColor: 'transparent', borderColor: '#000000',
    margin: '0px', padding: '0px', border: '0px',
    cursor: 'auto', pointerEvents: 'auto', visibility: 'visible', opacity: '1',
    ...overrides,
  };
}

describe('Real HTML scenarios: too-small clickable elements', () => {
  it('flags a 30x25 button with cursor:pointer', () => {
    const box = makeBox(30, 25);
    const styles = makeStyles({ cursor: 'pointer', backgroundColor: '#007bff' });
    const result = ElementAnalyzer.analyzeElement('button.small', 'button.small', box, styles, rules);
    expect(result.issues.some(i => i.type === 'too_small_clickable_area')).toBe(true);
  });

  it('flags a 20px tall submit button', () => {
    const box = makeBox(80, 20);
    const styles = makeStyles({ cursor: 'pointer', backgroundColor: '#666', color: '#ffffff' });
    const result = ElementAnalyzer.analyzeElement('button.submit', 'button.submit', box, styles, rules);
    expect(result.issues.some(i => i.type === 'too_small_clickable_area')).toBe(true);
  });

  it('does NOT flag a 48x48 button', () => {
    const box = makeBox(48, 48, 0, 0, 0, 0, 12, 24, 12, 24);
    const styles = makeStyles({ cursor: 'pointer', fontSize: '16px', backgroundColor: '#007bff' });
    const result = ElementAnalyzer.analyzeElement('button.ok', 'button.ok', box, styles, rules);
    expect(result.issues.some(i => i.type === 'too_small_clickable_area')).toBe(false);
  });
});

describe('Real HTML scenarios: typography', () => {
  it('flags font-size: 10px as too small', () => {
    const box = makeBox(200, 20);
    const styles = makeStyles({ fontSize: '10px', lineHeight: '1.1', color: '#999999' });
    const result = ElementAnalyzer.analyzeElement('.bad-typography', '.bad-typography', box, styles, rules);
    expect(result.issues.some(i => i.type === 'text_too_small')).toBe(true);
  });

  it('does NOT flag font-size: 16px', () => {
    const box = makeBox(200, 24);
    const styles = makeStyles({ fontSize: '16px', lineHeight: '1.5' });
    const result = ElementAnalyzer.analyzeElement('.good-text', '.good-text', box, styles, rules);
    expect(result.issues.some(i => i.type === 'text_too_small')).toBe(false);
  });
});

describe('Real HTML scenarios: spacing', () => {
  it('detects off-grid margin: 7px', () => {
    const box = makeBox(100, 50, 7, 7, 7, 7);
    const styles = makeStyles({ margin: '7px' });
    const result = ElementAnalyzer.analyzeElement('.bad-spacing', '.bad-spacing', box, styles, rules);
    expect(result.issues.some(i => i.type === 'spacing_not_on_grid')).toBe(true);
  });

  it('detects off-grid padding: 13px', () => {
    const box = makeBox(126, 76, 0, 0, 0, 0, 13, 13, 13, 13);
    const styles = makeStyles({ padding: '13px' });
    const result = ElementAnalyzer.analyzeElement('.odd-padding', '.odd-padding', box, styles, rules);
    expect(result.issues.some(i => i.type === 'spacing_not_on_grid')).toBe(true);
  });

  it('passes for on-grid margin: 8px', () => {
    const box = makeBox(100, 50, 8, 8, 8, 8);
    const styles = makeStyles({ margin: '8px' });
    const result = ElementAnalyzer.analyzeElement('.good-spacing', '.good-spacing', box, styles, rules);
    expect(result.issues.some(i => i.type === 'spacing_not_on_grid')).toBe(false);
  });
});

// ============================================================
// Summary
// ============================================================

describe('Real HTML: issue summary', () => {
  it('prints analysis report for bad-design page', () => {
    const results = analyzeHTML(badHTML);
    const allIssues = results.flatMap(r => r.issues);

    const byType: Record<string, number> = {};
    const bySeverity: Record<string, number> = {};
    for (const i of allIssues) {
      byType[i.type] = (byType[i.type] || 0) + 1;
      bySeverity[i.severity] = (bySeverity[i.severity] || 0) + 1;
    }

    console.log('\n=== test-bad-design.html ===');
    console.log(`Elements with issues: ${results.length}`);
    console.log(`Total issues: ${allIssues.length}`);
    console.log('By severity:', JSON.stringify(bySeverity));
    console.log('By type:', JSON.stringify(byType, null, 2));

    expect(allIssues.length).toBeGreaterThan(20);
  });
});

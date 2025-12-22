/**
 * Copyright (c) 2025 Pixel Perfect Inspector
 *
 * Author: Pixel Perfect Inspector
 * Available for contact via email: support@b-b.top
 * For up-to-date contact information:
 * https://github.com/bivex
 *
 * Created: 2025-12-22T14:30:00
 * Last Updated: 2025-12-22T14:30:00
 *
 * Licensed under the MIT License.
 * Commercial licensing available upon request.
 */

/**
 * Color harmony analyzer for advanced color analysis
 * Detects color schemes, validates semantic usage, and suggests improvements
 */
export class ColorHarmonyAnalyzer {
  /**
   * Analyze color harmony for a set of colors
   */
  static analyzeHarmony(colors: string[], rules?: any): ColorHarmonyAnalysis {
    const hslColors = colors.map(color => this.hexToHsl(color)).filter(Boolean) as HSLColor[];
    const scheme = this.detectColorScheme(hslColors, rules?.schemes);
    const semanticIssues = this.validateSemanticUsage(colors, rules?.semantics);
    const consistencyIssues = this.checkConsistency(hslColors, rules?.consistency);

    return {
      scheme,
      semanticIssues,
      consistencyIssues,
      harmonyScore: this.calculateHarmonyScore(scheme, hslColors),
      suggestions: this.generateSuggestions(scheme, semanticIssues, consistencyIssues, rules)
    };
  }

  /**
   * Detect the color scheme from HSL colors
   */
  private static detectColorScheme(colors: HSLColor[], schemes?: any): ColorScheme | null {
    if (colors.length < 2) return null;

    const defaultSchemes = {
      monochromatic: { hueTolerance: 15 },
      analogous: { hueTolerance: 30 },
      complementary: { angle: 180, tolerance: 15 },
      triadic: { angle: 120, tolerance: 15 },
      splitComplementary: { angles: [150, 210], tolerance: 15 },
      tetradic: { angles: [90, 180, 270], tolerance: 15 }
    };

    const config = schemes || defaultSchemes;

    // Check monochromatic (all colors within hue tolerance)
    const hueRange = Math.max(...colors.map(c => c.h)) - Math.min(...colors.map(c => c.h));
    if (hueRange <= config.monochromatic.hueTolerance) {
      return {
        type: 'monochromatic',
        confidence: 0.9,
        colors: colors.map(c => this.hslToHex(c))
      };
    }

    // Check complementary
    const complementaryPairs = this.findAnglePairs(colors, config.complementary.angle, config.complementary.tolerance);
    if (complementaryPairs.length >= 1) {
      return {
        type: 'complementary',
        confidence: 0.8,
        colors: colors.map(c => this.hslToHex(c))
      };
    }

    // Check triadic
    const triadicGroups = this.findAngleGroups(colors, config.triadic.angle, config.triadic.tolerance);
    if (triadicGroups.length >= 1) {
      return {
        type: 'triadic',
        confidence: 0.7,
        colors: colors.map(c => this.hslToHex(c))
      };
    }

    // Check analogous
    const avgHue = colors.reduce((sum, c) => sum + c.h, 0) / colors.length;
    const maxHueDeviation = Math.max(...colors.map(c => Math.min(
      Math.abs(c.h - avgHue),
      360 - Math.abs(c.h - avgHue)
    )));

    if (maxHueDeviation <= config.analogous.hueTolerance) {
      return {
        type: 'analogous',
        confidence: 0.6,
        colors: colors.map(c => this.hslToHex(c))
      };
    }

    return {
      type: 'unknown',
      confidence: 0,
      colors: colors.map(c => this.hslToHex(c))
    };
  }

  /**
   * Find color pairs at specific angle relationship
   */
  private static findAnglePairs(colors: HSLColor[], targetAngle: number, tolerance: number): Array<[HSLColor, HSLColor]> {
    const pairs: Array<[HSLColor, HSLColor]> = [];

    for (let i = 0; i < colors.length; i++) {
      for (let j = i + 1; j < colors.length; j++) {
        const angle1 = colors[i].h;
        const angle2 = colors[j].h;
        const diff = Math.min(Math.abs(angle1 - angle2), 360 - Math.abs(angle1 - angle2));

        if (Math.abs(diff - targetAngle) <= tolerance) {
          pairs.push([colors[i], colors[j]]);
        }
      }
    }

    return pairs;
  }

  /**
   * Find color groups with angular relationships
   */
  private static findAngleGroups(colors: HSLColor[], angle: number, tolerance: number): HSLColor[][] {
    const groups: HSLColor[][] = [];

    for (let i = 0; i < colors.length; i++) {
      const group: HSLColor[] = [colors[i]];

      for (let j = i + 1; j < colors.length; j++) {
        const baseHue = colors[i].h;
        const targetHue = (baseHue + angle) % 360;
        const actualHue = colors[j].h;

        const diff = Math.min(
          Math.abs(actualHue - targetHue),
          360 - Math.abs(actualHue - targetHue)
        );

        if (diff <= tolerance) {
          group.push(colors[j]);
        }
      }

      if (group.length >= 2) {
        groups.push(group);
      }
    }

    return groups;
  }

  /**
   * Validate semantic color usage
   */
  private static validateSemanticUsage(colors: string[], semantics?: any): SemanticIssue[] {
    const issues: SemanticIssue[] = [];

    const defaultSemantics = {
      error: ['#dc2626', '#ef4444', '#f87171'], // red variants
      success: ['#16a34a', '#22c55e', '#4ade80'], // green variants
      warning: ['#d97706', '#f59e0b', '#fbbf24'], // amber variants
      info: ['#2563eb', '#3b82f6', '#60a5fa'], // blue variants
      primary: ['#2563eb', '#3b82f6', '#1d4ed8'] // blue variants
    };

    const config = semantics || defaultSemantics;

    // Check if colors match their semantic roles
    for (const [role, expectedColors] of Object.entries(config)) {
      // This would need actual element context to check semantic usage
      // For now, we'll do basic validation
      const roleColors = expectedColors as string[];
      const hasMatchingColor = colors.some(color =>
        roleColors.some(expected => this.colorsSimilar(color, expected))
      );

      if (!hasMatchingColor && role === 'primary') {
        issues.push({
          type: 'missing_semantic_color',
          role: role as string,
          message: `Missing ${role} color from expected palette`,
          severity: 'warning'
        });
      }
    }

    return issues;
  }

  /**
   * Check color consistency (saturation, lightness)
   */
  private static checkConsistency(colors: HSLColor[], consistency?: any): ConsistencyIssue[] {
    const issues: ConsistencyIssue[] = [];

    const defaultConsistency = {
      maxSaturationDeviation: 30,
      maxLightnessDeviation: 40,
      requiredSemanticRoles: ['primary', 'success', 'error']
    };

    const config = consistency || defaultConsistency;

    if (colors.length < 2) return issues;

    // Check saturation variance
    const saturations = colors.map(c => c.s);
    const saturationVariance = this.calculateVariance(saturations);

    if (saturationVariance > config.maxSaturationDeviation) {
      issues.push({
        type: 'saturation_variance',
        message: `High saturation variance (${saturationVariance.toFixed(1)}) - colors feel inconsistent`,
        severity: 'info',
        variance: saturationVariance
      });
    }

    // Check lightness variance
    const lightnesses = colors.map(c => c.l);
    const lightnessVariance = this.calculateVariance(lightnesses);

    if (lightnessVariance > config.maxLightnessDeviation) {
      issues.push({
        type: 'lightness_variance',
        message: `High lightness variance (${lightnessVariance.toFixed(1)}) - poor visual hierarchy`,
        severity: 'warning',
        variance: lightnessVariance
      });
    }

    return issues;
  }

  /**
   * Calculate variance of an array of numbers
   */
  private static calculateVariance(values: number[]): number {
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    const squaredDiffs = values.map(v => Math.pow(v - mean, 2));
    return squaredDiffs.reduce((a, b) => a + b, 0) / values.length;
  }

  /**
   * Calculate overall harmony score (0-100)
   */
  private static calculateHarmonyScore(scheme: ColorScheme | null, colors: HSLColor[]): number {
    if (!scheme || colors.length < 2) return 0;

    let score = 50; // Base score

    // Bonus for recognized schemes
    if (scheme.type !== 'unknown') {
      score += scheme.confidence * 30;
    }

    // Bonus for color count (more colors can create better harmony)
    score += Math.min(colors.length * 5, 20);

    // Penalty for extreme saturation/lightness values
    const extremeColors = colors.filter(c => c.s > 90 || c.l < 10 || c.l > 90);
    score -= extremeColors.length * 5;

    return Math.max(0, Math.min(100, score));
  }

  /**
   * Generate suggestions for color harmony improvements
   */
  private static generateSuggestions(
    scheme: ColorScheme | null,
    semanticIssues: SemanticIssue[],
    consistencyIssues: ConsistencyIssue[],
    rules?: any
  ): ColorSuggestion[] {
    const suggestions: ColorSuggestion[] = [];

    // Scheme-based suggestions
    if (!scheme || scheme.type === 'unknown') {
      suggestions.push({
        type: 'adopt_scheme',
        description: 'Consider adopting a recognized color scheme (complementary, triadic, etc.)',
        action: 'choose_scheme',
        impact: 'high'
      });
    }

    // Semantic suggestions
    for (const issue of semanticIssues) {
      if (issue.type === 'missing_semantic_color') {
        suggestions.push({
          type: 'add_semantic_color',
          description: `Add a ${issue.role} color to improve semantic clarity`,
          action: 'add_color',
          semanticRole: issue.role,
          impact: 'medium'
        });
      }
    }

    // Consistency suggestions
    for (const issue of consistencyIssues) {
      if (issue.type === 'saturation_variance') {
        suggestions.push({
          type: 'adjust_saturation',
          description: 'Adjust color saturations to create more consistent feel',
          action: 'modify_saturation',
          impact: 'low'
        });
      } else if (issue.type === 'lightness_variance') {
        suggestions.push({
          type: 'adjust_lightness',
          description: 'Adjust color lightness values for better visual hierarchy',
          action: 'modify_lightness',
          impact: 'medium'
        });
      }
    }

    return suggestions;
  }

  /**
   * Check if two colors are similar
   */
  private static colorsSimilar(color1: string, color2: string): boolean {
    const hsl1 = this.hexToHsl(color1);
    const hsl2 = this.hexToHsl(color2);

    if (!hsl1 || !hsl2) return false;

    const hueDiff = Math.min(Math.abs(hsl1.h - hsl2.h), 360 - Math.abs(hsl1.h - hsl2.h));
    const satDiff = Math.abs(hsl1.s - hsl2.s);
    const lightDiff = Math.abs(hsl1.l - hsl2.l);

    return hueDiff <= 15 && satDiff <= 20 && lightDiff <= 20;
  }

  /**
   * Convert hex color to HSL
   */
  private static hexToHsl(hex: string): HSLColor | null {
    // Remove # if present
    const cleanHex = hex.replace('#', '');

    // Parse hex
    let r: number, g: number, b: number;
    if (cleanHex.length === 3) {
      r = parseInt(cleanHex[0] + cleanHex[0], 16) / 255;
      g = parseInt(cleanHex[1] + cleanHex[1], 16) / 255;
      b = parseInt(cleanHex[2] + cleanHex[2], 16) / 255;
    } else if (cleanHex.length === 6) {
      r = parseInt(cleanHex.substring(0, 2), 16) / 255;
      g = parseInt(cleanHex.substring(2, 4), 16) / 255;
      b = parseInt(cleanHex.substring(4, 6), 16) / 255;
    } else {
      return null;
    }

    // Convert RGB to HSL
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const diff = max - min;

    let h = 0;
    let s = 0;
    const l = (max + min) / 2;

    if (diff !== 0) {
      s = l > 0.5 ? diff / (2 - max - min) : diff / (max + min);

      switch (max) {
        case r: h = (g - b) / diff + (g < b ? 6 : 0); break;
        case g: h = (b - r) / diff + 2; break;
        case b: h = (r - g) / diff + 4; break;
      }
      h /= 6;
    }

    return {
      h: h * 360, // Convert to degrees
      s: s * 100, // Convert to percentage
      l: l * 100  // Convert to percentage
    };
  }

  /**
   * Convert HSL to hex color
   */
  private static hslToHex(hsl: HSLColor): string {
    const h = hsl.h / 360;
    const s = hsl.s / 100;
    const l = hsl.l / 100;

    if (s === 0) {
      const gray = Math.round(l * 255);
      return `#${gray.toString(16).padStart(2, '0').repeat(3)}`;
    }

    const hue2rgb = (p: number, q: number, t: number) => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1/6) return p + (q - p) * 6 * t;
      if (t < 1/2) return q;
      if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
      return p;
    };

    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;

    const r = Math.round(hue2rgb(p, q, h + 1/3) * 255);
    const g = Math.round(hue2rgb(p, q, h) * 255);
    const b = Math.round(hue2rgb(p, q, h - 1/3) * 255);

    return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
  }
}

/**
 * HSL color representation
 */
export interface HSLColor {
  h: number; // Hue in degrees (0-360)
  s: number; // Saturation in percent (0-100)
  l: number; // Lightness in percent (0-100)
}

/**
 * Result of color harmony analysis
 */
export interface ColorHarmonyAnalysis {
  scheme: ColorScheme | null;
  semanticIssues: SemanticIssue[];
  consistencyIssues: ConsistencyIssue[];
  harmonyScore: number;
  suggestions: ColorSuggestion[];
}

/**
 * Detected color scheme
 */
export interface ColorScheme {
  type: 'monochromatic' | 'analogous' | 'complementary' | 'triadic' | 'split-complementary' | 'tetradic' | 'unknown';
  confidence: number;
  colors: string[];
}

/**
 * Semantic color usage issue
 */
export interface SemanticIssue {
  type: 'missing_semantic_color' | 'incorrect_semantic_color';
  role: string;
  message: string;
  severity: 'info' | 'warning' | 'error';
}

/**
 * Color consistency issue
 */
export interface ConsistencyIssue {
  type: 'saturation_variance' | 'lightness_variance';
  message: string;
  severity: 'info' | 'warning' | 'error';
  variance: number;
}

/**
 * Color harmony suggestion
 */
export interface ColorSuggestion {
  type: 'adopt_scheme' | 'add_semantic_color' | 'adjust_saturation' | 'adjust_lightness';
  description: string;
  action: string;
  semanticRole?: string;
  impact: 'low' | 'medium' | 'high';
}

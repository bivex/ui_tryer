/**
 * Copyright (c) 2025 Pixel Perfect Inspector
 *
 * Author: Pixel Perfect Inspector
 * Available for contact via email: support@b-b.top
 * For up-to-date contact information:
 * https://github.com/bivex
 *
 * Created: 2025-12-22T14:00:00
 * Last Updated: 2025-12-22T11:01:05
 *
 * Licensed under the MIT License.
 * Commercial licensing available upon request.
 */

/**
 * Vertical rhythm analyzer for spacing harmony analysis
 * Detects baseline, validates rhythm consistency, and suggests improvements
 */
export class VerticalRhythmAnalyzer {
  /**
   * Analyze vertical rhythm for a set of spacing values
   */
  static analyzeRhythm(spacings: number[], rules: any): VerticalRhythmAnalysis {
    const baseline = this.detectBaseline(spacings);
    const violations = this.findViolations(spacings, baseline, rules);
    const suggestions = this.generateSuggestions(violations, baseline, rules);

    return {
      baseline,
      confidence: this.calculateConfidence(spacings, baseline),
      violations,
      suggestions,
      harmonics: this.calculateHarmonics(spacings, baseline)
    };
  }

  /**
   * Detect the baseline spacing from a set of values
   * Uses GCD (Greatest Common Divisor) and most common value approaches
   */
  private static detectBaseline(spacings: number[]): number {
    if (spacings.length === 0) return 4; // Default baseline

    // Filter out invalid spacings
    const validSpacings = spacings.filter(s => s > 0 && s < 1000);

    if (validSpacings.length === 0) return 4;

    // Try GCD approach
    const gcd = this.findGCD(validSpacings.map(s => Math.round(s)));
    if (gcd >= 2 && gcd <= 20) {
      return gcd;
    }

    // Fallback to most common rounded value
    const roundedSpacings = validSpacings.map(s => Math.round(s / 2) * 2); // Round to even numbers
    const frequency: { [key: number]: number } = {};

    for (const spacing of roundedSpacings) {
      frequency[spacing] = (frequency[spacing] || 0) + 1;
    }

    let mostCommon = 4; // default
    let maxCount = 0;

    for (const [spacing, count] of Object.entries(frequency)) {
      if (count > maxCount) {
        maxCount = count;
        mostCommon = parseInt(spacing);
      }
    }

    return Math.max(2, Math.min(20, mostCommon)); // Clamp between 2-20px
  }

  /**
   * Find GCD of an array of numbers
   */
  private static findGCD(numbers: number[]): number {
    if (numbers.length === 0) return 1;
    if (numbers.length === 1) return numbers[0];

    let result = numbers[0];
    for (let i = 1; i < numbers.length; i++) {
      result = this.gcd(result, numbers[i]);
    }
    return result;
  }

  /**
   * Calculate GCD of two numbers
   */
  private static gcd(a: number, b: number): number {
    a = Math.abs(a);
    b = Math.abs(b);
    while (b !== 0) {
      const t = b;
      b = a % b;
      a = t;
    }
    return a;
  }

  /**
   * Find violations of vertical rhythm
   */
  private static findViolations(spacings: number[], baseline: number, rules: any): SpacingViolation[] {
    const violations: SpacingViolation[] = [];
    const tolerance = rules.tolerance || 0.02; // 2% tolerance

    for (const spacing of spacings) {
      if (spacing <= 0) continue;

      // Check if spacing follows harmonic progression
      const ratio = spacing / baseline;
      const isHarmonic = rules.allowedRatios.some((allowedRatio: number) =>
        Math.abs(ratio - allowedRatio) <= tolerance
      );

      if (!isHarmonic) {
        const closestRatio = this.findClosestRatio(ratio, rules.allowedRatios);
        const suggestedValue = Math.round(closestRatio * baseline);

        violations.push({
          value: spacing,
          expected: suggestedValue,
          deviation: Math.abs(spacing - suggestedValue),
          ratio,
          closestRatio,
          severity: this.calculateViolationSeverity(spacing, suggestedValue, baseline)
        });
      }
    }

    return violations;
  }

  /**
   * Find the closest allowed ratio
   */
  private static findClosestRatio(targetRatio: number, allowedRatios: number[]): number {
    let closest = allowedRatios[0];
    let minDiff = Math.abs(targetRatio - closest);

    for (const ratio of allowedRatios) {
      const diff = Math.abs(targetRatio - ratio);
      if (diff < minDiff) {
        minDiff = diff;
        closest = ratio;
      }
    }

    return closest;
  }

  /**
   * Calculate severity of a spacing violation
   */
  private static calculateViolationSeverity(actual: number, expected: number, baseline: number): 'minor' | 'moderate' | 'major' {
    const deviation = Math.abs(actual - expected);
    const relativeDeviation = deviation / baseline;

    if (relativeDeviation <= 0.25) return 'minor';
    if (relativeDeviation <= 0.5) return 'moderate';
    return 'major';
  }

  /**
   * Generate suggestions for rhythm improvements
   */
  private static generateSuggestions(violations: SpacingViolation[], baseline: number, rules: any): SpacingSuggestion[] {
    const suggestions: SpacingSuggestion[] = [];

    // Group violations by severity
    const majorViolations = violations.filter(v => v.severity === 'major');
    const moderateViolations = violations.filter(v => v.severity === 'moderate');

    if (majorViolations.length > 0) {
      suggestions.push({
        type: 'baseline_adjustment',
        description: `Consider changing baseline from ${baseline}px to better fit your spacing`,
        action: 'review_baseline',
        impact: 'high'
      });
    }

    if (moderateViolations.length > 0) {
      suggestions.push({
        type: 'bulk_correction',
        description: `Multiple spacings (${moderateViolations.length}) deviate from ${baseline}px baseline`,
        action: 'adjust_spacings',
        impact: 'medium'
      });
    }

    // Add specific spacing suggestions
    for (const violation of violations.slice(0, 5)) { // Limit to top 5
      suggestions.push({
        type: 'specific_spacing',
        description: `Change ${violation.value}px to ${violation.expected}px (${violation.closestRatio}x baseline)`,
        action: 'update_css',
        cssProperty: 'margin',
        oldValue: `${violation.value}px`,
        newValue: `${violation.expected}px`,
        impact: violation.severity === 'major' ? 'high' : 'medium'
      });
    }

    return suggestions;
  }

  /**
   * Calculate confidence in detected baseline
   */
  private static calculateConfidence(spacings: number[], baseline: number): number {
    if (spacings.length === 0) return 0;

    let harmonicCount = 0;
    for (const spacing of spacings) {
      const ratio = spacing / baseline;
      if (Math.abs(ratio - Math.round(ratio)) < 0.1) {
        harmonicCount++;
      }
    }

    return harmonicCount / spacings.length;
  }

  /**
   * Calculate harmonics distribution
   */
  private static calculateHarmonics(spacings: number[], baseline: number): HarmonicDistribution {
    const harmonics: { [ratio: number]: number } = {};

    for (const spacing of spacings) {
      const ratio = Math.round((spacing / baseline) * 4) / 4; // Round to nearest 0.25
      harmonics[ratio] = (harmonics[ratio] || 0) + 1;
    }

    return {
      distribution: harmonics,
      dominantHarmonic: this.findDominantHarmonic(harmonics),
      entropy: this.calculateEntropy(Object.values(harmonics))
    };
  }

  /**
   * Find the most common harmonic ratio
   */
  private static findDominantHarmonic(harmonics: { [ratio: number]: number }): number {
    let dominant = 1;
    let maxCount = 0;

    for (const [ratio, count] of Object.entries(harmonics)) {
      if (count > maxCount) {
        maxCount = count;
        dominant = parseFloat(ratio);
      }
    }

    return dominant;
  }

  /**
   * Calculate entropy of harmonic distribution (lower = more consistent)
   */
  private static calculateEntropy(counts: number[]): number {
    const total = counts.reduce((a, b) => a + b, 0);
    if (total === 0) return 0;

    let entropy = 0;
    for (const count of counts) {
      const p = count / total;
      if (p > 0) {
        entropy -= p * Math.log2(p);
      }
    }

    return entropy;
  }
}

/**
 * Result of vertical rhythm analysis
 */
export interface VerticalRhythmAnalysis {
  baseline: number;
  confidence: number;
  violations: SpacingViolation[];
  suggestions: SpacingSuggestion[];
  harmonics: HarmonicDistribution;
}

/**
 * A spacing violation in vertical rhythm
 */
export interface SpacingViolation {
  value: number;
  expected: number;
  deviation: number;
  ratio: number;
  closestRatio: number;
  severity: 'minor' | 'moderate' | 'major';
}

/**
 * Suggestion for improving vertical rhythm
 */
export interface SpacingSuggestion {
  type: 'baseline_adjustment' | 'bulk_correction' | 'specific_spacing';
  description: string;
  action: string;
  cssProperty?: string;
  oldValue?: string;
  newValue?: string;
  impact: 'low' | 'medium' | 'high';
}

/**
 * Distribution of harmonic ratios
 */
export interface HarmonicDistribution {
  distribution: { [ratio: number]: number };
  dominantHarmonic: number;
  entropy: number;
}
/**
 * Copyright (c) 2025 Pixel Perfect Inspector
 *
 * Author: Pixel Perfect Inspector
 * Available for contact via email: support@b-b.top
 * For up-to-date contact information:
 * https://github.com/bivex
 *
 * Created: 2025-12-22T14:15:00
 * Last Updated: 2025-12-22T14:15:00
 *
 * Licensed under the MIT License.
 * Commercial licensing available upon request.
 */

/**
 * Typography analyzer for advanced text analysis
 * Handles line length, type scales, reading ease, and typographic harmony
 */
export class TypographyAnalyzer {
  /**
   * Analyze typography for an element
   */
  static analyzeTypography(
    fontSize: number,
    lineHeight: number,
    containerWidth: number,
    content?: string,
    rules?: any
  ): TypographyAnalysis {
    const lineLength = this.calculateLineLength(fontSize, containerWidth);
    const readingEase = this.calculateReadingEase(lineLength, lineHeight / fontSize);
    const optimalLineHeight = this.getOptimalLineHeight(fontSize, rules?.lineHeightRatios);
    const issues = this.identifyIssues(fontSize, lineHeight, lineLength, content, rules);
    const suggestions = this.generateSuggestions(issues, fontSize, containerWidth);

    return {
      lineLength,
      readingEase,
      optimalLineHeight,
      actualLineHeightRatio: lineHeight / fontSize,
      issues,
      suggestions,
      metrics: {
        charsPerLine: Math.floor(lineLength),
        readingSpeed: this.estimateReadingSpeed(lineLength, readingEase),
        visualComfort: this.calculateVisualComfort(fontSize, lineHeight, lineLength)
      }
    };
  }

  /**
   * Analyze type scale for a collection of font sizes
   */
  static analyzeTypeScale(fontSizes: number[], rules?: any): TypeScaleAnalysis {
    const scales = rules?.typeScales || {
      'minor-second': 1.067,
      'major-second': 1.125,
      'minor-third': 1.2,
      'major-third': 1.25,
      'perfect-fourth': 1.333,
      'golden-ratio': 1.618
    };

    const detectedScale = this.detectScale(fontSizes, scales);
    const violations = this.findScaleViolations(fontSizes, detectedScale, scales);
    const consistency = this.calculateConsistency(fontSizes, detectedScale);

    return {
      detectedScale,
      violations,
      consistency,
      suggestions: this.generateScaleSuggestions(violations, detectedScale, scales)
    };
  }

  /**
   * Calculate characters per line
   */
  private static calculateLineLength(fontSize: number, containerWidth: number): number {
    // Average character width is approximately 0.6 * fontSize
    const avgCharWidth = fontSize * 0.6;
    return containerWidth / avgCharWidth;
  }

  /**
   * Calculate reading ease score (0-100, higher is better)
   */
  private static calculateReadingEase(charsPerLine: number, lineHeightRatio: number): number {
    let ease = 100;

    // Penalize for line length outside optimal range (55-75 chars)
    const optimalMin = 55;
    const optimalMax = 75;

    if (charsPerLine < optimalMin) {
      ease -= (optimalMin - charsPerLine) * 0.8;
    } else if (charsPerLine > optimalMax) {
      ease -= (charsPerLine - optimalMax) * 0.6;
    }

    // Penalize for poor line height
    const optimalLineHeight = 1.4;
    if (lineHeightRatio < 1.2) {
      ease -= (1.2 - lineHeightRatio) * 25;
    } else if (lineHeightRatio > 1.8) {
      ease -= (lineHeightRatio - 1.8) * 15;
    }

    return Math.max(0, Math.min(100, ease));
  }

  /**
   * Get optimal line height for font size
   */
  private static getOptimalLineHeight(fontSize: number, ratios?: any): number {
    const defaultRatios = {
      small: 1.5,     // < 12px
      body: 1.5,      // 12-16px
      subheading: 1.4, // 17-24px
      heading: 1.3,   // 25-36px
      display: 1.1    // > 36px
    };

    const config = ratios || defaultRatios;

    if (fontSize <= 12) return config.small;
    if (fontSize <= 16) return config.body;
    if (fontSize <= 24) return config.subheading;
    if (fontSize <= 36) return config.heading;
    return config.display;
  }

  /**
   * Identify typography issues
   */
  private static identifyIssues(
    fontSize: number,
    lineHeight: number,
    lineLength: number,
    content?: string,
    rules?: any
  ): TypographyIssue[] {
    const issues: TypographyIssue[] = [];
    const lineHeightRatio = lineHeight / fontSize;

    // Line length issues
    const lengthRules = rules?.lineLength || { comfortable: { min: 55, max: 75 } };
    if (lineLength < lengthRules.comfortable.min) {
      issues.push({
        type: 'line_length',
        severity: 'warning',
        message: `Line too short: ${lineLength.toFixed(0)} characters (min: ${lengthRules.comfortable.min})`,
        value: lineLength,
        optimal: lengthRules.comfortable.min
      });
    } else if (lineLength > lengthRules.comfortable.max) {
      issues.push({
        type: 'line_length',
        severity: 'warning',
        message: `Line too long: ${lineLength.toFixed(0)} characters (max: ${lengthRules.comfortable.max})`,
        value: lineLength,
        optimal: lengthRules.comfortable.max
      });
    }

    // Line height issues
    const optimalLineHeight = this.getOptimalLineHeight(fontSize, rules?.lineHeightRatios);
    if (Math.abs(lineHeightRatio - optimalLineHeight) > 0.2) {
      issues.push({
        type: 'line_height',
        severity: lineHeightRatio < 1.2 || lineHeightRatio > 2.0 ? 'error' : 'warning',
        message: `Line height ratio ${lineHeightRatio.toFixed(2)} differs from optimal ${optimalLineHeight.toFixed(2)}`,
        value: lineHeightRatio,
        optimal: optimalLineHeight
      });
    }

    // Check for orphans and widows if content is available
    if (content) {
      const orphanWidowIssues = this.checkOrphansAndWidows(content, rules?.orphansWidows);
      issues.push(...orphanWidowIssues);
    }

    return issues;
  }

  /**
   * Check for orphans and widows
   */
  private static checkOrphansAndWidows(content: string, rules?: any): TypographyIssue[] {
    const issues: TypographyIssue[] = [];
    const config = rules || { maxOrphanLines: 2, maxWidowLines: 1, minLastLineRatio: 0.3 };

    // Split into paragraphs
    const paragraphs = content.split('\n\n').filter(p => p.trim());

    for (const paragraph of paragraphs) {
      const words = paragraph.trim().split(/\s+/);
      if (words.length < 10) continue; // Skip very short paragraphs

      // Estimate lines (simplified - in reality would need actual rendering)
      const estimatedLines = Math.ceil(words.length / 12); // Rough estimate

      if (estimatedLines > 1) {
        // Check last line ratio
        const lastLineWords = words.length % 12 || 12;
        const lastLineRatio = lastLineWords / 12;

        if (lastLineRatio < config.minLastLineRatio) {
          issues.push({
            type: 'widow',
            severity: 'info',
            message: `Widow detected: last line has only ${(lastLineRatio * 100).toFixed(0)}% of optimal length`,
            value: lastLineRatio,
            optimal: config.minLastLineRatio
          });
        }
      }
    }

    return issues;
  }

  /**
   * Generate suggestions for typography improvements
   */
  private static generateSuggestions(
    issues: TypographyIssue[],
    fontSize: number,
    containerWidth: number
  ): TypographySuggestion[] {
    const suggestions: TypographySuggestion[] = [];

    for (const issue of issues) {
      switch (issue.type) {
        case 'line_length':
          if (issue.value < issue.optimal) {
            suggestions.push({
              type: 'container_width',
              description: `Increase container width to reach ${issue.optimal} characters per line`,
              cssProperty: 'max-width',
              currentValue: `${containerWidth}px`,
              suggestedValue: `${Math.ceil(issue.optimal * fontSize * 0.6)}px`,
              impact: 'medium'
            });
          } else {
            suggestions.push({
              type: 'container_width',
              description: `Decrease container width to limit line length to ${issue.optimal} characters`,
              cssProperty: 'max-width',
              currentValue: `${containerWidth}px`,
              suggestedValue: `${Math.ceil(issue.optimal * fontSize * 0.6)}px`,
              impact: 'medium'
            });
          }
          break;

        case 'line_height':
          suggestions.push({
            type: 'line_height',
            description: `Adjust line-height to ${issue.optimal.toFixed(2)} for better readability`,
            cssProperty: 'line-height',
            currentValue: `${(issue.value).toFixed(2)}`,
            suggestedValue: `${issue.optimal.toFixed(2)}`,
            impact: 'high'
          });
          break;
      }
    }

    return suggestions;
  }

  /**
   * Detect the most likely type scale from font sizes
   */
  private static detectScale(fontSizes: number[], scales: any): DetectedScale {
    const uniqueSizes = [...new Set(fontSizes)].sort((a, b) => a - b);

    if (uniqueSizes.length < 2) {
      return { name: 'unknown', ratio: 1, confidence: 0 };
    }

    let bestScale = { name: 'unknown', ratio: 1, confidence: 0 };

    for (const [scaleName, scaleRatio] of Object.entries(scales)) {
      let matches = 0;
      let totalComparisons = 0;

      for (let i = 0; i < uniqueSizes.length - 1; i++) {
        const current = uniqueSizes[i];
        const next = uniqueSizes[i + 1];
        const expectedNext = current * (scaleRatio as number);

        const deviation = Math.abs(next - expectedNext) / current;
        if (deviation < 0.1) { // Within 10%
          matches++;
        }
        totalComparisons++;
      }

      const confidence = totalComparisons > 0 ? matches / totalComparisons : 0;

      if (confidence > bestScale.confidence) {
        bestScale = { name: scaleName, ratio: scaleRatio as number, confidence };
      }
    }

    return bestScale;
  }

  /**
   * Find violations of detected type scale
   */
  private static findScaleViolations(
    fontSizes: number[],
    detectedScale: DetectedScale,
    scales: any
  ): ScaleViolation[] {
    const violations: ScaleViolation[] = [];
    const uniqueSizes = [...new Set(fontSizes)].sort((a, b) => a - b);

    for (const size of uniqueSizes) {
      const level = Math.round(Math.log(size / uniqueSizes[0]) / Math.log(detectedScale.ratio));
      const expectedSize = uniqueSizes[0] * Math.pow(detectedScale.ratio, level);
      const deviation = Math.abs(size - expectedSize);

      if (deviation > 1) { // More than 1px deviation
        violations.push({
          actualSize: size,
          expectedSize,
          level,
          deviation
        });
      }
    }

    return violations;
  }

  /**
   * Calculate type scale consistency
   */
  private static calculateConsistency(fontSizes: number[], detectedScale: DetectedScale): number {
    const violations = this.findScaleViolations(fontSizes, detectedScale, {});
    const totalSizes = new Set(fontSizes).size;

    return totalSizes > 0 ? 1 - (violations.length / totalSizes) : 0;
  }

  /**
   * Generate suggestions for type scale improvements
   */
  private static generateScaleSuggestions(
    violations: ScaleViolation[],
    detectedScale: DetectedScale,
    scales: any
  ): ScaleSuggestion[] {
    const suggestions: ScaleSuggestion[] = [];

    if (violations.length > 0) {
      suggestions.push({
        type: 'scale_consistency',
        description: `${violations.length} font sizes don't follow the ${detectedScale.name} scale`,
        action: 'standardize_sizes',
        impact: 'medium'
      });

      // Suggest specific fixes
      for (const violation of violations.slice(0, 3)) {
        suggestions.push({
          type: 'specific_size',
          description: `Change ${violation.actualSize}px to ${violation.expectedSize.toFixed(1)}px (level ${violation.level})`,
          action: 'update_font_size',
          impact: 'low'
        });
      }
    }

    return suggestions;
  }

  /**
   * Estimate reading speed in words per minute
   */
  private static estimateReadingSpeed(charsPerLine: number, readingEase: number): number {
    // Base reading speed (words per minute)
    const baseWPM = 200;
    const easeMultiplier = readingEase / 100;
    const lineLengthMultiplier = charsPerLine > 75 ? 0.9 : charsPerLine < 45 ? 0.8 : 1.0;

    return Math.round(baseWPM * easeMultiplier * lineLengthMultiplier);
  }

  /**
   * Calculate visual comfort score (0-100)
   */
  private static calculateVisualComfort(fontSize: number, lineHeight: number, lineLength: number): number {
    let comfort = 100;

    // Font size comfort (12-16px is optimal)
    if (fontSize < 12) comfort -= (12 - fontSize) * 3;
    if (fontSize > 16) comfort -= (fontSize - 16) * 2;

    // Line height comfort
    const lineHeightRatio = lineHeight / fontSize;
    if (lineHeightRatio < 1.3) comfort -= (1.3 - lineHeightRatio) * 50;
    if (lineHeightRatio > 1.7) comfort -= (lineHeightRatio - 1.7) * 30;

    // Line length comfort
    if (lineLength < 50) comfort -= (50 - lineLength) * 0.8;
    if (lineLength > 80) comfort -= (lineLength - 80) * 0.6;

    return Math.max(0, Math.min(100, comfort));
  }
}

/**
 * Result of typography analysis
 */
export interface TypographyAnalysis {
  lineLength: number;
  readingEase: number;
  optimalLineHeight: number;
  actualLineHeightRatio: number;
  issues: TypographyIssue[];
  suggestions: TypographySuggestion[];
  metrics: {
    charsPerLine: number;
    readingSpeed: number;
    visualComfort: number;
  };
}

/**
 * Result of type scale analysis
 */
export interface TypeScaleAnalysis {
  detectedScale: DetectedScale;
  violations: ScaleViolation[];
  consistency: number;
  suggestions: ScaleSuggestion[];
}

/**
 * Detected type scale
 */
export interface DetectedScale {
  name: string;
  ratio: number;
  confidence: number;
}

/**
 * Typography issue
 */
export interface TypographyIssue {
  type: 'line_length' | 'line_height' | 'widow' | 'orphan';
  severity: 'info' | 'warning' | 'error';
  message: string;
  value: number;
  optimal: number;
}

/**
 * Typography suggestion
 */
export interface TypographySuggestion {
  type: string;
  description: string;
  cssProperty?: string;
  currentValue?: string;
  suggestedValue?: string;
  impact: 'low' | 'medium' | 'high';
}

/**
 * Type scale violation
 */
export interface ScaleViolation {
  actualSize: number;
  expectedSize: number;
  level: number;
  deviation: number;
}

/**
 * Type scale suggestion
 */
export interface ScaleSuggestion {
  type: string;
  description: string;
  action: string;
  impact: 'low' | 'medium' | 'high';
}

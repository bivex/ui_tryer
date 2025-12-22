/**
 * Copyright (c) 2025 Pixel Perfect Inspector
 *
 * Author: Pixel Perfect Inspector
 * Available for contact via email: support@b-b.top
 * For up-to-date contact information:
 * https://github.com/bivex
 *
 * Created: 2025-12-22T16:30:00
 * Last Updated: 2025-12-22T16:30:00
 *
 * Licensed under the MIT License.
 * Commercial licensing available upon request.
 */

/**
 * Consistency analyzer for design system validation
 * Handles component consistency and design pattern detection
 */
export class ConsistencyAnalyzer {
  /**
   * Analyze consistency of an element against design system
   */
  static analyzeConsistency(
    elementId: string,
    selector: string,
    styles: any,
    boxModel: any,
    designSystem?: any,
    similarElements?: any[]
  ): ConsistencyAnalysis {
    const config = designSystem || {
      patterns: {
        card: {
          paddingScale: [16, 20, 24, 32],
          borderRadiusScale: [4, 6, 8, 12],
          shadowRequired: false
        },
        button: {
          heightScale: [32, 36, 40, 44, 48],
          widthConstraints: { min: 80 },
        },
        form: {
          inputHeight: 40,
          labelSpacing: 8,
          groupSpacing: 16
        }
      },
      tokens: {
        spacingTokens: ['4px', '8px', '12px', '16px', '20px', '24px', '32px', '48px', '64px'],
        colorTokens: ['primary', 'secondary', 'success', 'warning', 'error'],
        typographyTokens: ['xs', 'sm', 'base', 'lg', 'xl', '2xl', '3xl'],
        strictTokenUsage: false
      },
      similarity: {
        spacing: 0.1, // 10% tolerance
        sizing: 0.05,
        color: 0.05
      }
    };

    const issues: ConsistencyIssue[] = [];

    // Analyze component patterns
    const patternIssues = this.analyzeComponentPatterns(elementId, selector, styles, boxModel, config.patterns);
    issues.push(...patternIssues);

    // Analyze design token usage
    const tokenIssues = this.analyzeDesignTokens(elementId, selector, styles, config.tokens);
    issues.push(...tokenIssues);

    // Analyze similarity to other elements
    const similarityIssues = this.analyzeElementSimilarity(elementId, selector, styles, similarElements, config.similarity);
    issues.push(...similarityIssues);

    // Detect design patterns
    const detectedPatterns = this.detectDesignPatterns(selector, styles, boxModel, config.patterns);

    return {
      detectedPatterns,
      consistencyScore: this.calculateConsistencyScore(issues),
      tokenCompliance: this.calculateTokenCompliance(issues),
      patternAdherence: this.calculatePatternAdherence(detectedPatterns, issues),
      issues,
      suggestions: this.generateConsistencySuggestions(issues, detectedPatterns, config)
    };
  }

  /**
   * Analyze component patterns (card, button, form, etc.)
   */
  private static analyzeComponentPatterns(
    elementId: string,
    selector: string,
    styles: any,
    boxModel: any,
    patterns: any
  ): ConsistencyIssue[] {
    const issues: ConsistencyIssue[] = [];

    // Check if element matches common patterns
    const elementType = this.inferElementType(selector, styles);

    if (elementType && patterns[elementType]) {
      const patternRules = patterns[elementType];

      // Check spacing patterns
      if (patternRules.paddingScale && styles.padding) {
        const paddingValue = this.extractMainValue(styles.padding);
        const isValidPadding = patternRules.paddingScale.includes(paddingValue);

        if (!isValidPadding) {
          issues.push({
            type: 'pattern_violation',
            severity: 'info',
            message: `${elementType} padding ${paddingValue}px doesn't match design system scale`,
            elementId,
            selector,
            suggestedFix: `Use padding from scale: ${patternRules.paddingScale.join(', ')}px`,
            codeExample: `${selector} {\n  padding: ${patternRules.paddingScale[2]}px;\n}`,
            context: {
              elementType,
              currentValue: paddingValue,
              validValues: patternRules.paddingScale,
              pattern: 'spacing'
            }
          });
        }
      }

      // Check sizing patterns for buttons
      if (elementType === 'button' && patternRules.heightScale) {
        const height = boxModel.height || parseFloat(styles.height);
        if (height && !patternRules.heightScale.includes(height)) {
          issues.push({
            type: 'component_inconsistency',
            severity: 'warning',
            message: `Button height ${height}px doesn't match design system scale`,
            elementId,
            selector,
            suggestedFix: `Use height from scale: ${patternRules.heightScale.join(', ')}px`,
            context: {
              elementType,
              currentValue: height,
              validValues: patternRules.heightScale,
              pattern: 'sizing'
            }
          });
        }
      }

      // Check border radius for cards
      if (elementType === 'card' && patternRules.borderRadiusScale && styles.borderRadius) {
        const borderRadius = parseFloat(styles.borderRadius);
        if (borderRadius && !patternRules.borderRadiusScale.includes(borderRadius)) {
          issues.push({
            type: 'pattern_violation',
            severity: 'info',
            message: `Card border-radius ${borderRadius}px doesn't match design system`,
            elementId,
            selector,
            suggestedFix: `Use border-radius from scale: ${patternRules.borderRadiusScale.join(', ')}px`,
            context: {
              elementType,
              currentValue: borderRadius,
              validValues: patternRules.borderRadiusScale,
              pattern: 'border-radius'
            }
          });
        }
      }
    }

    return issues;
  }

  /**
   * Analyze design token usage
   */
  private static analyzeDesignTokens(
    elementId: string,
    selector: string,
    styles: any,
    tokens: any
  ): ConsistencyIssue[] {
    const issues: ConsistencyIssue[] = [];

    // Check for hardcoded values vs tokens
    for (const [property, value] of Object.entries(styles)) {
      if (this.isHardcodedValue(property, value as string, tokens)) {
        issues.push({
          type: 'design_token_mismatch',
          severity: tokens.strictTokenUsage ? 'warning' : 'info',
          message: `Hardcoded ${property} value should use design token`,
          elementId,
          selector,
          suggestedFix: `Use CSS custom property or design token instead`,
          codeExample: `${selector} {\n  ${property}: var(--${property});\n}`,
          context: {
            property,
            hardcodedValue: value,
            recommended: 'design-token'
          }
        });
      }
    }

    return issues;
  }

  /**
   * Analyze similarity to other elements
   */
  private static analyzeElementSimilarity(
    elementId: string,
    selector: string,
    styles: any,
    similarElements?: any[],
    similarityConfig?: any
  ): ConsistencyIssue[] {
    const issues: ConsistencyIssue[] = [];

    if (!similarElements || similarElements.length === 0) return issues;

    const config = similarityConfig || { spacing: 0.1, sizing: 0.05, color: 0.05 };

    // Group similar elements
    const similarGroups = this.groupSimilarElements(similarElements, styles, config);

    if (similarGroups.length > 1) {
      issues.push({
        type: 'component_inconsistency',
        severity: 'info',
        message: `Element differs from ${similarGroups.length - 1} similar elements`,
        elementId,
        selector,
        suggestedFix: 'Standardize styling to match similar elements',
        context: {
          similarCount: similarGroups.length,
          differences: this.calculateDifferences(styles, similarGroups[0])
        }
      });
    }

    return issues;
  }

  /**
   * Detect design patterns
   */
  private static detectDesignPatterns(
    selector: string,
    styles: any,
    boxModel: any,
    patterns: any
  ): DetectedPattern[] {
    const detected: DetectedPattern[] = [];

    // Check for card pattern
    if (this.matchesCardPattern(styles, boxModel)) {
      detected.push({
        type: 'card',
        confidence: 0.8,
        matchedRules: ['padding', 'border-radius', 'box-shadow']
      });
    }

    // Check for button pattern
    if (this.matchesButtonPattern(selector, styles, boxModel)) {
      detected.push({
        type: 'button',
        confidence: 0.9,
        matchedRules: ['height', 'padding', 'border-radius']
      });
    }

    // Check for form input pattern
    if (this.matchesInputPattern(selector, styles, boxModel)) {
      detected.push({
        type: 'input',
        confidence: 0.7,
        matchedRules: ['height', 'border', 'padding']
      });
    }

    return detected;
  }

  /**
   * Infer element type from selector and styles
   */
  private static inferElementType(selector: string, styles: any): string | null {
    if (/button|btn/i.test(selector) || styles.cursor === 'pointer') {
      return 'button';
    }

    if (/card|panel|article/i.test(selector) ||
        (styles.boxShadow && styles.borderRadius && styles.padding)) {
      return 'card';
    }

    if (/input|textarea|select/i.test(selector) ||
        (styles.border && styles.padding && !styles.display)) {
      return 'input';
    }

    return null;
  }

  /**
   * Extract main numeric value from CSS value
   */
  private static extractMainValue(cssValue: string): number {
    const match = cssValue.match(/(\d+)/);
    return match ? parseInt(match[1]) : 0;
  }

  /**
   * Check if value is hardcoded instead of using tokens
   */
  private static isHardcodedValue(property: string, value: string, tokens: any): boolean {
    if (!value || typeof value !== 'string') return false;

    // Check spacing tokens
    if (property.includes('padding') || property.includes('margin') || property.includes('gap')) {
      return tokens.spacingTokens && !tokens.spacingTokens.some((token: string) => value.includes(token));
    }

    // Check color tokens
    if (property.includes('color') || property.includes('background')) {
      return !value.startsWith('var(') && !tokens.colorTokens.some((token: string) => value.includes(token));
    }

    // Check typography tokens
    if (property.includes('font') && property !== 'fontFamily') {
      return tokens.typographyTokens && !tokens.typographyTokens.some((token: string) => value.includes(token));
    }

    return false;
  }

  /**
   * Group similar elements based on styling
   */
  private static groupSimilarElements(elements: any[], referenceStyles: any, config: any): any[][] {
    const groups: any[][] = [];

    for (const element of elements) {
      let addedToGroup = false;

      for (const group of groups) {
        if (this.areElementsSimilar(group[0], element, config)) {
          group.push(element);
          addedToGroup = true;
          break;
        }
      }

      if (!addedToGroup) {
        groups.push([element]);
      }
    }

    return groups;
  }

  /**
   * Check if two elements are similar
   */
  private static areElementsSimilar(element1: any, element2: any, config: any): boolean {
    // Compare key properties
    const propertiesToCompare = ['padding', 'margin', 'fontSize', 'color', 'backgroundColor'];

    for (const prop of propertiesToCompare) {
      const val1 = element1.styles?.[prop];
      const val2 = element2.styles?.[prop];

      if (val1 && val2 && !this.valuesSimilar(val1, val2, config)) {
        return false;
      }
    }

    return true;
  }

  /**
   * Check if two values are similar within tolerance
   */
  private static valuesSimilar(value1: string, value2: string, config: any): boolean {
    const num1 = parseFloat(value1);
    const num2 = parseFloat(value2);

    if (isNaN(num1) || isNaN(num2)) {
      return value1 === value2; // String comparison
    }

    const tolerance = config.spacing || 0.1; // Default 10%
    return Math.abs(num1 - num2) / Math.max(num1, num2) <= tolerance;
  }

  /**
   * Calculate differences between elements
   */
  private static calculateDifferences(element1: any, element2: any): any {
    const differences: any = {};

    for (const [key, value] of Object.entries(element1)) {
      if (element2[key] !== value) {
        differences[key] = { element1: value, element2: element2[key] };
      }
    }

    return differences;
  }

  /**
   * Check if element matches card pattern
   */
  private static matchesCardPattern(styles: any, boxModel: any): boolean {
    return !!(
      styles.padding &&
      styles.borderRadius &&
      (styles.boxShadow || styles.border) &&
      boxModel.width && boxModel.height &&
      boxModel.width > boxModel.height // Typically wider than tall
    );
  }

  /**
   * Check if element matches button pattern
   */
  private static matchesButtonPattern(selector: string, styles: any, boxModel: any): boolean {
    return !!(
      /button|btn/i.test(selector) ||
      (styles.cursor === 'pointer' &&
       styles.padding &&
       boxModel.height &&
       boxModel.height >= 32 && boxModel.height <= 60) // Typical button heights
    );
  }

  /**
   * Check if element matches input pattern
   */
  private static matchesInputPattern(selector: string, styles: any, boxModel: any): boolean {
    return !!(
      /input|textarea|select/i.test(selector) ||
      (styles.border &&
       styles.padding &&
       boxModel.height &&
       boxModel.height >= 32 && boxModel.height <= 48) // Typical input heights
    );
  }

  /**
   * Calculate overall consistency score (0-100)
   */
  private static calculateConsistencyScore(issues: ConsistencyIssue[]): number {
    let score = 100;

    for (const issue of issues) {
      switch (issue.severity) {
        case 'error': score -= 20; break;
        case 'warning': score -= 10; break;
        case 'info': score -= 5; break;
      }
    }

    return Math.max(0, score);
  }

  /**
   * Calculate design token compliance (0-100)
   */
  private static calculateTokenCompliance(issues: ConsistencyIssue[]): number {
    const tokenIssues = issues.filter(i => i.type === 'design_token_mismatch');
    const totalTokens = 50; // Estimated - would need real counting
    const violationPenalty = (tokenIssues.length / Math.max(totalTokens, 1)) * 100;

    return Math.max(0, 100 - violationPenalty);
  }

  /**
   * Calculate pattern adherence score (0-100)
   */
  private static calculatePatternAdherence(patterns: DetectedPattern[], issues: ConsistencyIssue[]): number {
    let score = 50; // Base score

    // Bonus for detected patterns
    score += patterns.length * 10;

    // Penalty for pattern violations
    const patternIssues = issues.filter(i => i.type === 'pattern_violation');
    score -= patternIssues.length * 15;

    return Math.max(0, Math.min(100, score));
  }

  /**
   * Generate consistency improvement suggestions
   */
  private static generateConsistencySuggestions(
    issues: ConsistencyIssue[],
    patterns: DetectedPattern[],
    config: any
  ): ConsistencySuggestion[] {
    const suggestions: ConsistencySuggestion[] = [];

    const tokenIssues = issues.filter(i => i.type === 'design_token_mismatch');
    const patternIssues = issues.filter(i => i.type === 'pattern_violation');
    const inconsistencyIssues = issues.filter(i => i.type === 'component_inconsistency');

    if (tokenIssues.length > 0) {
      suggestions.push({
        type: 'token_adoption',
        description: `${tokenIssues.length} hardcoded values should use design tokens`,
        action: 'implement_design_tokens',
        impact: 'high'
      });
    }

    if (patternIssues.length > 0) {
      suggestions.push({
        type: 'pattern_standardization',
        description: `${patternIssues.length} elements don't follow design patterns`,
        action: 'standardize_patterns',
        impact: 'medium'
      });
    }

    if (inconsistencyIssues.length > 0) {
      suggestions.push({
        type: 'consistency_cleanup',
        description: 'Multiple similar elements have inconsistent styling',
        action: 'unify_similar_elements',
        impact: 'medium'
      });
    }

    return suggestions;
  }
}

/**
 * Result of consistency analysis
 */
export interface ConsistencyAnalysis {
  detectedPatterns: DetectedPattern[];
  consistencyScore: number;
  tokenCompliance: number;
  patternAdherence: number;
  issues: ConsistencyIssue[];
  suggestions: ConsistencySuggestion[];
}

/**
 * Detected design pattern
 */
export interface DetectedPattern {
  type: string;
  confidence: number;
  matchedRules: string[];
}

/**
 * Consistency issue
 */
export interface ConsistencyIssue {
  type: 'pattern_violation' | 'component_inconsistency' | 'design_token_mismatch';
  severity: 'info' | 'warning' | 'error';
  message: string;
  elementId: string;
  selector?: string;
  suggestedFix?: string;
  codeExample?: string;
  context?: any;
}

/**
 * Consistency suggestion
 */
export interface ConsistencySuggestion {
  type: string;
  description: string;
  action: string;
  impact: 'low' | 'medium' | 'high';
}

/**
 * Copyright (c) 2025 Pixel Perfect Inspector
 *
 * Author: Pixel Perfect Inspector
 * Available for contact via email: support@b-b.top
 * For up-to-date contact information:
 * https://github.com/bivex
 *
 * Created: 2025-12-22T16:15:00
 * Last Updated: 2025-12-22T16:15:00
 *
 * Licensed under the MIT License.
 * Commercial licensing available upon request.
 */

/**
 * Performance analyzer for UI performance optimization
 * Handles layout shift prevention, animation performance, and resource loading
 */
export class PerformanceAnalyzer {
  /**
   * Analyze performance aspects of an element
   */
  static analyzePerformance(
    elementId: string,
    selector: string,
    styles: any,
    boxModel: any,
    rules?: any
  ): PerformanceAnalysis {
    const config = rules || {
      layoutShift: {
        imageDimensionsRequired: true,
        fontLoadingStrategy: 'swap',
        dynamicContentSpaceReserved: true
      },
      animation: {
        preferTransform: true,
        avoidProperties: ['left', 'top', 'width', 'height'],
        maxDuration: 300
      },
      resources: {
        lazyLoadingRecommended: true,
        preloadCritical: true,
        compressionRequired: true
      }
    };

    const issues: PerformanceIssue[] = [];

    // Analyze layout shift prevention
    const layoutShiftIssues = this.analyzeLayoutShift(elementId, selector, styles, boxModel, config.layoutShift);
    issues.push(...layoutShiftIssues);

    // Analyze animation performance
    const animationIssues = this.analyzeAnimationPerformance(elementId, selector, styles, config.animation);
    issues.push(...animationIssues);

    // Analyze resource loading
    const resourceIssues = this.analyzeResourceLoading(elementId, selector, styles, config.resources);
    issues.push(...resourceIssues);

    // Calculate performance score
    const performanceScore = this.calculatePerformanceScore(issues);

    return {
      performanceScore,
      layoutShiftRisk: this.calculateLayoutShiftRisk(issues),
      animationEfficiency: this.calculateAnimationEfficiency(issues),
      resourceOptimization: this.calculateResourceOptimization(issues),
      issues,
      suggestions: this.generatePerformanceSuggestions(issues, config)
    };
  }

  /**
   * Analyze layout shift prevention
   */
  private static analyzeLayoutShift(
    elementId: string,
    selector: string,
    styles: any,
    boxModel: any,
    config: any
  ): PerformanceIssue[] {
    const issues: PerformanceIssue[] = [];

    // Check images for dimensions
    if (this.isImageElement(selector)) {
      const hasWidth = styles.width && styles.width !== 'auto';
      const hasHeight = styles.height && styles.height !== 'auto';
      const hasAspectRatio = styles.aspectRatio;

      if (!hasWidth || !hasHeight) {
        if (!hasAspectRatio) {
          issues.push({
            type: 'layout_shift',
            severity: 'error',
            message: 'Image without dimensions or aspect ratio will cause layout shift',
            elementId,
            selector,
            suggestedFix: 'Add explicit width and height or aspect-ratio',
            codeExample: `<img src="..." width="400" height="300" />\n/* or */\nimg {\n  aspect-ratio: 4/3;\n}`,
            learnMoreUrl: 'https://web.dev/cls/',
            context: {
              hasWidth,
              hasHeight,
              hasAspectRatio,
              elementType: 'image'
            },
            impact: 'high'
          });
        }
      }
    }

    // Check dynamic content
    if (this.isDynamicContent(selector)) {
      const hasMinDimensions = (styles.minWidth || styles.minHeight);
      const hasFlexboxGrid = (styles.display === 'flex' || styles.display === 'grid');

      if (!hasMinDimensions && !hasFlexboxGrid) {
        issues.push({
          type: 'layout_shift',
            severity: 'warning',
            message: 'Dynamic content may cause layout shift without reserved space',
            elementId,
            selector,
            suggestedFix: 'Add min-height or use flexbox/grid for stable layout',
            codeExample: `${selector} {\n  min-height: 200px;\n  display: flex;\n  align-items: center;\n}`,
            context: {
              hasMinDimensions: !!hasMinDimensions,
              hasFlexboxGrid,
              elementType: 'dynamic'
            },
            impact: 'medium'
          });
      }
    }


    return issues;
  }

  /**
   * Analyze animation performance
   */
  private static analyzeAnimationPerformance(
    elementId: string,
    selector: string,
    styles: any,
    config: any
  ): PerformanceIssue[] {
    const issues: PerformanceIssue[] = [];

    // Check for expensive animations
    const transition = styles.transition || styles.animation;
    if (transition) {
      const animatedProperties = this.extractAnimatedProperties(transition);

      for (const prop of animatedProperties) {
        if (config.avoidProperties.includes(prop)) {
          issues.push({
            type: 'expensive_animation',
            severity: 'warning',
            message: `Animation of '${prop}' property triggers layout recalculation`,
            elementId,
            selector,
            suggestedFix: `Use transform or opacity instead of ${prop}`,
            codeExample: `${selector} {\n  transition: transform 0.3s ease;\n}\n\n${selector}:hover {\n  transform: scale(1.05);\n}`,
            learnMoreUrl: 'https://web.dev/animations-overview/',
            context: {
              animatedProperty: prop,
              expensiveProperties: config.avoidProperties,
              alternative: 'transform'
            },
            impact: 'medium'
          });
        }
      }

      // Check animation duration
      const duration = this.extractAnimationDuration(transition);
      if (duration > config.maxDuration) {
        issues.push({
          type: 'long_animation',
          severity: 'info',
          message: `Animation duration (${duration}ms) may feel sluggish`,
          elementId,
          selector,
          suggestedFix: `Reduce animation duration to ${config.maxDuration}ms or less`,
          context: {
            duration,
            maxRecommended: config.maxDuration
          },
          impact: 'low'
        });
      }
    }

    // Check for will-change misuse
    if (styles.willChange && styles.willChange !== 'auto') {
      issues.push({
        type: 'will_change_misuse',
        severity: 'info',
        message: 'will-change should be used sparingly and removed after animation',
        elementId,
        selector,
        suggestedFix: 'Remove will-change after animation completes',
        codeExample: `element.addEventListener('animationend', () => {\n  element.style.willChange = 'auto';\n});`,
        learnMoreUrl: 'https://web.dev/will-change/',
        context: { willChange: styles.willChange },
        impact: 'low'
      });
    }

    return issues;
  }

  /**
   * Analyze resource loading optimization
   */
  private static analyzeResourceLoading(
    elementId: string,
    selector: string,
    styles: any,
    config: any
  ): PerformanceIssue[] {
    const issues: PerformanceIssue[] = [];

    // Check images for lazy loading
    if (this.isImageElement(selector)) {
      const hasLoading = styles.loading === 'lazy';
      const isAboveFold = this.isLikelyAboveFold(selector); // Simplified heuristic

      if (!hasLoading && !isAboveFold && config.lazyLoadingRecommended) {
        issues.push({
          type: 'missing_lazy_loading',
          severity: 'info',
          message: 'Consider lazy loading for below-the-fold images',
          elementId,
          selector,
          suggestedFix: 'Add loading="lazy" attribute',
          codeExample: `<img src="..." loading="lazy" />`,
          learnMoreUrl: 'https://web.dev/browser-level-image-lazy-loading/',
          context: { hasLoading, isAboveFold },
          impact: 'low'
        });
      }

      // Check for unoptimized images
      const src = styles.src || '';
      if (src && !src.includes('.webp') && !src.includes('.avif')) {
        issues.push({
          type: 'unoptimized_image',
          severity: 'info',
          message: 'Consider using modern image formats (WebP, AVIF)',
          elementId,
          selector,
          suggestedFix: 'Convert images to WebP or AVIF format',
          learnMoreUrl: 'https://web.dev/serve-images-webp/',
          context: { currentFormat: this.getImageExtension(src) },
          impact: 'low'
        });
      }
    }

    // Check for unused styles (simplified check)
    if (styles.unused && styles.unused.length > 0) {
      issues.push({
        type: 'unused_styles',
        severity: 'info',
        message: `${styles.unused.length} unused CSS properties detected`,
        elementId,
        selector,
        suggestedFix: 'Remove unused CSS to reduce bundle size',
        context: { unusedCount: styles.unused.length },
        impact: 'low'
      });
    }

    return issues;
  }

  /**
   * Extract animated properties from transition/animation
   */
  private static extractAnimatedProperties(transition: string): string[] {
    // Simplified parsing - real implementation would be more robust
    const properties: string[] = [];

    // Common patterns: "all 0.3s ease" or "transform 0.3s, opacity 0.2s"
    const propMatches = transition.match(/([a-zA-Z-]+)\s+\d/);
    if (propMatches) {
      properties.push(propMatches[1]);
    }

    if (transition.includes('all')) {
      properties.push('all');
    }

    return properties;
  }

  /**
   * Extract animation duration from transition/animation
   */
  private static extractAnimationDuration(transition: string): number {
    const durationMatch = transition.match(/(\d+(?:\.\d+)?)s/);
    if (durationMatch) {
      return parseFloat(durationMatch[1]) * 1000; // Convert to ms
    }

    const msMatch = transition.match(/(\d+)ms/);
    if (msMatch) {
      return parseInt(msMatch[1]);
    }

    return 0;
  }

  /**
   * Check if element is likely above the fold
   */
  private static isLikelyAboveFold(selector: string): boolean {
    // Simplified heuristic based on selector patterns
    return /hero|header|nav|logo|title/i.test(selector);
  }

  /**
   * Get image extension from src
   */
  private static getImageExtension(src: string): string {
    const match = src.match(/\.([a-zA-Z]+)(?:\?|$)/);
    return match ? match[1].toLowerCase() : 'unknown';
  }

  /**
   * Check if element is an image
   */
  private static isImageElement(selector: string): boolean {
    return /img|image|\[src.*\]/.test(selector);
  }

  /**
   * Check if element contains dynamic content
   */
  private static isDynamicContent(selector: string): boolean {
    return /comment|post|article|feed|stream|dynamic|async/i.test(selector);
  }

  /**
   * Calculate overall performance score (0-100)
   */
  private static calculatePerformanceScore(issues: PerformanceIssue[]): number {
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
   * Calculate layout shift risk (0-100)
   */
  private static calculateLayoutShiftRisk(issues: PerformanceIssue[]): number {
    const layoutIssues = issues.filter(i => i.type === 'layout_shift');
    let risk = 0;

    for (const issue of layoutIssues) {
      switch (issue.severity) {
        case 'error': risk += 30; break;
        case 'warning': risk += 15; break;
        case 'info': risk += 5; break;
      }
    }

    return Math.min(100, risk);
  }

  /**
   * Calculate animation efficiency (0-100)
   */
  private static calculateAnimationEfficiency(issues: PerformanceIssue[]): number {
    const animationIssues = issues.filter(i => i.type === 'expensive_animation');
    let efficiency = 100;

    for (const issue of animationIssues) {
      efficiency -= 15;
    }

    return Math.max(0, efficiency);
  }

  /**
   * Calculate resource optimization score (0-100)
   */
  private static calculateResourceOptimization(issues: PerformanceIssue[]): number {
    const resourceIssues = issues.filter(i =>
      i.type === 'missing_lazy_loading' || i.type === 'unoptimized_image'
    );
    let optimization = 100;

    for (const issue of resourceIssues) {
      optimization -= 10;
    }

    return Math.max(0, optimization);
  }

  /**
   * Generate performance improvement suggestions
   */
  private static generatePerformanceSuggestions(
    issues: PerformanceIssue[],
    config: any
  ): PerformanceSuggestion[] {
    const suggestions: PerformanceSuggestion[] = [];

    const layoutIssues = issues.filter(i => i.type === 'layout_shift');
    const animationIssues = issues.filter(i => i.type === 'expensive_animation');
    const resourceIssues = issues.filter(i => i.type.includes('resource') || i.type.includes('image'));

    if (layoutIssues.length > 0) {
      suggestions.push({
        type: 'layout_shift_prevention',
        description: `${layoutIssues.length} elements may cause layout shift`,
        action: 'reserve_space',
        impact: 'high'
      });
    }

    if (animationIssues.length > 0) {
      suggestions.push({
        type: 'animation_optimization',
        description: `${animationIssues.length} animations may cause performance issues`,
        action: 'use_transform',
        impact: 'medium'
      });
    }

    if (resourceIssues.length > 0) {
      suggestions.push({
        type: 'resource_optimization',
        description: 'Optimize image loading and formats',
        action: 'implement_lazy_loading',
        impact: 'medium'
      });
    }

    return suggestions;
  }
}

/**
 * Result of performance analysis
 */
export interface PerformanceAnalysis {
  performanceScore: number;
  layoutShiftRisk: number;
  animationEfficiency: number;
  resourceOptimization: number;
  issues: PerformanceIssue[];
  suggestions: PerformanceSuggestion[];
}

/**
 * Performance issue
 */
export interface PerformanceIssue {
  type: 'layout_shift' | 'expensive_animation' | 'long_animation' | 'will_change_misuse' | 'font_loading' | 'missing_lazy_loading' | 'unoptimized_image' | 'unused_styles';
  severity: 'info' | 'warning' | 'error';
  message: string;
  elementId: string;
  selector?: string;
  suggestedFix?: string;
  codeExample?: string;
  learnMoreUrl?: string;
  context?: any;
  impact: 'low' | 'medium' | 'high';
}

/**
 * Performance suggestion
 */
export interface PerformanceSuggestion {
  type: string;
  description: string;
  action: string;
  impact: 'low' | 'medium' | 'high';
}

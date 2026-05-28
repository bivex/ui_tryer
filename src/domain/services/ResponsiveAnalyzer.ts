/**
 * Copyright (c) 2025 Pixel Perfect Inspector
 *
 * Author: Pixel Perfect Inspector
 * Available for contact via email: support@b-b.top
 * For up-to-date contact information:
 * https://github.com/bivex
 *
 * Created: 2025-12-22T16:00:00
 * Last Updated: 2025-12-22T16:00:00
 *
 * Licensed under the MIT License.
 * Commercial licensing available upon request.
 */

/**
 * Responsive analyzer for mobile-first design validation
 * Handles breakpoint consistency, content overflow, and readability
 */
export class ResponsiveAnalyzer {
  /**
   * Analyze responsive behavior of an element
   */
  static analyzeResponsive(
    elementId: string,
    selector: string,
    styles: any,
    boxModel: any,
    viewport?: { width: number; height: number },
    rules?: any
  ): ResponsiveAnalysis {
    const config = rules || {
      breakpoints: {
        sm: 640,
        md: 768,
        lg: 1024,
        xl: 1280,
        '2xl': 1536
      },
      mobileFirst: {
        preferMinWidth: true,
        maxWidthAllowed: true
      },
      overflow: {
        horizontalScrollPenalty: 10,
        textOverflowHandling: true
      }
    };

    const currentViewport = viewport || { width: 1920, height: 1080 };
    const breakpoint = this.getCurrentBreakpoint(currentViewport.width, config.breakpoints);

    const issues: ResponsiveIssue[] = [];

    // Check content overflow
    const overflowIssues = this.analyzeOverflow(elementId, selector, styles, boxModel, currentViewport, config.overflow);
    issues.push(...overflowIssues);

    // Check breakpoint consistency
    const breakpointIssues = this.analyzeBreakpointConsistency(elementId, selector, styles, breakpoint, config, currentViewport.width);
    issues.push(...breakpointIssues);

    // Check mobile readability
    const readabilityIssues = this.analyzeMobileReadability(elementId, selector, styles, boxModel, currentViewport, config);
    issues.push(...readabilityIssues);

    // Check responsive images
    const imageIssues = this.analyzeResponsiveImages(elementId, selector, styles, currentViewport, config);
    issues.push(...imageIssues);

    return {
      currentBreakpoint: breakpoint,
      viewportSize: currentViewport,
      issues,
      suggestions: this.generateResponsiveSuggestions(issues, breakpoint, config),
      mobileFriendly: this.isMobileFriendly(issues),
      breakpointCoverage: this.calculateBreakpointCoverage(styles, config.breakpoints)
    };
  }

  /**
   * Analyze content overflow issues
   */
  private static analyzeOverflow(
    elementId: string,
    selector: string,
    styles: any,
    boxModel: any,
    viewport: { width: number; height: number },
    overflowConfig: any
  ): ResponsiveIssue[] {
    const issues: ResponsiveIssue[] = [];

    const elementWidth = boxModel.width || parseFloat(styles.width) || 0;
    const elementHeight = boxModel.height || parseFloat(styles.height) || 0;

    // Check horizontal overflow (skip JS-injected monitors wider than 2x viewport)
    if (elementWidth > viewport.width && elementWidth < viewport.width * 2) {
      issues.push({
        type: 'content_overflow',
        severity: 'error',
        message: `Element width (${elementWidth}px) exceeds viewport (${viewport.width}px)`,
        elementId,
        selector,
        suggestedFix: 'Use max-width: 100% or responsive sizing',
        codeExample: `${selector} {\n  max-width: 100%;\n  box-sizing: border-box;\n}`,
        context: {
          elementWidth,
          viewportWidth: viewport.width,
          overflow: elementWidth - viewport.width
        },
        breakpoint: this.getCurrentBreakpoint(viewport.width)
      });
    }

    // Check for horizontal scroll issues (skip .table-responsive — intentional Bootstrap pattern)
    if ((styles.overflowX === 'scroll' || styles.overflowX === 'auto') && !selector.includes('.table-responsive')) {
      issues.push({
        type: 'horizontal_scroll',
        severity: 'warning',
        message: 'Horizontal scrolling detected - poor mobile UX',
        elementId,
        selector,
        suggestedFix: 'Use responsive design to avoid horizontal scroll',
        context: { overflowX: styles.overflowX },
        breakpoint: 'mobile'
      });
    }

    // Check text overflow handling
    if (this.isTextElement(selector) && styles.whiteSpace === 'nowrap' && !styles.textOverflow) {
      issues.push({
        type: 'text_overflow',
        severity: 'warning',
        message: 'Text may overflow without proper handling',
        elementId,
        selector,
        suggestedFix: 'Add text-overflow: ellipsis or word-break',
        codeExample: `${selector} {\n  text-overflow: ellipsis;\n  overflow: hidden;\n  white-space: nowrap;\n}`,
        context: { whiteSpace: styles.whiteSpace, hasTextOverflow: !!styles.textOverflow }
      });
    }

    return issues;
  }

  /**
   * Analyze breakpoint consistency
   */
  private static analyzeBreakpointConsistency(
    elementId: string,
    selector: string,
    styles: any,
    currentBreakpoint: string,
    config: any,
    viewportWidth?: number
  ): ResponsiveIssue[] {
    const issues: ResponsiveIssue[] = [];

    // Check for non-mobile-first media queries (would need CSS analysis)
    // This is simplified - real implementation would parse CSS

    // Check for hardcoded sizes that don't scale
    const width = parseFloat(styles.width);
    const height = parseFloat(styles.height);

    // Skip if width ≈ viewport — it's a responsive container, not fixed CSS
    if (viewportWidth && width && Math.abs(width - viewportWidth) < 300) {
      return issues;
    }

    // Skip elements wider than 2x viewport — JS-injected layout monitors (Chart.js etc.)
    if (viewportWidth && width && width > viewportWidth * 2) {
      return issues;
    }

    if (width && width > config.breakpoints.md && (styles.maxWidth === 'none' || !styles.maxWidth)) {
      issues.push({
        type: 'breakpoint_inconsistency',
        severity: 'info',
        message: `Fixed width (${width}px) may not work on smaller screens`,
        elementId,
        selector,
        suggestedFix: 'Use percentage, vw, or media queries for responsive width',
        codeExample: `${selector} {\n  width: 100%;\n  max-width: ${width}px;\n}`,
        context: { fixedWidth: width, suggestedMaxWidth: width }
      });
    }

    // Check font sizes for mobile readability
    const fontSize = parseFloat(styles.fontSize);
    if (fontSize && fontSize < 14 && currentBreakpoint === 'mobile') {
      issues.push({
        type: 'mobile_readability',
        severity: 'warning',
        message: `Font size (${fontSize}px) too small for mobile readability`,
        elementId,
        selector,
        suggestedFix: 'Increase font size to at least 14px on mobile',
        codeExample: `@media (max-width: ${config.breakpoints.sm}px) {\n  ${selector} {\n    font-size: 14px;\n  }\n}`,
        context: { fontSize, minRecommended: 14 }
      });
    }

    return issues;
  }

  /**
   * Analyze mobile readability
   */
  private static analyzeMobileReadability(
    elementId: string,
    selector: string,
    styles: any,
    boxModel: any,
    viewport: { width: number; height: number },
    config: any
  ): ResponsiveIssue[] {
    const issues: ResponsiveIssue[] = [];

    // Check touch target sizes on mobile
    if (viewport.width <= config.breakpoints.sm) {
      const touchTarget = this.calculateTouchTarget(boxModel, styles);
      const minTouchTarget = 44; // WCAG recommendation

      if (touchTarget.width < minTouchTarget || touchTarget.height < minTouchTarget) {
        issues.push({
          type: 'touch_target',
          severity: 'error',
          message: `Touch target too small: ${touchTarget.width}x${touchTarget.height}px (min: ${minTouchTarget}px)`,
          elementId,
          selector,
          suggestedFix: 'Increase padding or size for better touch accessibility',
          codeExample: `${selector} {\n  min-width: ${minTouchTarget}px;\n  min-height: ${minTouchTarget}px;\n  padding: 8px;\n}`,
          learnMoreUrl: 'https://www.w3.org/WAI/WCAG21/Understanding/target-size.html',
          context: {
            touchTarget,
            minRequired: minTouchTarget,
            currentBreakpoint: 'mobile'
          }
        });
      }
    }

    // Check line length on mobile
    if (this.isTextElement(selector) && viewport.width <= config.breakpoints.sm) {
      const containerWidth = boxModel.width || viewport.width;
      const fontSize = parseFloat(styles.fontSize) || 16;
      const charsPerLine = containerWidth / (fontSize * 0.6);

      if (charsPerLine > 40) { // Too long for comfortable mobile reading
        issues.push({
          type: 'mobile_readability',
          severity: 'info',
          message: `Line too long for mobile: ${charsPerLine.toFixed(0)} characters per line`,
          elementId,
          selector,
          suggestedFix: 'Consider increasing font size or adjusting container width',
          context: { charsPerLine, viewportWidth: viewport.width }
        });
      }
    }

    return issues;
  }

  /**
   * Analyze responsive images
   */
  private static analyzeResponsiveImages(
    elementId: string,
    selector: string,
    styles: any,
    viewport: { width: number; height: number },
    config: any
  ): ResponsiveIssue[] {
    const issues: ResponsiveIssue[] = [];

    if (this.isImageElement(selector)) {
      // Check for responsive images
      const hasSrcset = styles.srcset;
      const hasSizes = styles.sizes;

      if (!hasSrcset && viewport.width > config.breakpoints.md) {
        issues.push({
          type: 'responsive_image',
          severity: 'info',
          message: 'Consider using srcset for responsive images',
          elementId,
          selector,
          suggestedFix: 'Add srcset attribute for different screen sizes',
          codeExample: `<img src="small.jpg"\n     srcset="small.jpg 480w, medium.jpg 768w, large.jpg 1024w"\n     sizes="(max-width: 480px) 100vw, (max-width: 768px) 50vw, 33vw" />`,
          learnMoreUrl: 'https://web.dev/serve-responsive-images/',
          context: { hasSrcset: !!hasSrcset, hasSizes: !!hasSizes }
        });
      }

      // Check aspect ratio maintenance
      if (!styles.aspectRatio && !styles.height && styles.width) {
        issues.push({
          type: 'aspect_ratio',
          severity: 'warning',
          message: 'Image may distort without explicit aspect ratio',
          elementId,
          selector,
          suggestedFix: 'Add aspect-ratio or explicit height',
          codeExample: `${selector} {\n  aspect-ratio: 16/9;\n  /* or */\n  height: auto;\n}`,
          context: { hasAspectRatio: false, hasHeight: !!styles.height }
        });
      }
    }

    return issues;
  }

  /**
   * Calculate touch target size
   */
  private static calculateTouchTarget(boxModel: any, styles: any): { width: number; height: number } {
    const padding = this.parseBoxValue(styles.padding);
    const border = this.parseBoxValue(styles.border);

    return {
      width: (boxModel.width || 0) + padding.left + padding.right + border.left + border.right,
      height: (boxModel.height || 0) + padding.top + padding.bottom + border.top + border.bottom
    };
  }

  /**
   * Parse CSS box value (padding, margin, border)
   */
  private static parseBoxValue(value: string): { top: number; right: number; bottom: number; left: number } {
    if (!value) return { top: 0, right: 0, bottom: 0, left: 0 };

    const parts = value.split(' ').map(v => parseFloat(v) || 0);

    switch (parts.length) {
      case 1: return { top: parts[0], right: parts[0], bottom: parts[0], left: parts[0] };
      case 2: return { top: parts[0], right: parts[1], bottom: parts[0], left: parts[1] };
      case 3: return { top: parts[0], right: parts[1], bottom: parts[2], left: parts[1] };
      case 4: return { top: parts[0], right: parts[1], bottom: parts[2], left: parts[3] };
      default: return { top: 0, right: 0, bottom: 0, left: 0 };
    }
  }

  /**
   * Get current breakpoint
   */
  private static getCurrentBreakpoint(viewportWidth: number, breakpoints?: any): string {
    const bp = breakpoints || { sm: 640, md: 768, lg: 1024, xl: 1280, '2xl': 1536 };

    if (viewportWidth < bp.sm) return 'mobile';
    if (viewportWidth < bp.md) return 'tablet';
    if (viewportWidth < bp.lg) return 'desktop';
    if (viewportWidth < bp.xl) return 'large';
    return 'xl';
  }

  /**
   * Check if element is a text container
   */
  private static isTextElement(selector: string): boolean {
    return /p|h[1-6]|span|div|article|section|main/i.test(selector);
  }

  /**
   * Check if element is an image
   */
  private static isImageElement(selector: string): boolean {
    return /img|image|\[src.*\]/i.test(selector);
  }

  /**
   * Check if design is mobile-friendly
   */
  private static isMobileFriendly(issues: ResponsiveIssue[]): boolean {
    const criticalIssues = issues.filter(issue =>
      issue.severity === 'error' && issue.breakpoint === 'mobile'
    );
    return criticalIssues.length === 0;
  }

  /**
   * Calculate breakpoint coverage
   */
  private static calculateBreakpointCoverage(styles: any, breakpoints: any): number {
    // Breakpoint coverage requires CSS media query analysis which is not available
    // from computed styles alone. Return 0 to avoid misleading data.
    return 0;
  }

  /**
   * Generate responsive improvement suggestions
   */
  private static generateResponsiveSuggestions(
    issues: ResponsiveIssue[],
    currentBreakpoint: string,
    config: any
  ): ResponsiveSuggestion[] {
    const suggestions: ResponsiveSuggestion[] = [];

    const overflowIssues = issues.filter(i => i.type === 'content_overflow');
    const readabilityIssues = issues.filter(i => i.type === 'mobile_readability');
    const touchIssues = issues.filter(i => i.type === 'touch_target');

    if (overflowIssues.length > 0) {
      suggestions.push({
        type: 'overflow_fix',
        description: `${overflowIssues.length} elements overflow viewport`,
        action: 'fix_overflow',
        impact: 'high'
      });
    }

    if (readabilityIssues.length > 0) {
      suggestions.push({
        type: 'mobile_optimization',
        description: 'Improve mobile readability and touch targets',
        action: 'optimize_mobile',
        impact: 'medium'
      });
    }

    if (touchIssues.length > 0) {
      suggestions.push({
        type: 'accessibility_improvement',
        description: `${touchIssues.length} touch targets too small for mobile`,
        action: 'increase_touch_targets',
        impact: 'high'
      });
    }

    return suggestions;
  }
}

/**
 * Result of responsive analysis
 */
export interface ResponsiveAnalysis {
  currentBreakpoint: string;
  viewportSize: { width: number; height: number };
  issues: ResponsiveIssue[];
  suggestions: ResponsiveSuggestion[];
  mobileFriendly: boolean;
  breakpointCoverage: number;
}

/**
 * Responsive issue
 */
export interface ResponsiveIssue {
  type: 'content_overflow' | 'horizontal_scroll' | 'text_overflow' | 'breakpoint_inconsistency' | 'mobile_readability' | 'touch_target' | 'responsive_image' | 'aspect_ratio';
  severity: 'info' | 'warning' | 'error';
  message: string;
  elementId: string;
  selector?: string;
  suggestedFix?: string;
  codeExample?: string;
  learnMoreUrl?: string;
  context?: any;
  breakpoint?: string;
}

/**
 * Responsive suggestion
 */
export interface ResponsiveSuggestion {
  type: string;
  description: string;
  action: string;
  impact: 'low' | 'medium' | 'high';
}

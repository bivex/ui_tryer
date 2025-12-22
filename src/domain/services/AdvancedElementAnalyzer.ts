/**
 * Copyright (c) 2025 Pixel Perfect Inspector
 *
 * Author: Pixel Perfect Inspector
 * Available for contact via email: support@b-b.top
 * For up-to-date contact information:
 * https://github.com/bivex
 *
 * Created: 2025-12-22T12:15:00
 * Last Updated: 2025-12-22T11:39:11
 *
 * Licensed under the MIT License.
 * Commercial licensing available upon request.
 */

import {
  ElementInspection,
  Issue,
  IssueType,
  IssueSeverity,
  IssueCategory,
  ElementContext,
  VisualMetrics,
  ElementRelations
} from '../entities/ElementInspection';
import { AdvancedDesignRules, ResponsiveRules, PerformanceRules, ConsistencyRules } from '../entities/AdvancedDesignRules';
import { BoxModel } from '../entities/BoxModel';
import { APCAContrastAnalyzer } from './APCAContrastAnalyzer';
import { VerticalRhythmAnalyzer } from './VerticalRhythmAnalyzer';
import { TypographyAnalyzer } from './TypographyAnalyzer';
import { ColorHarmonyAnalyzer } from './ColorHarmonyAnalyzer';
import { LayoutAnalyzer } from './LayoutAnalyzer';
import { InteractionAnalyzer } from './InteractionAnalyzer';
import { ResponsiveAnalyzer } from './ResponsiveAnalyzer';
import { PerformanceAnalyzer } from './PerformanceAnalyzer';
import { ConsistencyAnalyzer } from './ConsistencyAnalyzer';

/**
 * Advanced element analyzer with sophisticated UI analysis algorithms
 * Implements all the algorithms from the Pixel Perfect Inspector plan
 */
export class AdvancedElementAnalyzer {
  /**
   * Analyze element with all advanced algorithms
   */
  static analyzeElement(
    elementId: string,
    selector: string,
    boxModel: BoxModel,
    computedStyles: any,
    rules: AdvancedDesignRules,
    context?: ElementContext
  ): ElementInspection {
    const issues: Issue[] = [];

    // Phase 1: Critical accessibility and contrast
    issues.push(...this.analyzeAPCAContrast(elementId, selector, computedStyles, rules.apcaContrast));
    issues.push(...this.analyzeAriaCompliance(elementId, selector, computedStyles, rules.accessibility.aria));
    issues.push(...this.analyzeKeyboardNavigation(elementId, selector, computedStyles, rules.accessibility.keyboard));

    // Phase 2: Typography and spacing harmony
    issues.push(...this.analyzeVerticalRhythm(elementId, selector, boxModel, computedStyles, rules.verticalRhythm, context));
    issues.push(...this.analyzeTypographyAdvanced(elementId, selector, computedStyles, rules.typography, context));
    issues.push(...this.analyzeColorHarmony(elementId, selector, computedStyles, rules.colorHarmony));

    // Phase 3: Layout and interaction
    issues.push(...this.analyzeLayoutAdvanced(elementId, selector, boxModel, computedStyles, context, rules.layout));
    issues.push(...this.analyzeInteractionAdvanced(elementId, selector, computedStyles, context?.computedStates, rules.interaction));

    // Phase 4: Advanced analysis
    issues.push(...this.analyzeResponsiveAdvanced(elementId, selector, computedStyles, boxModel, context?.viewport, rules.responsive));
    issues.push(...this.analyzePerformanceAdvanced(elementId, selector, computedStyles, boxModel, rules.performance));
    issues.push(...this.analyzeConsistencyAdvanced(elementId, selector, computedStyles, boxModel, rules.consistency, context?.relations?.nearbyElements));

    return {
      elementId,
      selector,
      boxModel,
      computedStyles,
      issues,
      timestamp: Date.now(),
      context,
      visualMetrics: this.calculateVisualMetrics(computedStyles, rules),
      relations: context?.relations
    };
  }

  /**
   * Phase 1: APCA Contrast Analysis
   */
  private static analyzeAPCAContrast(
    elementId: string,
    selector: string,
    styles: any,
    rules: AdvancedDesignRules['apcaContrast']
  ): Issue[] {
    const issues: Issue[] = [];

    if (!styles || !styles.color || !styles.backgroundColor) return issues;

    const fontSize = parseFloat(styles.fontSize || '16');
    const fontWeight = parseInt(styles.fontWeight || '400');

    // Determine content type
    let contentType: 'body' | 'heading' | 'large' | 'ui' = 'body';
    if (this.isHeading(selector)) {
      contentType = 'heading';
    } else if (fontSize >= 24 || (fontSize >= 18.5 && fontWeight >= 600)) {
      contentType = 'large';
    } else if (this.isUIElement(selector)) {
      contentType = 'ui';
    }

    // Perform APCA analysis
    const result = APCAContrastAnalyzer.isAccessible(
      styles.color,
      styles.backgroundColor,
      rules,
      contentType,
      fontWeight
    );

    if (!result.isAccessible) {
      const severity: IssueSeverity = result.level === 'fail' ? 'error' : 'warning';

      issues.push({
        id: `${elementId}_apca_contrast_${Date.now()}`,
        type: 'apca_contrast_insufficient',
        severity,
        category: 'accessibility',
        message: `APCA contrast ${result.score.toFixed(1)} is below required ${result.required.toFixed(1)} for ${contentType} text`,
        elementId,
        selector,
        suggestedFix: result.suggestions.length > 0
          ? `Try: ${result.suggestions[0].foreground} on ${result.suggestions[0].background}`
          : 'Use colors with sufficient contrast',
        codeExample: result.suggestions.length > 0
          ? `color: ${result.suggestions[0].foreground}; background-color: ${result.suggestions[0].background};`
          : undefined,
        learnMoreUrl: 'https://www.w3.org/WAI/GL/low-vision-a11y-tf/wiki/Contrast_Algorithm',
        context: {
          apcaScore: result.score,
          required: result.required,
          contentType,
          wcagLevel: result.level,
          suggestions: result.suggestions
        }
      });
    }

    return issues;
  }

  /**
   * Phase 1: ARIA Compliance Analysis
   */
  private static analyzeAriaCompliance(
    elementId: string,
    selector: string,
    styles: any,
    rules: AdvancedDesignRules['accessibility']['aria']
  ): Issue[] {
    const issues: Issue[] = [];

    if (!styles) return issues;

    // Check invalid ARIA roles
    if (styles.role && !rules.allowedRoles.includes(styles.role)) {
      issues.push({
        id: `${elementId}_invalid_aria_role_${Date.now()}`,
        type: 'ari-incomplete',
        severity: 'error',
        category: 'accessibility',
        message: `Invalid ARIA role: ${styles.role}`,
        elementId,
        selector,
        suggestedFix: `Use one of: ${rules.allowedRoles.slice(0, 5).join(', ')}...`,
        learnMoreUrl: 'https://www.w3.org/TR/wai-aria-1.1/#role_definitions',
        context: { invalidRole: styles.role, allowedRoles: rules.allowedRoles }
      });
    }

    // Check required ARIA attributes for roles
    if (styles.role && rules.requiredAttributes[styles.role]) {
      const requiredAttrs = rules.requiredAttributes[styles.role];
      const missingAttrs = requiredAttrs.filter((attr: string) => !styles[attr]);

      if (missingAttrs.length > 0) {
        issues.push({
          id: `${elementId}_missing_aria_attrs_${Date.now()}`,
          type: 'ari-incomplete',
          severity: 'error',
          category: 'accessibility',
          message: `Role "${styles.role}" requires attributes: ${missingAttrs.join(', ')}`,
          elementId,
          selector,
          suggestedFix: `Add ${missingAttrs.map((attr: string) => `${attr}=""`).join(' ')}`,
          learnMoreUrl: 'https://www.w3.org/TR/wai-aria-1.1/#role_definitions',
          context: { role: styles.role, missingAttrs, requiredAttrs }
        });
      }
    }

    // Check aria-hidden conflicts
    if (styles['aria-hidden'] === 'true') {
      if (styles.tabIndex && parseInt(styles.tabIndex) >= 0) {
        issues.push({
          id: `${elementId}_aria_hidden_focusable_${Date.now()}`,
          type: 'ari-incomplete',
          severity: 'critical',
          category: 'accessibility',
          message: 'Element with aria-hidden="true" should not be focusable',
          elementId,
          selector,
          suggestedFix: 'Remove tabindex or set aria-hidden="false"',
          learnMoreUrl: 'https://www.w3.org/TR/wai-aria-1.1/#aria-hidden',
          context: { ariaHidden: styles['aria-hidden'], tabIndex: styles.tabIndex }
        });
      }
    }

    // Check for accessible name
    if (this.needsAccessibleName(styles.role) && !this.hasAccessibleName(styles)) {
      issues.push({
        id: `${elementId}_missing_accessible_name_${Date.now()}`,
        type: 'ari-incomplete',
        severity: 'error',
        category: 'accessibility',
        message: `Element with role "${styles.role}" needs an accessible name`,
        elementId,
        selector,
        suggestedFix: 'Add aria-label, aria-labelledby, or visible text content',
        codeExample: 'aria-label="Descriptive label"',
        learnMoreUrl: 'https://www.w3.org/TR/wai-aria-1.1/#namecalculation',
        context: { role: styles.role, nameSources: rules.nameSources }
      });
    }

    return issues;
  }

  /**
   * Phase 1: Keyboard Navigation Analysis
   */
  private static analyzeKeyboardNavigation(
    elementId: string,
    selector: string,
    styles: any,
    rules: AdvancedDesignRules['accessibility']['keyboard']
  ): Issue[] {
    const issues: Issue[] = [];

    if (!styles) return issues;

    if (this.isInteractiveElement(selector)) {
      // Check for focus indicator
      const hasFocusIndicator = styles.outline || styles.boxShadow ||
                               (styles.border && styles.border !== 'none');

      if (!hasFocusIndicator) {
        issues.push({
          id: `${elementId}_missing_focus_indicator_${Date.now()}`,
          type: 'focus_indicator_missing',
          severity: 'error',
          category: 'accessibility',
          message: 'Interactive element missing visible focus indicator',
          elementId,
          selector,
          suggestedFix: 'Add outline, border, or box-shadow for :focus state',
          codeExample: `${selector}:focus {\n  outline: 2px solid #007acc;\n  outline-offset: 2px;\n}`,
          learnMoreUrl: 'https://webaim.org/techniques/keyboard/',
          context: { focusIndicatorMinSize: rules.focusIndicatorMinSize }
        });
      } else if (styles.outline) {
        // Check focus indicator size
        const outlineWidth = parseFloat(styles.outline.split(' ')[0]);
        if (outlineWidth < 2) {
          issues.push({
            id: `${elementId}_thin_focus_indicator_${Date.now()}`,
            type: 'focus_indicator_missing',
            severity: 'warning',
            category: 'accessibility',
            message: `Focus outline too thin (${outlineWidth}px). Minimum: ${rules.focusIndicatorMinSize}px`,
            elementId,
            selector,
            suggestedFix: `Increase outline width to at least ${rules.focusIndicatorMinSize}px`,
            codeExample: `${selector}:focus {\n  outline: ${rules.focusIndicatorMinSize}px solid #007acc;\n}`,
            learnMoreUrl: 'https://webaim.org/techniques/keyboard/'
          });
        }
      }
    }

    // Check tabindex issues
    if (styles.tabIndex) {
      const tabIndex = parseInt(styles.tabIndex);

      if (tabIndex < -1) {
        issues.push({
          id: `${elementId}_invalid_tabindex_${Date.now()}`,
          type: 'keyboard_navigation_broken',
          severity: 'error',
          category: 'accessibility',
          message: `Invalid tabindex value: ${tabIndex}. Should be >= -1`,
          elementId,
          selector,
          suggestedFix: 'Use tabindex="0" to make focusable, or remove tabindex',
          learnMoreUrl: 'https://developer.mozilla.org/en-US/docs/Web/HTML/Global_attributes/tabindex'
        });
      } else if (tabIndex > 0) {
        issues.push({
          id: `${elementId}_high_tabindex_${Date.now()}`,
          type: 'keyboard_navigation_broken',
          severity: 'warning',
          category: 'accessibility',
          message: `High tabindex value (${tabIndex}) may disrupt tab order`,
          elementId,
          selector,
          suggestedFix: 'Avoid positive tabindex values. Use semantic HTML order instead',
          learnMoreUrl: 'https://webaim.org/techniques/keyboard/taborder'
        });
      }
    }

    // Check for elements that should be focusable but aren't
    if (this.shouldBeFocusable(selector) && styles.tabIndex === undefined && !this.isNaturallyFocusable(selector)) {
      issues.push({
        id: `${elementId}_should_be_focusable_${Date.now()}`,
        type: 'keyboard_navigation_broken',
        severity: 'warning',
        category: 'accessibility',
        message: 'Interactive element may not be keyboard accessible',
        elementId,
        selector,
        suggestedFix: 'Add tabindex="0" if element needs keyboard focus',
        learnMoreUrl: 'https://webaim.org/techniques/keyboard/'
      });
    }

    return issues;
  }

  /**
   * Phase 2: Vertical Rhythm Analysis
   */
  private static analyzeVerticalRhythm(
    elementId: string,
    selector: string,
    boxModel: BoxModel,
    styles: any,
    rules: any,
    context?: ElementContext
  ): Issue[] {
    const issues: Issue[] = [];

    if (!styles) return issues;

    // Extract spacings from current element and context
    const spacings = this.extractVerticalSpacings(boxModel, styles);

    if (spacings.length > 0) {
      const analysis = VerticalRhythmAnalyzer.analyzeRhythm(spacings, rules);

      // Convert analysis results to issues
      for (const violation of analysis.violations) {
        issues.push({
          id: `${elementId}_vertical_rhythm_${violation.value}_${Date.now()}`,
          type: 'vertical_rhythm_broken',
          severity: this.mapViolationSeverity(violation.severity),
          category: 'spacing',
          message: `Spacing ${violation.value}px breaks vertical rhythm (suggested: ${violation.expected}px)`,
          elementId,
          selector,
          suggestedFix: `Use ${violation.expected}px (${violation.closestRatio}x baseline)`,
          codeExample: `margin: ${violation.expected}px;`,
          context: {
            violation,
            baseline: analysis.baseline,
            confidence: analysis.confidence
          }
        });
      }

      // Add rhythm improvement suggestions
      if (analysis.suggestions.length > 0) {
        const topSuggestion = analysis.suggestions[0];
        issues.push({
          id: `${elementId}_rhythm_suggestion_${Date.now()}`,
          type: 'vertical_rhythm_broken',
          severity: 'info',
          category: 'spacing',
          message: topSuggestion.description,
          elementId,
          selector,
          suggestedFix: 'Review spacing system for consistency',
          context: { suggestions: analysis.suggestions, harmonics: analysis.harmonics }
        });
      }
    }

    return issues;
  }

  /**
   * Phase 2: Advanced Typography Analysis
   */
  private static analyzeTypographyAdvanced(
    elementId: string,
    selector: string,
    styles: any,
    rules: any,
    context?: ElementContext
  ): Issue[] {
    const issues: Issue[] = [];

    if (!styles) return issues;

    const fontSize = parseFloat(styles.fontSize || '16');
    const lineHeight = parseFloat(styles.lineHeight || '1.5');
    const containerWidth = parseFloat(styles.width) || 800;

    // Perform comprehensive typography analysis
    const analysis = TypographyAnalyzer.analyzeTypography(
      fontSize,
      lineHeight,
      containerWidth,
      undefined, // content not available at this level
      rules
    );

    // Convert analysis results to issues
    for (const issue of analysis.issues) {
      issues.push({
        id: `${elementId}_typography_${issue.type}_${Date.now()}`,
        type: this.mapTypographyIssueType(issue.type),
        severity: issue.severity,
        category: 'typography',
        message: issue.message,
        elementId,
        selector,
        suggestedFix: analysis.suggestions.find(s => s.type === issue.type)?.description || 'Review typography settings',
        codeExample: analysis.suggestions.find(s => s.type === issue.type)?.suggestedValue
          ? `${analysis.suggestions.find(s => s.type === issue.type)?.cssProperty}: ${analysis.suggestions.find(s => s.type === issue.type)?.suggestedValue};`
          : undefined,
        context: {
          typographyMetrics: analysis.metrics,
          optimalLineHeight: analysis.optimalLineHeight,
          readingEase: analysis.readingEase
        }
      });
    }

    // Add typography improvement suggestions
    if (analysis.suggestions.length > 0 && analysis.issues.length === 0) {
      // Only add suggestions if there are no critical issues
      const topSuggestion = analysis.suggestions[0];
      issues.push({
        id: `${elementId}_typography_improvement_${Date.now()}`,
        type: 'line_height_inadequate',
        severity: 'info',
        category: 'typography',
        message: topSuggestion.description,
        elementId,
        selector,
        suggestedFix: 'Consider typography improvements',
        context: { suggestions: analysis.suggestions }
      });
    }

    return issues;
  }

  /**
   * Phase 2: Color Harmony Analysis
   */
  private static analyzeColorHarmony(
    elementId: string,
    selector: string,
    styles: any,
    rules: any
  ): Issue[] {
    const issues: Issue[] = [];

    if (!styles) return issues;

    // Extract colors from current element
    const colors = this.extractColorsFromStyles(styles);

    if (colors.length > 0) {
      const analysis = ColorHarmonyAnalyzer.analyzeHarmony(colors, rules);

      // Convert semantic issues to domain issues
      for (const semanticIssue of analysis.semanticIssues) {
        issues.push({
          id: `${elementId}_semantic_color_${semanticIssue.role}_${Date.now()}`,
          type: 'color_semantics_wrong',
          severity: semanticIssue.severity,
          category: 'color',
          message: semanticIssue.message,
          elementId,
          selector,
          suggestedFix: `Add appropriate ${semanticIssue.role} color`,
          context: { semanticIssue, harmonyScore: analysis.harmonyScore }
        });
      }

      // Convert consistency issues to domain issues
      for (const consistencyIssue of analysis.consistencyIssues) {
        issues.push({
          id: `${elementId}_color_consistency_${consistencyIssue.type}_${Date.now()}`,
          type: 'color_harmony_broken',
          severity: consistencyIssue.severity,
          category: 'color',
          message: consistencyIssue.message,
          elementId,
          selector,
          suggestedFix: consistencyIssue.type === 'saturation_variance'
            ? 'Adjust color saturations for consistency'
            : 'Adjust color lightness values for better hierarchy',
          context: {
            consistencyIssue,
            scheme: analysis.scheme,
            harmonyScore: analysis.harmonyScore
          }
        });
      }

      // Add harmony improvement suggestions
      if (analysis.scheme?.type === 'unknown' && analysis.suggestions.length > 0) {
        const topSuggestion = analysis.suggestions[0];
        issues.push({
          id: `${elementId}_harmony_suggestion_${Date.now()}`,
          type: 'color_harmony_broken',
          severity: 'info',
          category: 'color',
          message: topSuggestion.description,
          elementId,
          selector,
          suggestedFix: 'Consider adopting a color scheme',
          context: {
            suggestions: analysis.suggestions,
            harmonyScore: analysis.harmonyScore
          }
        });
      }
    }

    return issues;
  }

  /**
   * Phase 3: Advanced Layout Analysis
   */
  private static analyzeLayoutAdvanced(
    elementId: string,
    selector: string,
    boxModel: any,
    styles: any,
    context?: ElementContext,
    rules?: any
  ): Issue[] {
    const issues: Issue[] = [];

    if (!styles) return issues;

    // Prepare nearby elements data
    const nearbyElements = context?.relations?.nearbyElements?.map(nearby => ({
      id: nearby.id,
      left: nearby.distance, // Simplified - would need actual positioning
      right: nearby.distance,
      top: nearby.distance,
      bottom: nearby.distance,
      centerX: nearby.distance,
      centerY: nearby.distance
    })) || [];

    const analysis = LayoutAnalyzer.analyzeLayout(
      elementId,
      selector,
      boxModel,
      styles,
      nearbyElements,
      rules
    );

    // Convert analysis results to issues
    for (const issue of analysis.issues) {
      issues.push({
        id: `${elementId}_layout_${issue.type}_${Date.now()}`,
        type: issue.type as IssueType,
        severity: issue.severity,
        category: 'layout',
        message: issue.message,
        elementId,
        selector,
        suggestedFix: issue.suggestedFix,
        codeExample: issue.context?.suggestedCss,
        learnMoreUrl: issue.learnMoreUrl,
        context: issue.context
      });
    }

    return issues;
  }

  /**
   * Phase 3: Advanced Interaction Analysis
   */
  private static analyzeInteractionAdvanced(
    elementId: string,
    selector: string,
    styles: any,
    computedStates?: any,
    rules?: any
  ): Issue[] {
    const issues: Issue[] = [];

    if (!styles) return issues;

    const analysis = InteractionAnalyzer.analyzeInteraction(
      elementId,
      selector,
      styles,
      computedStates,
      rules
    );

    // Convert analysis results to issues
    for (const issue of analysis.issues) {
      issues.push({
        id: `${elementId}_interaction_${issue.type}_${Date.now()}`,
        type: issue.type as IssueType,
        severity: issue.severity,
        category: 'interaction',
        message: issue.message,
        elementId,
        selector,
        suggestedFix: issue.suggestedFix,
        codeExample: issue.codeExample,
        learnMoreUrl: issue.learnMoreUrl,
        context: issue.context
      });
    }

    return issues;
  }


  /**
   * Phase 4: Responsive Analysis
   */
  private static analyzeResponsive(
    elementId: string,
    selector: string,
    boxModel: BoxModel,
    styles: any,
    rules: ResponsiveRules,
    context?: ElementContext
  ): Issue[] {
    const issues: Issue[] = [];

    if (!styles) return issues;

    if (context?.viewport) {
      const viewportWidth = context.viewport.width;
      const elementWidth = boxModel.totalWidth;

      if (elementWidth > viewportWidth) {
        issues.push({
          id: `${elementId}_responsive_overflow_${Date.now()}`,
          type: 'responsive_overflow',
          severity: 'error',
          category: 'responsive',
          message: `Element width ${elementWidth}px exceeds viewport ${viewportWidth}px`,
          elementId,
          selector,
          suggestedFix: 'Use max-width: 100% or responsive sizing',
          context: { elementWidth, viewportWidth }
        });
      }
    }

    return issues;
  }

  /**
   * Phase 4: Performance Analysis
   */
  private static analyzePerformance(
    elementId: string,
    selector: string,
    styles: any,
    rules: PerformanceRules
  ): Issue[] {
    const issues: Issue[] = [];

    if (!styles) return issues;

    // Check for potential layout shifts
    if (this.isImageElement(selector) && (!styles.width || !styles.height)) {
      issues.push({
        id: `${elementId}_layout_shift_${Date.now()}`,
        type: 'layout_shift_potential',
        severity: 'warning',
        category: 'performance',
        message: 'Image without explicit dimensions may cause layout shift',
        elementId,
        selector,
        suggestedFix: 'Add width and height attributes',
        learnMoreUrl: 'https://web.dev/cls/'
      });
    }

    return issues;
  }

  /**
   * Phase 4: Consistency Analysis
   */
  private static analyzeConsistency(
    elementId: string,
    selector: string,
    styles: any,
    rules: ConsistencyRules,
    context?: ElementContext
  ): Issue[] {
    const issues: Issue[] = [];

    if (!styles) return issues;

    // Check for hardcoded values vs design tokens
    if (this.usesHardcodedColor(styles.backgroundColor)) {
      issues.push({
        id: `${elementId}_hardcoded_color_${Date.now()}`,
        type: 'design_token_mismatch',
        severity: 'info',
        category: 'consistency',
        message: 'Using hardcoded color instead of design token',
        elementId,
        selector,
        suggestedFix: 'Use CSS custom property like var(--color-primary)',
        context: { color: styles.backgroundColor }
      });
    }

    return issues;
  }

  /**
   * Calculate visual metrics for the element
   */
  private static calculateVisualMetrics(styles: any, rules: AdvancedDesignRules): VisualMetrics {
    if (!styles) {
      return {
        visualWeight: 0,
        focusScore: 0,
        contrastScore: 0,
        harmonyScore: 0,
        opticalAlignment: {
          visualCenterX: 0,
          visualCenterY: 0,
          opticalShiftX: 0,
          opticalShiftY: 0,
        },
      };
    }

    const visualWeight = this.calculateVisualWeight(styles);
    const focusScore = this.calculateFocusScore(styles);
    const contrastScore = this.calculateAPCAScore(styles.color, styles.backgroundColor);
    const harmonyScore = this.calculateHarmonyScore(styles);

    return {
      visualWeight,
      focusScore,
      contrastScore,
      harmonyScore,
      typography: this.extractTypographyMetrics(styles, rules.typography),
      opticalAlignment: this.calculateOpticalAlignment(styles)
    };
  }

  // Helper methods
  private static calculateAPCAScore(foreground: string, background: string): number {
    // Simplified APCA calculation - in real implementation would use proper color math
    // This is a placeholder for the actual APCA algorithm
    const fgLum = this.getLuminance(foreground);
    const bgLum = this.getLuminance(background);

    if (bgLum > fgLum) {
      return (bgLum ** 0.56 - fgLum ** 0.57) * 1.14 * 100;
    } else {
      return (bgLum ** 0.65 - fgLum ** 0.62) * 1.14 * 100;
    }
  }

  private static getLuminance(color: string): number {
    // Simplified luminance calculation
    // Real implementation would parse RGB/HSL properly
    return 0.5; // placeholder
  }

  private static isHeading(selector: string): boolean {
    return /h[1-6]/i.test(selector);
  }

  private static isInteractiveElement(selector: string): boolean {
    return /button|a|input|select|textarea|\[role=button\]|\[role=link\]|\[role=tab\]|\[tabindex\]/i.test(selector);
  }

  private static isUIElement(selector: string): boolean {
    return /button|input|select|textarea|\[role=button\]|\[role=checkbox\]|\[role=radio\]/i.test(selector);
  }

  private static extractVerticalSpacings(boxModel: BoxModel, styles: any): number[] {
    const spacings: number[] = [];
    if (boxModel.marginTop) spacings.push(boxModel.marginTop);
    if (boxModel.marginBottom) spacings.push(boxModel.marginBottom);
    if (boxModel.paddingTop) spacings.push(boxModel.paddingTop);
    if (boxModel.paddingBottom) spacings.push(boxModel.paddingBottom);
    return spacings;
  }

  private static detectBaseSpacing(spacings: number[]): number {
    if (spacings.length === 0) return 4; // default
    return Math.min(...spacings.filter(s => s > 0));
  }

  private static getOptimalLineHeight(fontSize: number, ratios: any): number {
    if (fontSize <= 12) return ratios.small;
    if (fontSize <= 16) return ratios.body;
    if (fontSize <= 24) return ratios.subheading;
    if (fontSize <= 36) return ratios.heading;
    return ratios.display;
  }

  private static extractColorsFromStyles(styles: any): string[] {
    if (!styles) return [];

    const colors: string[] = [];
    if (styles.color) colors.push(styles.color);
    if (styles.backgroundColor) colors.push(styles.backgroundColor);
    if (styles.borderColor) colors.push(styles.borderColor);
    return colors;
  }

  private static rgbToHsl(color: string): { h: number; s: number; l: number } {
    // Simplified HSL conversion - real implementation would parse RGB properly
    return { h: 0, s: 0.5, l: 0.5 };
  }

  private static standardDeviation(values: number[]): number {
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    const squareDiffs = values.map(v => (v - mean) ** 2);
    return Math.sqrt(squareDiffs.reduce((a, b) => a + b, 0) / values.length);
  }

  private static calculateVisualWeight(styles: any): number {
    if (!styles) return 0;

    let weight = 0;
    if (styles.width && styles.height) {
      weight += (parseFloat(styles.width) * parseFloat(styles.height)) / 1000;
    }
    if (styles.fontWeight) {
      weight += (parseInt(styles.fontWeight) - 400) / 100 * 10;
    }
    return weight;
  }

  private static calculateFocusScore(styles: any): number {
    if (!styles) return 0;

    let score = 0;
    if (styles.fontSize) score += parseFloat(styles.fontSize) / 10;
    if (styles.fontWeight) score += (parseInt(styles.fontWeight) - 400) / 100;
    return score;
  }

  private static calculateHarmonyScore(styles: any): number {
    if (!styles) return 0;

    // Simplified harmony calculation
    return 0.8; // placeholder
  }

  private static extractTypographyMetrics(styles: any, rules: any): any {
    if (!styles) return {};

    const fontSize = parseFloat(styles.fontSize);
    const containerWidth = parseFloat(styles.width) || 800;
    const charsPerLine = containerWidth / (fontSize * 0.6);

    return {
      lineLength: charsPerLine,
      lineHeightRatio: parseFloat(styles.lineHeight) / fontSize,
      fontSize,
      readingEase: this.calculateReadingEase(charsPerLine, parseFloat(styles.lineHeight) / fontSize)
    };
  }

  private static calculateReadingEase(lineLength: number, lineHeightRatio: number): number {
    // Simplified reading ease calculation
    let ease = 100;
    if (lineLength > 75) ease -= (lineLength - 75) * 0.5;
    if (lineHeightRatio < 1.4) ease -= (1.4 - lineHeightRatio) * 20;
    return Math.max(0, ease);
  }

  private static calculateOpticalAlignment(styles: any): any {
    if (!styles) return {};

    // Placeholder for optical alignment calculation
    return {
      visualCenterX: 0,
      visualCenterY: 0,
      opticalShiftX: 0,
      opticalShiftY: 0
    };
  }

  private static isImageElement(selector: string): boolean {
    return /img|image/i.test(selector);
  }

  private static usesHardcodedColor(color: string): boolean {
    // Check if color is not a CSS custom property
    return color && !color.startsWith('var(') && !color.includes('currentColor');
  }

  private static needsAccessibleName(role?: string): boolean {
    const rolesNeedingName = ['button', 'link', 'checkbox', 'radio', 'tab', 'combobox', 'listbox'];
    return role ? rolesNeedingName.includes(role) : false;
  }

  private static hasAccessibleName(styles: any): boolean {
    if (!styles) return false;

    // Check for aria-label
    if (styles['aria-label'] && styles['aria-label'].trim()) {
      return true;
    }

    // Check for aria-labelledby (would need DOM access to verify)
    if (styles['aria-labelledby']) {
      return true; // Assume it's valid for now
    }

    // Check for visible text content (simplified check)
    // In real implementation, would need to check actual text content
    return false;
  }

  private static shouldBeFocusable(selector: string): boolean {
    // Elements that are interactive and should be keyboard accessible
    return /button|input|select|textarea|a\[href\]|\[role=button\]|\[role=link\]|\[role=tab\]/i.test(selector);
  }

  private static isNaturallyFocusable(selector: string): boolean {
    // Elements that are naturally focusable in browsers
    return /input|select|textarea|a\[href\]|button|iframe|object|embed/i.test(selector);
  }

  private static mapViolationSeverity(severity: 'minor' | 'moderate' | 'major'): IssueSeverity {
    switch (severity) {
      case 'major': return 'error';
      case 'moderate': return 'warning';
      case 'minor': return 'info';
      default: return 'info';
    }
  }

  private static mapTypographyIssueType(type: string): IssueType {
    switch (type) {
      case 'line_length': return 'line_length_too_long';
      case 'line_height': return 'line_height_inadequate';
      case 'widow': return 'orphans_widows_present';
      case 'orphan': return 'orphans_widows_present';
      default: return 'line_height_inadequate';
    }
  }

  /**
   * Phase 4: Advanced Responsive Analysis
   */
  private static analyzeResponsiveAdvanced(
    elementId: string,
    selector: string,
    styles: any,
    boxModel: any,
    viewport?: { width: number; height: number },
    rules?: any
  ): Issue[] {
    const issues: Issue[] = [];

    if (!styles) return issues;

    const analysis = ResponsiveAnalyzer.analyzeResponsive(
      elementId,
      selector,
      styles,
      boxModel,
      viewport,
      rules
    );

    // Convert analysis results to issues
    for (const issue of analysis.issues) {
      issues.push({
        id: `${elementId}_responsive_${issue.type}_${Date.now()}`,
        type: issue.type as IssueType,
        severity: issue.severity,
        category: 'responsive',
        message: issue.message,
        elementId,
        selector,
        suggestedFix: issue.suggestedFix,
        codeExample: issue.codeExample,
        learnMoreUrl: issue.learnMoreUrl,
        context: issue.context
      });
    }

    return issues;
  }

  /**
   * Phase 4: Advanced Performance Analysis
   */
  private static analyzePerformanceAdvanced(
    elementId: string,
    selector: string,
    styles: any,
    boxModel: any,
    rules?: any
  ): Issue[] {
    const issues: Issue[] = [];

    if (!styles) return issues;

    const analysis = PerformanceAnalyzer.analyzePerformance(
      elementId,
      selector,
      styles,
      boxModel,
      rules
    );

    // Convert analysis results to issues
    for (const issue of analysis.issues) {
      issues.push({
        id: `${elementId}_performance_${issue.type}_${Date.now()}`,
        type: issue.type as IssueType,
        severity: issue.severity,
        category: 'performance',
        message: issue.message,
        elementId,
        selector,
        suggestedFix: issue.suggestedFix,
        codeExample: issue.codeExample,
        learnMoreUrl: issue.learnMoreUrl,
        context: issue.context
      });
    }

    return issues;
  }

  /**
   * Phase 4: Advanced Consistency Analysis
   */
  private static analyzeConsistencyAdvanced(
    elementId: string,
    selector: string,
    styles: any,
    boxModel: any,
    rules?: any,
    similarElements?: any[]
  ): Issue[] {
    const issues: Issue[] = [];

    if (!styles) return issues;

    const analysis = ConsistencyAnalyzer.analyzeConsistency(
      elementId,
      selector,
      styles,
      boxModel,
      rules,
      similarElements
    );

    // Convert analysis results to issues
    for (const issue of analysis.issues) {
      issues.push({
        id: `${elementId}_consistency_${issue.type}_${Date.now()}`,
        type: issue.type as IssueType,
        severity: issue.severity,
        category: 'consistency',
        message: issue.message,
        elementId,
        selector,
        suggestedFix: issue.suggestedFix,
        codeExample: issue.codeExample,
        context: issue.context
      });
    }

    return issues;
  }
}
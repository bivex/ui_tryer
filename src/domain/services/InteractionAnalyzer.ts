/**
 * Copyright (c) 2025 Pixel Perfect Inspector
 *
 * Author: Pixel Perfect Inspector
 * Available for contact via email: support@b-b.top
 * For up-to-date contact information:
 * https://github.com/bivex
 *
 * Created: 2025-12-22T15:15:00
 * Last Updated: 2025-12-22T15:15:00
 *
 * Licensed under the MIT License.
 * Commercial licensing available upon request.
 */

/**
 * Interaction analyzer for interactive elements and states
 * Handles state styles, loading states, and layout shift prevention
 */
export class InteractionAnalyzer {
  /**
   * Analyze interaction properties of an element
   */
  static analyzeInteraction(
    elementId: string,
    selector: string,
    styles: any,
    computedStates?: any,
    rules?: any
  ): InteractionAnalysis {
    const stateAnalysis = this.analyzeStates(elementId, selector, styles, computedStates, rules);
    const loadingAnalysis = this.analyzeLoadingStates(elementId, selector, styles, rules?.loading);
    // CLS prevention is handled by PerformanceAnalyzer to avoid duplicate issues

    const issues: InteractionIssue[] = [
      ...stateAnalysis.issues,
      ...loadingAnalysis.issues
    ];

    return {
      states: stateAnalysis,
      loading: loadingAnalysis,
      issues,
      suggestions: this.generateInteractionSuggestions(issues, rules)
    };
  }

  /**
   * Analyze interactive states (hover, focus, active, etc.)
   */
  private static analyzeStates(
    elementId: string,
    selector: string,
    styles: any,
    computedStates?: any,
    rules?: any
  ): StateAnalysis {
    const issues: InteractionIssue[] = [];
    const config = rules?.requiredStates || ['hover', 'focus', 'active'];
    const minDiffThreshold = rules?.stateVisibility?.minDifference ?? 0.1;

    const isInteractive = this.isInteractiveElement(selector, styles);

    if (!isInteractive) {
      return {
        hasStates: false,
        missingStates: [],
        stateDifferences: {},
        issues: []
      };
    }

    const availableStates = computedStates || {};
    const missingStates: string[] = [];
    const stateDifferences: { [state: string]: StateDifference } = {};

    for (const state of config) {
      const stateStyles = availableStates[state];

      if (!stateStyles || Object.keys(stateStyles).length === 0) {
        const severity = state === 'focus' ? 'error' : state === 'hover' ? 'warning' : 'info';
        missingStates.push(state);

        issues.push({
          type: 'state_styles_missing',
          severity,
          message: `Missing :${state} state styles for interactive element`,
          elementId,
          selector,
          suggestedFix: `Add styles for :${state} { /* visual feedback */ }`,
          codeExample: `${selector}:${state} {\n  /* Add visual changes like color, background, transform */\n}`,
          learnMoreUrl: state === 'focus' ? 'https://webaim.org/techniques/keyboard/' : undefined,
          context: { missingState: state, isInteractive }
        });
      } else {
        // Analyze state differences
        const differences = this.calculateStateDifferences(styles, stateStyles);
        stateDifferences[state] = differences;

        if (differences.perceptibleDifference < minDiffThreshold) {
          issues.push({
            type: 'state_styles_missing',
            severity: state === 'focus' ? 'error' : 'warning',
            message: `:${state} state barely differs from default state`,
            elementId,
            selector,
            suggestedFix: `Increase visual difference for :${state} state`,
            context: { state, difference: differences.perceptibleDifference }
          });
        }
      }
    }

    // Check for transition/animation
    const hasTransition = styles.transition || styles.animation || 
                         (styles.transitionDuration && styles.transitionDuration !== '0s') ||
                         (styles.transitionProperty && styles.transitionProperty !== 'none');
    if (!hasTransition && missingStates.length === 0) {
      issues.push({
        type: 'transition_inadequate',
        severity: 'info',
        message: 'Consider adding transition for smooth state changes',
        elementId,
        selector,
        suggestedFix: 'Add transition: all 0.2s ease-in-out',
        codeExample: `${selector} {\n  transition: all 0.2s ease-in-out;\n}`,
        context: { hasTransition: false }
      });
    }

    return {
      hasStates: missingStates.length < config.length,
      missingStates,
      stateDifferences,
      issues
    };
  }

  /**
   * Analyze loading states and skeleton screens
   */
  private static analyzeLoadingStates(
    elementId: string,
    selector: string,
    styles: any,
    loadingRules?: any
  ): LoadingAnalysis {
    const issues: InteractionIssue[] = [];
    const config = loadingRules || {
      skeletonRequired: true,
      layoutShiftTolerance: 20,
      loadingIndicatorRequired: true
    };

    const hasLoadingClass = selector.includes('loading') || selector.includes('skeleton');
    const hasLoadingIndicator = styles.opacity === '0.5' || styles.visibility === 'hidden' ||
                               styles.display === 'none' || hasLoadingClass;

    // Check for potential layout shift during loading
    if (this.isImageElement(selector)) {
      const hasDimensions = styles.width && styles.height &&
                           styles.width !== 'auto' && styles.height !== 'auto';

      if (!hasDimensions) {
        issues.push({
          type: 'layout_shift_potential',
          severity: 'warning',
          message: 'Image without explicit dimensions may cause layout shift',
          elementId,
          selector,
          suggestedFix: 'Add width and height attributes or CSS dimensions',
          codeExample: `${selector} {\n  width: 400px;\n  height: 300px;\n}`,
          learnMoreUrl: 'https://web.dev/cls/',
          context: { hasDimensions: false, elementType: 'image' }
        });
      }
    }

    // Check for loading state indicators
    if (hasLoadingIndicator && !hasLoadingClass) {
      issues.push({
        type: 'loading_state_missing',
        severity: 'info',
        message: 'Loading state detected but no proper loading indicator',
        elementId,
        selector,
        suggestedFix: 'Add loading spinner or skeleton screen',
        context: { hasLoadingIndicator: true, hasProperIndicator: false }
      });
    }

    return {
      hasLoadingState: hasLoadingIndicator,
      hasProperIndicator: hasLoadingClass,
      preventsLayoutShift: this.checksContentShiftPrevention(styles),
      issues
    };
  }

  /**
   * Analyze Cumulative Layout Shift (CLS) prevention
   */
  private static analyzeCLSPrevention(
    elementId: string,
    selector: string,
    styles: any,
    clsRules?: any
  ): CLSPreventionAnalysis {
    const issues: InteractionIssue[] = [];
    const config = clsRules || {
      imageDimensionsRequired: true,
      fontLoadingStrategy: 'swap',
      dynamicContentSpaceReserved: true
    };

    // Check images
    if (this.isImageElement(selector)) {
      const hasDimensions = styles.width && styles.height &&
                           styles.width !== 'auto' && styles.height !== 'auto';
      const hasAspectRatio = styles.aspectRatio || styles.width && styles.height;

      if (!hasDimensions && !hasAspectRatio) {
        issues.push({
          type: 'layout_shift_potential',
          severity: 'error',
          message: 'Image lacks dimensions or aspect ratio, will cause CLS',
          elementId,
          selector,
          suggestedFix: 'Add width, height, or aspect-ratio',
          codeExample: `<img src="..." width="400" height="300" />\n/* or */\nimg {\n  aspect-ratio: 4/3;\n}`,
          learnMoreUrl: 'https://web.dev/cls/',
          context: { hasDimensions: false, hasAspectRatio: false }
        });
      }
    }

    // Check dynamic content
    if (this.isDynamicContent(selector)) {
      const hasMinHeight = styles.minHeight && parseFloat(styles.minHeight) > 0;
      const hasReservedSpace = hasMinHeight || styles.aspectRatio;

      if (!hasReservedSpace) {
        issues.push({
          type: 'layout_shift_potential',
          severity: 'warning',
          message: 'Dynamic content may cause layout shift without reserved space',
          elementId,
          selector,
          suggestedFix: 'Add min-height or aspect-ratio for dynamic content',
          codeExample: `${selector} {\n  min-height: 200px;\n  /* or reserve space for content */\n}`,
          context: { hasMinHeight: false, isDynamic: true }
        });
      }
    }


    return {
      preventsImageShift: this.checksImageShiftPrevention(styles),
      preventsContentShift: this.checksContentShiftPrevention(styles),
      hasFontOptimization: this.checksFontOptimization(styles),
      issues
    };
  }

  /**
   * Check if element is interactive
   */
  private static isInteractiveElement(selector: string, styles?: any): boolean {
    const interactiveSelectors = /button|a\[href\]|\[role=button\]|\[role=link\]|\[role=tab\]|\[tabindex\]/i;
    const interactiveTags = /input|select|textarea/i;

    return interactiveSelectors.test(selector) ||
           (styles && (styles.cursor === 'pointer' || styles.tabIndex !== undefined)) ||
           interactiveTags.test(selector);
  }

  /**
   * Calculate differences between default and state styles
   */
  private static calculateStateDifferences(defaultStyles: any, stateStyles: any): StateDifference {
    const differences: { [property: string]: { from: any, to: any, difference: number } } = {};
    let perceptibleDifference = 0;

    // Compare key visual properties
    const visualProperties = ['color', 'backgroundColor', 'borderColor', 'boxShadow', 'transform', 'opacity', 'outline', 'outlineColor', 'outlineWidth'];

    for (const prop of visualProperties) {
      const defaultValue = defaultStyles[prop];
      const stateValue = stateStyles[prop];

      if (defaultValue !== stateValue) {
        const difference = this.calculatePropertyDifference(prop, defaultValue, stateValue);
        differences[prop] = {
          from: defaultValue,
          to: stateValue,
          difference
        };
        perceptibleDifference += difference;
      }
    }

    return {
      perceptibleDifference: Math.min(perceptibleDifference, 1),
      propertyDifferences: differences
    };
  }

  /**
   * Calculate difference between two property values
   */
  private static calculatePropertyDifference(property: string, value1: any, value2: any): number {
    if (!value1 || !value2 || value1 === value2) return 0;

    switch (property) {
      case 'color':
      case 'backgroundColor':
      case 'borderColor':
        // Simplified color difference (would need proper color math)
        return value1 !== value2 ? 0.3 : 0;

      case 'opacity':
        const opacity1 = parseFloat(value1) || 1;
        const opacity2 = parseFloat(value2) || 1;
        return Math.abs(opacity1 - opacity2);

      case 'boxShadow':
        return value1 !== value2 ? 0.4 : 0;

      case 'outline':
      case 'outlineWidth':
        return value1 !== value2 ? 0.5 : 0;

      case 'transform':
        return value1 !== value2 ? 0.4 : 0;

      default:
        return 0.1; // Small difference for any change
    }
  }

  /**
   * Check if element is an image
   */
  private static isImageElement(selector: string): boolean {
    return /img|image|\[src.*\]/i.test(selector);
  }

  /**
   * Check if element contains dynamic content
   */
  private static isDynamicContent(selector: string): boolean {
    return /comment|post|article|feed|stream/i.test(selector);
  }

  /**
   * Check if styles prevent image layout shift
   */
  private static checksImageShiftPrevention(styles: any): boolean {
    return !!(styles.width && styles.height) || !!styles.aspectRatio;
  }

  /**
   * Check if styles prevent content layout shift
   */
  private static checksContentShiftPrevention(styles: any): boolean {
    return !!(styles.minHeight && parseFloat(styles.minHeight) > 0) || !!styles.aspectRatio;
  }

  /**
   * Check if styles optimize font loading
   */
  private static checksFontOptimization(styles: any): boolean {
    // This would need to check @font-face rules, simplified check
    return styles.fontFamily && styles.fontFamily.includes('font-display');
  }

  /**
   * Generate interaction improvement suggestions
   */
  private static generateInteractionSuggestions(issues: InteractionIssue[], rules?: any): InteractionSuggestion[] {
    const suggestions: InteractionSuggestion[] = [];

    const stateIssues = issues.filter(i => i.type === 'state_styles_missing');
    const loadingIssues = issues.filter(i => i.type === 'loading_state_missing');

    if (stateIssues.length > 0) {
      suggestions.push({
        type: 'state_improvement',
        description: `${stateIssues.length} interactive elements lack proper state styles`,
        action: 'add_state_styles',
        impact: 'high'
      });
    }

    if (loadingIssues.length > 0) {
      suggestions.push({
        type: 'loading_improvement',
        description: 'Loading states need better user feedback',
        action: 'add_loading_indicators',
        impact: 'medium'
      });
    }

    return suggestions;
  }
}

/**
 * Result of interaction analysis
 */
export interface InteractionAnalysis {
  states: StateAnalysis;
  loading: LoadingAnalysis;
  issues: InteractionIssue[];
  suggestions: InteractionSuggestion[];
}

/**
 * State analysis result
 */
export interface StateAnalysis {
  hasStates: boolean;
  missingStates: string[];
  stateDifferences: { [state: string]: StateDifference };
  issues: InteractionIssue[];
}

/**
 * Loading analysis result
 */
export interface LoadingAnalysis {
  hasLoadingState: boolean;
  hasProperIndicator: boolean;
  preventsLayoutShift: boolean;
  issues: InteractionIssue[];
}

/**
 * CLS prevention analysis result
 */
export interface CLSPreventionAnalysis {
  preventsImageShift: boolean;
  preventsContentShift: boolean;
  hasFontOptimization: boolean;
  issues: InteractionIssue[];
}

/**
 * Interaction issue
 */
export interface InteractionIssue {
  type: 'state_styles_missing' | 'transition_inadequate' | 'loading_state_missing' | 'layout_shift_potential';
  severity: 'info' | 'warning' | 'error';
  message: string;
  elementId: string;
  selector?: string;
  suggestedFix?: string;
  codeExample?: string;
  learnMoreUrl?: string;
  context?: any;
}

/**
 * Interaction suggestion
 */
export interface InteractionSuggestion {
  type: string;
  description: string;
  action: string;
  impact: 'low' | 'medium' | 'high';
}

/**
 * State difference analysis
 */
export interface StateDifference {
  perceptibleDifference: number;
  propertyDifferences: { [property: string]: { from: any, to: any, difference: number } };
}

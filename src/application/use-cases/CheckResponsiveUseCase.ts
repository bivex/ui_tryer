/**
 * Copyright (c) 2025 Pixel Perfect Inspector
 *
 * Author: Pixel Perfect Inspector
 * Available for contact via email: support@b-b.top
 * For up-to-date contact information:
 * https://github.com/bivex
 *
 * Created: 2025-12-22T07:28:49
 * Last Updated: 2025-12-22T11:34:34
 *
 * Licensed under the MIT License.
 * Commercial licensing available upon request.
 */

import { ResponsiveChecker } from '../../domain/services/ResponsiveChecker';
import { ElementInspection } from '../../domain/entities/ElementInspection';
import { DesignRules, TailwindBreakpoint } from '../../domain/entities/DesignRules';

/**
 * Use case for checking responsive behavior
 * Analyzes how elements behave at different viewport sizes
 */
export class CheckResponsiveUseCase {
  /**
   * Executes responsive check for current viewport
   */
  async execute(input: CheckResponsiveInput): Promise<CheckResponsiveOutput> {
    try {
      this.validateInput(input);

      // Use domain service to check responsive behavior
      const issues = ResponsiveChecker.checkResponsiveBehavior(
        input.elements,
        input.viewportSize,
        input.rules
      );

      // Generate screenshot if requested
      let screenshot: string | undefined;
      if (input.includeScreenshot) {
        // This would be handled by infrastructure layer
        // For now, we'll return placeholder
        screenshot = await this.captureScreenshot(input.viewportSize);
      }

      return {
        success: true,
        issues,
        viewportSize: input.viewportSize,
        screenshot,
        summary: this.createSummary(issues),
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error during responsive check',
        issues: [],
        viewportSize: input.viewportSize,
        summary: this.createEmptySummary(),
      };
    }
  }

  /**
   * Gets a representative viewport size for a Tailwind breakpoint
   */
  private getViewportForBreakpoint(breakpoint: TailwindBreakpoint): { width: number; height: number } {
    // Use minWidth as base and add some padding for realistic viewport
    const width = breakpoint.minWidth;
    const height = 800; // Standard desktop height, adjust based on device type

    return { width, height };
  }

  /**
   * Checks responsive behavior when switching breakpoints
   */
  async executeBreakpointTransition(
    input: CheckBreakpointTransitionInput
  ): Promise<CheckBreakpointTransitionOutput> {
    try {
      this.validateBreakpointTransitionInput(input);

      // Check compatibility between breakpoints
      const transitionIssues = ResponsiveChecker.validateBreakpointCompatibility(
        input.elements,
        input.fromBreakpoint,
        input.toBreakpoint,
        input.rules
      );

      // Check elements at target breakpoint
      const targetViewport = this.getViewportForBreakpoint(input.toBreakpoint);

      const targetIssues = ResponsiveChecker.checkResponsiveBehavior(
        input.elements,
        targetViewport,
        input.rules
      );

      const allIssues = [...transitionIssues, ...targetIssues];

      return {
        success: true,
        issues: allIssues,
        fromBreakpoint: input.fromBreakpoint,
        toBreakpoint: input.toBreakpoint,
        transitionIssues,
        targetIssues,
        summary: this.createSummary(allIssues),
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error during breakpoint transition check',
        issues: [],
        fromBreakpoint: input.fromBreakpoint,
        toBreakpoint: input.toBreakpoint,
        transitionIssues: [],
        targetIssues: [],
        summary: this.createEmptySummary(),
      };
    }
  }

  /**
   * Simulates different breakpoints and returns issues for each
   */
  async executeMultiBreakpointCheck(
    input: CheckMultiBreakpointInput
  ): Promise<CheckMultiBreakpointOutput> {
    try {
      this.validateMultiBreakpointInput(input);

      const results: BreakpointCheckResult[] = [];

      for (const breakpoint of input.breakpoints) {
        const viewportSize = this.getViewportForBreakpoint(breakpoint);

        const issues = ResponsiveChecker.checkResponsiveBehavior(
          input.elements,
          viewportSize,
          input.rules
        );

        results.push({
          breakpoint,
          issues,
          summary: this.createSummary(issues),
          viewportSize,
        });
      }

      const overallSummary = this.createOverallSummary(results);

      return {
        success: true,
        results,
        overallSummary,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error during multi-breakpoint check',
        results: [],
        overallSummary: this.createEmptyOverallSummary(),
      };
    }
  }

  /**
   * Validates input parameters
   */
  private validateInput(input: CheckResponsiveInput): void {
    if (!input.elements || input.elements.length === 0) {
      throw new Error('Elements array is required and cannot be empty');
    }

    if (!input.viewportSize || input.viewportSize.width <= 0 || input.viewportSize.height <= 0) {
      throw new Error('Valid viewport size is required');
    }

    if (!input.rules) {
      throw new Error('Design rules are required');
    }
  }

  private validateBreakpointTransitionInput(input: CheckBreakpointTransitionInput): void {
    if (!input.elements || input.elements.length === 0) {
      throw new Error('Elements array is required and cannot be empty');
    }

    if (!input.fromBreakpoint) {
      throw new Error('From breakpoint is required');
    }

    if (!input.toBreakpoint) {
      throw new Error('To breakpoint is required');
    }

    if (!input.rules) {
      throw new Error('Design rules are required');
    }
  }

  private validateMultiBreakpointInput(input: CheckMultiBreakpointInput): void {
    if (!input.elements || input.elements.length === 0) {
      throw new Error('Elements array is required and cannot be empty');
    }

    if (!input.breakpoints || input.breakpoints.length === 0) {
      throw new Error('Breakpoints array is required and cannot be empty');
    }

    if (!input.rules) {
      throw new Error('Design rules are required');
    }
  }

  /**
   * Placeholder for screenshot capture (would be implemented in infrastructure)
   */
  private async captureScreenshot(viewportSize: { width: number; height: number }): Promise<string> {
    // This would use Chrome API through infrastructure layer
    // For now, return placeholder
    return `data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==`;
  }

  /**
   * Creates summary of issues
   */
  private createSummary(issues: ElementInspection['issues']): ResponsiveCheckSummary {
    const issuesBySeverity = issues.reduce((acc, issue) => {
      acc[issue.severity] = (acc[issue.severity] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const issuesByType = issues.reduce((acc, issue) => {
      acc[issue.type] = (acc[issue.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      totalIssues: issues.length,
      issuesBySeverity,
      issuesByType,
      hasErrors: issues.some(issue => issue.severity === 'error'),
      hasWarnings: issues.some(issue => issue.severity === 'warning'),
    };
  }

  /**
   * Creates overall summary for multiple breakpoints
   */
  private createOverallSummary(results: BreakpointCheckResult[]): MultiBreakpointSummary {
    const breakpointSummaries = results.map(result => ({
      breakpoint: result.breakpoint.name,
      totalIssues: result.summary.totalIssues,
      errors: result.summary.issuesBySeverity.error || 0,
      warnings: result.summary.issuesBySeverity.warning || 0,
    }));

    const totalIssues = results.reduce((sum, result) => sum + result.summary.totalIssues, 0);
    const totalErrors = results.reduce((sum, result) => sum + (result.summary.issuesBySeverity.error || 0), 0);
    const totalWarnings = results.reduce((sum, result) => sum + (result.summary.issuesBySeverity.warning || 0), 0);

    return {
      totalBreakpoints: results.length,
      totalIssues,
      totalErrors,
      totalWarnings,
      breakpointSummaries,
      worstBreakpoint: this.findWorstBreakpoint(results),
    };
  }

  /**
   * Finds breakpoint with most issues
   */
  private findWorstBreakpoint(results: BreakpointCheckResult[]): string | null {
    if (results.length === 0) return null;

    return results.reduce((worst, current) =>
      current.summary.totalIssues > (worst.summary?.totalIssues || 0) ? current : worst
    ).breakpoint.name;
  }

  /**
   * Creates empty summaries
   */
  private createEmptySummary(): ResponsiveCheckSummary {
    return {
      totalIssues: 0,
      issuesBySeverity: {},
      issuesByType: {},
      hasErrors: false,
      hasWarnings: false,
    };
  }

  private createEmptyOverallSummary(): MultiBreakpointSummary {
    return {
      totalBreakpoints: 0,
      totalIssues: 0,
      totalErrors: 0,
      totalWarnings: 0,
      breakpointSummaries: [],
      worstBreakpoint: null,
    };
  }
}

/**
 * Input interfaces
 */
export interface CheckResponsiveInput {
  elements: ElementInspection[];
  viewportSize: { width: number; height: number };
  rules: DesignRules;
  includeScreenshot?: boolean;
}

export interface CheckBreakpointTransitionInput {
  elements: ElementInspection[];
  fromBreakpoint: TailwindBreakpoint;
  toBreakpoint: TailwindBreakpoint;
  rules: DesignRules;
}

export interface CheckMultiBreakpointInput {
  elements: ElementInspection[];
  breakpoints: TailwindBreakpoint[];
  rules: DesignRules;
}

/**
 * Output interfaces
 */
export interface CheckResponsiveOutput {
  success: boolean;
  issues: ElementInspection['issues'];
  viewportSize: { width: number; height: number };
  screenshot?: string;
  summary: ResponsiveCheckSummary;
  error?: string;
}

export interface CheckBreakpointTransitionOutput {
  success: boolean;
  issues: ElementInspection['issues'];
  fromBreakpoint: TailwindBreakpoint;
  toBreakpoint: TailwindBreakpoint;
  transitionIssues: ElementInspection['issues'];
  targetIssues: ElementInspection['issues'];
  summary: ResponsiveCheckSummary;
  error?: string;
}

export interface CheckMultiBreakpointOutput {
  success: boolean;
  results: BreakpointCheckResult[];
  overallSummary: MultiBreakpointSummary;
  error?: string;
}

/**
 * Supporting interfaces
 */
export interface ResponsiveCheckSummary {
  totalIssues: number;
  issuesBySeverity: Record<string, number>;
  issuesByType: Record<string, number>;
  hasErrors: boolean;
  hasWarnings: boolean;
}

export interface BreakpointCheckResult {
  breakpoint: TailwindBreakpoint;
  issues: ElementInspection['issues'];
  summary: ResponsiveCheckSummary;
  viewportSize: { width: number; height: number };
}

export interface MultiBreakpointSummary {
  totalBreakpoints: number;
  totalIssues: number;
  totalErrors: number;
  totalWarnings: number;
  breakpointSummaries: Array<{
    breakpoint: string;
    totalIssues: number;
    errors: number;
    warnings: number;
  }>;
  worstBreakpoint: string | null;
}

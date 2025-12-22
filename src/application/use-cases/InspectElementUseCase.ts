/**
 * Copyright (c) 2025 Pixel Perfect Inspector
 *
 * Author: Pixel Perfect Inspector
 * Available for contact via email: support@b-b.top
 * For up-to-date contact information:
 * https://github.com/bivex
 *
 * Created: 2025-12-22T07:28:45
 * Last Updated: 2025-12-22T11:09:24
 *
 * Licensed under the MIT License.
 * Commercial licensing available upon request.
 */

import { ElementAnalyzer, ElementSemanticInfo } from '../../domain/services/ElementAnalyzer';
import { DesignRules } from '../../domain/entities/DesignRules';
import { BoxModel } from '../../domain/entities/BoxModel';
import { ElementInspection, ComputedStyles } from '../../domain/entities/ElementInspection';

/**
 * Use case for inspecting a single element
 * Orchestrates the element inspection process
 */
export class InspectElementUseCase {
  /**
   * Executes element inspection
   */
  async execute(input: InspectElementInput): Promise<InspectElementOutput> {
    try {
      // Validate input
      this.validateInput(input);

      // Analyze element using domain service
      const inspection = ElementAnalyzer.analyzeElement(
        input.elementId,
        input.selector,
        input.boxModel,
        input.computedStyles,
        input.rules,
        input.semanticInfo
      );

      // Add viewport position if provided
      if (input.viewportPosition) {
        inspection.viewportPosition = input.viewportPosition;
      }

      if (input.documentPosition) {
        inspection.documentPosition = input.documentPosition;
      }

      return {
        success: true,
        inspection,
        issues: inspection.issues,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error during element inspection',
        inspection: null,
        issues: [],
      };
    }
  }

  /**
   * Validates input parameters
   */
  private validateInput(input: InspectElementInput): void {
    if (!input.elementId) {
      throw new Error('Element ID is required');
    }

    if (!input.selector) {
      throw new Error('Element selector is required');
    }

    if (!input.boxModel) {
      throw new Error('Box model data is required');
    }

    if (!input.computedStyles) {
      throw new Error('Computed styles are required');
    }

    if (!input.rules) {
      throw new Error('Design rules are required');
    }
  }

  /**
   * Creates a simplified inspection for quick preview
   */
  async executeQuick(input: InspectElementQuickInput): Promise<InspectElementQuickOutput> {
    try {
      const inspection = ElementAnalyzer.analyzeElement(
        input.elementId,
        input.selector,
        input.boxModel,
        input.computedStyles,
        input.rules,
        input.semanticInfo
      );

      // Return only critical issues for quick preview
      const criticalIssues = inspection.issues.filter(
        issue => issue.severity === 'error'
      );

      return {
        success: true,
        elementId: input.elementId,
        boxModel: input.boxModel,
        criticalIssues,
        hasSpacingIssues: inspection.issues.some(issue =>
          issue.type.includes('spacing')
        ),
        hasSizingIssues: inspection.issues.some(issue =>
          issue.type.includes('sizing') || issue.type === 'too_small_clickable_area'
        ),
        hasColorIssues: inspection.issues.some(issue =>
          issue.type === 'color_not_in_palette' || issue.type === 'contrast_ratio_low'
        ),
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        elementId: input.elementId,
        boxModel: input.boxModel,
        criticalIssues: [],
        hasSpacingIssues: false,
        hasSizingIssues: false,
        hasColorIssues: false,
      };
    }
  }
}

/**
 * Input for element inspection use case
 */
export interface InspectElementInput {
  elementId: string;
  selector: string;
  boxModel: BoxModel;
  computedStyles: ComputedStyles;
  rules: DesignRules;
  viewportPosition?: BoxModel['content'];
  documentPosition?: BoxModel['content'];
  semanticInfo?: ElementSemanticInfo;
}

/**
 * Output for element inspection use case
 */
export interface InspectElementOutput {
  success: boolean;
  inspection: ElementInspection | null;
  issues: ElementInspection['issues'];
  error?: string;
}

/**
 * Input for quick element inspection
 */
export interface InspectElementQuickInput {
  elementId: string;
  selector: string;
  boxModel: BoxModel;
  computedStyles: ComputedStyles;
  rules: DesignRules;
  semanticInfo?: ElementSemanticInfo;
}

/**
 * Output for quick element inspection
 */
export interface InspectElementQuickOutput {
  success: boolean;
  elementId: string;
  boxModel: BoxModel;
  criticalIssues: ElementInspection['issues'];
  hasSpacingIssues: boolean;
  hasSizingIssues: boolean;
  hasColorIssues: boolean;
  error?: string;
}

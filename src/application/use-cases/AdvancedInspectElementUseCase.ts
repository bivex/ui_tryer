/**
 * Copyright (c) 2025 Pixel Perfect Inspector
 *
 * Author: Pixel Perfect Inspector
 * Available for contact via email: support@b-b.top
 * For up-to-date contact information:
 * https://github.com/bivex
 *
 * Created: 2025-12-22T13:00:00
 * Last Updated: 2025-12-22T13:00:00
 *
 * Licensed under the MIT License.
 * Commercial licensing available upon request.
 */

import { AdvancedElementAnalyzer } from '../../domain/services/AdvancedElementAnalyzer';
import { AdvancedDesignRules } from '../../domain/entities/AdvancedDesignRules';
import { ElementInspection, ElementContext } from '../../domain/entities/ElementInspection';
import { BoxModel } from '../../domain/entities/BoxModel';
import { VerticalRhythmAnalyzer, type VerticalRhythmAnalysis } from '../../domain/services/VerticalRhythmAnalyzer';
import { TypographyAnalyzer, type TypographyAnalysis, type TypeScaleAnalysis } from '../../domain/services/TypographyAnalyzer';
import { ColorHarmonyAnalyzer, type ColorHarmonyAnalysis } from '../../domain/services/ColorHarmonyAnalyzer';

/**
 * Use case for advanced element inspection with all analysis algorithms
 * Orchestrates comprehensive element analysis including accessibility, typography, layout, etc.
 */
export class AdvancedInspectElementUseCase {
  /**
   * Execute advanced element inspection
   */
  async execute(input: AdvancedInspectElementInput): Promise<AdvancedInspectElementOutput> {
    const startTime = Date.now();

    try {
      // Validate input
      this.validateInput(input);

      // Prepare analysis context
      const context = await this.buildAnalysisContext(input);

      // Perform advanced analysis
      const inspection = AdvancedElementAnalyzer.analyzeElement(
        input.elementId,
        input.selector,
        input.boxModel,
        input.computedStyles,
        input.rules,
        context
      );

      // Add performance metrics
      const processingTime = Date.now() - startTime;
      inspection.processingTime = processingTime;

      // Categorize issues by phase
      const phaseResults = this.categorizeIssuesByPhase(inspection.issues);

      return {
        inspection,
        phaseResults,
        processingTime,
        analysisMetadata: {
          rulesVersion: input.rulesVersion || '1.0.0',
          analysisScope: input.analysisScope || ['accessibility', 'typography', 'color', 'layout', 'interaction', 'performance', 'consistency'],
          contextAvailable: !!context,
          elementComplexity: this.calculateElementComplexity(input)
        }
      };

    } catch (error) {
      console.error('Advanced element inspection failed:', error);
      throw new Error(`Advanced inspection failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Validate input parameters
   */
  private validateInput(input: AdvancedInspectElementInput): void {
    if (!input.elementId) {
      throw new Error('Element ID is required');
    }
    if (!input.selector) {
      throw new Error('CSS selector is required');
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
   * Build analysis context from input data
   */
  private async buildAnalysisContext(input: AdvancedInspectElementInput): Promise<ElementContext | undefined> {
    if (!input.contextData) {
      return undefined;
    }

    const { viewport, parent, siblings, page, interaction } = input.contextData;

    return {
      viewport: {
        width: viewport?.width || 1920,
        height: viewport?.height || 1080,
        devicePixelRatio: viewport?.devicePixelRatio || 1
      },
      parent: parent ? {
        display: parent.display,
        flexDirection: parent.flexDirection,
        gridTemplate: parent.gridTemplate,
        width: parent.width,
        height: parent.height
      } : undefined,
      siblings: {
        count: siblings?.count || 0,
        similarElements: siblings?.similarElements || 0
      },
      page: {
        hasNavigation: page?.hasNavigation || false,
        hasFooter: page?.hasFooter || false,
        primaryColor: page?.primaryColor,
        fontFamily: page?.fontFamily
      },
      interaction: {
        isHoverable: interaction?.isHoverable || false,
        isFocusable: interaction?.isFocusable || false,
        hasClickHandler: interaction?.hasClickHandler || false,
        tabIndex: interaction?.tabIndex
      }
    };
  }

  /**
   * Categorize issues by analysis phase
   */
  private categorizeIssuesByPhase(issues: any[]): PhaseResults {
    const phaseResults = {
      accessibility: [] as any[],
      typography: [] as any[],
      color: [] as any[],
      layout: [] as any[],
      interaction: [] as any[],
      performance: [] as any[],
      consistency: [] as any[]
    };

    for (const issue of issues) {
      switch (issue.category) {
        case 'accessibility':
          phaseResults.accessibility.push(issue);
          break;
        case 'typography':
          phaseResults.typography.push(issue);
          break;
        case 'color':
          phaseResults.color.push(issue);
          break;
        case 'layout':
          phaseResults.layout.push(issue);
          break;
        case 'interaction':
          phaseResults.interaction.push(issue);
          break;
        case 'performance':
          phaseResults.performance.push(issue);
          break;
        case 'consistency':
          phaseResults.consistency.push(issue);
          break;
        default:
          // Fallback to accessibility for unknown categories
          phaseResults.accessibility.push(issue);
      }
    }

    return phaseResults;
  }

  /**
   * Calculate element complexity score for analysis metadata
   */
  private calculateElementComplexity(input: AdvancedInspectElementInput): number {
    let complexity = 1; // Base complexity

    // Factor in CSS properties count
    const stylesCount = Object.keys(input.computedStyles || {}).length;
    complexity += Math.min(stylesCount / 10, 5); // Max 5 points for styles

    // Factor in box model complexity
    if (input.boxModel.padding && (input.boxModel.padding.top !== input.boxModel.padding.right ||
                                   input.boxModel.padding.right !== input.boxModel.padding.bottom ||
                                   input.boxModel.padding.bottom !== input.boxModel.padding.left)) {
      complexity += 1; // Asymmetric padding
    }

    // Factor in context availability
    if (input.contextData) {
      complexity += 2; // Context provides richer analysis
    }

    // Factor in analysis scope
    complexity += (input.analysisScope?.length || 7) / 7 * 2; // Max 2 points for full scope

    return Math.min(Math.round(complexity), 10); // Cap at 10
  }
}

/**
 * Input for advanced element inspection
 */
export interface AdvancedInspectElementInput {
  /** Element identifier */
  elementId: string;

  /** CSS selector */
  selector: string;

  /** Box model data */
  boxModel: BoxModel;

  /** Computed CSS styles */
  computedStyles: Record<string, string>;

  /** Advanced design rules */
  rules: AdvancedDesignRules;

  /** Optional context data */
  contextData?: {
    viewport?: {
      width: number;
      height: number;
      devicePixelRatio: number;
    };
    parent?: {
      display: string;
      flexDirection?: string;
      gridTemplate?: string;
      width: number;
      height: number;
    };
    siblings?: {
      count: number;
      similarElements: number;
    };
    page?: {
      hasNavigation: boolean;
      hasFooter: boolean;
      primaryColor?: string;
      fontFamily?: string;
    };
    interaction?: {
      isHoverable: boolean;
      isFocusable: boolean;
      hasClickHandler: boolean;
      tabIndex?: number;
    };
  };

  /** Analysis scope - which phases to run */
  analysisScope?: ('accessibility' | 'typography' | 'color' | 'layout' | 'interaction' | 'performance' | 'consistency')[];

  /** Rules version for compatibility tracking */
  rulesVersion?: string;
}

/**
 * Output from advanced element inspection
 */
export interface AdvancedInspectElementOutput {
  /** Complete inspection result */
  inspection: ElementInspection;

  /** Issues categorized by analysis phase */
  phaseResults: PhaseResults;

  /** Processing time in milliseconds */
  processingTime: number;

  /** Analysis metadata */
  analysisMetadata: {
    rulesVersion: string;
    analysisScope: string[];
    contextAvailable: boolean;
    elementComplexity: number;
  };
}

/**
 * Issues categorized by analysis phase
 */
export interface PhaseResults {
  accessibility: any[];
  typography: any[];
  color: any[];
  layout: any[];
  interaction: any[];
  performance: any[];
  consistency: any[];
}
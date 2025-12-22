/**
 * Copyright (c) 2025 Pixel Perfect Inspector
 *
 * Author: Pixel Perfect Inspector
 * Available for contact via email: support@b-b.top
 * For up-to-date contact information:
 * https://github.com/bivex
 *
 * Created: 2025-12-22T07:29:06
 * Last Updated: 2025-12-22T11:34:34
 *
 * Licensed under the MIT License.
 * Commercial licensing available upon request.
 */

import { ElementComparator, ElementComparison } from '../../domain/services/ElementComparator';
import { ElementInspection } from '../../domain/entities/ElementInspection';
import { DesignRules } from '../../domain/entities/DesignRules';

/**
 * Use case for comparing multiple elements
 * Analyzes consistency across similar UI components
 */
export class CompareElementsUseCase {
  /**
   * Executes element comparison
   */
  async execute(input: CompareElementsInput): Promise<CompareElementsOutput> {
    try {
      this.validateInput(input);

      // Use domain service to compare elements
      const { comparison, inconsistencies } = ElementComparator.compareElements(
        input.elements,
        input.comparisonType,
        input.rules
      );

      // Generate summary report
      const summary = this.generateComparisonSummary(comparison, inconsistencies);

      return {
        success: true,
        comparison,
        inconsistencies,
        summary,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error during element comparison',
        comparison: this.createEmptyComparison(),
        inconsistencies: [],
        summary: this.createEmptySummary(),
      };
    }
  }

  /**
   * Compares elements of specific types (buttons, cards, etc.)
   */
  async executeByType(input: CompareElementsByTypeInput): Promise<CompareElementsByTypeOutput> {
    try {
      this.validateByTypeInput(input);

      // Group elements by type
      const groupedElements = this.groupElementsByType(input.elements, input.elementType);

      const results: ElementTypeComparison[] = [];

      for (const [type, elements] of Object.entries(groupedElements)) {
        if (elements.length >= input.minGroupSize) {
          const { comparison, inconsistencies } = ElementComparator.compareElements(
            elements,
            input.comparisonType,
            input.rules
          );

          results.push({
            elementType: type,
            elements,
            comparison,
            inconsistencies,
            summary: this.generateComparisonSummary(comparison, inconsistencies),
          });
        }
      }

      const overallSummary = this.generateOverallSummary(results);

      return {
        success: true,
        results,
        overallSummary,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error during type-based comparison',
        results: [],
        overallSummary: this.createEmptyOverallSummary(),
      };
    }
  }

  /**
   * Validates input parameters
   */
  private validateInput(input: CompareElementsInput): void {
    if (!input.elements || input.elements.length < 2) {
      throw new Error('At least 2 elements are required for comparison');
    }

    if (!input.comparisonType) {
      throw new Error('Comparison type is required');
    }

    if (!input.rules) {
      throw new Error('Design rules are required');
    }
  }

  private validateByTypeInput(input: CompareElementsByTypeInput): void {
    if (!input.elements || input.elements.length === 0) {
      throw new Error('Elements array is required');
    }

    if (!input.elementType) {
      throw new Error('Element type is required');
    }

    if (!input.comparisonType) {
      throw new Error('Comparison type is required');
    }

    if (!input.rules) {
      throw new Error('Design rules are required');
    }

    if (input.minGroupSize < 2) {
      throw new Error('Minimum group size must be at least 2');
    }
  }

  /**
   * Groups elements by their semantic type
   */
  private groupElementsByType(
    elements: ElementInspection[],
    typeCriteria: string
  ): Record<string, ElementInspection[]> {
    const groups: Record<string, ElementInspection[]> = {};

    elements.forEach(element => {
      const type = this.determineElementType(element, typeCriteria);
      if (!groups[type]) {
        groups[type] = [];
      }
      groups[type].push(element);
    });

    return groups;
  }

  /**
   * Determines element type based on various criteria
   */
  private determineElementType(element: ElementInspection, criteria: string): string {
    // This is a simplified implementation
    // In real app, would use more sophisticated element classification
    const selector = element.selector.toLowerCase();
    const computedStyles = element.computedStyles;

    switch (criteria) {
      case 'semantic':
        if (selector.includes('button') || computedStyles.display === 'button') {
          return 'button';
        }
        if (selector.includes('input') || ['input', 'textarea', 'select'].includes(computedStyles.display || '')) {
          return 'input';
        }
        if (selector.includes('card') || selector.includes('panel')) {
          return 'card';
        }
        return 'other';

      case 'tag':
        // Extract tag name from selector (simplified)
        const tagMatch = selector.match(/([a-zA-Z]+)(?:\[[^\]]*\])*$/);
        return tagMatch ? tagMatch[1] : 'unknown';

      case 'class':
        // Extract class names from selector (simplified)
        const classMatch = selector.match(/\.([a-zA-Z][a-zA-Z0-9-]*)/);
        return classMatch ? classMatch[1] : 'unknown';

      default:
        return 'unknown';
    }
  }

  /**
   * Generates comparison summary
   */
  private generateComparisonSummary(
    comparison: ElementComparison,
    inconsistencies: ElementInspection['issues']
  ): ComparisonSummary {
    return {
      totalElements: comparison.elements.length,
      totalDifferences: comparison.differences.length,
      totalInconsistencies: inconsistencies.length,
      consistencyScore: this.calculateConsistencyScore(comparison, inconsistencies),
      mostInconsistentProperty: this.findMostInconsistentProperty(comparison.differences),
      recommendedActions: this.generateRecommendedActions(inconsistencies),
    };
  }

  /**
   * Generates overall summary for multiple comparisons
   */
  private generateOverallSummary(results: ElementTypeComparison[]): OverallComparisonSummary {
    const totalTypes = results.length;
    const totalElements = results.reduce((sum, result) => sum + result.elements.length, 0);
    const totalInconsistencies = results.reduce((sum, result) => sum + result.inconsistencies.length, 0);
    const averageConsistencyScore = results.length > 0
      ? results.reduce((sum, result) => sum + result.summary.consistencyScore, 0) / results.length
      : 0;

    const typeSummaries = results.map(result => ({
      type: result.elementType,
      elements: result.elements.length,
      inconsistencies: result.inconsistencies.length,
      consistencyScore: result.summary.consistencyScore,
    }));

    return {
      totalTypes,
      totalElements,
      totalInconsistencies,
      averageConsistencyScore,
      typeSummaries,
      mostProblematicType: this.findMostProblematicType(results),
    };
  }

  /**
   * Calculates consistency score (0-100, higher is better)
   */
  private calculateConsistencyScore(
    comparison: ElementComparison,
    inconsistencies: ElementInspection['issues']
  ): number {
    if (comparison.elements.length === 0) return 100;

    const totalPossibleDifferences = comparison.elements.length * 10; // Simplified metric
    const actualDifferences = comparison.differences.length + inconsistencies.length;

    const score = Math.max(0, 100 - (actualDifferences / totalPossibleDifferences) * 100);
    return Math.round(score);
  }

  /**
   * Finds the most inconsistent property
   */
  private findMostInconsistentProperty(differences: ElementComparison['differences']): string | null {
    if (differences.length === 0) return null;

    return differences.reduce((most, current) =>
      current.variance > (most.variance || 0) ? current : most
    ).property;
  }

  /**
   * Finds the most problematic element type
   */
  private findMostProblematicType(results: ElementTypeComparison[]): string | null {
    if (results.length === 0) return null;

    return results.reduce((worst, current) =>
      current.inconsistencies.length > worst.inconsistencies.length ? current : worst
    ).elementType;
  }

  /**
   * Generates recommended actions based on inconsistencies
   */
  private generateRecommendedActions(inconsistencies: ElementInspection['issues']): string[] {
    const actions: string[] = [];

    const hasSpacingIssues = inconsistencies.some(issue => issue.type.includes('spacing'));
    const hasColorIssues = inconsistencies.some(issue => issue.type === 'color_not_in_palette');
    const hasSizingIssues = inconsistencies.some(issue => issue.type.includes('sizing'));

    if (hasSpacingIssues) {
      actions.push('Стандартизировать отступы согласно дизайн-системе');
    }

    if (hasColorIssues) {
      actions.push('Использовать только цвета из утвержденной палитры');
    }

    if (hasSizingIssues) {
      actions.push('Привести размеры компонентов к единому стандарту');
    }

    if (actions.length === 0) {
      actions.push('Все элементы соответствуют дизайн-системе');
    }

    return actions;
  }

  /**
   * Creates empty objects for error cases
   */
  private createEmptyComparison(): ElementComparison {
    return {
      elements: [],
      differences: [],
      summary: {
        totalElements: 0,
        consistentProperties: [],
        inconsistentProperties: [],
      },
    };
  }

  private createEmptySummary(): ComparisonSummary {
    return {
      totalElements: 0,
      totalDifferences: 0,
      totalInconsistencies: 0,
      consistencyScore: 100,
      mostInconsistentProperty: null,
      recommendedActions: [],
    };
  }

  private createEmptyOverallSummary(): OverallComparisonSummary {
    return {
      totalTypes: 0,
      totalElements: 0,
      totalInconsistencies: 0,
      averageConsistencyScore: 100,
      typeSummaries: [],
      mostProblematicType: null,
    };
  }
}

/**
 * Input interfaces
 */
export interface CompareElementsInput {
  elements: ElementInspection[];
  comparisonType: 'spacing' | 'sizing' | 'colors' | 'typography' | 'all';
  rules: DesignRules;
}

export interface CompareElementsByTypeInput {
  elements: ElementInspection[];
  elementType: 'semantic' | 'tag' | 'class';
  comparisonType: 'spacing' | 'sizing' | 'colors' | 'typography' | 'all';
  rules: DesignRules;
  minGroupSize: number;
}

/**
 * Output interfaces
 */
export interface CompareElementsOutput {
  success: boolean;
  comparison: ElementComparison;
  inconsistencies: ElementInspection['issues'];
  summary: ComparisonSummary;
  error?: string;
}

export interface CompareElementsByTypeOutput {
  success: boolean;
  results: ElementTypeComparison[];
  overallSummary: OverallComparisonSummary;
  error?: string;
}

/**
 * Supporting interfaces
 */
export interface ComparisonSummary {
  totalElements: number;
  totalDifferences: number;
  totalInconsistencies: number;
  consistencyScore: number;
  mostInconsistentProperty: string | null;
  recommendedActions: string[];
}

export interface ElementTypeComparison {
  elementType: string;
  elements: ElementInspection[];
  comparison: ElementComparison;
  inconsistencies: ElementInspection['issues'];
  summary: ComparisonSummary;
}

export interface OverallComparisonSummary {
  totalTypes: number;
  totalElements: number;
  totalInconsistencies: number;
  averageConsistencyScore: number;
  typeSummaries: Array<{
    type: string;
    elements: number;
    inconsistencies: number;
    consistencyScore: number;
  }>;
  mostProblematicType: string | null;
}

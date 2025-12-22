/**
 * Copyright (c) 2025 Pixel Perfect Inspector
 *
 * Author: Pixel Perfect Inspector
 * Available for contact via email: support@b-b.top
 * For up-to-date contact information:
 * https://github.com/bivex
 *
 * Created: 2025-12-22T07:28:24
 * Last Updated: 2025-12-22T11:09:24
 *
 * Licensed under the MIT License.
 * Commercial licensing available upon request.
 */

import { ElementInspection, Issue, ElementInspectionFactory } from '../entities/ElementInspection';
import { DesignRules } from '../entities/DesignRules';

/**
 * Domain service for comparing multiple elements
 * Used to check consistency across similar UI components
 */
export class ElementComparator {
  /**
   * Compares a group of elements for consistency
   */
  static compareElements(
    elements: ElementInspection[],
    comparisonType: 'spacing' | 'sizing' | 'colors' | 'typography' | 'all' = 'all',
    rules: DesignRules
  ): {
    comparison: ElementComparison;
    inconsistencies: Issue[];
  } {
    const comparison: ElementComparison = {
      elements,
      differences: [],
      summary: this.createEmptySummary(),
    };

    const inconsistencies: Issue[] = [];

    if (elements.length < 2) {
      return { comparison, inconsistencies };
    }

    // Compare based on type
    switch (comparisonType) {
      case 'spacing':
        comparison.differences.push(...this.compareSpacing(elements));
        inconsistencies.push(...this.createSpacingInconsistencies(elements, comparison.differences));
        break;

      case 'sizing':
        comparison.differences.push(...this.compareSizing(elements));
        inconsistencies.push(...this.createSizingInconsistencies(elements, comparison.differences));
        break;

      case 'colors':
        comparison.differences.push(...this.compareColors(elements));
        inconsistencies.push(...this.createColorInconsistencies(elements, comparison.differences));
        break;

      case 'typography':
        comparison.differences.push(...this.compareTypography(elements));
        inconsistencies.push(...this.createTypographyInconsistencies(elements, comparison.differences));
        break;

      case 'all':
        const allDifferences = [
          ...this.compareSpacing(elements),
          ...this.compareSizing(elements),
          ...this.compareColors(elements),
          ...this.compareTypography(elements),
        ];
        comparison.differences = allDifferences;
        inconsistencies.push(
          ...this.createSpacingInconsistencies(elements, allDifferences.filter(d => d.property.startsWith('spacing'))),
          ...this.createSizingInconsistencies(elements, allDifferences.filter(d => d.property.startsWith('size'))),
          ...this.createColorInconsistencies(elements, allDifferences.filter(d => d.property.startsWith('color'))),
          ...this.createTypographyInconsistencies(elements, allDifferences.filter(d => d.property.startsWith('font'))),
        );
        break;
    }

    comparison.summary = this.calculateSummary(comparison.differences, elements);

    return { comparison, inconsistencies };
  }

  /**
   * Compares spacing properties across elements
   */
  private static compareSpacing(elements: ElementInspection[]): ComparisonDifference[] {
    const differences: ComparisonDifference[] = [];

    // Compare padding
    const paddingProps = ['paddingTop', 'paddingRight', 'paddingBottom', 'paddingLeft'];
    paddingProps.forEach(prop => {
      const values = elements.map(el => ({
        elementId: el.elementId,
        value: this.getPaddingValue(el, prop),
      }));

      if (this.hasVariance(values)) {
        differences.push({
          property: `spacing.${prop}`,
          values: Object.fromEntries(values.map(v => [v.elementId, v.value])),
          variance: this.calculateVariance(values.map(v => v.value)),
        });
      }
    });

    // Compare margin
    const marginProps = ['marginTop', 'marginRight', 'marginBottom', 'marginLeft'];
    marginProps.forEach(prop => {
      const values = elements.map(el => ({
        elementId: el.elementId,
        value: this.getMarginValue(el, prop),
      }));

      if (this.hasVariance(values)) {
        differences.push({
          property: `spacing.${prop}`,
          values: Object.fromEntries(values.map(v => [v.elementId, v.value])),
          variance: this.calculateVariance(values.map(v => v.value)),
        });
      }
    });

    return differences;
  }

  /**
   * Compares sizing properties across elements
   */
  private static compareSizing(elements: ElementInspection[]): ComparisonDifference[] {
    const differences: ComparisonDifference[] = [];

    // Compare dimensions
    const sizeProps = ['width', 'height', 'minWidth', 'minHeight', 'maxWidth', 'maxHeight'];
    sizeProps.forEach(prop => {
      const values = elements.map(el => ({
        elementId: el.elementId,
        value: this.getSizeValue(el, prop),
      }));

      if (this.hasVariance(values)) {
        differences.push({
          property: `size.${prop}`,
          values: Object.fromEntries(values.map(v => [v.elementId, v.value])),
          variance: this.calculateVariance(values.map(v => v.value)),
        });
      }
    });

    return differences;
  }

  /**
   * Compares color properties across elements
   */
  private static compareColors(elements: ElementInspection[]): ComparisonDifference[] {
    const differences: ComparisonDifference[] = [];

    const colorProps = ['color', 'backgroundColor', 'borderColor'];
    colorProps.forEach(prop => {
      const values = elements.map(el => ({
        elementId: el.elementId,
        value: this.getColorValue(el, prop),
      }));

      if (this.hasVariance(values)) {
        differences.push({
          property: `color.${prop}`,
          values: Object.fromEntries(values.map(v => [v.elementId, v.value])),
          variance: this.calculateVariance(values.map(v => v.value)),
        });
      }
    });

    return differences;
  }

  /**
   * Compares typography properties across elements
   */
  private static compareTypography(elements: ElementInspection[]): ComparisonDifference[] {
    const differences: ComparisonDifference[] = [];

    const typographyProps = ['fontSize', 'lineHeight', 'fontWeight', 'fontFamily'];
    typographyProps.forEach(prop => {
      const values = elements.map(el => ({
        elementId: el.elementId,
        value: this.getTypographyValue(el, prop),
      }));

      if (this.hasVariance(values)) {
        differences.push({
          property: `font.${prop}`,
          values: Object.fromEntries(values.map(v => [v.elementId, v.value])),
          variance: this.calculateVariance(values.map(v => v.value)),
        });
      }
    });

    return differences;
  }

  /**
   * Creates inconsistency issues from spacing differences
   */
  private static createSpacingInconsistencies(
    elements: ElementInspection[],
    differences: ComparisonDifference[]
  ): Issue[] {
    const issues: Issue[] = [];

    differences.forEach(diff => {
      if (diff.variance > 0) { // Has differences
        const elementSelectors = elements.map(el => el.selector).join(', ');

        issues.push(ElementInspectionFactory.createIssue(
          'inconsistent_sizing',
          'warning',
          'consistency',
          `Несоответствие ${diff.property} между элементами: ${elementSelectors}`,
          elements[0].elementId,
          elements[0].selector,
          {
            suggestedFix: 'Приведите значения к единому стандарту',
            actualValue: diff.values,
            context: {
              differenceType: 'spacing',
              variance: diff.variance,
              affectedElements: elements.length,
            },
          }
        ));
      }
    });

    return issues;
  }

  /**
   * Creates inconsistency issues from sizing differences
   */
  private static createSizingInconsistencies(
    elements: ElementInspection[],
    differences: ComparisonDifference[]
  ): Issue[] {
    const issues: Issue[] = [];

    differences.forEach(diff => {
      if (diff.variance > 0) {
        const elementSelectors = elements.map(el => el.selector).join(', ');

        issues.push(ElementInspectionFactory.createIssue(
          'inconsistent_sizing',
          'warning',
          'consistency',
          `Несоответствие размеров ${diff.property} между элементами: ${elementSelectors}`,
          elements[0].elementId,
          elements[0].selector,
          {
            suggestedFix: 'Приведите размеры к единому стандарту дизайн-системы',
            actualValue: diff.values,
            context: {
              differenceType: 'sizing',
              variance: diff.variance,
              affectedElements: elements.length,
            },
          }
        ));
      }
    });

    return issues;
  }

  /**
   * Creates inconsistency issues from color differences
   */
  private static createColorInconsistencies(
    elements: ElementInspection[],
    differences: ComparisonDifference[]
  ): Issue[] {
    const issues: Issue[] = [];

    differences.forEach(diff => {
      if (diff.variance > 0) {
        const elementSelectors = elements.map(el => el.selector).join(', ');

        issues.push(ElementInspectionFactory.createIssue(
          'color_not_in_palette',
          'info',
          'consistency',
          `Разные цвета ${diff.property} между элементами: ${elementSelectors}`,
          elements[0].elementId,
          elements[0].selector,
          {
            suggestedFix: 'Используйте цвета из единой палитры дизайн-системы',
            actualValue: diff.values,
            context: {
              differenceType: 'color',
              variance: diff.variance,
              affectedElements: elements.length,
            },
          }
        ));
      }
    });

    return issues;
  }

  /**
   * Creates inconsistency issues from typography differences
   */
  private static createTypographyInconsistencies(
    elements: ElementInspection[],
    differences: ComparisonDifference[]
  ): Issue[] {
    const issues: Issue[] = [];

    differences.forEach(diff => {
      if (diff.variance > 0) {
        const elementSelectors = elements.map(el => el.selector).join(', ');

        issues.push(ElementInspectionFactory.createIssue(
          'inconsistent_sizing',
          'warning',
          'consistency',
          `Несоответствие типографики ${diff.property} между элементами: ${elementSelectors}`,
          elements[0].elementId,
          elements[0].selector,
          {
            suggestedFix: 'Приведите типографику к единому стандарту',
            actualValue: diff.values,
            context: {
              differenceType: 'typography',
              variance: diff.variance,
              affectedElements: elements.length,
            },
          }
        ));
      }
    });

    return issues;
  }

  /**
   * Calculates comparison summary
   */
  private static calculateSummary(
    differences: ComparisonDifference[],
    elements: ElementInspection[]
  ): ComparisonSummary {
    const allProperties = [
      'spacing.paddingTop', 'spacing.paddingRight', 'spacing.paddingBottom', 'spacing.paddingLeft',
      'spacing.marginTop', 'spacing.marginRight', 'spacing.marginBottom', 'spacing.marginLeft',
      'size.width', 'size.height', 'size.minWidth', 'size.minHeight', 'size.maxWidth', 'size.maxHeight',
      'color.color', 'color.backgroundColor', 'color.borderColor',
      'font.fontSize', 'font.lineHeight', 'font.fontWeight', 'font.fontFamily',
    ];

    const consistentProperties = allProperties.filter(prop =>
      !differences.some(diff => diff.property === prop)
    );

    const inconsistentProperties = differences.map(diff => diff.property);

    return {
      totalElements: elements.length,
      consistentProperties,
      inconsistentProperties,
    };
  }

  /**
   * Helper methods for extracting values
   */
  private static getPaddingValue(element: ElementInspection, prop: string): number {
    const sideMap: Record<string, keyof typeof element.boxModel.padding> = {
      paddingTop: 'top',
      paddingRight: 'right',
      paddingBottom: 'bottom',
      paddingLeft: 'left',
    };
    return element.boxModel.padding[sideMap[prop]];
  }

  private static getMarginValue(element: ElementInspection, prop: string): number {
    const sideMap: Record<string, keyof typeof element.boxModel.margin> = {
      marginTop: 'top',
      marginRight: 'right',
      marginBottom: 'bottom',
      marginLeft: 'left',
    };
    return element.boxModel.margin[sideMap[prop]];
  }

  private static getSizeValue(element: ElementInspection, prop: string): string | number {
    const styles = element.computedStyles;
    switch (prop) {
      case 'width': return parseFloat(styles.width) || styles.width;
      case 'height': return parseFloat(styles.height) || styles.height;
      case 'minWidth': return styles.minWidth ? parseFloat(styles.minWidth) || styles.minWidth : 0;
      case 'minHeight': return styles.minHeight ? parseFloat(styles.minHeight) || styles.minHeight : 0;
      case 'maxWidth': return styles.maxWidth ? parseFloat(styles.maxWidth) || styles.maxWidth : Infinity;
      case 'maxHeight': return styles.maxHeight ? parseFloat(styles.maxHeight) || styles.maxHeight : Infinity;
      default: return 0;
    }
  }

  private static getColorValue(element: ElementInspection, prop: string): string {
    const styles = element.computedStyles;
    switch (prop) {
      case 'color': return styles.color;
      case 'backgroundColor': return styles.backgroundColor;
      case 'borderColor': return styles.borderColor || '';
      default: return '';
    }
  }

  private static getTypographyValue(element: ElementInspection, prop: string): string | number {
    const styles = element.computedStyles;
    switch (prop) {
      case 'fontSize': return parseFloat(styles.fontSize) || styles.fontSize;
      case 'lineHeight': return styles.lineHeight;
      case 'fontWeight': return styles.fontWeight;
      case 'fontFamily': return styles.fontFamily;
      default: return '';
    }
  }

  /**
   * Checks if values have variance (are different)
   */
  private static hasVariance(values: Array<{ elementId: string; value: any }>): boolean {
    const uniqueValues = [...new Set(values.map(v => JSON.stringify(v.value)))];
    return uniqueValues.length > 1;
  }

  /**
   * Calculates variance in values (simplified)
   */
  private static calculateVariance(values: any[]): number {
    const numericValues = values.filter(v => typeof v === 'number') as number[];
    if (numericValues.length < 2) return 0;

    const mean = numericValues.reduce((a, b) => a + b, 0) / numericValues.length;
    const variance = numericValues.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) / numericValues.length;
    return Math.sqrt(variance);
  }

  /**
   * Creates empty summary
   */
  private static createEmptySummary(): ComparisonSummary {
    return {
      totalElements: 0,
      consistentProperties: [],
      inconsistentProperties: [],
    };
  }
}

/**
 * Types for comparison results
 */
export interface ElementComparison {
  elements: ElementInspection[];
  differences: ComparisonDifference[];
  summary: ComparisonSummary;
}

export interface ComparisonDifference {
  property: string;
  values: Record<string, any>;
  variance: number;
}

export interface ComparisonSummary {
  totalElements: number;
  consistentProperties: string[];
  inconsistentProperties: string[];
}

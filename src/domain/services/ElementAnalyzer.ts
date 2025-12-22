/**
 * Copyright (c) 2025 Pixel Perfect Inspector
 *
 * Author: Pixel Perfect Inspector
 * Available for contact via email: support@b-b.top
 * For up-to-date contact information:
 * https://github.com/bivex
 *
 * Created: 2025-12-22T07:28:11
 * Last Updated: 2025-12-22T07:41:13
 *
 * Licensed under the MIT License.
 * Commercial licensing available upon request.
 */

import {
  ElementInspection,
  ElementInspectionFactory,
  Issue,
  IssueType,
  IssueSeverity,
  ComputedStyles
} from '../entities/ElementInspection';
import { BoxModel, BoxModelFactory, Sides } from '../entities/BoxModel';
import { DesignRules, DesignRulesFactory } from '../entities/DesignRules';

/**
 * Domain service responsible for analyzing UI elements
 * Contains pure business logic for element inspection and validation
 */
export class ElementAnalyzer {
  /**
   * Analyzes an element and creates a complete inspection report
   */
  static analyzeElement(
    elementId: string,
    selector: string,
    boxModel: BoxModel,
    computedStyles: ComputedStyles,
    rules: DesignRules
  ): ElementInspection {
    const issues = [
      ...this.validateSpacing(boxModel, rules, elementId, selector),
      ...this.validateSizing(boxModel, computedStyles, rules, elementId, selector),
      ...this.validateTypography(computedStyles, rules, elementId, selector),
      ...this.validateColors(computedStyles, rules, elementId, selector),
      ...this.validateAccessibility(boxModel, computedStyles, rules, elementId, selector),
    ];

    return ElementInspectionFactory.create(
      elementId,
      selector,
      boxModel,
      computedStyles,
      issues
    );
  }

  /**
   * Validates spacing against design system rules
   */
  private static validateSpacing(
    boxModel: BoxModel,
    rules: DesignRules,
    elementId: string,
    selector: string
  ): Issue[] {
    const issues: Issue[] = [];

    // Check if spacing values are on the grid
    const spacingValues = [
      ...Object.values(boxModel.padding),
      ...Object.values(boxModel.margin),
    ];

    spacingValues.forEach((value, index) => {
      if (value > 0 && !DesignRulesFactory.isSpacingOnGrid(rules, value)) {
        const suggestedValue = DesignRulesFactory.getClosestSpacing(rules, value);
        const side = index < 4 ? 'padding' : 'margin';
        const sideIndex = index % 4;
        const sideName = ['top', 'right', 'bottom', 'left'][sideIndex];

        issues.push(ElementInspectionFactory.createIssue(
          'spacing_not_on_grid',
          'warning',
          `${side}-${sideName} (${value}px) не соответствует сетке дизайна`,
          elementId,
          selector,
          {
            suggestedFix: `Используйте ${suggestedValue}px вместо ${value}px`,
            actualValue: value,
            expectedValue: suggestedValue,
          }
        ));
      }
    });

    // Check for asymmetric spacing
    if (this.isAsymmetric(boxModel.padding)) {
      issues.push(ElementInspectionFactory.createIssue(
        'asymmetric_spacing',
        'info',
        'Padding несимметричный - рассмотрите использование симметричных отступов',
        elementId,
        selector,
        {
          actualValue: boxModel.padding,
          context: { type: 'padding' },
        }
      ));
    }

    if (this.isAsymmetric(boxModel.margin)) {
      issues.push(ElementInspectionFactory.createIssue(
        'asymmetric_spacing',
        'info',
        'Margin несимметричный - рассмотрите использование симметричных отступов',
        elementId,
        selector,
        {
          actualValue: boxModel.margin,
          context: { type: 'margin' },
        }
      ));
    }

    return issues;
  }

  /**
   * Validates element sizing
   */
  private static validateSizing(
    boxModel: BoxModel,
    computedStyles: ComputedStyles,
    rules: DesignRules,
    elementId: string,
    selector: string
  ): Issue[] {
    const issues: Issue[] = [];

    // Check minimum clickable size
    const isClickable = this.isClickableElement(computedStyles);
    if (isClickable) {
      const minSize = rules.minClickableSize;
      const actualWidth = boxModel.totalWidth;
      const actualHeight = boxModel.totalHeight;

      if (actualWidth < minSize || actualHeight < minSize) {
        issues.push(ElementInspectionFactory.createIssue(
          'too_small_clickable_area',
          'error',
          `Кликабельная область слишком маленькая: ${actualWidth}×${actualHeight}px (минимум ${minSize}×${minSize}px)`,
          elementId,
          selector,
          {
            suggestedFix: `Увеличьте размеры до минимум ${minSize}px по каждой стороне`,
            actualValue: { width: actualWidth, height: actualHeight },
            expectedValue: { width: minSize, height: minSize },
          }
        ));
      }
    }

    // Check if element is too small in general
    if (boxModel.content.width < 16 || boxModel.content.height < 16) {
      issues.push(ElementInspectionFactory.createIssue(
        'inconsistent_sizing',
        'warning',
        `Элемент слишком маленький: ${boxModel.content.width}×${boxModel.content.height}px`,
        elementId,
        selector,
        {
          actualValue: { width: boxModel.content.width, height: boxModel.content.height },
        }
      ));
    }

    return issues;
  }

  /**
   * Validates typography
   */
  private static validateTypography(
    computedStyles: ComputedStyles,
    rules: DesignRules,
    elementId: string,
    selector: string
  ): Issue[] {
    const issues: Issue[] = [];
    const fontSize = parseFloat(computedStyles.fontSize);

    // Check minimum font size for mobile
    if (fontSize < rules.typographyScale.minMobileSize) {
      issues.push(ElementInspectionFactory.createIssue(
        'text_too_small',
        'error',
        `Текст слишком мелкий: ${fontSize}px (минимум ${rules.typographyScale.minMobileSize}px для мобильных)`,
        elementId,
        selector,
        {
          suggestedFix: `Увеличьте размер шрифта до ${rules.typographyScale.minMobileSize}px или больше`,
          actualValue: fontSize,
          expectedValue: rules.typographyScale.minMobileSize,
        }
      ));
    }

    return issues;
  }

  /**
   * Validates colors against design system palette
   */
  private static validateColors(
    computedStyles: ComputedStyles,
    rules: DesignRules,
    elementId: string,
    selector: string
  ): Issue[] {
    const issues: Issue[] = [];

    // Skip color validation if disabled
    if (!rules.featureToggles.checkColorPalette) {
      return issues;
    }

    // Normalize colors to hex format for comparison
    const textColor = this.normalizeColor(computedStyles.color);
    const bgColor = this.normalizeColor(computedStyles.backgroundColor);

    if (textColor && !ElementAnalyzer.isColorInTailwindPalette(textColor, rules.colorPalette)) {
      issues.push(ElementInspectionFactory.createIssue(
        'color_not_in_palette',
        'info',
        `Цвет текста ${textColor} не входит в палитру Tailwind CSS`,
        elementId,
        selector,
        {
          actualValue: textColor,
          expectedValue: 'Tailwind color palette',
          context: { type: 'text' },
        }
      ));
    }

    if (bgColor && bgColor !== 'transparent' && !ElementAnalyzer.isColorInTailwindPalette(bgColor, rules.colorPalette)) {
      issues.push(ElementInspectionFactory.createIssue(
        'color_not_in_palette',
        'info',
        `Цвет фона ${bgColor} не входит в палитру дизайна`,
        elementId,
        selector,
        {
          actualValue: bgColor,
          expectedValue: rules.colorPalette,
          context: { type: 'background' },
        }
      ));
    }

    return issues;
  }

  /**
   * Validates accessibility concerns
   */
  private static validateAccessibility(
    boxModel: BoxModel,
    computedStyles: ComputedStyles,
    rules: DesignRules,
    elementId: string,
    selector: string
  ): Issue[] {
    const issues: Issue[] = [];

    // Check contrast ratio (simplified check)
    const textColor = computedStyles.color;
    const bgColor = computedStyles.backgroundColor;

    if (textColor && bgColor && bgColor !== 'transparent') {
      const contrast = this.calculateContrastRatio(textColor, bgColor);
      if (contrast < rules.typographyScale.minContrastRatio) {
        issues.push(ElementInspectionFactory.createIssue(
          'contrast_ratio_low',
          'error',
          `Низкая контрастность: ${contrast.toFixed(2)}:1 (минимум ${rules.typographyScale.minContrastRatio}:1)`,
          elementId,
          selector,
          {
            suggestedFix: 'Увеличьте контраст между текстом и фоном',
            actualValue: contrast,
            expectedValue: rules.typographyScale.minContrastRatio,
          }
        ));
      }
    }

    return issues;
  }

  /**
   * Helper methods
   */
  private static isAsymmetric(sides: Sides): boolean {
    const { top, right, bottom, left } = sides;
    return !(top === bottom && left === right);
  }

  private static isClickableElement(styles: ComputedStyles): boolean {
    return styles.cursor === 'pointer';
  }

  private static normalizeColor(color: string): string | null {
    if (!color || color === 'transparent') return null;

    // Convert rgb/rgba to hex
    const rgbMatch = color.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
    if (rgbMatch) {
      const r = parseInt(rgbMatch[1]);
      const g = parseInt(rgbMatch[2]);
      const b = parseInt(rgbMatch[3]);
      return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
    }

    // Return hex colors as-is
    if (color.startsWith('#')) return color.toLowerCase();

    return null;
  }

  private static calculateContrastRatio(color1: string, color2: string): number {
    // Simplified contrast calculation
    // In real implementation, would use proper WCAG formula
    const lum1 = this.getLuminance(color1);
    const lum2 = this.getLuminance(color2);
    const brightest = Math.max(lum1, lum2);
    const darkest = Math.min(lum1, lum2);
    return (brightest + 0.05) / (darkest + 0.05);
  }

  private static getLuminance(color: string): number {
    // Simplified luminance calculation
    // Convert hex to rgb and calculate relative luminance
    const hex = color.replace('#', '');
    const r = parseInt(hex.substr(0, 2), 16) / 255;
    const g = parseInt(hex.substr(2, 2), 16) / 255;
    const b = parseInt(hex.substr(4, 2), 16) / 255;

    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  }

  /**
   * Checks if a color is in the Tailwind color palette
   */
  static isColorInTailwindPalette(color: string, palette: any): boolean {
    // Check semantic colors
    if (color === palette.white || color === palette.black) {
      return true;
    }

    // Check all color groups and their shades
    for (const colorGroup of Object.values(palette)) {
      if (typeof colorGroup === 'string') {
        if (colorGroup === color) return true;
      } else if (typeof colorGroup === 'object') {
        for (const shade of Object.values(colorGroup)) {
          if (shade === color) return true;
        }
      }
    }

    return false;
  }
}

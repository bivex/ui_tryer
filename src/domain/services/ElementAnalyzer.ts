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

    // Skip validation for elements that should be excluded
    if (this.shouldExcludeFromClickableCheck(computedStyles, boxModel, elementId)) {
      return issues;
    }

    // Check minimum clickable size - be more selective
    const isClickable = this.isClickableElement(computedStyles, elementId);
    if (isClickable) {
      const minSize = rules.minClickableSize;
      const actualWidth = boxModel.totalWidth;
      const actualHeight = boxModel.totalHeight;

      // Skip clickable area check for elements that are likely decorative or part of larger components
      if (this.shouldSkipClickableAreaCheck(computedStyles, boxModel, elementId, selector)) {
        return issues;
      }

      if (actualWidth < minSize || actualHeight < minSize) {
        // Flag as error if element is significantly below minimum size
        const severity = (actualWidth < minSize - 10 || actualHeight < minSize - 10) ? 'error' : 'warning';

        issues.push(ElementInspectionFactory.createIssue(
          'too_small_clickable_area',
          severity,
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

    // Check if element is suspiciously small (but not microscopic)
    const contentWidth = boxModel.content.width;
    const contentHeight = boxModel.content.height;

    // Only warn about elements that are likely interactive but small
    // Skip elements that are clearly decorative or text-only
    const isPotentiallyInteractive = this.isClickableElement(computedStyles, elementId) ||
                                    (computedStyles.cursor && computedStyles.cursor !== 'default' && computedStyles.cursor !== 'auto');

    if (isPotentiallyInteractive &&
        contentWidth >= 20 && contentHeight >= 20 && // Not too small to be concerning
        (contentWidth < 36 || contentHeight < 36) && // But still smaller than ideal
        !this.shouldExcludeFromClickableCheck(computedStyles, boxModel, elementId)) {

      // Don't warn about elements that are clearly just text content without interactive purpose
      const hasTextStyling = computedStyles.fontSize && parseFloat(computedStyles.fontSize) >= 12;
      const isLikelyText = (!computedStyles.backgroundColor ||
                           computedStyles.backgroundColor === 'transparent' ||
                           computedStyles.backgroundColor === 'rgba(0, 0, 0, 0)') &&
                          (!computedStyles.border || computedStyles.border === 'none' || computedStyles.border === '0px');

      if (hasTextStyling && isLikelyText) {
        // This might be a small text element that doesn't need to be large
        return issues;
      }

      // Only warn if the element has some visual prominence (background, border, etc.)
      const hasVisualProminence = (computedStyles.backgroundColor &&
                                  computedStyles.backgroundColor !== 'transparent' &&
                                  computedStyles.backgroundColor !== 'rgba(0, 0, 0, 0)') ||
                                 (computedStyles.border &&
                                  computedStyles.border !== 'none' &&
                                  computedStyles.border !== '0px') ||
                                 (computedStyles.boxShadow &&
                                  computedStyles.boxShadow !== 'none');

      if (hasVisualProminence) {
        issues.push(ElementInspectionFactory.createIssue(
          'inconsistent_sizing',
          'warning',
          `Элемент довольно маленький: ${contentWidth}×${contentHeight}px - проверьте, что он достаточно заметен для взаимодействия`,
          elementId,
          selector,
          {
            actualValue: { width: contentWidth, height: contentHeight },
            suggestedFix: 'Рассмотрите увеличение размеров для лучшей доступности',
          }
        ));
      }
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

  private static isClickableElement(styles: ComputedStyles, elementId?: string): boolean {
    // Check explicit cursor pointer - this is the most reliable indicator
    if (styles.cursor === 'pointer') {
      return true;
    }

    // Elements with pointer-events: none are not clickable
    if (styles.pointerEvents === 'none') {
      return false;
    }

    // Check other cursor types that strongly indicate interactivity
    // Be more restrictive - only allow cursors that clearly suggest clicking
    const definitelyInteractiveCursors = ['pointer', 'grab', 'grabbing'];
    if (definitelyInteractiveCursors.includes(styles.cursor || '')) {
      return true;
    }

    // For other cursor types (text, crosshair, move, etc.), be very conservative
    // These might indicate interactivity but are often just visual feedback
    // Only consider them interactive if they have additional visual styling
    const otherInteractiveCursors = ['text', 'crosshair', 'move', 'copy', 'alias'];
    if (otherInteractiveCursors.includes(styles.cursor || '')) {
      // Only consider these interactive if they have visual prominence
      const hasVisualStyling = (styles.backgroundColor &&
                               styles.backgroundColor !== 'transparent' &&
                               styles.backgroundColor !== 'rgba(0, 0, 0, 0)') ||
                              (styles.border &&
                               styles.border !== 'none' &&
                               styles.border !== '0px') ||
                              (styles.boxShadow &&
                               styles.boxShadow !== 'none');

      return hasVisualStyling;
    }

    // Default to false for elements without clear interactive indicators
    return false;
  }

  /**
   * Determines if an element should skip the clickable area size check
   */
  private static shouldSkipClickableAreaCheck(
    styles: ComputedStyles,
    boxModel: BoxModel,
    elementId?: string,
    selector?: string
  ): boolean {
    const width = boxModel.totalWidth;
    const height = boxModel.totalHeight;

    // Skip check for elements that are clearly decorative or system elements
    if (width < 12 || height < 12) {
      return true;
    }

    // Skip check for elements that are likely just text or labels
    // Elements with small dimensions that don't have strong visual prominence
    const hasVisualProminence = (styles.backgroundColor &&
                                styles.backgroundColor !== 'transparent' &&
                                styles.backgroundColor !== 'rgba(0, 0, 0, 0)') ||
                               (styles.border &&
                                styles.border !== 'none' &&
                                styles.border !== '0px') ||
                               (styles.boxShadow &&
                                styles.boxShadow !== 'none');

    if (!hasVisualProminence && (width < 32 || height < 32)) {
      // Small elements without visual styling are likely just text or decorative
      return true;
    }

    // Skip check for elements that are part of larger interactive components
    // (identified by being very thin or having specific styling patterns)
    if (selector) {
      // Skip navigation items, breadcrumbs, etc. that are often small but part of larger clickable areas
      if (selector.includes('.px-2.py-1') ||
          selector.includes('.px-1.py-0.5') ||
          selector.includes('span.') && (width < 100 || height < 24)) {
        return true;
      }

      // Skip small elements in flex containers that are likely part of larger buttons/links
      if (selector.includes('div.flex') && (width < 50 || height < 30)) {
        return true;
      }
    }

    return false;
  }

  /**
   * Determines if an element should be excluded from clickable area checks
   */
  private static shouldExcludeFromClickableCheck(
    styles: ComputedStyles,
    boxModel: BoxModel,
    elementId?: string
  ): boolean {
    const width = boxModel.totalWidth;
    const height = boxModel.totalHeight;

    // Exclude microscopic elements (smaller than 8x8px)
    if (width < 8 || height < 8) {
      return true;
    }

    // Exclude elements that are clearly decorative or part of larger components
    if (styles.pointerEvents === 'none') {
      return true;
    }

    // Exclude elements with very small dimensions that are likely decorative
    // Elements smaller than 16x16px are often icons, bullets, or decorative elements
    if (width < 16 || height < 16) {
      // Only include if they have clear interactive styling
      const hasInteractiveStyling = styles.cursor === 'pointer' ||
                                   styles.cursor === 'grab' ||
                                   styles.cursor === 'grabbing';

      if (!hasInteractiveStyling) {
        return true;
      }
    }

    // Exclude elements with no visual styling that suggests interactivity
    const hasBackground = styles.backgroundColor &&
                         styles.backgroundColor !== 'transparent' &&
                         styles.backgroundColor !== 'rgba(0, 0, 0, 0)' &&
                         styles.backgroundColor !== '';
    const hasBorder = styles.border &&
                     styles.border !== '0px' &&
                     styles.border !== 'none' &&
                     styles.border !== '';
    const hasBoxShadow = styles.boxShadow &&
                        styles.boxShadow !== 'none' &&
                        styles.boxShadow !== '';

    // If element has no background, border, or box shadow, it's likely just text
    // Only include it if it has clear interactive indicators
    if (!hasBackground && !hasBorder && !hasBoxShadow) {
      const isClearlyInteractive = styles.cursor === 'pointer' ||
                                  styles.cursor === 'grab' ||
                                  styles.cursor === 'grabbing' ||
                                  styles.cursor === 'text';

      if (!isClearlyInteractive) {
        return true;
      }
    }

    // Exclude elements that are too thin to be meaningful clickable areas
    // (like horizontal lines, vertical separators, etc.)
    if ((width < 24 && height >= 100) || (height < 24 && width >= 100)) {
      return true;
    }

    // Exclude elements that are extremely thin in one dimension
    // (like borders, underlines, etc.)
    if (width < 6 || height < 6) {
      return true;
    }

    // Exclude elements with no meaningful content and no interactive styling
    // Elements that are just whitespace or have minimal visual presence
    if (!hasBackground && !hasBorder && !hasBoxShadow) {
      const hasTextContent = styles.fontSize && parseFloat(styles.fontSize) > 0;
      if (!hasTextContent) {
        return true;
      }
    }

    return false;
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

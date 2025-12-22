/**
 * Copyright (c) 2025 Pixel Perfect Inspector
 *
 * Author: Pixel Perfect Inspector
 * Available for contact via email: support@b-b.top
 * For up-to-date contact information:
 * https://github.com/bivex
 *
 * Created: 2025-12-22T07:28:12
 * Last Updated: 2025-12-22T11:34:33
 *
 * Licensed under the MIT License.
 * Commercial licensing available upon request.
 */

import { ElementInspection, Issue, IssueSeverity, ElementInspectionFactory } from '../entities/ElementInspection';
import { DesignRules, Breakpoint } from '../entities/DesignRules';

/**
 * Domain service for checking responsive behavior
 * Analyzes how elements behave at different viewport sizes
 */
export class ResponsiveChecker {
  /**
   * Checks elements for responsive issues at a specific breakpoint
   */
  static checkResponsiveBehavior(
    elements: ElementInspection[],
    viewportSize: { width: number; height: number },
    rules: DesignRules
  ): Issue[] {
    const issues: Issue[] = [];
    const activeBreakpoint = this.getActiveBreakpoint(viewportSize.width, rules);

    elements.forEach(element => {
      issues.push(...this.checkElementResponsive(element, viewportSize, activeBreakpoint, rules));
    });

    // Check for layout shifts and overlapping elements
    issues.push(...this.checkLayoutIssues(elements, viewportSize, rules));

    return issues;
  }

  /**
   * Checks individual element for responsive issues
   */
  private static checkElementResponsive(
    element: ElementInspection,
    viewportSize: { width: number; height: number },
    breakpoint: Breakpoint | null,
    rules: DesignRules
  ): Issue[] {
    const issues: Issue[] = [];

    // Check if element overflows viewport
    if (element.boxModel.totalWidth > viewportSize.width) {
      issues.push(ElementInspectionFactory.createIssue(
        'responsive_overflow',
        'error',
        'responsive',
        `Элемент шире viewport: ${element.boxModel.totalWidth}px > ${viewportSize.width}px`,
        element.elementId,
        element.selector,
        {
          suggestedFix: 'Добавьте горизонтальную прокрутку или уменьшите ширину элемента',
          actualValue: element.boxModel.totalWidth,
          expectedValue: viewportSize.width,
          context: { breakpoint: breakpoint?.name },
        }
      ));
    }

    // Check text size on mobile
    if (breakpoint?.device === 'mobile') {
      const fontSize = parseFloat(element.computedStyles.fontSize);
      if (fontSize < rules.typographyScale.minMobileSize) {
        issues.push(ElementInspectionFactory.createIssue(
          'text_too_small',
          'error',
          'responsive',
          `Текст слишком мелкий для мобильных: ${fontSize}px (минимум ${rules.typographyScale.minMobileSize}px)`,
          element.elementId,
          element.selector,
          {
            suggestedFix: `Увеличьте размер шрифта до ${rules.typographyScale.minMobileSize}px`,
            actualValue: fontSize,
            expectedValue: rules.typographyScale.minMobileSize,
            context: { breakpoint: breakpoint.name },
          }
        ));
      }
    }

    // Check if clickable elements are still accessible on small screens
    const isClickable = this.isClickableElement(element.computedStyles);
    if (isClickable && breakpoint?.device === 'mobile') {
      const minSize = rules.minClickableSize;
      const totalWidth = element.boxModel.totalWidth;
      const totalHeight = element.boxModel.totalHeight;

      if (totalWidth < minSize || totalHeight < minSize) {
        issues.push(ElementInspectionFactory.createIssue(
          'inaccessible_click_area',
          'error',
          'responsive',
          `Кликабельная область слишком маленькая для мобильных: ${totalWidth}×${totalHeight}px`,
          element.elementId,
          element.selector,
          {
            suggestedFix: `Увеличьте размеры минимум до ${minSize}×${minSize}px`,
            actualValue: { width: totalWidth, height: totalHeight },
            expectedValue: { width: minSize, height: minSize },
            context: { breakpoint: breakpoint.name },
          }
        ));
      }
    }

    // Check for fixed widths that might not work on smaller screens
    if (element.computedStyles.width.includes('px')) {
      const width = parseFloat(element.computedStyles.width);
      if (width > viewportSize.width * 0.8) { // More than 80% of viewport
        issues.push(ElementInspectionFactory.createIssue(
          'responsive_overflow',
          'warning',
          'responsive',
          `Фиксированная ширина ${width}px может вызвать проблемы на маленьких экранах`,
          element.elementId,
          element.selector,
          {
            suggestedFix: 'Используйте относительные единицы (%, vw) или max-width',
            actualValue: width,
            expectedValue: Math.floor(viewportSize.width * 0.8),
            context: { breakpoint: breakpoint?.name },
          }
        ));
      }
    }

    return issues;
  }

  /**
   * Checks for layout issues across multiple elements
   */
  private static checkLayoutIssues(
    elements: ElementInspection[],
    viewportSize: { width: number; height: number },
    rules: DesignRules
  ): Issue[] {
    const issues: Issue[] = [];

    // Check for overlapping elements
    for (let i = 0; i < elements.length; i++) {
      for (let j = i + 1; j < elements.length; j++) {
        const elem1 = elements[i];
        const elem2 = elements[j];

        if (this.elementsOverlap(elem1, elem2)) {
          issues.push(ElementInspectionFactory.createIssue(
            'layout_shift',
            'warning',
            'layout',
            `Элементы накладываются: ${elem1.selector} и ${elem2.selector}`,
            elem1.elementId,
            elem1.selector,
            {
              suggestedFix: 'Проверьте позиционирование и размеры элементов',
              context: {
                overlappingElement: elem2.selector,
                viewport: viewportSize,
              },
            }
          ));
        }
      }
    }

    // Check for elements extending beyond viewport bounds
    elements.forEach(element => {
      const bounds = this.getElementBounds(element);
      if (bounds.right > viewportSize.width || bounds.bottom > viewportSize.height) {
        issues.push(ElementInspectionFactory.createIssue(
          'responsive_overflow',
          'error',
          'responsive',
          `Элемент выходит за границы viewport: ${bounds.right > viewportSize.width ? 'справа' : 'снизу'}`,
          element.elementId,
          element.selector,
          {
            suggestedFix: 'Добавьте прокрутку или скорректируйте размеры/позиционирование',
            actualValue: bounds,
            expectedValue: { right: viewportSize.width, bottom: viewportSize.height },
          }
        ));
      }
    });

    return issues;
  }

  /**
   * Gets the active breakpoint for current viewport width
   */
  private static getActiveBreakpoint(viewportWidth: number, rules: DesignRules): Breakpoint | null {
    return rules.breakpoints.find(bp => viewportWidth >= bp.minWidth) || null;
  }

  /**
   * Checks if two elements overlap
   */
  private static elementsOverlap(elem1: ElementInspection, elem2: ElementInspection): boolean {
    const bounds1 = this.getElementBounds(elem1);
    const bounds2 = this.getElementBounds(elem2);

    return !(bounds1.right < bounds2.left ||
             bounds1.left > bounds2.right ||
             bounds1.bottom < bounds2.top ||
             bounds1.top > bounds2.bottom);
  }

  /**
   * Gets element bounds from box model
   */
  private static getElementBounds(element: ElementInspection): {
    left: number;
    top: number;
    right: number;
    bottom: number;
  } {
    const { boxModel } = element;
    return {
      left: boxModel.content.x - boxModel.margin.left,
      top: boxModel.content.y - boxModel.margin.top,
      right: boxModel.content.x + boxModel.totalWidth,
      bottom: boxModel.content.y + boxModel.totalHeight,
    };
  }

  /**
   * Checks if element is clickable based on its styles
   */
  private static isClickableElement(computedStyles: any): boolean {
    return computedStyles.cursor === 'pointer' ||
           computedStyles.pointerEvents !== 'none' ||
           ['button', 'a', 'input', 'select', 'textarea'].includes(computedStyles.display);
  }

  /**
   * Validates if current layout works well at breakpoint
   */
  static validateBreakpointCompatibility(
    elements: ElementInspection[],
    fromBreakpoint: Breakpoint,
    toBreakpoint: Breakpoint,
    rules: DesignRules
  ): Issue[] {
    const issues: Issue[] = [];

    // Check for elements that might need different sizing
    elements.forEach(element => {
      if (fromBreakpoint.device !== toBreakpoint.device) {
        // Device type changed (mobile -> tablet -> desktop)
        issues.push(...this.checkDeviceTransition(element, fromBreakpoint, toBreakpoint, rules));
      }
    });

    return issues;
  }

  /**
   * Checks issues when transitioning between device types
   */
  private static checkDeviceTransition(
    element: ElementInspection,
    fromBreakpoint: Breakpoint,
    toBreakpoint: Breakpoint,
    rules: DesignRules
  ): Issue[] {
    const issues: Issue[] = [];

    // Check if text needs scaling
    const fontSize = parseFloat(element.computedStyles.fontSize);
    const minSize = toBreakpoint.device === 'mobile' ?
      rules.typographyScale.minMobileSize :
      rules.typographyScale.fontSize.sm;

    if (fontSize < minSize) {
      issues.push(ElementInspectionFactory.createIssue(
        'text_too_small',
        'warning',
        'responsive',
        `Размер текста может быть слишком мелким для ${toBreakpoint.device}: ${fontSize}px`,
        element.elementId,
        element.selector,
        {
          suggestedFix: `Рассмотрите увеличение до ${minSize}px для ${toBreakpoint.device}`,
          actualValue: fontSize,
          expectedValue: minSize,
          context: {
            fromBreakpoint: fromBreakpoint.name,
            toBreakpoint: toBreakpoint.name,
          },
        }
      ));
    }

    return issues;
  }
}

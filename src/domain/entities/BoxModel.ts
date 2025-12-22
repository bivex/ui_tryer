/**
 * Copyright (c) 2025 Pixel Perfect Inspector
 *
 * Author: Pixel Perfect Inspector
 * Available for contact via email: support@b-b.top
 * For up-to-date contact information:
 * https://github.com/bivex
 *
 * Created: 2025-12-22T07:27:32
 * Last Updated: 2025-12-22T07:46:21
 *
 * Licensed under the MIT License.
 * Commercial licensing available upon request.
 */

/**
 * Domain entity representing CSS Box Model
 * Contains all geometric information about an element's layout
 */
export interface BoxModel {
  /** Content area dimensions and position */
  content: Rect;

  /** Padding on all sides */
  padding: Sides;

  /** Border widths on all sides */
  border: Sides;

  /** Margin on all sides */
  margin: Sides;

  /** Total dimensions including all box model properties */
  totalWidth: number;
  totalHeight: number;
}

/**
 * Rectangle with position and dimensions
 */
export interface Rect {
  width: number;
  height: number;
  x: number;
  y: number;
}

/**
 * Spacing values for all four sides
 */
export interface Sides {
  top: number;
  right: number;
  bottom: number;
  left: number;
}

/**
 * Factory for creating BoxModel instances
 */
export class BoxModelFactory {
  static create(
    contentRect: Rect,
    padding: Sides,
    border: Sides,
    margin: Sides
  ): BoxModel {
    return {
      content: contentRect,
      padding,
      border,
      margin,
      totalWidth: contentRect.width + padding.left + padding.right + border.left + border.right + margin.left + margin.right,
      totalHeight: contentRect.height + padding.top + padding.bottom + border.top + border.bottom + margin.top + margin.bottom,
    };
  }

  static fromDOMRect(domRect: DOMRect, computedStyle: CSSStyleDeclaration): BoxModel {
    const content = {
      width: domRect.width,
      height: domRect.height,
      x: domRect.x,
      y: domRect.y,
    };

    const padding = this.parseSides(computedStyle, 'padding');
    const border = this.parseSides(computedStyle, 'border', true);
    const margin = this.parseSides(computedStyle, 'margin');

    return this.create(content, padding, border, margin);
  }

  private static parseSides(style: CSSStyleDeclaration, property: string, isBorder = false): Sides {
    const suffix = isBorder ? 'Width' : '';

    return {
      top: parseFloat(style.getPropertyValue(`${property}-top${suffix}`)) || 0,
      right: parseFloat(style.getPropertyValue(`${property}-right${suffix}`)) || 0,
      bottom: parseFloat(style.getPropertyValue(`${property}-bottom${suffix}`)) || 0,
      left: parseFloat(style.getPropertyValue(`${property}-left${suffix}`)) || 0,
    };
  }
}

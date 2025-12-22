/**
 * Copyright (c) 2025 Pixel Perfect Inspector
 *
 * Author: Pixel Perfect Inspector
 * Available for contact via email: support@b-b.top
 * For up-to-date contact information:
 * https://github.com/bivex
 *
 * Created: 2025-12-22T07:27:46
 * Last Updated: 2025-12-22T07:46:22
 *
 * Licensed under the MIT License.
 * Commercial licensing available upon request.
 */

import { BoxModel, Rect } from './BoxModel';

/**
 * Domain entity representing a complete element inspection
 * Contains all information gathered about an element during inspection
 */
export interface ElementInspection {
  /** Unique identifier for the element */
  elementId: string;

  /** CSS selector for the element */
  selector: string;

  /** CSS Box Model data */
  boxModel: BoxModel;

  /** Computed CSS styles relevant for UI analysis */
  computedStyles: ComputedStyles;

  /** List of issues found during inspection */
  issues: Issue[];

  /** Timestamp when inspection was performed */
  timestamp: number;

  /** Element's position in viewport */
  viewportPosition?: Rect;

  /** Element's position in document */
  documentPosition?: Rect;
}

/**
 * Computed CSS properties relevant for UI inspection
 */
export interface ComputedStyles {
  /** Layout properties */
  display: string;
  position: string;
  width: string;
  height: string;
  minWidth?: string;
  minHeight?: string;
  maxWidth?: string;
  maxHeight?: string;

  /** Typography */
  fontSize: string;
  lineHeight: string;
  fontFamily: string;
  fontWeight: string;

  /** Colors */
  color: string;
  backgroundColor: string;
  borderColor?: string;

  /** Spacing */
  margin: string;
  padding: string;
  border: string;

  /** Other relevant properties */
  cursor?: string;
  pointerEvents?: string;
  visibility: string;
  opacity: string;
  boxShadow?: string;
}

/**
 * Issue found during element inspection
 */
export interface Issue {
  /** Unique identifier */
  id: string;

  /** Type of issue */
  type: IssueType;

  /** Severity level */
  severity: IssueSeverity;

  /** Human-readable message */
  message: string;

  /** Element that has the issue */
  elementId: string;

  /** CSS selector for the element */
  selector: string;

  /** Suggested fix for the issue */
  suggestedFix?: string;

  /** Actual value that caused the issue */
  actualValue?: any;

  /** Expected value according to design rules */
  expectedValue?: any;

  /** Position of the problematic area */
  position?: Rect;

  /** Additional context data */
  context?: Record<string, any>;
}

/**
 * Types of issues that can be detected
 */
export type IssueType =
  | 'spacing_not_on_grid'
  | 'asymmetric_spacing'
  | 'inconsistent_sizing'
  | 'too_small_clickable_area'
  | 'alignment_issue'
  | 'responsive_overflow'
  | 'text_too_small'
  | 'color_not_in_palette'
  | 'spacing_not_in_scale'
  | 'layout_shift'
  | 'contrast_ratio_low'
  | 'missing_alt_text'
  | 'inaccessible_click_area';

/**
 * Severity levels for issues
 */
export type IssueSeverity = 'info' | 'warning' | 'error';

/**
 * Factory for creating ElementInspection instances
 */
export class ElementInspectionFactory {
  static create(
    elementId: string,
    selector: string,
    boxModel: BoxModel,
    computedStyles: ComputedStyles,
    issues: Issue[] = []
  ): ElementInspection {
    return {
      elementId,
      selector,
      boxModel,
      computedStyles,
      issues,
      timestamp: Date.now(),
    };
  }

  static createIssue(
    type: IssueType,
    severity: IssueSeverity,
    message: string,
    elementId: string,
    selector: string,
    options: {
      suggestedFix?: string;
      actualValue?: any;
      expectedValue?: any;
      position?: Rect;
      context?: Record<string, any>;
    } = {}
  ): Issue {
    return {
      id: `${elementId}_${type}_${Date.now()}`,
      type,
      severity,
      message,
      elementId,
      selector,
      ...options,
    };
  }
}

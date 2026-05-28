/**
 * Copyright (c) 2025 Pixel Perfect Inspector
 *
 * Author: Pixel Perfect Inspector
 * Available for contact via email: support@b-b.top
 * For up-to-date contact information:
 * https://github.com/bivex
 *
 * Created: 2025-12-22T07:27:46
 * Last Updated: 2025-12-22T12:01:40
 *
 * Licensed under the MIT License.
 * Commercial licensing available upon request.
 */

import type { BoxModel, Rect, Sides } from './BoxModel';

export type { BoxModel, Rect, Sides };

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

  /** Context information about the element's environment */
  context?: ElementContext;

  /** Visual metrics for advanced analysis */
  visualMetrics?: VisualMetrics;

  /** Relations to other elements */
  relations?: ElementRelations;
  /** Time taken to process the inspection in milliseconds */
  processingTime?: number;
}

/**
 * Context information about element's environment and usage
 */
export interface ElementContext {
  /** Viewport information */
  viewport: {
    width: number;
    height: number;
    devicePixelRatio: number;
  };

  /** Parent container information */
  parent?: {
    display: string;
    flexDirection?: string;
    gridTemplate?: string;
    width: number;
    height: number;
  };

  /** Sibling elements count and types */
  siblings: {
    count: number;
    similarElements: number; // elements with same tag/role
  };

  /** Page-level context */
  page: {
    hasNavigation: boolean;
    hasFooter: boolean;
    primaryColor?: string;
    fontFamily?: string;
  };

  /** User interaction context */
  interaction: {
    isHoverable: boolean;
    isFocusable: boolean;
    hasClickHandler: boolean;
    tabIndex?: number;
  };

  /** Computed states for advanced analysis */
  computedStates?: {
    isVisible: boolean;
    isInViewport: boolean;
    effectiveZIndex: number;
    hover?: any;
    focus?: any;
    active?: any;
  };

  /** Element relations for consistency analysis */
  relations?: ElementRelations;

  /** Text content of the element for typography analysis */
  textContent?: string;

  /** Raw DOM attributes (src, loading, alt, etc.) for performance analysis */
  domAttributes?: Record<string, string>;
}

/**
 * Visual metrics for advanced UI analysis
 */
export interface VisualMetrics {
  /** Visual weight (importance) of the element */
  visualWeight: number;

  /** Focus score (how well it attracts attention) */
  focusScore: number;

  /** Color contrast score (APCA) */
  contrastScore: number;

  /** Harmony score (fits color scheme) */
  harmonyScore: number;

  /** Optical alignment data */
  opticalAlignment?: {
    visualCenterX: number;
    visualCenterY: number;
    opticalShiftX: number;
    opticalShiftY: number;
  };

  /** Typography metrics */
  typography?: {
    lineLength: number; // characters per line
    lineHeightRatio: number;
    fontSize: number;
    readingEase: number; // Flesch score approximation
  };
}

/**
 * Relations to other elements on the page
 */
export interface ElementRelations {
  /** Parent element ID */
  parentId?: string;

  /** Child element IDs */
  childrenIds: string[];

  /** Sibling element IDs */
  siblingIds: string[];

  /** Nearby elements (within 50px) */
  nearbyElements: Array<{
    id: string;
    distance: number;
    direction: 'above' | 'below' | 'left' | 'right';
  }>;

  /** Alignment lines this element belongs to */
  alignmentLines: Array<{
    axis: 'x' | 'y';
    position: number;
    elements: string[]; // other elements on this line
  }>;

  /** Visual grouping (perceived as part of a group) */
  visualGroup?: {
    groupId: string;
    confidence: number;
    elements: string[];
  };
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

  /** Category of the issue */
  category: IssueCategory;

  /** Human-readable message */
  message: string;

  /** Element that has the issue */
  elementId: string;

  /** CSS selector for the element */
  selector: string;

  /** Suggested fix for the issue */
  suggestedFix?: string;

  /** Code example for the fix */
  codeExample?: string;

  /** Links to relevant documentation */
  learnMoreUrl?: string;

  /** Additional context data */
  context?: Record<string, any>;
  /** Actual value that caused the issue */
  actualValue?: any;
  /** Expected value according to design rules */
  expectedValue?: any;
  /** Position of the problematic area */
  position?: Rect;
}

/**
 * Categories of issues for better organization
 */
export type IssueCategory =
  | 'spacing'
  | 'sizing'
  | 'typography'
  | 'color'
  | 'layout'
  | 'accessibility'
  | 'interaction'
  | 'consistency'
  | 'responsive'
  | 'performance';

/**
 * Types of issues that can be detected
 */
export type IssueType =
  // Spacing issues
  | 'spacing_not_on_grid'
  | 'spacing_not_in_scale'
  | 'asymmetric_spacing'
  | 'spacing_redundancy'
  | 'margin_collapse_issue'
  | 'vertical_rhythm_broken'
  | 'optical_alignment_issue'

  // Sizing issues
  | 'inconsistent_sizing'
  | 'too_small_clickable_area'
  | 'context_dependent_sizing'
  | 'overflow_clipping'
  | 'aspect_ratio_issue'
  | 'golden_ratio_deviation'

  // Typography issues
  | 'text_too_small'
  | 'line_length_too_long'
  | 'line_height_inadequate'
  | 'type_scale_inconsistent'
  | 'orphans_widows_present'
  | 'reading_ease_poor'

  // Color issues
  | 'color_not_in_palette'
  | 'contrast_ratio_low'
  | 'apca_contrast_insufficient'
  | 'color_harmony_broken'
  | 'color_semantics_wrong'
  | 'color_blindness_issue'

  // Layout issues
  | 'alignment_issue'
  | 'z_index_conflict'
  | 'visual_hierarchy_broken'
  | 'grid_alignment_issue'

  // Accessibility issues
  | 'missing_alt_text'
  | 'inaccessible_click_area'
  | 'ari-incomplete'
  | 'keyboard_navigation_broken'
  | 'focus_indicator_missing'
  | 'semantic_structure_broken'

  // Interaction issues
  | 'state_styles_missing'
  | 'transition_inadequate'
  | 'loading_state_missing'
  | 'layout_shift_potential'

  // Consistency issues
  | 'component_inconsistency'
  | 'design_token_mismatch'
  | 'pattern_violation'

  // Responsive issues
  | 'responsive_overflow'
  | 'breakpoint_inconsistency'
  | 'mobile_layout_issue'

  // Performance issues
  | 'layout_shift'
  | 'reflow_trigger'
  | 'inefficient_animation';

/**
 * Severity levels for issues
 */
export type IssueSeverity = 'info' | 'warning' | 'error' | 'critical';

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
    category: IssueCategory,
    message: string,
    elementId: string,
    selector: string,
    options: {
      suggestedFix?: string;
      codeExample?: string;
      learnMoreUrl?: string;
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
      category,
      message,
      elementId,
      selector,
      ...options,
    };
  }
}

export interface UIReport {
  id: string;
  title: string;
  timestamp: number;
  url: string;
  summary: ReportSummary;
  issues: Issue[];
  comparisons: ElementComparison[];
  screenshots: Screenshot[];
  analysisErrors?: AnalysisError[];
}

export interface ReportSummary {
  totalIssues: number;
  issuesBySeverity: Record<string, number>;
  issuesByType: Record<string, number>;
  elementsInspected: number;
}

export interface Screenshot {
  id: string;
  data: string; // base64
  description: string;
  timestamp: number;
}

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

/**
 * Analysis error that occurred during element processing
 */
export interface AnalysisError {
  /** Unique identifier */
  id: string;

  /** Error type/category */
  type: 'tokenization_error' | 'parsing_error' | 'analysis_error' | 'css_parsing_error';

  /** Error message */
  message: string;

  /** Element that caused the error (if applicable) */
  elementId?: string;

  /** CSS selector of the problematic element */
  selector?: string;

  /** Stack trace or additional error details */
  details?: string;

  /** Timestamp when error occurred */
  timestamp: number;
}

/**
 * Copyright (c) 2025 Bivex
 *
 * Author: Bivex
 * Available for contact via email: support@b-b.top
 * For up-to-date contact information:
 * https://github.com/bivex
 *
 * Created: 2025-12-22T07:27:15
 * Last Updated: 2025-12-22T10:09:30
 *
 * Licensed under the MIT License.
 * Commercial licensing available upon request.
 */

// Message contracts between extension layers
export interface Message<T = any> {
  type: MessageType;
  payload: T;
  source: 'popup' | 'content' | 'background';
  target: 'popup' | 'content' | 'background';
  timestamp: number;
  requestId?: string;
}

export type MessageType =
  // Inspection messages
  | 'INSPECT_ELEMENT_REQUEST'
  | 'INSPECT_ELEMENT_RESPONSE'
  | 'TOGGLE_INSPECTION_MODE'
  | 'INSPECTION_MODE_STATUS'
  | 'ELEMENT_SELECTED'

  // Responsive messages
  | 'RESPONSIVE_CHECK_REQUEST'
  | 'RESPONSIVE_CHECK_RESPONSE'
  | 'SET_BREAKPOINT'

  // Comparison messages
  | 'COMPARE_ELEMENTS_REQUEST'
  | 'COMPARE_ELEMENTS_RESPONSE'

  // Report messages
  | 'GENERATE_REPORT_REQUEST'
  | 'GENERATE_REPORT_RESPONSE'

  // Settings messages
  | 'LOAD_SETTINGS_REQUEST'
  | 'LOAD_SETTINGS_RESPONSE'
  | 'SAVE_SETTINGS_REQUEST'
  | 'SAVE_SETTINGS_RESPONSE';

// Message payloads
export interface InspectElementRequest {
  elementId: string;
  rules: DesignRules;
  includeComputedStyles?: boolean;
}

export interface InspectElementResponse {
  inspection: ElementInspection;
  issues: Issue[];
}

export interface ToggleInspectionModeRequest {
  enabled: boolean;
}

export interface InspectionModeStatusResponse {
  enabled: boolean;
  activeTabId?: number;
}

export interface ResponsiveCheckRequest {
  breakpoint: Breakpoint;
  rules: DesignRules;
}

export interface ResponsiveCheckResponse {
  issues: Issue[];
  viewportSize: ViewportSize;
  screenshot?: string; // base64 encoded
}

export interface CompareElementsRequest {
  elementIds: string[];
  comparisonType: 'spacing' | 'sizing' | 'colors' | 'all';
}

export interface CompareElementsResponse {
  comparison: ElementComparison;
  inconsistencies: Issue[];
}

export interface GenerateReportRequest {
  scope: 'current_page' | 'selected_elements';
  format: 'json' | 'html';
  includeScreenshots: boolean;
}

export interface GenerateReportResponse {
  report: UIReport;
  downloadUrl?: string;
}

export interface LoadSettingsResponse {
  settings: ExtensionSettings;
}

export interface SaveSettingsRequest {
  settings: ExtensionSettings;
}

// Import domain types
export interface ElementInspection {
  elementId: string;
  selector: string;
  boxModel: BoxModel;
  computedStyles: ComputedStyles;
  issues: Issue[];
  timestamp: number;
}

export interface BoxModel {
  content: Rect;
  padding: Sides;
  border: Sides;
  margin: Sides;
  totalWidth: number;
  totalHeight: number;
}

export interface Rect {
  width: number;
  height: number;
  x: number;
  y: number;
}

export interface Sides {
  top: number;
  right: number;
  bottom: number;
  left: number;
}

export interface ComputedStyles {
  display: string;
  position: string;
  width: string;
  height: string;
  minWidth?: string;
  minHeight?: string;
  maxWidth?: string;
  maxHeight?: string;
  fontSize: string;
  lineHeight: string;
  fontFamily?: string;
  fontWeight?: string;
  color: string;
  backgroundColor: string;
  backgroundImage?: string;
  border?: string;
  borderColor?: string;
  margin?: string;
  padding?: string;
  cursor?: string;
  pointerEvents?: string;
  visibility?: string;
  opacity?: string;
  boxShadow?: string;
}

export interface DesignRules {
  spacingGrid: number[];
  minClickableSize: number;
  colorPalette: string[];
  breakpoints: Breakpoint[];
  spacingScale: SpacingScale;
}

export interface SpacingScale {
  xs: number;
  sm: number;
  md: number;
  lg: number;
  xl: number;
  xxl: number;
}

export interface Breakpoint {
  name: string;
  width: number;
  height: number;
  device: 'mobile' | 'tablet' | 'desktop';
}

export interface ViewportSize {
  width: number;
  height: number;
}

export interface Issue {
  id: string;
  type: IssueType;
  severity: 'info' | 'warning' | 'error';
  message: string;
  elementId: string;
  selector: string;
  suggestedFix?: string;
  actualValue?: any;
  expectedValue?: any;
  position?: Rect;
}

export type IssueType =
  | 'spacing_not_on_grid'
  | 'asymmetric_spacing'
  | 'inconsistent_sizing'
  | 'too_small_clickable_area'
  | 'alignment_issue'
  | 'responsive_overflow'
  | 'text_too_small'
  | 'color_not_in_palette'
  | 'spacing_not_in_scale';

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

export interface UIReport {
  id: string;
  title: string;
  timestamp: number;
  url: string;
  summary: ReportSummary;
  issues: Issue[];
  comparisons: ElementComparison[];
  screenshots: Screenshot[];
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

export interface ExtensionSettings {
  designRules: DesignRules;
  ui: {
    overlayOpacity: number;
    showGridOverlay: boolean;
    theme: 'light' | 'dark';
  };
  shortcuts: {
    toggleInspect: string;
    generateReport: string;
  };
  version: string;
}

/**
 * Copyright (c) 2025 Bivex
 *
 * Author: Bivex
 * Available for contact via email: support@b-b.top
 * For up-to-date contact information:
 * https://github.com/bivex
 *
 * Created: 2025-12-22T07:27:15
 * Last Updated: 2025-12-22T11:18:51
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
  sessionId?: string; // For bulk operations tracking
}

export type MessageType =
  // Core inspection messages
  | 'INSPECT_ELEMENT_REQUEST'
  | 'INSPECT_ELEMENT_RESPONSE'
  | 'TOGGLE_INSPECTION_MODE'
  | 'INSPECTION_MODE_STATUS'
  | 'ELEMENT_SELECTED'

  // Advanced analysis messages
  | 'ADVANCED_ANALYZE_REQUEST'
  | 'ADVANCED_ANALYZE_RESPONSE'
  | 'VISUAL_METRICS_REQUEST'
  | 'VISUAL_METRICS_RESPONSE'
  | 'CONTEXT_ANALYZE_REQUEST'
  | 'CONTEXT_ANALYZE_RESPONSE'

  // Phase-specific analysis messages
  | 'APCA_CONTRAST_ANALYZE_REQUEST'
  | 'APCA_CONTRAST_ANALYZE_RESPONSE'
  | 'VERTICAL_RHYTHM_ANALYZE_REQUEST'
  | 'VERTICAL_RHYTHM_ANALYZE_RESPONSE'
  | 'TYPOGRAPHY_ANALYZE_REQUEST'
  | 'TYPOGRAPHY_ANALYZE_RESPONSE'
  | 'COLOR_HARMONY_ANALYZE_REQUEST'
  | 'COLOR_HARMONY_ANALYZE_RESPONSE'
  | 'ALIGNMENT_ANALYZE_REQUEST'
  | 'ALIGNMENT_ANALYZE_RESPONSE'
  | 'ACCESSIBILITY_ANALYZE_REQUEST'
  | 'ACCESSIBILITY_ANALYZE_RESPONSE'

  // Layout and interaction messages
  | 'LAYOUT_ANALYZE_REQUEST'
  | 'LAYOUT_ANALYZE_RESPONSE'
  | 'INTERACTION_ANALYZE_REQUEST'
  | 'INTERACTION_ANALYZE_RESPONSE'
  | 'CONSISTENCY_ANALYZE_REQUEST'
  | 'CONSISTENCY_ANALYZE_RESPONSE'

  // Performance and responsive messages
  | 'PERFORMANCE_ANALYZE_REQUEST'
  | 'PERFORMANCE_ANALYZE_RESPONSE'
  | 'RESPONSIVE_CHECK_REQUEST'
  | 'RESPONSIVE_CHECK_RESPONSE'
  | 'SET_BREAKPOINT'

  // Comparison and reporting messages
  | 'COMPARE_ELEMENTS_REQUEST'
  | 'COMPARE_ELEMENTS_RESPONSE'
  | 'COMPARE_DESIGN_SYSTEM_REQUEST'
  | 'COMPARE_DESIGN_SYSTEM_RESPONSE'
  | 'GENERATE_REPORT_REQUEST'
  | 'GENERATE_REPORT_RESPONSE'
  | 'EXPORT_ANALYSIS_REQUEST'
  | 'EXPORT_ANALYSIS_RESPONSE'

  // Settings and configuration messages
  | 'LOAD_ADVANCED_SETTINGS_REQUEST'
  | 'LOAD_ADVANCED_SETTINGS_RESPONSE'
  | 'SAVE_ADVANCED_SETTINGS_REQUEST'
  | 'SAVE_ADVANCED_SETTINGS_RESPONSE'
  | 'LOAD_DESIGN_RULES_REQUEST'
  | 'LOAD_DESIGN_RULES_RESPONSE'
  | 'SAVE_DESIGN_RULES_REQUEST'
  | 'SAVE_DESIGN_RULES_RESPONSE'
  | 'LOAD_SETTINGS_REQUEST'
  | 'LOAD_SETTINGS_RESPONSE'
  | 'SAVE_SETTINGS_REQUEST'
  | 'SAVE_SETTINGS_RESPONSE'

  // Bulk operations messages
  | 'BULK_ANALYZE_REQUEST'
  | 'BULK_ANALYZE_PROGRESS'
  | 'BULK_ANALYZE_RESPONSE'
  | 'PAGE_ANALYZE_REQUEST'
  | 'PAGE_ANALYZE_PROGRESS'
  | 'PAGE_ANALYZE_RESPONSE';

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

import { IssueSeverity } from '../src/domain/entities/ElementInspection';

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
  // Direct access for convenience, derived from 'margin' and 'padding'
  marginTop: number;
  marginBottom: number;
  paddingTop: number;
  paddingBottom: number;
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

// Advanced analysis message payloads
export interface AdvancedAnalyzeRequest {
  elementId: string;
  rules: AdvancedDesignRules;
  context?: ElementContext;
  analysisScope: ('accessibility' | 'typography' | 'color' | 'layout' | 'interaction' | 'performance' | 'consistency')[];
}

export interface AdvancedAnalyzeResponse {
  inspection: ElementInspection;
  phaseResults: {
    accessibility: Issue[];
    typography: Issue[];
    color: Issue[];
    layout: Issue[];
    interaction: Issue[];
    performance: Issue[];
    consistency: Issue[];
  };
  visualMetrics: VisualMetrics;
  processingTime: number;
}

export interface VisualMetricsRequest {
  elementIds: string[];
  includeContext?: boolean;
}

export interface VisualMetricsResponse {
  metrics: Record<string, VisualMetrics>;
  pageMetrics?: {
    dominantColors: string[];
    typographyScale: number[];
    spacingScale: number[];
    visualHierarchy: VisualHierarchy;
  };
}

export interface ContextAnalyzeRequest {
  elementId: string;
  includeNearbyElements?: boolean;
  includePageContext?: boolean;
}

export interface ContextAnalyzeResponse {
  context: ElementContext;
  relations: ElementRelations;
  pageStats: {
    totalElements: number;
    interactiveElements: number;
    colorPalette: string[];
    typographyUsage: Record<string, number>;
  };
}

// Phase-specific analysis payloads
export interface ApcaContrastAnalyzeRequest {
  elementId: string;
  foreground: string;
  background: string;
  fontSize: number;
  fontWeight?: number;
  contentType: 'body' | 'heading' | 'large' | 'ui';
}

export interface ApcaContrastAnalyzeResponse {
  score: number;
  isAccessible: boolean;
  requiredMinimum: number;
  suggestions: ColorSuggestion[];
}

export interface VerticalRhythmAnalyzeRequest {
  elementId: string;
  verticalSpacings: number[];
  containerHeight?: number;
}

export interface VerticalRhythmAnalyzeResponse {
  baseSpacing: number;
  detectedScale: number[];
  violations: SpacingViolation[];
  suggestions: SpacingSuggestion[];
}

export interface TypographyAnalyzeRequest {
  elementId: string;
  fontSize: number;
  lineHeight: number;
  containerWidth: number;
  contentLength?: number;
}

export interface TypographyAnalyzeResponse {
  lineLength: number;
  readingEase: number;
  optimalLineHeight: number;
  issues: TypographyIssue[];
  suggestions: TypographySuggestion[];
}

export interface ColorHarmonyAnalyzeRequest {
  colors: string[];
  context: 'element' | 'page' | 'component';
}

export interface ColorHarmonyAnalyzeResponse {
  scheme: ColorScheme | null;
  harmonyScore: number;
  issues: ColorHarmonyIssue[];
  suggestions: ColorSuggestion[];
}

export interface AlignmentAnalyzeRequest {
  elementId: string;
  nearbyElements: Array<{
    id: string;
    rect: Rect;
    distance: number;
  }>;
}

export interface AlignmentAnalyzeResponse {
  alignmentLines: AlignmentLine[];
  violations: AlignmentViolation[];
  suggestions: AlignmentSuggestion[];
}

export interface AccessibilityAnalyzeRequest {
  elementId: string;
  computedStyles: ComputedStyles;
  semanticRole?: string;
  ariaAttributes?: Record<string, string>;
}

export interface AccessibilityAnalyzeResponse {
  wcagCompliance: 'A' | 'AA' | 'AAA' | 'fail';
  apcaScore: number;
  keyboardAccessible: boolean;
  screenReaderCompatible: boolean;
  issues: AccessibilityIssue[];
  recommendations: AccessibilityRecommendation[];
}

// Bulk operations payloads
export interface BulkAnalyzeRequest {
  elementIds: string[];
  rules: AdvancedDesignRules;
  analysisScope: string[];
  batchSize?: number;
}

export interface BulkAnalyzeProgress {
  completed: number;
  total: number;
  currentElement: string;
  issuesFound: number;
}

export interface BulkAnalyzeResponse {
  inspections: Record<string, ElementInspection>;
  summary: {
    totalElements: number;
    totalIssues: number;
    issuesByCategory: Record<string, number>;
    issuesBySeverity: Record<string, number>;
    processingTime: number;
  };
}

export interface PageAnalyzeRequest {
  rules: AdvancedDesignRules;
  analysisScope: string[];
  excludeSelectors?: string[];
  maxElements?: number;
}

export interface PageAnalyzeProgress {
  phase: string;
  completed: number;
  total: number;
  currentElement?: string;
}

export interface PageAnalyzeResponse {
  pageInspection: {
    url: string;
    title: string;
    timestamp: number;
    viewport: { width: number; height: number };
    elementsAnalyzed: number;
  };
  elementInspections: Record<string, ElementInspection>;
  pageMetrics: VisualMetricsResponse['pageMetrics'];
  summary: BulkAnalyzeResponse['summary'];
}

// Supporting types
export interface ColorSuggestion {
  foreground?: string;
  background?: string;
  contrast: number;
  reason: string;
}

export interface SpacingViolation {
  value: number;
  expected: number;
  deviation: number;
}

export interface SpacingSuggestion {
  value: number;
  reason: string;
  impact: 'minor' | 'moderate' | 'major';
}

export interface TypographyIssue {
  type: 'line_length' | 'line_height' | 'font_size' | 'orphans_widows';
  severity: IssueSeverity;
  description: string;
}

export interface TypographySuggestion {
  property: string;
  value: string | number;
  reason: string;
}

export interface ColorScheme {
  type: 'monochromatic' | 'analogous' | 'complementary' | 'triadic' | 'tetradic' | 'split-complementary';
  confidence: number;
  colors: string[];
}

export interface ColorHarmonyIssue {
  type: 'saturation_variance' | 'unknown_scheme' | 'semantic_mismatch';
  description: string;
  severity: IssueSeverity;
}

export interface AlignmentLine {
  axis: 'x' | 'y';
  position: number;
  elements: string[];
  confidence: number;
}

export interface AlignmentViolation {
  elementId: string;
  linePosition: number;
  actualPosition: number;
  deviation: number;
}

export interface AlignmentSuggestion {
  elementId: string;
  adjustment: number;
  axis: 'x' | 'y';
  reason: string;
}

export interface AccessibilityIssue {
  wcagGuideline: string;
  description: string;
  severity: IssueSeverity;
  impact: 'minor' | 'moderate' | 'serious' | 'critical';
}

export interface AccessibilityRecommendation {
  action: string;
  code?: string;
  priority: 'low' | 'medium' | 'high';
}

export interface VisualHierarchy {
  focalPoints: Array<{
    elementId: string;
    weight: number;
    position: { x: number; y: number };
  }>;
  hierarchyLevels: number;
  dominantElement?: string;
}

// Forward declarations for advanced types (to avoid circular imports)
// These types are defined in domain entities and will be available at runtime
export type AdvancedDesignRules = any; // Will be imported from domain
export type ElementContext = any;
export type VisualMetrics = any;
export type ElementRelations = any;

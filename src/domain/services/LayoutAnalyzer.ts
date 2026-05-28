/**
 * Copyright (c) 2025 Pixel Perfect Inspector
 *
 * Author: Pixel Perfect Inspector
 * Available for contact via email: support@b-b.top
 * For up-to-date contact information:
 * https://github.com/bivex
 *
 * Created: 2025-12-22T15:00:00
 * Last Updated: 2025-12-22T15:00:00
 *
 * Licensed under the MIT License.
 * Commercial licensing available upon request.
 */

/**
 * Layout analyzer for advanced layout analysis
 * Handles alignment detection, z-index conflicts, and visual hierarchy
 */
export class LayoutAnalyzer {
  /**
   * Analyze layout properties of an element
   */
  static analyzeLayout(
    elementId: string,
    selector: string,
    boxModel: any,
    styles: any,
    nearbyElements: any[],
    rules?: any
  ): LayoutAnalysis {
    const alignmentAnalysis = this.analyzeAlignment(elementId, boxModel, nearbyElements, rules?.alignment);
    const zIndexAnalysis = this.analyzeZIndex(elementId, styles.zIndex, rules?.zIndex);
    const hierarchyAnalysis = this.analyzeVisualHierarchy(elementId, styles, boxModel, rules?.visualHierarchy);

    const issues: LayoutIssue[] = [
      ...alignmentAnalysis.issues,
      ...zIndexAnalysis.issues,
      ...hierarchyAnalysis.issues
    ];

    return {
      alignment: alignmentAnalysis,
      zIndex: zIndexAnalysis,
      hierarchy: hierarchyAnalysis,
      issues,
      suggestions: this.generateLayoutSuggestions(issues, rules)
    };
  }

  /**
   * Analyze element alignment relative to nearby elements
   */
  private static analyzeAlignment(
    elementId: string,
    boxModel: any,
    nearbyElements: any[],
    rules?: any
  ): AlignmentAnalysis {
    const issues: LayoutIssue[] = [];
    const config = rules || { pixelTolerance: 2, minElementsInLine: 3 };

    const elementRect = {
      left: boxModel.content?.x || boxModel.left || 0,
      right: (boxModel.content?.x || boxModel.left || 0) + (boxModel.content?.width || boxModel.width || 0),
      top: boxModel.content?.y || boxModel.top || 0,
      bottom: (boxModel.content?.y || boxModel.top || 0) + (boxModel.content?.height || boxModel.height || 0),
      centerX: (boxModel.content?.x || boxModel.left || 0) + (boxModel.content?.width || boxModel.width || 0) / 2,
      centerY: (boxModel.content?.y || boxModel.top || 0) + (boxModel.content?.height || boxModel.height || 0) / 2
    };

    // Check for nearby alignments
    const alignments: AlignmentCandidate[] = [];

    for (const nearby of nearbyElements) {
      const distance = Math.sqrt(
        Math.pow(nearby.centerX - elementRect.centerX, 2) +
        Math.pow(nearby.centerY - elementRect.centerY, 2)
      );

      if (distance < 100) { // Within reasonable distance
        // Check horizontal alignment
        if (Math.abs(nearby.top - elementRect.top) <= config.pixelTolerance) {
          alignments.push({
            type: 'horizontal',
            position: elementRect.top,
            elements: [elementId, nearby.id],
            confidence: 1 - (Math.abs(nearby.top - elementRect.top) / config.pixelTolerance)
          });
        }

        if (Math.abs(nearby.bottom - elementRect.bottom) <= config.pixelTolerance) {
          alignments.push({
            type: 'horizontal',
            position: elementRect.bottom,
            elements: [elementId, nearby.id],
            confidence: 1 - (Math.abs(nearby.bottom - elementRect.bottom) / config.pixelTolerance)
          });
        }

        // Check vertical alignment
        if (Math.abs(nearby.left - elementRect.left) <= config.pixelTolerance) {
          alignments.push({
            type: 'vertical',
            position: elementRect.left,
            elements: [elementId, nearby.id],
            confidence: 1 - (Math.abs(nearby.left - elementRect.left) / config.pixelTolerance)
          });
        }

        if (Math.abs(nearby.centerX - elementRect.centerX) <= config.pixelTolerance) {
          alignments.push({
            type: 'vertical',
            position: elementRect.centerX,
            elements: [elementId, nearby.id],
            confidence: 1 - (Math.abs(nearby.centerX - elementRect.centerX) / config.pixelTolerance)
          });
        }
      }
    }

    // Check for imperfect alignments that should be perfect
    for (const nearby of nearbyElements) {
      const nearbyRect = {
        left: nearby.left,
        right: nearby.right,
        top: nearby.top,
        bottom: nearby.bottom,
        centerX: nearby.centerX,
        centerY: nearby.centerY
      };

      // Check for near-miss alignments
      const hOffsets = [
        Math.abs(elementRect.top - nearbyRect.top),
        Math.abs(elementRect.bottom - nearbyRect.bottom)
      ];

      const vOffsets = [
        Math.abs(elementRect.left - nearbyRect.left),
        Math.abs(elementRect.centerX - nearbyRect.centerX),
        Math.abs(elementRect.right - nearbyRect.right)
      ];

      const minHOffset = Math.min(...hOffsets);
      const minVOffset = Math.min(...vOffsets);

      if (minHOffset > config.pixelTolerance && minHOffset <= 10) {
        issues.push({
          type: 'alignment_issue',
          severity: 'info',
          message: `Element almost horizontally aligned with nearby element (${minHOffset}px off)`,
          elementId,
          suggestedFix: 'Adjust position for perfect horizontal alignment',
          context: { nearbyElement: nearby.id, offset: minHOffset, axis: 'horizontal' }
        });
      }

      if (minVOffset > config.pixelTolerance && minVOffset <= 10) {
        issues.push({
          type: 'alignment_issue',
          severity: 'info',
          message: `Element almost vertically aligned with nearby element (${minVOffset}px off)`,
          elementId,
          suggestedFix: 'Adjust position for perfect vertical alignment',
          context: { nearbyElement: nearby.id, offset: minVOffset, axis: 'vertical' }
        });
      }
    }

    return {
      alignments,
      issues,
      gridLines: this.extractGridLines(alignments, config.minElementsInLine)
    };
  }

  /**
   * Analyze z-index usage and conflicts
   */
  private static analyzeZIndex(
    elementId: string,
    zIndex: string | number | undefined,
    rules?: any
  ): ZIndexAnalysis {
    const issues: LayoutIssue[] = [];
    const config = rules || { scale: 10, maxRecommended: 100, negativeAllowed: false };

    if (zIndex === 'auto' || zIndex === undefined) {
      return { zIndex: undefined, issues: [], layer: 'default' };
    }

    if (zIndex !== undefined) {
      const zIndexValue = typeof zIndex === 'string' ? parseInt(zIndex) : zIndex;

      if (isNaN(zIndexValue)) {
        issues.push({
          type: 'z_index_conflict',
          severity: 'warning',
          message: `Invalid z-index value: ${zIndex}`,
          elementId,
          suggestedFix: 'Use numeric z-index values',
          context: { invalidValue: zIndex }
        });
        return { zIndex: zIndexValue, issues, layer: 'unknown' };
      }


      // Check for negative z-index
      if (zIndexValue < 0 && !config.negativeAllowed) {
        issues.push({
          type: 'z_index_conflict',
          severity: 'error',
          message: `Negative z-index (${zIndexValue}) may cause accessibility issues`,
          elementId,
          suggestedFix: 'Use positive z-index values or remove negative values',
          learnMoreUrl: 'https://developer.mozilla.org/en-US/docs/Web/CSS/z-index',
          context: { zIndex: zIndexValue, negativeAllowed: config.negativeAllowed }
        });
      }

      // Check for excessively high z-index
      if (zIndexValue > config.maxRecommended) {
        issues.push({
          type: 'z_index_conflict',
          severity: 'warning',
          message: `Z-index (${zIndexValue}) exceeds recommended maximum (${config.maxRecommended}). Consider using a structured z-index scale.`,
          elementId,
          suggestedFix: `Use z-index within recommended scale (max: ${config.maxRecommended})`,
          learnMoreUrl: 'https://developer.mozilla.org/en-US/docs/Web/CSS/z-index',
          context: { zIndex: zIndexValue, maxRecommended: config.maxRecommended }
        });
      }


      const layer = this.classifyZIndexLayer(zIndexValue);

      return {
        zIndex: zIndexValue,
        issues,
        layer
      };
    }

    return { zIndex: undefined, issues: [], layer: 'default' };
  }

  /**
   * Analyze visual hierarchy based on element properties
   */
  private static analyzeVisualHierarchy(
    elementId: string,
    styles: any,
    boxModel: any,
    rules?: any
  ): VisualHierarchyAnalysis {
    const issues: LayoutIssue[] = [];
    const config = rules || {
      weightFactors: {
        size: 1,
        colorSaturation: 50,
        borderWeight: 5,
        shadowPresence: 20,
        fontWeight: 10,
        position: 10
      },
      focalPointThreshold: 70,
      maxFocalPoints: 3
    };

    const visualWeight = this.calculateVisualWeight(styles, boxModel, config.weightFactors);

    // This would typically compare against page-level analysis
    // For now, we'll check individual element properties

    const isHighContrast = this.isHighContrastElement(styles);
    const hasShadow = styles.boxShadow && styles.boxShadow !== 'none';
    const isLarge = (boxModel.width || 0) * (boxModel.height || 0) > 10000; // > 100x100px

    if (visualWeight > config.focalPointThreshold && !isHighContrast && !hasShadow && !isLarge) {
      issues.push({
        type: 'visual_hierarchy_broken',
        severity: 'info',
        message: `Element has high visual weight (${visualWeight.toFixed(1)}) but lacks supporting visual cues`,
        elementId,
        suggestedFix: 'Add shadow, increase contrast, or resize to match importance',
        context: { visualWeight, hasShadow, isHighContrast, isLarge }
      });
    }

    return {
      visualWeight,
      isFocalPoint: visualWeight > config.focalPointThreshold,
      issues,
      hierarchyLevel: this.estimateHierarchyLevel(visualWeight)
    };
  }

  /**
   * Calculate visual weight of an element
   */
  private static calculateVisualWeight(styles: any, boxModel: any, factors: any): number {
    let weight = 0;

    // Size factor
    const area = (boxModel?.width || 0) * (boxModel?.height || 0);
    if (factors?.size) {
      weight += Math.min(area / 1000, 50) * factors.size;
    }

    // Color saturation (simplified - would need proper color analysis)
    if (styles?.backgroundColor && styles.backgroundColor !== 'transparent') {
      weight += (factors?.colorSaturation || 0) * 0.5; // Assume medium saturation
    }

    // Border weight
    if (styles?.border && styles.border !== 'none') {
      const borderWidth = parseFloat(styles.border.split(' ')[0]) || 0;
      weight += borderWidth * (factors?.borderWeight || 0);
    }

    // Shadow presence
    if (styles?.boxShadow && styles.boxShadow !== 'none') {
      weight += (factors?.shadowPresence || 0);
    }

    // Font weight
    if (styles?.fontWeight) {
      const fontWeight = parseInt(styles.fontWeight) || 400;
      weight += ((fontWeight - 400) / 100) * (factors?.fontWeight || 0);
    }

    // Position factor (top = higher weight)
    const top = boxModel?.top || 0;
    weight += (1 - Math.min(top / 1000, 1)) * (factors?.position || 0);

    return Math.min(weight, 100); // Cap at 100
  }

  /**
   * Check if element has high contrast
   */
  private static isHighContrastElement(styles: any): boolean {
    // Simplified check - would need proper contrast calculation
    return styles.color && styles.backgroundColor &&
           styles.color !== styles.backgroundColor;
  }

  /**
   * Classify z-index into layers
   */
  private static classifyZIndexLayer(zIndex: number): string {
    if (zIndex < 0) return 'background';
    if (zIndex < 10) return 'content';
    if (zIndex < 50) return 'interface';
    if (zIndex < 100) return 'overlay';
    return 'modal';
  }

  /**
   * Extract grid lines from alignments
   */
  private static extractGridLines(alignments: AlignmentCandidate[], minElements: number): GridLine[] {
    const gridLines: GridLine[] = [];
    const groupedAlignments = new Map<string, AlignmentCandidate[]>();

    // Group alignments by position and type
    for (const alignment of alignments) {
      const key = `${alignment.type}-${alignment.position}`;
      if (!groupedAlignments.has(key)) {
        groupedAlignments.set(key, []);
      }
      groupedAlignments.get(key)!.push(alignment);
    }

    // Extract grid lines with enough elements
    for (const [key, group] of groupedAlignments) {
      const allElements = new Set<string>();
      group.forEach(a => a.elements.forEach(id => allElements.add(id)));

      if (allElements.size >= minElements) {
        const [type, positionStr] = key.split('-');
        gridLines.push({
          type: type as 'horizontal' | 'vertical',
          position: parseFloat(positionStr),
          elements: Array.from(allElements),
          confidence: group.reduce((sum, a) => sum + a.confidence, 0) / group.length
        });
      }
    }

    return gridLines;
  }

  /**
   * Estimate hierarchy level based on visual weight
   */
  private static estimateHierarchyLevel(visualWeight: number): 'background' | 'content' | 'primary' | 'secondary' | 'accent' {
    if (visualWeight < 20) return 'background';
    if (visualWeight < 40) return 'content';
    if (visualWeight < 60) return 'secondary';
    if (visualWeight < 80) return 'primary';
    return 'accent';
  }

  /**
   * Generate layout improvement suggestions
   */
  private static generateLayoutSuggestions(issues: LayoutIssue[], rules?: any): LayoutSuggestion[] {
    const suggestions: LayoutSuggestion[] = [];

    const alignmentIssues = issues.filter(i => i.type === 'alignment_issue');
    const zIndexIssues = issues.filter(i => i.type === 'z_index_conflict');
    const hierarchyIssues = issues.filter(i => i.type === 'visual_hierarchy_broken');

    if (alignmentIssues.length > 0) {
      suggestions.push({
        type: 'alignment_improvement',
        description: `${alignmentIssues.length} alignment issues detected`,
        action: 'review_layout_grid',
        impact: 'medium'
      });
    }

    if (zIndexIssues.length > 0) {
      suggestions.push({
        type: 'z_index_organization',
        description: 'Z-index values need better organization',
        action: 'establish_z_index_scale',
        impact: 'high'
      });
    }

    if (hierarchyIssues.length > 0) {
      suggestions.push({
        type: 'hierarchy_enhancement',
        description: 'Visual hierarchy can be strengthened',
        action: 'add_visual_cues',
        impact: 'medium'
      });
    }

    return suggestions;
  }
}

/**
 * Result of layout analysis
 */
export interface LayoutAnalysis {
  alignment: AlignmentAnalysis;
  zIndex: ZIndexAnalysis;
  hierarchy: VisualHierarchyAnalysis;
  issues: LayoutIssue[];
  suggestions: LayoutSuggestion[];
}

/**
 * Alignment analysis result
 */
export interface AlignmentAnalysis {
  alignments: AlignmentCandidate[];
  issues: LayoutIssue[];
  gridLines: GridLine[];
}

/**
 * Z-index analysis result
 */
export interface ZIndexAnalysis {
  zIndex?: number;
  issues: LayoutIssue[];
  layer: string;
}

/**
 * Visual hierarchy analysis result
 */
export interface VisualHierarchyAnalysis {
  visualWeight: number;
  isFocalPoint: boolean;
  issues: LayoutIssue[];
  hierarchyLevel: string;
}

/**
 * Layout issue
 */
export interface LayoutIssue {
  type: 'alignment_issue' | 'z_index_conflict' | 'visual_hierarchy_broken';
  severity: 'info' | 'warning' | 'error';
  message: string;
  elementId: string;
  suggestedFix?: string;
  learnMoreUrl?: string;
  context?: any;
}

/**
 * Layout suggestion
 */
export interface LayoutSuggestion {
  type: string;
  description: string;
  action: string;
  impact: 'low' | 'medium' | 'high';
}

/**
 * Alignment candidate
 */
export interface AlignmentCandidate {
  type: 'horizontal' | 'vertical';
  position: number;
  elements: string[];
  confidence: number;
}

/**
 * Grid line
 */
export interface GridLine {
  type: 'horizontal' | 'vertical';
  position: number;
  elements: string[];
  confidence: number;
}

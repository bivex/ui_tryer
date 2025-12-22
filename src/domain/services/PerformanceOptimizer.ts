/**
 * Copyright (c) 2025 Pixel Perfect Inspector
 *
 * Author: Pixel Perfect Inspector
 * Available for contact via email: support@b-b.top
 * For up-to-date contact information:
 * https://github.com/bivex
 *
 * Created: 2025-12-22T17:00:00
 * Last Updated: 2025-12-22T17:00:00
 *
 * Licensed under the MIT License.
 * Commercial licensing available upon request.
 */

/**
 * Performance optimizer for large-scale element analysis
 * Implements progressive analysis, caching, and optimization strategies
 */
// Forward declarations for types that may be imported
type AnalysisTask = any;

export class PerformanceOptimizer {
  private static cache = new Map<string, CachedAnalysis>();
  private static analysisQueue: AnalysisTask[] = [];
  private static isProcessing = false;

  /**
   * Analyze elements with performance optimizations
   */
  static async analyzeElementsOptimized(
    elements: AnalysisInput[],
    rules: any,
    options: AnalysisOptions = {}
  ): Promise<OptimizedAnalysisResult> {
    const startTime = performance.now();

    // Initialize analysis context
    const context = this.createAnalysisContext(elements, options);

    // Prioritize elements for analysis
    const prioritizedElements = this.prioritizeElements(elements, context);

    // Check cache for previously analyzed elements
    const { cached, toAnalyze } = this.checkCache(prioritizedElements);

    // Analyze new elements
    const analyzed = await this.analyzeBatch(toAnalyze, rules, context);

    // Combine results
    const allResults = [...cached, ...analyzed];

    // Update cache
    this.updateCache(allResults, context);

    const endTime = performance.now();

    return {
      results: allResults,
      performance: {
        totalTime: endTime - startTime,
        cachedElements: cached.length,
        analyzedElements: analyzed.length,
        cacheHitRate: cached.length / allResults.length,
        averageTimePerElement: (endTime - startTime) / allResults.length
      },
      context
    };
  }

  /**
   * Progressive analysis for very large pages
   */
  static async analyzeProgressively(
    elements: AnalysisInput[],
    rules: any,
    onProgress?: (progress: AnalysisProgress) => void,
    options: AnalysisOptions = {}
  ): Promise<ProgressiveAnalysisResult> {
    const batchSize = options.batchSize || 20;
    const batches = this.createBatches(elements, batchSize);

    const results: ElementInspection[] = [];
    let totalTime = 0;

    for (let i = 0; i < batches.length; i++) {
      const batch = batches[i];
      const batchStartTime = performance.now();

      const batchResults = await this.analyzeBatch(batch, rules, {
        isProgressive: true,
        currentBatch: i,
        totalBatches: batches.length
      });

      const batchTime = performance.now() - batchStartTime;
      totalTime += batchTime;

      results.push(...batchResults);

      if (onProgress) {
        onProgress({
          completed: (i + 1) * batchSize,
          total: elements.length,
          currentBatch: i + 1,
          totalBatches: batches.length,
          batchTime,
          averageTimePerElement: totalTime / results.length
        });
      }

      // Allow UI to update between batches
      if (i < batches.length - 1) {
        await this.yieldToUI();
      }
    }

    return {
      results,
      performance: {
        totalTime,
        batchesProcessed: batches.length,
        averageBatchTime: totalTime / batches.length,
        averageTimePerElement: totalTime / results.length
      }
    };
  }

  /**
   * Create analysis context for optimization decisions
   */
  private static createAnalysisContext(elements: AnalysisInput[], options: AnalysisOptions): AnalysisContext {
    return {
      totalElements: elements.length,
      viewport: options.viewport || { width: 1920, height: 1080 },
      visibleElements: elements.filter(el => this.isElementVisible(el, options.viewport)).length,
      interactiveElements: elements.filter(el => this.isInteractiveElement(el.selector, el.computedStyles)).length,
      complexElements: elements.filter(el => this.isComplexElement(el)).length,
      cacheEnabled: options.enableCache !== false,
      progressiveAnalysis: options.progressive || false,
      priorityMode: options.priorityMode || 'balanced'
    };
  }

  /**
   * Prioritize elements for analysis based on context
   */
  private static prioritizeElements(elements: AnalysisInput[], context: AnalysisContext): PrioritizedElement[] {
    return elements.map(element => ({
      ...element,
      priority: this.calculatePriority(element, context)
    })).sort((a, b) => b.priority - a.priority);
  }

  /**
   * Calculate analysis priority for an element
   */
  private static calculatePriority(element: AnalysisInput, context: AnalysisContext): number {
    let priority = 50; // Base priority

    // Boost visible elements
    if (this.isElementVisible(element, context.viewport)) {
      priority += 30;
    }

    // Boost interactive elements
    if (this.isInteractiveElement(element.selector, element.computedStyles)) {
      priority += 20;
    }

    // Boost elements with obvious issues (simple heuristics)
    if (this.hasObviousIssues(element)) {
      priority += 15;
    }

    // Reduce priority for complex elements (analyze later)
    if (this.isComplexElement(element)) {
      priority -= 10;
    }

    // Boost elements in viewport center (F-pattern reading)
    if (this.isInReadingArea(element, context.viewport)) {
      priority += 10;
    }

    return Math.max(0, Math.min(100, priority));
  }

  /**
   * Check cache for previously analyzed elements
   */
  private static checkCache(elements: PrioritizedElement[]): { cached: ElementInspection[], toAnalyze: AnalysisInput[] } {
    const cached: ElementInspection[] = [];
    const toAnalyze: AnalysisInput[] = [];

    for (const element of elements) {
      const cacheKey = this.createCacheKey(element);
      const cachedResult = this.cache.get(cacheKey);

      if (cachedResult && this.isCacheValid(cachedResult, element)) {
        cached.push(cachedResult.inspection);
      } else {
        toAnalyze.push(element);
      }
    }

    return { cached, toAnalyze };
  }

  /**
   * Analyze batch of elements
   */
  private static async analyzeBatch(
    elements: AnalysisInput[],
    rules: any,
    context: any
  ): Promise<ElementInspection[]> {
    const results: ElementInspection[] = [];

    // Process elements in parallel with concurrency limit
    const concurrencyLimit = 5;
    const batches = this.chunkArray(elements, concurrencyLimit);

    for (const batch of batches) {
      const batchPromises = batch.map(element =>
        this.analyzeElementOptimized(element, rules, context)
      );

      const batchResults = await Promise.all(batchPromises);
      results.push(...batchResults);

      // Yield control to avoid blocking the main thread
      if (batches.length > 1) {
        await this.yieldToUI();
      }
    }

    return results;
  }

  /**
   * Create simple inspection for basic elements
   */
  private static createSimpleInspection(element: AnalysisInput): ElementInspection {
    return {
      elementId: element.elementId,
      selector: element.selector,
      boxModel: element.boxModel,
      computedStyles: element.computedStyles,
      issues: [], // Simple elements get basic analysis without detailed issues
      timestamp: Date.now(),
      context: element.context
    };
  }

  /**
   * Analyze single element with optimizations
   */
  private static async analyzeElementOptimized(
    element: AnalysisInput,
    rules: any,
    context: any
  ): Promise<ElementInspection> {
    // Use optimized analysis based on element complexity
    if (this.isSimpleElement(element)) {
      // Fast path for simple elements
      return this.createSimpleInspection(element);
    } else {
      // Full analysis for complex elements
      const { AdvancedElementAnalyzer } = await import('./AdvancedElementAnalyzer');
      return AdvancedElementAnalyzer.analyzeElement(
        element.elementId,
        element.selector,
        element.boxModel,
        element.computedStyles,
        rules,
        element.context
      );
    }
  }

  /**
   * Fast analysis for simple elements
   */
  private static analyzeSimpleElement(element: AnalysisInput, rules: any): ElementInspection {
    const issues: any[] = [];

    // Only run critical checks for simple elements
    const { APCAContrastAnalyzer } = require('./APCAContrastAnalyzer');

    if (element.computedStyles.color && element.computedStyles.backgroundColor) {
      const result = APCAContrastAnalyzer.isAccessible(
        element.computedStyles.color,
        element.computedStyles.backgroundColor,
        rules.apcaContrast,
        'body'
      );

      if (!result.isAccessible) {
        issues.push({
          id: `${element.elementId}_contrast_${Date.now()}`,
          type: 'apca_contrast_insufficient',
          severity: 'error',
          category: 'accessibility',
          message: `Low contrast: ${result.score.toFixed(1)}`,
          elementId: element.elementId,
          selector: element.selector
        });
      }
    }

    return {
      elementId: element.elementId,
      selector: element.selector,
      boxModel: element.boxModel,
      computedStyles: element.computedStyles,
      issues,
      timestamp: Date.now(),
      context: element.context
    };
  }

  /**
   * Update cache with new results
   */
  private static updateCache(results: ElementInspection[], context: AnalysisContext): void {
    if (!context.cacheEnabled) return;

    const maxCacheSize = 1000;

    for (const result of results) {
      const cacheKey = this.createCacheKey({
        elementId: result.elementId,
        selector: result.selector,
        computedStyles: result.computedStyles
      });

      this.cache.set(cacheKey, {
        inspection: result,
        timestamp: Date.now(),
        context: context
      });
    }

    // Clean up old cache entries
    if (this.cache.size > maxCacheSize) {
      const entries = Array.from(this.cache.entries());
      entries.sort((a, b) => b[1].timestamp - a[1].timestamp);

      this.cache = new Map(entries.slice(0, maxCacheSize * 0.8));
    }
  }

  /**
   * Create cache key for element
   */
  private static createCacheKey(element: Partial<AnalysisInput>): string {
    const stylesKey = this.hashObject(element.computedStyles || {});
    return `${element.elementId || ''}_${element.selector || ''}_${stylesKey}`;
  }

  /**
   * Check if cached result is still valid
   */
  private static isCacheValid(cached: CachedAnalysis, element: AnalysisInput): boolean {
    // Cache is valid for 5 minutes
    const cacheAge = Date.now() - cached.timestamp;
    if (cacheAge > 5 * 60 * 1000) return false;

    // Check if styles have changed
    return this.objectsEqual(cached.inspection.computedStyles, element.computedStyles);
  }

  /**
   * Create batches for progressive analysis
   */
  private static createBatches<T>(items: T[], batchSize: number): T[][] {
    const batches: T[][] = [];
    for (let i = 0; i < items.length; i += batchSize) {
      batches.push(items.slice(i, i + batchSize));
    }
    return batches;
  }

  /**
   * Yield control to UI thread
   */
  private static async yieldToUI(): Promise<void> {
    return new Promise(resolve => {
      setTimeout(resolve, 0);
    });
  }

  /**
   * Utility functions
   */
  private static isElementVisible(element: AnalysisInput, viewport?: { width: number; height: number }): boolean {
    if (!viewport || !element.boxModel) return false;

    const rect = {
      left: element.boxModel.left || 0,
      top: element.boxModel.top || 0,
      right: (element.boxModel.left || 0) + (element.boxModel.width || 0),
      bottom: (element.boxModel.top || 0) + (element.boxModel.height || 0)
    };

    return !(rect.right < 0 || rect.left > viewport.width ||
             rect.bottom < 0 || rect.top > viewport.height);
  }

  private static isInteractiveElement(selector: string, styles?: any): boolean {
    return /button|a\[href\]|\[role=button\]|\[role=link\]|\[tabindex\]/i.test(selector) ||
           (styles && styles.cursor === 'pointer');
  }

  private static isComplexElement(element: AnalysisInput): boolean {
    const styleCount = Object.keys(element.computedStyles || {}).length;
    const hasComplexStyles = /gradient|transform|animation|shadow/i.test(
      JSON.stringify(element.computedStyles)
    );

    return styleCount > 20 || hasComplexStyles;
  }

  private static isSimpleElement(element: AnalysisInput): boolean {
    const styleCount = Object.keys(element.computedStyles || {}).length;
    return styleCount <= 10 && !this.isComplexElement(element);
  }

  private static hasObviousIssues(element: AnalysisInput): boolean {
    const styles = element.computedStyles || {};
    return !styles.color || !styles.fontSize ||
           styles.display === 'none' || styles.visibility === 'hidden';
  }

  private static isInReadingArea(element: AnalysisInput, viewport?: { width: number; height: number }): boolean {
    if (!viewport || !element.boxModel) return false;

    const centerX = element.boxModel.left + (element.boxModel.width || 0) / 2;
    const centerY = element.boxModel.top + (element.boxModel.height || 0) / 2;

    // F-pattern: top-left area is most important for reading
    return centerX < viewport.width * 0.7 && centerY < viewport.height * 0.6;
  }

  private static chunkArray<T>(array: T[], size: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size));
    }
    return chunks;
  }

  private static hashObject(obj: any): string {
    const str = JSON.stringify(obj);
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return hash.toString();
  }

  private static objectsEqual(a: any, b: any): boolean {
    return JSON.stringify(a) === JSON.stringify(b);
  }
}

/**
 * Types for performance optimization
 */
export interface AnalysisInput {
  elementId: string;
  selector: string;
  boxModel: any;
  computedStyles: any;
  context?: any;
}

export interface AnalysisOptions {
  viewport?: { width: number; height: number };
  enableCache?: boolean;
  progressive?: boolean;
  batchSize?: number;
  priorityMode?: 'speed' | 'accuracy' | 'balanced';
}

export interface AnalysisContext {
  totalElements: number;
  viewport: { width: number; height: number };
  visibleElements: number;
  interactiveElements: number;
  complexElements: number;
  cacheEnabled: boolean;
  progressiveAnalysis: boolean;
  priorityMode: string;
}

export interface PrioritizedElement extends AnalysisInput {
  priority: number;
}

export interface CachedAnalysis {
  inspection: ElementInspection;
  timestamp: number;
  context: AnalysisContext;
}

export interface OptimizedAnalysisResult {
  results: ElementInspection[];
  performance: {
    totalTime: number;
    cachedElements: number;
    analyzedElements: number;
    cacheHitRate: number;
    averageTimePerElement: number;
  };
  context: AnalysisContext;
}

export interface ProgressiveAnalysisResult {
  results: ElementInspection[];
  performance: {
    totalTime: number;
    batchesProcessed: number;
    averageBatchTime: number;
    averageTimePerElement: number;
  };
}

export interface AnalysisProgress {
  completed: number;
  total: number;
  currentBatch: number;
  totalBatches: number;
  batchTime: number;
  averageTimePerElement: number;
}

export interface ElementInspection {
  elementId: string;
  selector: string;
  boxModel: any;
  computedStyles: any;
  issues: any[];
  timestamp: number;
  context?: any;
}

/**
 * Tests for Performance Optimizer
 */
import { PerformanceOptimizer } from '../src/domain/services/PerformanceOptimizer';

describe('PerformanceOptimizer', () => {
  const mockRules = {
    apcaContrast: {
      thresholds: { bodyText: { min: 60, preferred: 75 } },
      adjustments: { boldText: 5, smallText: 10 }
    },
    accessibility: {
      aria: {
        requiredAttributes: { button: [] },
        allowedRoles: ['button'],
        nameSources: ['aria-label']
      },
      keyboard: {
        tabOrderTolerance: 5,
        focusIndicatorMinSize: 2,
        skipLinkRequired: true
      }
    }
  };

  const mockElements: any[] = Array.from({ length: 10 }, (_, i) => ({
    elementId: `element-${i}`,
    selector: `.element-${i}`,
    boxModel: { width: 100, height: 50, left: i * 120, top: (i % 3) * 60 },
    computedStyles: {
      color: '#000000',
      backgroundColor: '#ffffff',
      fontSize: '16px',
      display: i % 2 === 0 ? 'block' : 'inline-block'
    }
  }));

  describe('analyzeElementsOptimized', () => {
    it('should analyze elements with caching', async () => {
      const options = { enableCache: true, viewport: { width: 1920, height: 1080 } };

      const result = await PerformanceOptimizer.analyzeElementsOptimized(
        mockElements,
        mockRules,
        options
      );

      expect(result.results).toHaveLength(mockElements.length);
      expect(result.performance.totalTime).toBeGreaterThan(0);
      expect(result.performance.averageTimePerElement).toBeGreaterThan(0);
      expect(result.context.totalElements).toBe(mockElements.length);
    });

    it('should use cache for repeated analyses', async () => {
      const options = { enableCache: true };

      // First analysis
      const result1 = await PerformanceOptimizer.analyzeElementsOptimized(
        mockElements.slice(0, 5),
        mockRules,
        options
      );

      // Second analysis of same elements
      const result2 = await PerformanceOptimizer.analyzeElementsOptimized(
        mockElements.slice(0, 5),
        mockRules,
        options
      );

      // Cache should improve performance on second run
      expect(result2.performance.cachedElements).toBeGreaterThanOrEqual(result1.performance.cachedElements);
    });

    it('should prioritize visible elements', async () => {
      const options = {
        enableCache: false,
        viewport: { width: 500, height: 300 } // Small viewport
      };

      const result = await PerformanceOptimizer.analyzeElementsOptimized(
        mockElements,
        mockRules,
        options
      );

      expect(result.context.visibleElements).toBeGreaterThan(0);
      expect(result.context.visibleElements).toBeLessThanOrEqual(mockElements.length);
    });
  });

  describe('analyzeProgressively', () => {
    it('should analyze elements in batches', async () => {
      const progressUpdates: any[] = [];
      const onProgress = (progress: any) => progressUpdates.push(progress);

      const result = await PerformanceOptimizer.analyzeProgressively(
        mockElements,
        mockRules,
        onProgress,
        { batchSize: 3 }
      );

      expect(result.results).toHaveLength(mockElements.length);
      expect(result.performance.batchesProcessed).toBeGreaterThan(0);
      expect(progressUpdates.length).toBeGreaterThan(0);
      expect(progressUpdates[progressUpdates.length - 1].completed).toBeGreaterThanOrEqual(mockElements.length);
    });

    it('should provide progress updates', async () => {
      let lastProgress: any = null;
      const onProgress = (progress: any) => { lastProgress = progress; };

      await PerformanceOptimizer.analyzeProgressively(
        mockElements.slice(0, 6),
        mockRules,
        onProgress,
        { batchSize: 2 }
      );

      expect(lastProgress).toBeDefined();
      expect(lastProgress.total).toBe(6);
      expect(lastProgress.completed).toBe(6);
      expect(lastProgress.currentBatch).toBe(3);
      expect(lastProgress.totalBatches).toBe(3);
    });
  });

  describe('element prioritization', () => {
    it('should prioritize visible elements', async () => {
      const visibleElement = {
        elementId: 'visible',
        selector: '.visible',
        boxModel: { width: 100, height: 50, left: 100, top: 100 }, // In viewport
        computedStyles: { color: '#000', backgroundColor: '#fff' }
      };

      const hiddenElement = {
        elementId: 'hidden',
        selector: '.hidden',
        boxModel: { width: 100, height: 50, left: 100, top: 1200 }, // Below viewport
        computedStyles: { color: '#000', backgroundColor: '#fff' }
      };

      const result = await PerformanceOptimizer.analyzeElementsOptimized(
        [visibleElement, hiddenElement],
        mockRules,
        { viewport: { width: 1920, height: 1080 } }
      );

      expect(result.context.visibleElements).toBe(1);
      expect(result.results).toHaveLength(2);
    });

    it('should prioritize interactive elements', async () => {
      const buttonElement = {
        elementId: 'button',
        selector: 'button.primary',
        boxModel: { width: 100, height: 40, left: 10, top: 10 },
        computedStyles: { color: '#000', backgroundColor: '#fff', cursor: 'pointer' }
      };

      const divElement = {
        elementId: 'div',
        selector: 'div.static',
        boxModel: { width: 100, height: 40, left: 10, top: 60 },
        computedStyles: { color: '#000', backgroundColor: '#fff' }
      };

      const result = await PerformanceOptimizer.analyzeElementsOptimized(
        [buttonElement, divElement],
        mockRules,
        { viewport: { width: 1920, height: 1080 } }
      );

      expect(result.context.interactiveElements).toBe(1);
      expect(result.results).toHaveLength(2);
    });
  });

  describe('performance metrics', () => {
    it('should track performance metrics', async () => {
      const result = await PerformanceOptimizer.analyzeElementsOptimized(
        mockElements.slice(0, 5),
        mockRules,
        { enableCache: false }
      );

      expect(result.performance).toBeDefined();
      expect(result.performance.totalTime).toBeGreaterThan(0);
      expect(result.performance.analyzedElements + result.performance.cachedElements).toBe(5);
      expect(result.performance.averageTimePerElement).toBeGreaterThan(0);
    });

    it('should calculate cache hit rate', async () => {
      // First run
      await PerformanceOptimizer.analyzeElementsOptimized(
        mockElements.slice(0, 3),
        mockRules,
        { enableCache: true }
      );

      // Second run (should hit cache)
      const result = await PerformanceOptimizer.analyzeElementsOptimized(
        mockElements.slice(0, 3),
        mockRules,
        { enableCache: true }
      );

      expect(result.performance.cacheHitRate).toBeGreaterThan(0);
      expect(result.performance.cachedElements).toBe(3);
      expect(result.performance.analyzedElements).toBe(0);
    });
  });

  describe('complexity handling', () => {
    it('should identify complex elements', async () => {
      const simpleElement = {
        elementId: 'simple',
        selector: '.simple',
        boxModel: { width: 100, height: 50, left: 10, top: 10 },
        computedStyles: { color: '#000', backgroundColor: '#fff' } // Few styles
      };

      const complexElement = {
        elementId: 'complex',
        selector: '.complex',
        boxModel: { width: 300, height: 200, left: 10, top: 10 },
        computedStyles: {
          color: '#123456',
          backgroundColor: 'linear-gradient(45deg, #ff0000, #00ff00)',
          fontSize: '18px',
          lineHeight: '1.6',
          padding: '20px 30px',
          margin: '10px auto',
          border: '2px solid #000000',
          borderRadius: '10px',
          boxShadow: '0 4px 8px rgba(0,0,0,0.1)',
          transform: 'translateX(10px) rotate(5deg)',
          transition: 'all 0.3s ease-in-out, transform 0.2s linear',
          position: 'relative',
          zIndex: '10',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        } // Many complex styles
      };

      const result = await PerformanceOptimizer.analyzeElementsOptimized(
        [simpleElement, complexElement],
        mockRules,
        { enableCache: false }
      );

      expect(result.context.complexElements).toBe(1);
      expect(result.context.totalElements).toBe(2);
      expect(result.results).toHaveLength(2);
    });
  });

  describe('error handling', () => {
    it('should handle empty element list', async () => {
      const result = await PerformanceOptimizer.analyzeElementsOptimized(
        [],
        mockRules,
        {}
      );

      expect(result.results).toHaveLength(0);
      expect(result.context.totalElements).toBe(0);
    });

    it('should handle malformed elements gracefully', async () => {
      const malformedElements = [
        { elementId: 'good', selector: '.good', boxModel: {}, computedStyles: {} },
        { elementId: 'partial', selector: '.partial', boxModel: {}, computedStyles: {} }
      ];

      const result = await PerformanceOptimizer.analyzeElementsOptimized(
        malformedElements,
        mockRules,
        {}
      );

      expect(result).toBeDefined();
      expect(result.results).toHaveLength(2);
    });
  });

  describe('scalability', () => {
    it('should handle large element sets efficiently', async () => {
      const largeElementSet = Array.from({ length: 50 }, (_, i) => ({
        elementId: `large-element-${i}`,
        selector: `.element-${i}`,
        boxModel: { width: 100, height: 50, left: (i % 10) * 110, top: Math.floor(i / 10) * 60 },
        computedStyles: { color: '#000000', backgroundColor: '#ffffff' }
      }));

      const startTime = performance.now();

      const result = await PerformanceOptimizer.analyzeElementsOptimized(
        largeElementSet,
        mockRules,
        { enableCache: false, batchSize: 10 }
      );

      const duration = performance.now() - startTime;

      expect(result.results).toHaveLength(50);
      expect(duration).toBeLessThan(5000); // Should complete in reasonable time
      expect(result.performance.averageTimePerElement).toBeLessThan(100);
    }, 10000); // Increased timeout for large test
  });
});

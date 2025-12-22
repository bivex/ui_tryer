/**
 * Copyright (c) 2025 Bivex
 *
 * Author: Bivex
 * Available for contact via email: support@b-b.top
 * For up-to-date contact information:
 * https://github.com/bivex
 *
 * Created: 2025-12-22T11:04:26
 * Last Updated: 2025-12-22T11:04:56
 *
 * Licensed under the MIT License.
 * Commercial licensing available upon request.
 */

/**
 * Performance benchmarks for the Pixel Perfect Inspector
 * Tests analysis speed and memory usage
 */

import { AdvancedElementAnalyzer } from '../src/domain/services/AdvancedElementAnalyzer';
import { AdvancedDesignRules } from '../src/domain/entities/AdvancedDesignRules';

describe('Performance Benchmarks', () => {
  const mockRules: AdvancedDesignRules = {
    apcaContrast: {
      thresholds: { bodyText: { min: 60, preferred: 75 }, headingText: { min: 45, preferred: 60 }, largeText: { min: 45, preferred: 60 }, uiComponents: { min: 15, preferred: 30 } },
      adjustments: { boldText: 5, italicText: 2, smallText: 10 }
    },
    verticalRhythm: { allowedRatios: [1, 1.5, 2, 3, 4, 6, 8], tolerance: 0.05, minSpacingDifference: 2, opticalAlignment: { textDescenders: 2, iconPadding: 4, avatarWeight: 1.2 } },
    typography: {
      lineLength: { comfortable: { min: 55, max: 75 } },
      lineHeightRatios: { small: 1.5, body: 1.5, subheading: 1.4, heading: 1.3, display: 1.1 },
      typeScales: { 'minor-second': 1.067, 'major-second': 1.125, 'minor-third': 1.2, 'major-third': 1.25, 'perfect-fourth': 1.333, 'golden-ratio': 1.618 },
      orphansWidows: { maxOrphanLines: 2, maxWidowLines: 1, minLastLineRatio: 0.3 }
    },
    colorHarmony: {
      schemes: { monochromatic: { hueTolerance: 15 }, analogous: { hueTolerance: 30 }, complementary: { angle: 180, tolerance: 15 }, triadic: { angle: 120, tolerance: 15 } },
      semantics: { error: ['#dc2626'], success: ['#16a34a'], warning: ['#d97706'], info: ['#2563eb'], primary: ['#2563eb'] },
      consistency: { maxSaturationDeviation: 30, maxLightnessDeviation: 40, requiredSemanticRoles: ['primary'] }
    },
    layout: {
      alignment: { pixelTolerance: 2, minElementsInLine: 3 },
      zIndex: { scale: 10, maxRecommended: 100, negativeAllowed: false },
      visualHierarchy: { weightFactors: { size: 1, colorSaturation: 50, borderWeight: 5, shadowPresence: 20, fontWeight: 10, position: 10 }, focalPointThreshold: 70, maxFocalPoints: 3 }
    },
    interaction: {
      requiredStates: ['hover', 'focus', 'active'],
      loading: { skeletonRequired: true, layoutShiftTolerance: 20, loadingIndicatorRequired: true },
      layoutShift: { imageDimensionsRequired: true, fontLoadingStrategy: 'swap', dynamicContentSpaceReserved: true }
    },
    responsive: {
      breakpoints: { sm: 640, md: 768, lg: 1024, xl: 1280, '2xl': 1536 },
      mobileFirst: { preferMinWidth: true, maxWidthAllowed: true },
      overflow: { horizontalScrollPenalty: 10, textOverflowHandling: true }
    },
    performance: {
      layoutShift: { imageDimensionsRequired: true, fontLoadingStrategy: 'swap', dynamicContentSpaceReserved: true },
      animation: { preferTransform: true, avoidProperties: ['left', 'top', 'width', 'height'], maxDuration: 300 },
      resources: { lazyLoadingRecommended: true, preloadCritical: true, compressionRequired: true }
    },
    consistency: {
      patterns: { card: { paddingScale: [16, 20, 24, 32], borderRadiusScale: [4, 6, 8, 12], shadowRequired: false }, button: { heightScale: [32, 36, 40, 44, 48], widthConstraints: { min: 80 } }, form: { inputHeight: 40, labelSpacing: 8, groupSpacing: 16 } },
      tokens: { spacingTokens: ['4px', '8px', '12px', '16px', '20px', '24px', '32px', '48px', '64px'], colorTokens: ['primary', 'secondary'], typographyTokens: ['xs', 'sm', 'base', 'lg', 'xl'], strictTokenUsage: false },
      similarity: { spacing: 0.1, sizing: 0.05, color: 0.05 }
    },
    accessibility: {
      aria: { requiredAttributes: { button: [], checkbox: ['aria-checked'] }, allowedRoles: ['button', 'link'], nameSources: ['aria-label', 'content'] },
      keyboard: { tabOrderTolerance: 5, focusIndicatorMinSize: 2, skipLinkRequired: true },
      motion: { prefersReducedMotion: true, animationDurationLimits: { min: 150, max: 300 } }
    }
  };

  describe('Analysis Speed', () => {
    const baseElement = {
      boxModel: { width: 100, height: 50, left: 10, top: 20 },
      computedStyles: {
        color: '#000000',
        backgroundColor: '#ffffff',
        fontSize: '16px',
        lineHeight: '24px',
        padding: '8px'
      }
    };

    it('should analyze single element quickly', () => {
      const startTime = performance.now();

      const inspection = AdvancedElementAnalyzer.analyzeElement(
        'perf-test-single',
        '.perf-test',
        baseElement.boxModel,
        baseElement.computedStyles,
        mockRules
      );

      const endTime = performance.now();
      const duration = endTime - startTime;

      expect(duration).toBeLessThan(100); // Should complete in < 100ms
      expect(inspection).toBeDefined();
    });

    it('should handle batch analysis efficiently', () => {
      const elementCount = 50;
      const elements = Array.from({ length: elementCount }, (_, i) => ({
        id: `batch-element-${i}`,
        selector: `.batch-element-${i}`,
        ...baseElement
      }));

      const startTime = performance.now();

      const inspections = elements.map(element =>
        AdvancedElementAnalyzer.analyzeElement(
          element.id,
          element.selector,
          element.boxModel,
          element.computedStyles,
          mockRules
        )
      );

      const endTime = performance.now();
      const totalDuration = endTime - startTime;
      const avgDuration = totalDuration / elementCount;

      expect(totalDuration).toBeLessThan(2000); // Should complete batch in < 2s
      expect(avgDuration).toBeLessThan(50); // Average < 50ms per element
      expect(inspections).toHaveLength(elementCount);
      expect(inspections.every(inspection => inspection !== undefined)).toBe(true);
    });

    it('should scale with complexity', () => {
      const simpleElement = {
        boxModel: { width: 100, height: 50, left: 10, top: 20 },
        computedStyles: { color: '#000000', backgroundColor: '#ffffff' }
      };

      const complexElement = {
        boxModel: { width: 300, height: 200, left: 10, top: 20 },
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
        }
      };

      const simpleStart = performance.now();
      AdvancedElementAnalyzer.analyzeElement('simple', '.simple', simpleElement.boxModel, simpleElement.computedStyles, mockRules);
      const simpleDuration = performance.now() - simpleStart;

      const complexStart = performance.now();
      AdvancedElementAnalyzer.analyzeElement('complex', '.complex', complexElement.boxModel, complexElement.computedStyles, mockRules);
      const complexDuration = performance.now() - complexStart;

      // Complex analysis should not be excessively slower (less than 5x)
      expect(complexDuration / simpleDuration).toBeLessThan(5);
      expect(complexDuration).toBeLessThan(200); // Still reasonable
    });
  });

  describe('Memory Usage', () => {
    it('should not leak memory during repeated analysis', () => {
      // This is a simplified memory test - in a real scenario,
      // we'd use a memory profiler or heap snapshots

      const initialMemory = (performance as any).memory?.usedJSHeapSize || 0;

      for (let i = 0; i < 100; i++) {
        AdvancedElementAnalyzer.analyzeElement(
          `memory-test-${i}`,
          `.memory-test-${i}`,
          { width: 100, height: 50, left: 10, top: 20 },
          { color: '#000000', backgroundColor: '#ffffff', fontSize: `${14 + (i % 10)}px` },
          mockRules
        );
      }

      const finalMemory = (performance as any).memory?.usedJSHeapSize || 0;

      if (initialMemory > 0 && finalMemory > 0) {
        const memoryIncrease = finalMemory - initialMemory;
        const memoryIncreaseMB = memoryIncrease / (1024 * 1024);

        // Should not increase memory by more than 50MB for 100 analyses
        expect(memoryIncreaseMB).toBeLessThan(50);
      }
    });
  });

  describe('Scalability', () => {
    it('should handle large pages with many elements', () => {
      const largePageElements = Array.from({ length: 200 }, (_, i) => ({
        id: `large-page-element-${i}`,
        selector: `.element-${i}`,
        boxModel: {
          width: 100 + (i % 50),
          height: 50 + (i % 30),
          left: (i % 20) * 120,
          top: Math.floor(i / 20) * 60
        },
        computedStyles: {
          color: '#000000',
          backgroundColor: '#ffffff',
          fontSize: '16px',
          position: i % 5 === 0 ? 'absolute' : 'static',
          zIndex: i % 10 === 0 ? (i % 100).toString() : undefined
        }
      }));

      const startTime = performance.now();

      const inspections = largePageElements.map(element =>
        AdvancedElementAnalyzer.analyzeElement(
          element.id,
          element.selector,
          element.boxModel,
          element.computedStyles,
          mockRules
        )
      );

      const endTime = performance.now();
      const totalDuration = endTime - startTime;

      expect(totalDuration).toBeLessThan(10000); // Should handle 200 elements in < 10s
      expect(inspections).toHaveLength(200);
      expect(inspections.every(inspection => inspection.issues !== undefined)).toBe(true);
    });

    it('should maintain performance with context data', () => {
      const elementsWithContext = Array.from({ length: 20 }, (_, i) => ({
        id: `context-element-${i}`,
        selector: `.context-element-${i}`,
        boxModel: { width: 100, height: 50, left: i * 120, top: (i % 5) * 60 },
        computedStyles: { color: '#000000', backgroundColor: '#ffffff', fontSize: '16px' },
        context: {
          viewport: { width: 1920, height: 1080 },
          relations: {
            nearbyElements: [
              { id: `nearby-${i}-1`, left: i * 120 + 120, right: i * 120 + 220, top: (i % 5) * 60, bottom: (i % 5) * 60 + 50, centerX: i * 120 + 170, centerY: (i % 5) * 60 + 25, distance: 20 },
              { id: `nearby-${i}-2`, left: i * 120 - 100, right: i * 120, top: (i % 5) * 60, bottom: (i % 5) * 60 + 50, centerX: i * 120 - 50, centerY: (i % 5) * 60 + 25, distance: 50 }
            ]
          }
        }
      }));

      const startTime = performance.now();

      const inspections = elementsWithContext.map(element =>
        AdvancedElementAnalyzer.analyzeElement(
          element.id,
          element.selector,
          element.boxModel,
          element.computedStyles,
          mockRules,
          element.context
        )
      );

      const endTime = performance.now();
      const totalDuration = endTime - startTime;
      const avgDuration = totalDuration / elementsWithContext.length;

      expect(totalDuration).toBeLessThan(3000); // Should handle context data efficiently
      expect(avgDuration).toBeLessThan(200); // Average should still be reasonable
      expect(inspections.every(inspection => inspection !== undefined)).toBe(true);
    });
  });

  describe('Resource Efficiency', () => {
    it('should minimize redundant calculations', () => {
      // Test that similar elements don't trigger excessive computation
      const similarElements = Array.from({ length: 10 }, () => ({
        id: 'similar-element',
        selector: '.similar',
        boxModel: { width: 100, height: 50, left: 10, top: 20 },
        computedStyles: { color: '#000000', backgroundColor: '#ffffff', fontSize: '16px' }
      }));

      const startTime = performance.now();

      const inspections = similarElements.map((element, i) =>
        AdvancedElementAnalyzer.analyzeElement(
          `${element.id}-${i}`,
          element.selector,
          element.boxModel,
          element.computedStyles,
          mockRules
        )
      );

      const endTime = performance.now();
      const totalDuration = endTime - startTime;
      const avgDuration = totalDuration / similarElements.length;

      // Similar elements should be analyzed efficiently
      expect(avgDuration).toBeLessThan(30); // Very fast for similar elements
      expect(totalDuration).toBeLessThan(500);
    });

    it('should handle malformed input gracefully', () => {
      const malformedInputs = [
        { id: null, selector: null, boxModel: null, styles: null },
        { id: undefined, selector: undefined, boxModel: undefined, styles: undefined },
        { id: '', selector: '', boxModel: {}, styles: {} },
        { id: 'test', selector: 'test', boxModel: { invalid: true }, styles: { invalid: true } }
      ];

      for (const input of malformedInputs) {
        expect(() => {
          AdvancedElementAnalyzer.analyzeElement(
            input.id as string,
            input.selector as string,
            input.boxModel as any,
            input.styles as any,
            mockRules
          );
        }).not.toThrow();
      }
    });
  });

  describe('Benchmark Results', () => {
    it('should meet performance targets', () => {
      // Comprehensive benchmark
      const benchmarkResults = {
        singleElement: 0,
        batchElements: 0,
        complexElement: 0,
        largePage: 0,
        withContext: 0
      };

      // Single element benchmark
      const singleStart = performance.now();
      AdvancedElementAnalyzer.analyzeElement('bench-single', '.bench', { width: 100, height: 50, left: 10, top: 20 }, { color: '#000', backgroundColor: '#fff' }, mockRules);
      benchmarkResults.singleElement = performance.now() - singleStart;

      // Batch benchmark (10 elements)
      const batchStart = performance.now();
      for (let i = 0; i < 10; i++) {
        AdvancedElementAnalyzer.analyzeElement(`bench-batch-${i}`, '.bench', { width: 100, height: 50, left: 10, top: 20 }, { color: '#000', backgroundColor: '#fff' }, mockRules);
      }
      benchmarkResults.batchElements = performance.now() - batchStart;

      // Complex element benchmark
      const complexStart = performance.now();
      AdvancedElementAnalyzer.analyzeElement('bench-complex', '.complex', { width: 300, height: 200, left: 10, top: 20 }, {
        color: '#123456', backgroundColor: 'linear-gradient(45deg, #ff0000, #00ff00)', fontSize: '18px', lineHeight: '1.6', padding: '20px 30px', margin: '10px auto',
        border: '2px solid #000', borderRadius: '10px', boxShadow: '0 4px 8px rgba(0,0,0,0.1)', transform: 'translateX(10px)', transition: 'all 0.3s ease', zIndex: '10'
      }, mockRules);
      benchmarkResults.complexElement = performance.now() - complexStart;

      // Performance assertions
      expect(benchmarkResults.singleElement).toBeLessThan(50); // Single element < 50ms
      expect(benchmarkResults.batchElements).toBeLessThan(300); // 10 elements < 300ms
      expect(benchmarkResults.complexElement).toBeLessThan(100); // Complex element < 100ms

      console.log('Benchmark Results:', benchmarkResults);
    });
  });
});

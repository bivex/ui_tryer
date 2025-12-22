/**
 * Copyright (c) 2025 Bivex
 *
 * Author: Bivex
 * Available for contact via email: support@b-b.top
 * For up-to-date contact information:
 * https://github.com/bivex
 *
 * Created: 2025-12-22T11:01:06
 * Last Updated: 2025-12-22T11:01:06
 *
 * Licensed under the MIT License.
 * Commercial licensing available upon request.
 */

/**
 * Tests for Layout Analyzer
 */
import { LayoutAnalyzer } from '../src/domain/services/LayoutAnalyzer';

describe('LayoutAnalyzer', () => {
  const mockRules = {
    alignment: {
      pixelTolerance: 2,
      minElementsInLine: 3
    },
    zIndex: {
      scale: 10,
      maxRecommended: 100,
      negativeAllowed: false
    },
    visualHierarchy: {
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
    }
  };

  describe('analyzeLayout', () => {
    it('should analyze alignment, z-index and hierarchy', () => {
      const boxModel = { width: 100, height: 50, left: 10, top: 20 };
      const styles = {
        zIndex: '50',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        fontWeight: '600'
      };
      const nearbyElements = [
        { id: 'elem2', left: 15, right: 115, top: 20, bottom: 70, centerX: 65, centerY: 45 }
      ];

      const analysis = LayoutAnalyzer.analyzeLayout(
        'elem1',
        '.test-element',
        boxModel,
        styles,
        nearbyElements,
        mockRules
      );

      expect(analysis.alignment).toBeDefined();
      expect(analysis.zIndex).toBeDefined();
      expect(analysis.hierarchy).toBeDefined();
      expect(analysis.issues).toBeDefined();
      expect(analysis.suggestions).toBeDefined();
    });

    it('should detect z-index issues', () => {
      const styles = { zIndex: '150' }; // Above max recommended

      const analysis = LayoutAnalyzer.analyzeLayout(
        'elem1',
        '.test-element',
        { width: 100, height: 50, left: 10, top: 20 },
        styles,
        [],
        mockRules
      );

      expect(analysis.zIndex.issues.length).toBeGreaterThan(0);
      expect(analysis.zIndex.issues[0].type).toBe('z_index_conflict');
    });

    it('should detect visual hierarchy issues', () => {
      const styles = {
        width: '200px',
        height: '200px',
        fontWeight: '700',
        boxShadow: '0 4px 8px rgba(0,0,0,0.1)'
      };

      const analysis = LayoutAnalyzer.analyzeLayout(
        'elem1',
        '.large-element',
        { width: 200, height: 200, left: 10, top: 20 },
        styles,
        [],
        mockRules
      );

      expect(analysis.hierarchy.visualWeight).toBeGreaterThan(0);
      expect(analysis.hierarchy.hierarchyLevel).toBeDefined();
    });
  });

  describe('alignment analysis', () => {
    it('should detect perfect alignments', () => {
      const nearbyElements = [
        { id: 'elem2', left: 10, right: 110, top: 20, bottom: 70, centerX: 60, centerY: 45 }
      ];

      const analysis = LayoutAnalyzer.analyzeLayout(
        'elem1',
        '.test-element',
        { width: 100, height: 50, left: 10, top: 20 },
        {},
        nearbyElements,
        mockRules
      );

      expect(analysis.alignment.alignments.length).toBeGreaterThan(0);
    });

    it('should detect near-miss alignments', () => {
      const nearbyElements = [
        { id: 'elem2', left: 12, right: 112, top: 23, bottom: 73, centerX: 62, centerY: 48 }
      ];

      const analysis = LayoutAnalyzer.analyzeLayout(
        'elem1',
        '.test-element',
        { width: 100, height: 50, left: 10, top: 20 },
        {},
        nearbyElements,
        mockRules
      );

      expect(analysis.alignment.issues.length).toBeGreaterThan(0);
      expect(analysis.alignment.issues[0].type).toBe('alignment_issue');
    });
  });

  describe('z-index analysis', () => {
    it('should classify z-index layers', () => {
      const testCases = [
        { zIndex: 5, expected: 'content' },
        { zIndex: 50, expected: 'overlay' },
        { zIndex: 150, expected: 'modal' },
        { zIndex: -1, expected: 'background' }
      ];

      for (const testCase of testCases) {
        const analysis = LayoutAnalyzer.analyzeLayout(
          'elem1',
          '.test-element',
          { width: 100, height: 50, left: 10, top: 20 },
          { zIndex: testCase.zIndex.toString() },
          [],
          mockRules
        );

        expect(analysis.zIndex.layer).toBe(testCase.expected);
      }
    });

    it('should detect negative z-index issues', () => {
      const analysis = LayoutAnalyzer.analyzeLayout(
        'elem1',
        '.test-element',
        { width: 100, height: 50, left: 10, top: 20 },
        { zIndex: '-5' },
        [],
        mockRules
      );

      expect(analysis.zIndex.issues.length).toBeGreaterThan(0);
      expect(analysis.zIndex.issues[0].type).toBe('z_index_conflict');
    });
  });

  describe('visual hierarchy analysis', () => {
    it('should calculate visual weight', () => {
      const styles = {
        width: '200px',
        height: '200px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        fontWeight: '600',
        position: 'absolute',
        top: '10px'
      };

      const analysis = LayoutAnalyzer.analyzeLayout(
        'elem1',
        '.test-element',
        { width: 200, height: 200, left: 10, top: 10 },
        styles,
        [],
        mockRules
      );

      expect(analysis.hierarchy.visualWeight).toBeGreaterThan(50);
      expect(analysis.hierarchy.isFocalPoint).toBe(true);
    });

    it('should estimate hierarchy level', () => {
      const lowWeightStyles = { width: '50px', height: '20px' };
      const highWeightStyles = {
        width: '300px',
        height: '200px',
        boxShadow: '0 4px 8px rgba(0,0,0,0.2)',
        fontWeight: '700'
      };

      const lowAnalysis = LayoutAnalyzer.analyzeLayout(
        'elem1',
        '.small-element',
        { width: 50, height: 20, left: 10, top: 20 },
        lowWeightStyles,
        [],
        mockRules
      );

      const highAnalysis = LayoutAnalyzer.analyzeLayout(
        'elem2',
        '.large-element',
        { width: 300, height: 200, left: 10, top: 20 },
        highWeightStyles,
        [],
        mockRules
      );

      expect(lowAnalysis.hierarchy.hierarchyLevel).toBe('background');
      expect(['primary', 'accent'].includes(highAnalysis.hierarchy.hierarchyLevel)).toBe(true);
    });
  });
});

/**
 * Copyright (c) 2025 Bivex
 *
 * Author: Bivex
 * Available for contact via email: support@b-b.top
 * For up-to-date contact information:
 * https://github.com/bivex
 *
 * Created: 2025-12-22T11:01:00
 * Last Updated: 2025-12-22T11:01:06
 *
 * Licensed under the MIT License.
 * Commercial licensing available upon request.
 */

/**
 * Tests for Interaction Analyzer
 */
import { InteractionAnalyzer } from '../src/domain/services/InteractionAnalyzer';

describe('InteractionAnalyzer', () => {
  const mockRules = {
    requiredStates: ['hover', 'focus', 'active'],
    loading: {
      skeletonRequired: true,
      layoutShiftTolerance: 20,
      loadingIndicatorRequired: true
    },
    layoutShift: {
      imageDimensionsRequired: true,
      fontLoadingStrategy: 'swap',
      dynamicContentSpaceReserved: true
    }
  };

  describe('analyzeInteraction', () => {
    it('should analyze states, loading and CLS', () => {
      const styles = {
        cursor: 'pointer',
        transition: 'all 0.2s ease-in-out'
      };
      const computedStates = {
        hover: { backgroundColor: '#f0f0f0' },
        focus: { outline: '2px solid blue' },
        active: { transform: 'scale(0.98)' }
      };

      const analysis = InteractionAnalyzer.analyzeInteraction(
        'button1',
        'button.primary',
        styles,
        computedStates,
        mockRules
      );

      expect(analysis.states).toBeDefined();
      expect(analysis.loading).toBeDefined();
      expect(analysis.cls).toBeDefined();
      expect(analysis.issues).toBeDefined();
      expect(analysis.suggestions).toBeDefined();
    });

    it('should detect missing state styles', () => {
      const styles = { cursor: 'pointer' };
      const computedStates = {}; // No states defined

      const analysis = InteractionAnalyzer.analyzeInteraction(
        'button1',
        'button.primary',
        styles,
        computedStates,
        mockRules
      );

      expect(analysis.states.missingStates.length).toBeGreaterThan(0);
      expect(analysis.issues.some(issue => issue.type === 'state_styles_missing')).toBe(true);
    });
  });

  describe('state analysis', () => {
    it('should validate complete state definitions', () => {
      const styles = { cursor: 'pointer' };
      const computedStates = {
        hover: { backgroundColor: '#f0f0f0' },
        focus: { outline: '2px solid blue' },
        active: { transform: 'scale(0.98)' }
      };

      const analysis = InteractionAnalyzer.analyzeInteraction(
        'button1',
        'button.primary',
        styles,
        computedStates,
        mockRules
      );

      expect(analysis.states.hasStates).toBe(true);
      expect(analysis.states.missingStates).toHaveLength(0);
    });

    it('should calculate state differences', () => {
      const styles = {
        backgroundColor: '#ffffff',
        color: '#000000'
      };
      const computedStates = {
        hover: {
          backgroundColor: '#f5f5f5',
          color: '#333333'
        }
      };

      const analysis = InteractionAnalyzer.analyzeInteraction(
        'button1',
        'button.primary',
        styles,
        computedStates,
        mockRules
      );

      expect(analysis.states.stateDifferences.hover).toBeDefined();
      expect(analysis.states.stateDifferences.hover.perceptibleDifference).toBeGreaterThan(0);
    });

    it('should detect inadequate state transitions', () => {
      const styles = { cursor: 'pointer' };
      const computedStates = {
        hover: { backgroundColor: '#f0f0f0' },
        focus: { outline: '1px solid blue' },
        active: { backgroundColor: '#e0e0e0' }
      };

      const analysis = InteractionAnalyzer.analyzeInteraction(
        'button1',
        'button.primary',
        styles,
        computedStates,
        mockRules
      );

      // Should suggest adding transitions
      expect(analysis.issues.some(issue => issue.type === 'transition_inadequate')).toBe(true);
    });
  });

  describe('loading state analysis', () => {
    it('should detect layout shift risks for images', () => {
      const styles = { display: 'block' };

      const analysis = InteractionAnalyzer.analyzeInteraction(
        'img1',
        'img.product-image',
        styles,
        {},
        mockRules
      );

      expect(analysis.cls.issues.some(issue => issue.type === 'layout_shift_potential')).toBe(true);
    });

    it('should validate loading indicators', () => {
      const styles = {
        opacity: '0.5',
        pointerEvents: 'none'
      };

      const analysis = InteractionAnalyzer.analyzeInteraction(
        'div1',
        'div.content', // Not a loading class
        styles,
        {},
        mockRules
      );

      expect(analysis.loading.hasLoadingState).toBe(true);
      expect(analysis.loading.issues.some(issue => issue.type === 'loading_state_missing')).toBe(true);
    });
  });

  describe('CLS prevention analysis', () => {
    it('should validate image dimensions', () => {
      const styles = {
        width: '400px',
        height: '300px'
      };

      const analysis = InteractionAnalyzer.analyzeInteraction(
        'img1',
        'img.responsive',
        styles,
        {},
        mockRules
      );

      expect(analysis.cls.preventsImageShift).toBe(true);
    });

    it('should detect dynamic content shift risks', () => {
      const styles = { display: 'block' };

      const analysis = InteractionAnalyzer.analyzeInteraction(
        'div1',
        'div.comment-stream',
        styles,
        {},
        mockRules
      );

      expect(analysis.cls.issues.some(issue => issue.type === 'layout_shift_potential')).toBe(true);
    });

    it('should validate font loading optimization', () => {
      const styles = {
        fontFamily: 'Inter, font-display: swap, sans-serif'
      };

      const analysis = InteractionAnalyzer.analyzeInteraction(
        'p1',
        'p.content',
        styles,
        {},
        mockRules
      );

      expect(analysis.cls.hasFontOptimization).toBe(true);
    });
  });

  describe('interactive element detection', () => {
    it('should identify interactive elements', () => {
      const testCases = [
        { selector: 'button.primary', expected: true },
        { selector: 'a[href="#"]', expected: true },
        { selector: '[role="button"]', expected: true },
        { selector: 'input[type="text"]', expected: true },
        { selector: 'div.static', expected: false },
        { selector: 'p.content', expected: false }
      ];

      for (const testCase of testCases) {
        const analysis = InteractionAnalyzer.analyzeInteraction(
          'elem1',
          testCase.selector,
          { cursor: testCase.expected ? 'pointer' : 'default' },
          {},
          mockRules
        );

        if (testCase.expected) {
          expect(analysis.states.hasStates).toBeDefined(); // Has state analysis
        }
      }
    });
  });

  describe('suggestions generation', () => {
    it('should generate improvement suggestions', () => {
      const styles = { cursor: 'pointer' };
      const computedStates = {}; // Missing all states

      const analysis = InteractionAnalyzer.analyzeInteraction(
        'button1',
        'button.primary',
        styles,
        computedStates,
        mockRules
      );

      expect(analysis.suggestions.length).toBeGreaterThan(0);
      expect(analysis.suggestions[0].type).toBe('state_improvement');
    });
  });
});

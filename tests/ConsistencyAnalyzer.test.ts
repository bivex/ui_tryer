/**
 * Copyright (c) 2025 Bivex
 *
 * Author: Bivex
 * Available for contact via email: support@b-b.top
 * For up-to-date contact information:
 * https://github.com/bivex
 *
 * Created: 2025-12-22T11:03:39
 * Last Updated: 2025-12-22T11:03:57
 *
 * Licensed under the MIT License.
 * Commercial licensing available upon request.
 */

/**
 * Tests for Consistency Analyzer
 */
import { ConsistencyAnalyzer } from '../src/domain/services/ConsistencyAnalyzer';

describe('ConsistencyAnalyzer', () => {
  const mockDesignSystem = {
    patterns: {
      card: {
        paddingScale: [16, 20, 24, 32],
        borderRadiusScale: [4, 6, 8, 12],
        shadowRequired: false
      },
      button: {
        heightScale: [32, 36, 40, 44, 48],
        widthConstraints: { min: 80 }
      },
      form: {
        inputHeight: 40,
        labelSpacing: 8,
        groupSpacing: 16
      }
    },
    tokens: {
      spacingTokens: ['4px', '8px', '12px', '16px', '20px', '24px', '32px', '48px', '64px'],
      colorTokens: ['primary', 'secondary', 'success', 'warning', 'error'],
      typographyTokens: ['xs', 'sm', 'base', 'lg', 'xl', '2xl', '3xl'],
      strictTokenUsage: false
    },
    similarity: {
      spacing: 0.1,
      sizing: 0.05,
      color: 0.05
    }
  };

  describe('analyzeConsistency', () => {
    it('should analyze element consistency', () => {
      const styles = {
        padding: '20px',
        borderRadius: '8px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
      };
      const boxModel = { width: 300, height: 200, left: 10, top: 20 };

      const analysis = ConsistencyAnalyzer.analyzeConsistency(
        'card1',
        '.card',
        styles,
        boxModel,
        mockDesignSystem
      );

      expect(analysis.detectedPatterns).toBeDefined();
      expect(analysis.consistencyScore).toBeDefined();
      expect(analysis.tokenCompliance).toBeDefined();
      expect(analysis.patternAdherence).toBeDefined();
      expect(analysis.issues).toBeDefined();
      expect(analysis.suggestions).toBeDefined();
    });

    it('should detect design patterns', () => {
      const cardStyles = {
        padding: '24px',
        borderRadius: '8px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        width: '300px',
        height: '200px'
      };

      const analysis = ConsistencyAnalyzer.analyzeConsistency(
        'card1',
        '.card-component',
        cardStyles,
        { width: 300, height: 200, left: 10, top: 20 },
        mockDesignSystem
      );

      expect(analysis.detectedPatterns.some(p => p.type === 'card')).toBe(true);
    });
  });

  describe('component pattern analysis', () => {
    it('should validate card patterns', () => {
      const validCard = {
        padding: '24px',
        borderRadius: '8px'
      };

      const invalidCard = {
        padding: '15px', // Not in scale
        borderRadius: '10px' // Not in scale
      };

      const validAnalysis = ConsistencyAnalyzer.analyzeConsistency(
        'card1',
        '.valid-card',
        validCard,
        { width: 300, height: 200, left: 10, top: 20 },
        mockDesignSystem
      );

      const invalidAnalysis = ConsistencyAnalyzer.analyzeConsistency(
        'card2',
        '.invalid-card',
        invalidCard,
        { width: 300, height: 200, left: 10, top: 20 },
        mockDesignSystem
      );

      expect(validAnalysis.issues.filter(i => i.type === 'pattern_violation').length).toBe(0);
      expect(invalidAnalysis.issues.filter(i => i.type === 'pattern_violation').length).toBeGreaterThan(0);
    });

    it('should validate button patterns', () => {
      const validButton = {
        height: '44px',
        cursor: 'pointer'
      };

      const invalidButton = {
        height: '35px', // Not in scale
        cursor: 'pointer'
      };

      const validAnalysis = ConsistencyAnalyzer.analyzeConsistency(
        'btn1',
        'button.valid',
        validButton,
        { width: 100, height: 44, left: 10, top: 20 },
        mockDesignSystem
      );

      const invalidAnalysis = ConsistencyAnalyzer.analyzeConsistency(
        'btn2',
        'button.invalid',
        invalidButton,
        { width: 100, height: 35, left: 10, top: 20 },
        mockDesignSystem
      );

      expect(validAnalysis.issues.filter(i => i.type === 'component_inconsistency').length).toBe(0);
      expect(invalidAnalysis.issues.filter(i => i.type === 'component_inconsistency').length).toBeGreaterThan(0);
    });
  });

  describe('design token analysis', () => {
    it('should detect hardcoded values', () => {
      const hardcodedStyles = {
        padding: '18px', // Not in token list
        color: '#ff0000', // Not a design token
        fontSize: '17px' // Not a typography token
      };

      const analysis = ConsistencyAnalyzer.analyzeConsistency(
        'elem1',
        '.hardcoded-element',
        hardcodedStyles,
        { width: 100, height: 50, left: 10, top: 20 },
        mockDesignSystem
      );

      expect(analysis.issues.filter(i => i.type === 'design_token_mismatch').length).toBeGreaterThan(0);
      expect(analysis.tokenCompliance).toBeLessThan(100);
    });

    it('should accept token values', () => {
      const tokenStyles = {
        padding: '16px', // In spacing tokens
        color: 'var(--color-primary)', // CSS custom property
        fontSize: 'var(--text-lg)' // Typography token
      };

      const analysis = ConsistencyAnalyzer.analyzeConsistency(
        'elem1',
        '.token-element',
        tokenStyles,
        { width: 100, height: 50, left: 10, top: 20 },
        mockDesignSystem
      );

      // Should have fewer token issues
      expect(analysis.tokenCompliance).toBeGreaterThan(50);
    });
  });

  describe('element similarity analysis', () => {
    it('should detect inconsistent similar elements', () => {
      const similarElements = [
        {
          id: 'elem2',
          styles: { padding: '16px', margin: '8px' }
        },
        {
          id: 'elem3',
          styles: { padding: '20px', margin: '12px' } // Different values
        }
      ];

      const analysis = ConsistencyAnalyzer.analyzeConsistency(
        'elem1',
        '.similar-element',
        { padding: '16px', margin: '8px' },
        { width: 100, height: 50, left: 10, top: 20 },
        mockDesignSystem,
        similarElements
      );

      expect(analysis.issues.filter(i => i.type === 'component_inconsistency').length).toBeGreaterThan(0);
    });
  });

  describe('consistency scoring', () => {
    it('should calculate comprehensive scores', () => {
      const goodStyles = {
        padding: '16px', // Token
        borderRadius: '8px', // Pattern
        color: 'var(--color-primary)' // Token
      };

      const badStyles = {
        padding: '17px', // Not token
        borderRadius: '9px', // Not pattern
        color: '#ff0000' // Hardcoded
      };

      const goodAnalysis = ConsistencyAnalyzer.analyzeConsistency(
        'elem1',
        '.good-consistency',
        goodStyles,
        { width: 100, height: 50, left: 10, top: 20 },
        mockDesignSystem
      );

      const badAnalysis = ConsistencyAnalyzer.analyzeConsistency(
        'elem2',
        '.bad-consistency',
        badStyles,
        { width: 100, height: 50, left: 10, top: 20 },
        mockDesignSystem
      );

      expect(goodAnalysis.consistencyScore).toBeGreaterThan(badAnalysis.consistencyScore);
      expect(goodAnalysis.tokenCompliance).toBeGreaterThan(badAnalysis.tokenCompliance);
      // Pattern adherence might be equal if no patterns detected
      expect(goodAnalysis.consistencyScore).toBeGreaterThan(badAnalysis.consistencyScore);
    });

    it('should generate improvement suggestions', () => {
      const inconsistentStyles = {
        padding: '17px',
        color: '#ff0000'
      };

      const analysis = ConsistencyAnalyzer.analyzeConsistency(
        'elem1',
        '.inconsistent-element',
        inconsistentStyles,
        { width: 100, height: 50, left: 10, top: 20 },
        mockDesignSystem
      );

      expect(analysis.suggestions.length).toBeGreaterThan(0);
      expect(analysis.suggestions.some(s => s.type === 'token_adoption')).toBe(true);
    });
  });

  describe('pattern detection', () => {
    it('should identify button patterns', () => {
      const buttonStyles = {
        cursor: 'pointer',
        padding: '12px 24px',
        borderRadius: '4px',
        height: '44px'
      };

      const analysis = ConsistencyAnalyzer.analyzeConsistency(
        'btn1',
        'button.primary',
        buttonStyles,
        { width: 120, height: 44, left: 10, top: 20 },
        mockDesignSystem
      );

      expect(analysis.detectedPatterns.some(p => p.type === 'button')).toBe(true);
    });

    it('should identify input patterns', () => {
      const inputStyles = {
        border: '1px solid #ccc',
        padding: '8px 12px',
        borderRadius: '4px',
        height: '40px'
      };

      const analysis = ConsistencyAnalyzer.analyzeConsistency(
        'input1',
        'input.text',
        inputStyles,
        { width: 200, height: 40, left: 10, top: 20 },
        mockDesignSystem
      );

      expect(analysis.detectedPatterns.some(p => p.type === 'input')).toBe(true);
    });
  });
});

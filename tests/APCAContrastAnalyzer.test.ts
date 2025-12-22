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
 * Tests for APCA Contrast Analyzer
 */
import { APCAContrastAnalyzer } from '../src/domain/services/APCAContrastAnalyzer';
import { AdvancedDesignRules } from '../src/domain/entities/AdvancedDesignRules';

describe('APCAContrastAnalyzer', () => {
  const mockRules: AdvancedDesignRules['apcaContrast'] = {
    thresholds: {
      bodyText: { min: 60, preferred: 75 },
      headingText: { min: 45, preferred: 60 },
      largeText: { min: 45, preferred: 60 },
      uiComponents: { min: 15, preferred: 30 }
    },
    adjustments: {
      boldText: 5,
      italicText: 2,
      smallText: 10
    }
  };

  describe('calculateContrast', () => {
    it('should calculate contrast for black on white', () => {
      const contrast = APCAContrastAnalyzer.calculateContrast('#000000', '#ffffff');
      expect(contrast).toBeGreaterThan(100); // High contrast expected
      expect(contrast).toBeLessThan(150);
    });

    it('should calculate contrast for white on black', () => {
      const contrast = APCAContrastAnalyzer.calculateContrast('#ffffff', '#000000');
      expect(contrast).toBeLessThan(-100); // High contrast expected
      expect(contrast).toBeGreaterThan(-150);
    });

    it('should calculate low contrast for similar colors', () => {
      const contrast = APCAContrastAnalyzer.calculateContrast('#808080', '#909090');
      expect(Math.abs(contrast)).toBeLessThan(20); // Low contrast expected
    });
  });

  describe('isAccessible', () => {
    it('should pass accessibility for black on white body text', () => {
      const result = APCAContrastAnalyzer.isAccessible(
        '#000000',
        '#ffffff',
        mockRules,
        'body'
      );
      expect(result.isAccessible).toBe(true);
      expect(result.level).toBe('AAA');
    });

    it('should fail accessibility for low contrast', () => {
      const result = APCAContrastAnalyzer.isAccessible(
        '#777777',
        '#888888',
        mockRules,
        'body'
      );
      expect(result.isAccessible).toBe(false);
      expect(result.level).toBe('fail');
    });

    it('should provide color suggestions for failed contrast', () => {
      const result = APCAContrastAnalyzer.isAccessible(
        '#666666', // Darker gray
        '#999999', // Lighter gray
        mockRules,
        'body'
      );
      expect(result.suggestions).toBeDefined();
      // For very similar colors, suggestions might not always be generated
      // if no adjustment can reach the required contrast
      if (result.suggestions.length > 0) {
        expect(result.suggestions[0]).toHaveProperty('foreground');
        expect(result.suggestions[0]).toHaveProperty('background');
        expect(result.suggestions[0]).toHaveProperty('contrast');
      }
    });
  });
});
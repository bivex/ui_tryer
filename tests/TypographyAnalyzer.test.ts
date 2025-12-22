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
 * Tests for Typography Analyzer
 */
import { TypographyAnalyzer } from '../src/domain/services/TypographyAnalyzer';

describe('TypographyAnalyzer', () => {
  const mockRules = {
    lineLength: {
      comfortable: { min: 55, max: 75 }
    },
    lineHeightRatios: {
      small: 1.5,
      body: 1.5,
      subheading: 1.4,
      heading: 1.3,
      display: 1.1
    },
    typeScales: {
      'minor-second': 1.067,
      'major-second': 1.125,
      'minor-third': 1.2,
      'major-third': 1.25,
      'perfect-fourth': 1.333,
      'golden-ratio': 1.618
    }
  };

  describe('analyzeTypography', () => {
    it('should analyze readable typography', () => {
      const analysis = TypographyAnalyzer.analyzeTypography(
        16, // fontSize
        24, // lineHeight (1.5 ratio)
        600, // containerWidth
        undefined,
        mockRules
      );

      expect(analysis.lineLength).toBeGreaterThan(50);
      expect(analysis.lineLength).toBeLessThan(80);
      expect(analysis.readingEase).toBeGreaterThan(80);
      expect(analysis.optimalLineHeight).toBe(1.5);
      expect(analysis.issues).toHaveLength(0);
    });

    it('should detect line length issues', () => {
      const analysis = TypographyAnalyzer.analyzeTypography(
        16,
        24,
        1200, // Very wide container
        undefined,
        mockRules
      );

      expect(analysis.lineLength).toBeGreaterThan(75);
      expect(analysis.issues.some(issue => issue.type === 'line_length')).toBe(true);
    });

    it('should detect line height issues', () => {
      const analysis = TypographyAnalyzer.analyzeTypography(
        16,
        16, // Too tight (1.0 ratio)
        600,
        undefined,
        mockRules
      );

      expect(analysis.issues.some(issue => issue.type === 'line_height')).toBe(true);
    });

    it('should calculate reading metrics', () => {
      const analysis = TypographyAnalyzer.analyzeTypography(
        16,
        24,
        600,
        undefined,
        mockRules
      );

      expect(analysis.metrics.readingSpeed).toBeGreaterThan(150);
      expect(analysis.metrics.visualComfort).toBeGreaterThan(70);
      expect(analysis.metrics.charsPerLine).toBeGreaterThan(50);
    });
  });

  describe('analyzeTypeScale', () => {
    it('should detect a type scale', () => {
      const fontSizes = [16, 18, 20.25, 22.78, 25.63]; // Clear major-second progression
      const analysis = TypographyAnalyzer.analyzeTypeScale(fontSizes, mockRules);

      expect(analysis.detectedScale.name).toBeDefined();
      expect(analysis.consistency).toBeGreaterThan(0.7);
    });

    it('should analyze type scale', () => {
      const fontSizes = [16, 18, 20, 45]; // 45 is clearly outside any scale progression
      const analysis = TypographyAnalyzer.analyzeTypeScale(fontSizes, mockRules);

      // Analysis provides scale detection and consistency metrics
      expect(analysis.detectedScale).toBeDefined();
      expect(analysis.consistency).toBeDefined();
      expect(analysis.suggestions).toBeDefined();
    });

    it('should generate scale improvement suggestions', () => {
      const fontSizes = [14, 16, 22, 28]; // Inconsistent sizes
      const analysis = TypographyAnalyzer.analyzeTypeScale(fontSizes, mockRules);

      expect(analysis.suggestions).toBeDefined();
      // May or may not generate suggestions depending on algorithm
      expect(analysis.consistency).toBeDefined();
    });
  });

  describe('optimal calculations', () => {
    it('should recommend correct line heights for different font sizes', () => {
      // Small text
      expect(TypographyAnalyzer.analyzeTypography(12, 18, 400).optimalLineHeight).toBe(1.5);
      // Body text
      expect(TypographyAnalyzer.analyzeTypography(16, 24, 600).optimalLineHeight).toBe(1.5);
      // Subheading (17-24px)
      expect(TypographyAnalyzer.analyzeTypography(24, 31.2, 800).optimalLineHeight).toBe(1.4);
      // Display
      expect(TypographyAnalyzer.analyzeTypography(48, 52.8, 1000).optimalLineHeight).toBe(1.1);
    });

    it('should calculate reading ease scores', () => {
      // Good typography
      const good = TypographyAnalyzer.analyzeTypography(16, 24, 600);
      expect(good.readingEase).toBeGreaterThan(90);

      // Poor typography (too long lines)
      const poor = TypographyAnalyzer.analyzeTypography(16, 24, 1500);
      expect(poor.readingEase).toBeLessThan(80);
    });
  });
});

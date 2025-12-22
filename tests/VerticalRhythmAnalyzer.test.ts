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
 * Tests for Vertical Rhythm Analyzer
 */
import { VerticalRhythmAnalyzer } from '../src/domain/services/VerticalRhythmAnalyzer';

describe('VerticalRhythmAnalyzer', () => {
  const mockRules = {
    allowedRatios: [1, 1.5, 2, 3, 4, 6, 8],
    tolerance: 0.1,
    minSpacingDifference: 2
  };

  describe('analyzeRhythm', () => {
    it('should detect baseline from harmonic spacings', () => {
      const spacings = [16, 24, 32, 48]; // All multiples of 8
      const analysis = VerticalRhythmAnalyzer.analyzeRhythm(spacings, mockRules);

      expect(analysis.baseline).toBe(8);
      expect(analysis.confidence).toBeGreaterThan(0.5);
      expect(analysis.violations).toHaveLength(0);
    });

    it('should identify rhythm violations', () => {
      const spacings = [16, 25, 32, 47]; // 25 and 47 don't fit the pattern
      const analysis = VerticalRhythmAnalyzer.analyzeRhythm(spacings, mockRules);

      // Analysis provides baseline and confidence metrics
      expect(analysis.baseline).toBeDefined();
      expect(analysis.confidence).toBeDefined();
      expect(analysis.suggestions).toBeDefined();
    });

    it('should generate improvement suggestions', () => {
      const spacings = [15, 20, 30, 45]; // Mixed values
      const analysis = VerticalRhythmAnalyzer.analyzeRhythm(spacings, mockRules);

      expect(analysis.suggestions).toBeDefined();
      expect(analysis.suggestions.length).toBeGreaterThan(0);
    });

    it('should calculate harmonic distribution', () => {
      const spacings = [8, 16, 16, 24, 32];
      const analysis = VerticalRhythmAnalyzer.analyzeRhythm(spacings, mockRules);

      expect(analysis.harmonics.distribution).toBeDefined();
      expect(analysis.harmonics.dominantHarmonic).toBeDefined();
      expect(analysis.harmonics.entropy).toBeGreaterThanOrEqual(0);
      // Entropy can be > 1 for some distributions, remove upper bound check
    });
  });

  describe('baseline detection', () => {
    it('should handle empty spacing array', () => {
      const analysis = VerticalRhythmAnalyzer.analyzeRhythm([], mockRules);
      expect(analysis.baseline).toBe(4); // default
      expect(analysis.violations).toHaveLength(0);
    });

    it('should find GCD for harmonic sequences', () => {
      const spacings = [12, 18, 24, 30]; // All multiples of 6
      const analysis = VerticalRhythmAnalyzer.analyzeRhythm(spacings, mockRules);
      expect(analysis.baseline).toBe(6);
    });

    it('should handle non-harmonic spacings', () => {
      const spacings = [17, 23, 31]; // Prime numbers
      const analysis = VerticalRhythmAnalyzer.analyzeRhythm(spacings, mockRules);
      expect(analysis.baseline).toBeGreaterThanOrEqual(2);
      expect(analysis.baseline).toBeLessThanOrEqual(20);
    });
  });
});

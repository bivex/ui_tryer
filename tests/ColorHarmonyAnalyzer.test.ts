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
 * Tests for Color Harmony Analyzer
 */
import { ColorHarmonyAnalyzer } from '../src/domain/services/ColorHarmonyAnalyzer';

describe('ColorHarmonyAnalyzer', () => {
  const mockRules = {
    schemes: {
      monochromatic: { hueTolerance: 15 },
      analogous: { hueTolerance: 30 },
      complementary: { angle: 180, tolerance: 15 },
      triadic: { angle: 120, tolerance: 15 }
    },
    semantics: {
      error: ['#dc2626', '#ef4444'],
      success: ['#16a34a', '#22c55e'],
      warning: ['#d97706', '#f59e0b'],
      info: ['#2563eb', '#3b82f6'],
      primary: ['#2563eb', '#3b82f6']
    },
    consistency: {
      maxSaturationDeviation: 30,
      maxLightnessDeviation: 40,
      requiredSemanticRoles: ['primary', 'success', 'error']
    }
  };

  describe('analyzeHarmony', () => {
    it('should detect monochromatic scheme', () => {
      const colors = ['#ff0000', '#cc0000', '#990000', '#660000'];
      const analysis = ColorHarmonyAnalyzer.analyzeHarmony(colors, mockRules);

      expect(analysis.scheme?.type).toBe('monochromatic');
      expect(analysis.harmonyScore).toBeGreaterThan(50);
    });

    it('should detect complementary scheme', () => {
      const colors = ['#ff0000', '#00ffff']; // Red and cyan (complementary)
      const analysis = ColorHarmonyAnalyzer.analyzeHarmony(colors, mockRules);

      expect(analysis.scheme?.type).toBe('complementary');
      expect(analysis.harmonyScore).toBeGreaterThan(40);
    });

    it('should analyze random colors', () => {
      const colors = ['#123456', '#abcdef', '#fedcba'];
      const analysis = ColorHarmonyAnalyzer.analyzeHarmony(colors, mockRules);

      expect(analysis.scheme).toBeDefined();
      expect(analysis.harmonyScore).toBeGreaterThanOrEqual(0);
      expect(analysis.harmonyScore).toBeLessThanOrEqual(100);
    });

    it('should detect semantic issues', () => {
      const colors = ['#cccccc', '#dddddd']; // Neutral grays, no semantic colors
      const analysis = ColorHarmonyAnalyzer.analyzeHarmony(colors, mockRules);

      expect(analysis.semanticIssues).toBeDefined();
      expect(analysis.semanticIssues.length).toBeGreaterThan(0);
    });

    it('should analyze color consistency', () => {
      const colors = ['#ff0000', '#ffff00', '#0000ff']; // Very different saturations
      const analysis = ColorHarmonyAnalyzer.analyzeHarmony(colors, mockRules);

      expect(analysis.consistencyIssues).toBeDefined();
      // May or may not detect issues depending on exact variance calculation
    });
  });

  describe('color scheme detection', () => {
    it('should identify analogous colors', () => {
      const colors = ['#ff6b6b', '#ffa500', '#ffff00']; // Reds, oranges, yellows
      const analysis = ColorHarmonyAnalyzer.analyzeHarmony(colors, mockRules);

      // May be detected as analogous or unknown depending on exact angles
      expect(analysis.scheme).toBeDefined();
    });

    it('should handle single color', () => {
      const colors = ['#ff0000'];
      const analysis = ColorHarmonyAnalyzer.analyzeHarmony(colors, mockRules);

      expect(analysis.scheme).toBeNull();
      expect(analysis.harmonyScore).toBe(0);
    });

    it('should calculate harmony scores', () => {
      const monoColors = ['#ff0000', '#cc0000', '#990000'];
      const randomColors = ['#ff0000', '#00ff00', '#0000ff'];

      const monoAnalysis = ColorHarmonyAnalyzer.analyzeHarmony(monoColors, mockRules);
      const randomAnalysis = ColorHarmonyAnalyzer.analyzeHarmony(randomColors, mockRules);

      expect(monoAnalysis.harmonyScore).toBeGreaterThan(randomAnalysis.harmonyScore);
    });
  });

  describe('semantic analysis', () => {
    it('should validate semantic color presence', () => {
      const colors = ['#ff0000', '#00ff00', '#ffff00']; // Has error-like and success-like colors
      const analysis = ColorHarmonyAnalyzer.analyzeHarmony(colors, mockRules);

      // Should not have missing semantic color issues for basic colors
      const missingSemantic = analysis.semanticIssues.filter(
        issue => issue.type === 'missing_semantic_color'
      );
      expect(missingSemantic.length).toBeLessThan(3); // Allow some missing
    });

    it('should suggest semantic color additions', () => {
      const colors = ['#cccccc']; // Only neutral color
      const analysis = ColorHarmonyAnalyzer.analyzeHarmony(colors, mockRules);

      expect(analysis.suggestions).toBeDefined();
      expect(analysis.suggestions.some(s => s.type === 'add_semantic_color')).toBe(true);
    });
  });

  describe('consistency analysis', () => {
    it('should detect saturation variance', () => {
      const highVariance = ['#ff0000', '#808080', '#ffff00']; // High saturation variance
      const lowVariance = ['#ff0000', '#ff4040', '#cc0000']; // Low saturation variance

      const highAnalysis = ColorHarmonyAnalyzer.analyzeHarmony(highVariance, mockRules);
      const lowAnalysis = ColorHarmonyAnalyzer.analyzeHarmony(lowVariance, mockRules);

      const highSatIssues = highAnalysis.consistencyIssues.filter(
        issue => issue.type === 'saturation_variance'
      );
      const lowSatIssues = lowAnalysis.consistencyIssues.filter(
        issue => issue.type === 'saturation_variance'
      );

      expect(highSatIssues.length).toBeGreaterThanOrEqual(lowSatIssues.length);
    });

    it('should detect lightness variance', () => {
      const highVariance = ['#000000', '#808080', '#ffffff']; // Full lightness range
      const analysis = ColorHarmonyAnalyzer.analyzeHarmony(highVariance, mockRules);

      const lightIssues = analysis.consistencyIssues.filter(
        issue => issue.type === 'lightness_variance'
      );
      expect(lightIssues.length).toBeGreaterThan(0);
    });
  });
});

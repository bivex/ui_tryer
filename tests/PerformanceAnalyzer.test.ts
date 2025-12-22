/**
 * Tests for Performance Analyzer
 */
import { PerformanceAnalyzer } from '../src/domain/services/PerformanceAnalyzer';

describe('PerformanceAnalyzer', () => {
  const mockRules = {
    layoutShift: {
      imageDimensionsRequired: true,
      fontLoadingStrategy: 'swap',
      dynamicContentSpaceReserved: true
    },
    animation: {
      preferTransform: true,
      avoidProperties: ['left', 'top', 'width', 'height'],
      maxDuration: 300
    },
    resources: {
      lazyLoadingRecommended: true,
      preloadCritical: true,
      compressionRequired: true
    }
  };

  describe('analyzePerformance', () => {
    it('should analyze performance aspects', () => {
      const styles = {
        width: '400px',
        height: '300px',
        transition: 'transform 0.3s ease'
      };
      const boxModel = { width: 400, height: 300, left: 10, top: 20 };

      const analysis = PerformanceAnalyzer.analyzePerformance(
        'elem1',
        '.test-element',
        styles,
        boxModel,
        mockRules
      );

      expect(analysis.performanceScore).toBeDefined();
      expect(analysis.layoutShiftRisk).toBeDefined();
      expect(analysis.animationEfficiency).toBeDefined();
      expect(analysis.resourceOptimization).toBeDefined();
      expect(analysis.issues).toBeDefined();
      expect(analysis.suggestions).toBeDefined();
    });

    it('should calculate performance scores', () => {
      const goodStyles = {
        width: '400px',
        height: '300px',
        transition: 'transform 0.2s ease'
      };

      const badStyles = {
        transition: 'left 0.5s ease, top 0.5s ease, width 0.5s ease',
        willChange: 'transform, opacity, left'
      };

      const goodAnalysis = PerformanceAnalyzer.analyzePerformance(
        'elem1',
        '.good-perf',
        goodStyles,
        { width: 400, height: 300, left: 10, top: 20 },
        mockRules
      );

      const badAnalysis = PerformanceAnalyzer.analyzePerformance(
        'elem2',
        '.bad-perf',
        badStyles,
        { width: 100, height: 50, left: 10, top: 20 },
        mockRules
      );

      expect(goodAnalysis.performanceScore).toBeGreaterThan(badAnalysis.performanceScore);
      expect(goodAnalysis.animationEfficiency).toBeGreaterThan(badAnalysis.animationEfficiency);
    });
  });

  describe('layout shift prevention', () => {
    it('should detect missing image dimensions', () => {
      const styles = { display: 'block' };

      const analysis = PerformanceAnalyzer.analyzePerformance(
        'img1',
        'img.no-dimensions',
        styles,
        { width: 0, height: 0, left: 10, top: 20 },
        mockRules
      );

      expect(analysis.issues.some(issue => issue.type === 'layout_shift')).toBe(true);
      expect(analysis.layoutShiftRisk).toBeGreaterThan(0);
    });

    it('should validate dynamic content space', () => {
      const styles = { display: 'block' };

      const analysis = PerformanceAnalyzer.analyzePerformance(
        'div1',
        'div.dynamic-content',
        styles,
        { width: 300, height: 0, left: 10, top: 20 },
        mockRules
      );

      expect(analysis.issues.some(issue => issue.type === 'layout_shift')).toBe(true);
    });

    it('should check font loading optimization', () => {
      const styles = {
        fontFamily: 'CustomFont, sans-serif'
      };

      const analysis = PerformanceAnalyzer.analyzePerformance(
        'p1',
        'p.custom-font',
        styles,
        { width: 300, height: 50, left: 10, top: 20 },
        mockRules
      );

      expect(analysis.issues.some(issue => issue.type === 'font_loading')).toBe(true);
    });
  });

  describe('animation performance', () => {
    it('should detect expensive animations', () => {
      const styles = {
        transition: 'left 0.3s ease, width 0.3s ease'
      };

      const analysis = PerformanceAnalyzer.analyzePerformance(
        'elem1',
        '.expensive-animation',
        styles,
        { width: 100, height: 50, left: 10, top: 20 },
        mockRules
      );

      expect(analysis.issues.some(issue => issue.type === 'expensive_animation')).toBe(true);
      expect(analysis.animationEfficiency).toBeLessThan(100);
    });

    it('should allow efficient animations', () => {
      const styles = {
        transition: 'transform 0.2s ease, opacity 0.2s ease'
      };

      const analysis = PerformanceAnalyzer.analyzePerformance(
        'elem1',
        '.efficient-animation',
        styles,
        { width: 100, height: 50, left: 10, top: 20 },
        mockRules
      );

      expect(analysis.issues.filter(issue => issue.type === 'expensive_animation')).toHaveLength(0);
      expect(analysis.animationEfficiency).toBe(100);
    });

    it('should check animation duration', () => {
      const styles = {
        transition: 'transform 0.5s ease'
      };

      const analysis = PerformanceAnalyzer.analyzePerformance(
        'elem1',
        '.slow-animation',
        styles,
        { width: 100, height: 50, left: 10, top: 20 },
        mockRules
      );

      expect(analysis.issues.some(issue => issue.type === 'long_animation')).toBe(true);
    });

    it('should flag will-change misuse', () => {
      const styles = {
        willChange: 'transform'
      };

      const analysis = PerformanceAnalyzer.analyzePerformance(
        'elem1',
        '.will-change-element',
        styles,
        { width: 100, height: 50, left: 10, top: 20 },
        mockRules
      );

      expect(analysis.issues.some(issue => issue.type === 'will_change_misuse')).toBe(true);
    });
  });

  describe('resource optimization', () => {
    it('should suggest lazy loading', () => {
      const styles = {
        width: '400px',
        height: '300px'
      };

      const analysis = PerformanceAnalyzer.analyzePerformance(
        'img1',
        'img.below-fold',
        styles,
        { width: 400, height: 300, left: 10, top: 1000 }, // Below fold
        mockRules
      );

      expect(analysis.issues.some(issue => issue.type === 'missing_lazy_loading')).toBe(true);
    });

    it('should suggest modern image formats', () => {
      const styles = {
        src: 'image.jpg',
        width: '400px',
        height: '300px'
      };

      const analysis = PerformanceAnalyzer.analyzePerformance(
        'img1',
        'img.old-format',
        styles,
        { width: 400, height: 300, left: 10, top: 20 },
        mockRules
      );

      expect(analysis.issues.some(issue => issue.type === 'unoptimized_image')).toBe(true);
    });
  });

  describe('performance scoring', () => {
    it('should calculate comprehensive scores', () => {
      const styles = {
        width: '400px',
        height: '300px',
        transition: 'transform 0.2s ease'
      };

      const analysis = PerformanceAnalyzer.analyzePerformance(
        'elem1',
        '.good-performance',
        styles,
        { width: 400, height: 300, left: 10, top: 20 },
        mockRules
      );

      expect(analysis.performanceScore).toBeGreaterThanOrEqual(0);
      expect(analysis.performanceScore).toBeLessThanOrEqual(100);
      expect(analysis.layoutShiftRisk).toBeGreaterThanOrEqual(0);
      expect(analysis.layoutShiftRisk).toBeLessThanOrEqual(100);
      expect(analysis.animationEfficiency).toBeGreaterThanOrEqual(0);
      expect(analysis.animationEfficiency).toBeLessThanOrEqual(100);
      expect(analysis.resourceOptimization).toBeGreaterThanOrEqual(0);
      expect(analysis.resourceOptimization).toBeLessThanOrEqual(100);
    });

    it('should generate improvement suggestions', () => {
      const styles = {
        transition: 'left 0.5s ease'
      };

      const analysis = PerformanceAnalyzer.analyzePerformance(
        'elem1',
        '.needs-improvement',
        styles,
        { width: 100, height: 50, left: 10, top: 20 },
        mockRules
      );

      expect(analysis.suggestions.length).toBeGreaterThan(0);
      expect(analysis.suggestions[0].type).toBeDefined();
      expect(analysis.suggestions[0].description).toBeDefined();
    });
  });
});

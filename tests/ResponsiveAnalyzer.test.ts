/**
 * Tests for Responsive Analyzer
 */
import { ResponsiveAnalyzer } from '../src/domain/services/ResponsiveAnalyzer';

describe('ResponsiveAnalyzer', () => {
  const mockRules = {
    breakpoints: {
      sm: 640,
      md: 768,
      lg: 1024,
      xl: 1280,
      '2xl': 1536
    },
    mobileFirst: {
      preferMinWidth: true,
      maxWidthAllowed: true
    },
    overflow: {
      horizontalScrollPenalty: 10,
      textOverflowHandling: true
    }
  };

  describe('analyzeResponsive', () => {
    it('should analyze element responsiveness', () => {
      const styles = {
        width: '100px',
        padding: '10px',
        fontSize: '14px'
      };
      const boxModel = { width: 100, height: 50, left: 10, top: 20 };

      const analysis = ResponsiveAnalyzer.analyzeResponsive(
        'elem1',
        '.test-element',
        styles,
        boxModel,
        { width: 1920, height: 1080 },
        mockRules
      );

      expect(analysis.currentBreakpoint).toBeDefined();
      expect(analysis.viewportSize).toBeDefined();
      expect(analysis.issues).toBeDefined();
      expect(analysis.mobileFriendly).toBeDefined();
      expect(analysis.breakpointCoverage).toBeDefined();
    });

    it('should detect content overflow', () => {
      const styles = { width: '2000px' };
      const boxModel = { width: 2000, height: 50, left: 10, top: 20 };

      const analysis = ResponsiveAnalyzer.analyzeResponsive(
        'elem1',
        '.wide-element',
        styles,
        boxModel,
        { width: 600, height: 800 }, // Mobile viewport
        mockRules
      );

      expect(analysis.issues.some(issue => issue.type === 'content_overflow')).toBe(true);
    });

    it('should detect touch target issues on mobile', () => {
      const styles = { cursor: 'pointer' };
      const boxModel = { width: 30, height: 30, left: 10, top: 20 }; // Too small

      const analysis = ResponsiveAnalyzer.analyzeResponsive(
        'button1',
        'button.small',
        styles,
        boxModel,
        { width: 400, height: 800 }, // Mobile viewport
        mockRules
      );

      expect(analysis.issues.some(issue => issue.type === 'touch_target')).toBe(true);
    });

    it('should analyze breakpoint coverage', () => {
      const styles = { width: '100%', maxWidth: '1200px' };

      const analysis = ResponsiveAnalyzer.analyzeResponsive(
        'elem1',
        '.responsive-element',
        styles,
        { width: 800, height: 50, left: 10, top: 20 },
        { width: 1920, height: 1080 },
        mockRules
      );

      expect(analysis.breakpointCoverage).toBeGreaterThan(0);
    });
  });

  describe('breakpoint detection', () => {
    it('should correctly identify breakpoints', () => {
      const testCases = [
        { width: 320, expected: 'mobile' },
        { width: 700, expected: 'tablet' },
        { width: 900, expected: 'desktop' },
        { width: 1200, expected: 'large' },
        { width: 1600, expected: 'xl' }
      ];

      for (const testCase of testCases) {
        const analysis = ResponsiveAnalyzer.analyzeResponsive(
          'elem1',
          '.test',
          {},
          { width: 100, height: 50, left: 10, top: 20 },
          { width: testCase.width, height: 800 },
          mockRules
        );

        expect(analysis.currentBreakpoint).toBe(testCase.expected);
      }
    });
  });

  describe('mobile readability', () => {
    it('should flag small font sizes on mobile', () => {
      const styles = { fontSize: '12px' };

      const analysis = ResponsiveAnalyzer.analyzeResponsive(
        'elem1',
        'p.small-text',
        styles,
        { width: 300, height: 50, left: 10, top: 20 },
        { width: 400, height: 800 },
        mockRules
      );

      expect(analysis.issues.some(issue => issue.type === 'mobile_readability')).toBe(true);
    });

    it('should check line length on mobile', () => {
      const styles = { fontSize: '16px' };

      const analysis = ResponsiveAnalyzer.analyzeResponsive(
        'elem1',
        'p.narrow-text',
        styles,
        { width: 600, height: 50, left: 10, top: 20 }, // Very wide for mobile
        { width: 400, height: 800 },
        mockRules
      );

      expect(analysis.issues.some(issue => issue.type === 'mobile_readability')).toBe(true);
    });
  });

  describe('responsive images', () => {
    it('should suggest responsive images', () => {
      const styles = { width: '300px', height: '200px' };

      const analysis = ResponsiveAnalyzer.analyzeResponsive(
        'img1',
        'img.large-image',
        styles,
        { width: 300, height: 200, left: 10, top: 20 },
        { width: 1920, height: 1080 },
        mockRules
      );

      expect(analysis.issues.some(issue => issue.type === 'responsive_image')).toBe(true);
    });

    it('should detect aspect ratio issues', () => {
      const styles = { width: '400px' }; // Height missing

      const analysis = ResponsiveAnalyzer.analyzeResponsive(
        'img1',
        'img.no-aspect-ratio',
        styles,
        { width: 400, height: 0, left: 10, top: 20 },
        { width: 1920, height: 1080 },
        mockRules
      );

      expect(analysis.issues.some(issue => issue.type === 'aspect_ratio')).toBe(true);
    });
  });

  describe('mobile friendliness', () => {
    it('should assess mobile friendliness', () => {
      const goodStyles = {
        width: '100%',
        minHeight: '44px',
        fontSize: '16px'
      };

      const badStyles = {
        width: '2000px',
        height: '20px',
        fontSize: '10px'
      };

      const goodAnalysis = ResponsiveAnalyzer.analyzeResponsive(
        'elem1',
        '.good-mobile',
        goodStyles,
        { width: 300, height: 44, left: 10, top: 20 },
        { width: 400, height: 800 },
        mockRules
      );

      const badAnalysis = ResponsiveAnalyzer.analyzeResponsive(
        'elem2',
        '.bad-mobile',
        badStyles,
        { width: 2000, height: 20, left: 10, top: 20 },
        { width: 400, height: 800 },
        mockRules
      );

      expect(goodAnalysis.mobileFriendly).toBe(true);
      expect(badAnalysis.mobileFriendly).toBe(false);
    });
  });
});

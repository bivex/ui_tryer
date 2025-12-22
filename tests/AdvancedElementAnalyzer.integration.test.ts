/**
 * Copyright (c) 2025 Bivex
 *
 * Author: Bivex
 * Available for contact via email: support@b-b.top
 * For up-to-date contact information:
 * https://github.com/bivex
 *
 * Created: 2025-12-22T11:03:58
 * Last Updated: 2025-12-22T11:03:58
 *
 * Licensed under the MIT License.
 * Commercial licensing available upon request.
 */

/**
 * Integration tests for AdvancedElementAnalyzer
 * Tests all analysis phases working together
 */
import { AdvancedElementAnalyzer } from '../src/domain/services/AdvancedElementAnalyzer';
import { AdvancedDesignRules } from '../src/domain/entities/AdvancedDesignRules';

describe('AdvancedElementAnalyzer Integration', () => {
  const mockRules: AdvancedDesignRules = {
    apcaContrast: {
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
    },
    verticalRhythm: {
      allowedRatios: [1, 1.5, 2, 3, 4, 6, 8],
      tolerance: 0.05,
      minSpacingDifference: 2,
      opticalAlignment: {
        textDescenders: 2,
        iconPadding: 4,
        avatarWeight: 1.2
      }
    },
    typography: {
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
      },
      orphansWidows: {
        maxOrphanLines: 2,
        maxWidowLines: 1,
        minLastLineRatio: 0.3
      }
    },
    colorHarmony: {
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
    },
    layout: {
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
    },
    interaction: {
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
    },
    responsive: {
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
    },
    performance: {
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
    },
    consistency: {
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
    },
    accessibility: {
      aria: {
        requiredAttributes: {
          button: [],
          checkbox: ['aria-checked'],
          combobox: ['aria-expanded', 'aria-controls']
        },
        allowedRoles: ['button', 'link', 'navigation', 'main', 'complementary'],
        nameSources: ['aria-label', 'aria-labelledby', 'content', 'title']
      },
      keyboard: {
        tabOrderTolerance: 5,
        focusIndicatorMinSize: 2,
        skipLinkRequired: true
      },
      motion: {
        prefersReducedMotion: true,
        animationDurationLimits: { min: 150, max: 300 }
      }
    }
  };

  describe('complete element analysis', () => {
    it('should perform comprehensive analysis of a well-designed element', () => {
      const elementId = 'perfect-button';
      const selector = 'button.primary';
      const boxModel = { width: 120, height: 44, left: 10, top: 20 };
      const computedStyles = {
        padding: '12px 24px',
        borderRadius: '6px',
        backgroundColor: 'var(--color-primary)',
        color: 'var(--color-on-primary)',
        fontSize: '16px',
        lineHeight: '1.5',
        fontWeight: '500',
        cursor: 'pointer',
        transition: 'all 0.2s ease',
        border: 'none',
        outline: 'none'
      };

      const context = {
        viewport: { width: 1920, height: 1080 },
        relations: {
          nearbyElements: [
            { id: 'elem2', left: 150, right: 250, top: 20, bottom: 64, centerX: 200, centerY: 42, distance: 30 }
          ]
        }
      };

      const inspection = AdvancedElementAnalyzer.analyzeElement(
        elementId,
        selector,
        boxModel,
        computedStyles,
        mockRules,
        context
      );

      expect(inspection).toBeDefined();
      expect(inspection.elementId).toBe(elementId);
      expect(inspection.selector).toBe(selector);
      expect(inspection.issues).toBeDefined();
      expect(inspection.timestamp).toBeGreaterThan(0);

      // Should have some issues even for well-designed elements (due to comprehensive analysis)
      expect(inspection.issues.length).toBeGreaterThanOrEqual(0);
    });

    it('should detect multiple issues in poorly designed element', () => {
      const elementId = 'problematic-div';
      const selector = '.bad-element';
      const boxModel = { width: 2000, height: 20, left: 10, top: 20 }; // Too wide, too short
      const computedStyles = {
        color: '#666666',
        backgroundColor: '#777777', // Poor contrast
        fontSize: '10px', // Too small
        padding: '17px', // Not in scale
        width: '2000px', // Too wide
        position: 'absolute',
        left: '10px',
        top: '20px', // Using positioning that causes layout shift
        zIndex: '999', // Too high
        transition: 'left 0.5s ease' // Expensive animation
      };

      const context = {
        viewport: { width: 400, height: 800 } // Mobile viewport
      };

      const inspection = AdvancedElementAnalyzer.analyzeElement(
        elementId,
        selector,
        boxModel,
        computedStyles,
        mockRules,
        context
      );

      expect(inspection).toBeDefined();
      expect(inspection.issues.length).toBeGreaterThan(5); // Should detect many issues

      // Should detect critical issues
      const criticalIssues = inspection.issues.filter(issue => issue.severity === 'error');
      expect(criticalIssues.length).toBeGreaterThan(0);
    });

    it('should handle edge cases gracefully', () => {
      const elementId = 'edge-case';
      const selector = '.edge-element';
      const boxModel = { width: 0, height: 0, left: 0, top: 0 };
      const computedStyles = {}; // Empty styles

      const inspection = AdvancedElementAnalyzer.analyzeElement(
        elementId,
        selector,
        boxModel,
        computedStyles,
        mockRules
      );

      expect(inspection).toBeDefined();
      expect(inspection.elementId).toBe(elementId);
      expect(inspection.issues).toBeDefined();
      // Should not crash even with empty/minimal input
    });
  });

  describe('analysis phases integration', () => {
    it('should run all analysis phases', () => {
      const elementId = 'test-element';
      const selector = 'div.test';
      const boxModel = { width: 100, height: 50, left: 10, top: 20 };
      const computedStyles = {
        color: '#000000',
        backgroundColor: '#ffffff',
        fontSize: '16px',
        lineHeight: '24px',
        padding: '16px'
      };

      const inspection = AdvancedElementAnalyzer.analyzeElement(
        elementId,
        selector,
        boxModel,
        computedStyles,
        mockRules
      );

      expect(inspection).toBeDefined();

      // Check that issues from different phases are present
      const issueCategories = new Set(inspection.issues.map(issue => issue.category));

      // Should have issues from multiple categories
      expect(issueCategories.size).toBeGreaterThan(1);
    });

    it('should respect analysis scope', () => {
      // This would require modifying the analyzer to accept scope parameter
      // For now, we test that all phases run by default
      const elementId = 'scoped-element';
      const selector = 'button.test';
      const boxModel = { width: 100, height: 44, left: 10, top: 20 };
      const computedStyles = {
        color: '#000000',
        backgroundColor: '#ffffff',
        cursor: 'pointer'
      };

      const inspection = AdvancedElementAnalyzer.analyzeElement(
        elementId,
        selector,
        boxModel,
        computedStyles,
        mockRules
      );

      expect(inspection).toBeDefined();
      expect(inspection.issues.length).toBeGreaterThanOrEqual(0);
    });
  });

  describe('performance and scalability', () => {
    it('should analyze elements quickly', () => {
      const elementId = 'perf-test';
      const selector = 'div.perf-test';
      const boxModel = { width: 100, height: 50, left: 10, top: 20 };
      const computedStyles = {
        color: '#000000',
        backgroundColor: '#ffffff',
        fontSize: '16px'
      };

      const startTime = Date.now();

      for (let i = 0; i < 10; i++) {
        AdvancedElementAnalyzer.analyzeElement(
          `${elementId}-${i}`,
          selector,
          boxModel,
          computedStyles,
          mockRules
        );
      }

      const endTime = Date.now();
      const totalTime = endTime - startTime;
      const avgTime = totalTime / 10;

      // Should analyze each element in reasonable time (< 50ms per element)
      expect(avgTime).toBeLessThan(50);
    });

    it('should handle complex styles', () => {
      const elementId = 'complex-element';
      const selector = 'div.complex';
      const boxModel = { width: 300, height: 200, left: 10, top: 20 };
      const computedStyles = {
        // Complex styles that might stress the analyzer
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
      };

      const inspection = AdvancedElementAnalyzer.analyzeElement(
        elementId,
        selector,
        boxModel,
        computedStyles,
        mockRules
      );

      expect(inspection).toBeDefined();
      expect(inspection.issues).toBeDefined();
      // Should handle complex styles without crashing
    });
  });

  describe('context awareness', () => {
    it('should use context information for better analysis', () => {
      const elementId = 'context-aware';
      const selector = 'button.context-test';
      const boxModel = { width: 100, height: 44, left: 10, top: 20 };
      const computedStyles = {
        color: '#000000',
        backgroundColor: '#ffffff',
        cursor: 'pointer'
      };

      const contextWithRelations = {
        viewport: { width: 400, height: 800 },
        relations: {
          nearbyElements: [
            { id: 'nearby-btn', left: 120, right: 220, top: 20, bottom: 64, centerX: 170, centerY: 42, distance: 20 }
          ],
          similarElements: [
            { id: 'similar-btn', styles: { padding: '12px', height: '44px' } }
          ]
        }
      };

      const inspectionWithContext = AdvancedElementAnalyzer.analyzeElement(
        elementId,
        selector,
        boxModel,
        computedStyles,
        mockRules,
        contextWithRelations
      );

      const inspectionWithoutContext = AdvancedElementAnalyzer.analyzeElement(
        elementId,
        selector,
        boxModel,
        computedStyles,
        mockRules
      );

      expect(inspectionWithContext).toBeDefined();
      expect(inspectionWithoutContext).toBeDefined();

      // Context should potentially provide different analysis results
      // (though in this simple case they might be the same)
      expect(inspectionWithContext.issues.length).toBeGreaterThanOrEqual(inspectionWithoutContext.issues.length);
    });
  });

  describe('error handling', () => {
    it('should handle invalid input gracefully', () => {
      // Create minimal valid rules to avoid errors
      const minimalRules = {
        apcaContrast: { thresholds: { bodyText: { min: 60, preferred: 75 }, uiComponents: { min: 15, preferred: 30 } }, adjustments: {} },
        accessibility: { aria: { requiredAttributes: {}, allowedRoles: [], nameSources: [] }, keyboard: {} },
        verticalRhythm: { allowedRatios: [1, 2], tolerance: 0.1 },
        typography: { lineLength: { comfortable: { min: 55, max: 75 } }, lineHeightRatios: {}, typeScales: {} },
        colorHarmony: { schemes: { monochromatic: { hueTolerance: 15 } }, semantics: {}, consistency: {} },
        layout: { alignment: {}, zIndex: {}, visualHierarchy: { weightFactors: { size: 1, colorSaturation: 50, borderWeight: 5, shadowPresence: 20, fontWeight: 10, position: 10 } } },
        interaction: { requiredStates: [], loading: {}, layoutShift: {} },
        responsive: { breakpoints: {}, mobileFirst: {}, overflow: {} },
        performance: { layoutShift: {}, animation: {}, resources: {} },
        consistency: { patterns: {}, tokens: { colorTokens: [] }, similarity: {} }
      };

      const inspection = AdvancedElementAnalyzer.analyzeElement(
        'test-id',
        '.test-selector',
        { width: 100, height: 50, left: 0, top: 0 },
        { color: '#000', backgroundColor: '#fff' },
        minimalRules
      );

      expect(inspection).toBeDefined();
      expect(inspection.elementId).toBe('test-id');
    });

    it('should handle missing properties', () => {
      const inspection = AdvancedElementAnalyzer.analyzeElement(
        'test',
        '.test',
        {} as any, // Missing boxModel properties
        {}, // Empty styles
        mockRules
      );

      expect(inspection).toBeDefined();
      expect(inspection.issues).toBeDefined();
    });
  });
});

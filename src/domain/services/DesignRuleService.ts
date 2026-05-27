import { 
  AdvancedDesignRules, 
  APCAContrastRules, 
  VerticalRhythmRules, 
  AdvancedTypographyRules, 
  ColorHarmonyRules, 
  LayoutAnalysisRules, 
  AdvancedAccessibilityRules, 
  InteractionRules, 
  ConsistencyRules, 
  ResponsiveRules, 
  PerformanceRules 
} from '../../../types/MessageContracts';

export class DesignRuleService {
  public static createAdvancedDesignRules(settings?: any): AdvancedDesignRules {
    const dr = settings?.designRules || {};
    return {
      apcaContrast: {
        thresholds: {
          bodyText: { min: dr.apcaContrast?.thresholds?.bodyText?.min || 75, preferred: 90 },
          headingText: { min: 75, preferred: 90 },
          largeText: { min: 60, preferred: 75 },
          uiComponents: { min: 30, preferred: 45 },
        },
        adjustments: { boldText: 0, italicText: 0, smallText: 0 },
      } as APCAContrastRules,
      verticalRhythm: { 
        baseLineHeight: 1.5, 
        allowedRatios: [1, 2, 3, 4], 
        tolerance: 2, 
        minSpacingDifference: 4, 
        opticalAlignment: { textDescenders: 0, iconPadding: 0, avatarWeight: 0 } 
      } as VerticalRhythmRules,
      typography: {
        lineLength: { narrow: { min: 45, max: 60 }, comfortable: { min: 60, max: 80 }, wide: { min: 80, max: 100 } },
        lineHeightRatios: { small: 1.4, body: 1.5, subheading: 1.2, heading: 1.1, display: 1.0 },
        typeScales: { 'minor-second': 1.067, 'major-second': 1.125, 'minor-third': 1.2, 'major-third': 1.25, 'perfect-fourth': 1.333, 'golden-ratio': 1.618 },
        orphansWidows: { maxOrphanLines: 2, maxWidowLines: 2, minLastLineRatio: 0.3 },
      } as AdvancedTypographyRules,
      colorHarmony: {
        schemes: { monochromatic: { hueTolerance: 10 }, analogous: { hueTolerance: 30 }, complementary: { angle: 180, tolerance: 10 }, triadic: { angle: 120, tolerance: 10 }, splitComplementary: { angle: 150, tolerance: 10 }, tetradic: { angles: [60, 180, 240], tolerance: 10 } },
        semantics: { error: ['#D32F2F'], success: ['#388E3C'], warning: ['#FBC02D'], info: ['#1976D2'], primary: ['#1976D2'], secondary: ['#424242'] },
        consistency: { maxSaturationDeviation: 10, maxLightnessDeviation: 10, requiredSemanticRoles: ['primary', 'error'] },
        colorBlindness: { simulateTypes: ['protanopia'], minimumDifference: 10 },
      } as ColorHarmonyRules,
      layout: {
        alignment: { pixelTolerance: 2, minElementsInLine: 3 },
        zIndex: { scale: 10, maxRecommended: 1000, negativeAllowed: false },
        visualHierarchy: { weightFactors: { size: 0.4, colorSaturation: 0.2, borderWeight: 0.1, shadowPresence: 0.1, fontWeight: 0.1, position: 0.1 }, focalPointThreshold: 0.6, maxFocalPoints: 3 },
        grid: { detectGridSize: true, commonGridSizes: [4, 8, 12, 16, 24], alignmentTolerance: 2 },
      } as LayoutAnalysisRules,
      accessibility: {
        aria: { requiredAttributes: { img: ['alt'] }, allowedRoles: ['button', 'link'], nameSources: ['title'] },
        keyboard: { tabOrderTolerance: 5, focusIndicatorMinSize: 2, skipLinkRequired: false },
        semantics: { requiredLandmarks: ['main'], headingHierarchyMaxSkip: 1, listStructureRequired: true },
        motion: { prefersReducedMotion: false, animationDurationLimits: { min: 0.1, max: 0.5 } },
      } as AdvancedAccessibilityRules,
      interaction: {
        requiredStates: ['hover', 'focus'],
        stateVisibility: { minDifference: 0.1, transitionRequired: true, transitionDuration: { min: 0.1, max: 0.3 } },
        loading: { skeletonRequired: false, layoutShiftTolerance: 0.1, loadingIndicatorRequired: true },
        touch: { minSize: 44, spacing: 8, gestureTolerance: 5 },
      } as InteractionRules,
      consistency: {
        patterns: { card: { paddingScale: [16], borderRadiusScale: [8], shadowRequired: true }, button: { heightScale: [44], widthConstraints: { min: 64 } }, form: { inputHeight: 40, labelSpacing: 8, groupSpacing: 16 } },
        tokens: { spacingTokens: [], colorTokens: [], typographyTokens: [], strictTokenUsage: false },
        similarity: { spacing: 0.9, sizing: 0.9, color: 0.9 },
      } as ConsistencyRules,
      responsive: { breakpoints: { sm: 640, md: 768, lg: 1024, xl: 1280, '2xl': 1536 }, mobileFirst: { preferMinWidth: true, maxWidthAllowed: false }, overflow: { horizontalScrollPenalty: 10, textOverflowHandling: true }, containers: { allowContainerQueries: false, maxContainerWidth: 1440 } } as ResponsiveRules,
      performance: { layoutShift: { imageDimensionsRequired: true, fontLoadingStrategy: 'swap', dynamicContentSpaceReserved: true }, animation: { preferTransform: true, avoidProperties: [], maxDuration: 500 }, resources: { lazyLoadingRecommended: true, preloadCritical: true, compressionRequired: true } } as PerformanceRules,
    };
  }
}

/**
 * Copyright (c) 2025 Pixel Perfect Inspector
 *
 * Author: Pixel Perfect Inspector
 * Available for contact via email: support@b-b.top
 * For up-to-date contact information:
 * https://github.com/bivex
 *
 * Created: 2025-12-22T12:00:00
 * Last Updated: 2025-12-22T11:34:33
 *
 * Licensed under the MIT License.
 * Commercial licensing available upon request.
 */

/**
 * Advanced design rules extending the basic DesignRules with sophisticated analysis algorithms
 */
export interface AdvancedDesignRules {
  /** APCA contrast thresholds for different content types */
  apcaContrast: APCAContrastRules;

  /** Vertical rhythm and spacing harmony rules */
  verticalRhythm: VerticalRhythmRules;

  /** Typography analysis rules */
  typography: AdvancedTypographyRules;

  /** Color harmony and semantic rules */
  colorHarmony: ColorHarmonyRules;

  /** Layout and alignment rules */
  layout: LayoutAnalysisRules;

  /** Accessibility rules beyond basic WCAG */
  accessibility: AdvancedAccessibilityRules;

  /** Interaction and state rules */
  interaction: InteractionRules;

  /** Consistency and design system rules */
  consistency: ConsistencyRules;

  /** Responsive design rules */
  responsive: ResponsiveRules;

  /** Performance optimization rules */
  performance: PerformanceRules;
}

/**
 * APCA (Advanced Perceptual Contrast Algorithm) contrast rules
 */
export interface APCAContrastRules {
  /** Contrast thresholds for different content types */
  thresholds: {
    bodyText: {
      min: number;        // Minimum for readable body text
      preferred: number;  // Preferred for optimal readability
    };
    headingText: {
      min: number;
      preferred: number;
    };
    largeText: {
      min: number;
      preferred: number;
    };
    uiComponents: {
      min: number;        // Borders, icons, focus indicators
      preferred: number;
    };
  };

  /** Contextual adjustments based on font properties */
  adjustments: {
    boldText: number;     // Additional contrast needed for bold text
    italicText: number;   // Additional contrast for italic
    smallText: number;    // Additional contrast for text < 14px
  };
}

/**
 * Vertical rhythm and spacing harmony rules
 */
export interface VerticalRhythmRules {
  /** Base line height for rhythm calculation */
  baseLineHeight: number;

  /** Allowed spacing ratios (powers of base spacing) */
  allowedRatios: number[];

  /** Tolerance for rhythm alignment */
  tolerance: number;

  /** Minimum spacing differences */
  minSpacingDifference: number;

  /** Optical alignment adjustments */
  opticalAlignment: {
    textDescenders: number;    // Adjustment for letters with descenders (g,j,p,q,y)
    iconPadding: number;       // Additional padding for icons
    avatarWeight: number;      // Visual weight adjustment for circular elements
  };
}

/**
 * Advanced typography analysis rules
 */
export interface AdvancedTypographyRules {
  /** Optimal line lengths for different contexts */
  lineLength: {
    narrow: { min: number; max: number; };
    comfortable: { min: number; max: number; };
    wide: { min: number; max: number; };
  };

  /** Line height recommendations by font size */
  lineHeightRatios: {
    small: number;     // < 12px
    body: number;      // 12-16px
    subheading: number; // 17-24px
    heading: number;   // 25-36px
    display: number;   // > 36px
  };

  /** Modular scale ratios */
  typeScales: {
    'minor-second': number;
    'major-second': number;
    'minor-third': number;
    'major-third': number;
    'perfect-fourth': number;
    'golden-ratio': number;
  };

  /** Orphans and widows control */
  orphansWidows: {
    maxOrphanLines: number;
    maxWidowLines: number;
    minLastLineRatio: number; // Minimum ratio of last line to paragraph width
  };
}

/**
 * Color harmony and semantic analysis rules
 */
export interface ColorHarmonyRules {
  /** Color schemes and their angle tolerances */
  schemes: {
    monochromatic: { hueTolerance: number };
    analogous: { hueTolerance: number };
    complementary: { angle: number; tolerance: number };
    triadic: { angle: number; tolerance: number };
    splitComplementary: { angle: number; tolerance: number };
    tetradic: { angles: number[]; tolerance: number };
  };

  /** Semantic color mappings */
  semantics: {
    error: string[];
    success: string[];
    warning: string[];
    info: string[];
    primary: string[];
    secondary: string[];
  };

  /** Saturation and lightness consistency */
  consistency: {
    maxSaturationDeviation: number;
    maxLightnessDeviation: number;
    requiredSemanticRoles: string[];
  };

  /** Color blindness simulation */
  colorBlindness: {
    simulateTypes: ('protanopia' | 'deuteranopia' | 'tritanopia')[];
    minimumDifference: number; // Minimum perceptual difference
  };
}

/**
 * Layout analysis and alignment rules
 */
export interface LayoutAnalysisRules {
  /** Alignment detection tolerances */
  alignment: {
    pixelTolerance: number;     // How close elements need to be to be considered aligned
    minElementsInLine: number;   // Minimum elements to form an alignment line
  };

  /** Z-index management */
  zIndex: {
    scale: number;              // Z-index scale (10, 100, etc.)
    maxRecommended: number;
    negativeAllowed: boolean;
  };

  /** Visual hierarchy analysis */
  visualHierarchy: {
    weightFactors: {
      size: number;
      colorSaturation: number;
      borderWeight: number;
      shadowPresence: number;
      fontWeight: number;
      position: number;         // top > center > bottom
    };
    focalPointThreshold: number;
    maxFocalPoints: number;
  };

  /** Grid and spacing systems */
  grid: {
    detectGridSize: boolean;
    commonGridSizes: number[];
    alignmentTolerance: number;
  };
}

/**
 * Advanced accessibility rules
 */
export interface AdvancedAccessibilityRules {
  /** ARIA validation rules */
  aria: {
    requiredAttributes: Record<string, string[]>;
    allowedRoles: string[];
    nameSources: ('aria-label' | 'aria-labelledby' | 'content' | 'title')[];
  };

  /** Keyboard navigation rules */
  keyboard: {
    tabOrderTolerance: number;     // How much tab order can deviate from visual order
    focusIndicatorMinSize: number;
    skipLinkRequired: boolean;
  };

  /** Semantic structure */
  semantics: {
    requiredLandmarks: string[];
    headingHierarchyMaxSkip: number;
    listStructureRequired: boolean;
  };

  /** Motion and animation */
  motion: {
    prefersReducedMotion: boolean;
    animationDurationLimits: { min: number; max: number };
  };
}

/**
 * Interaction and state analysis rules
 */
export interface InteractionRules {
  /** Required interactive states */
  requiredStates: ('hover' | 'focus' | 'active' | 'disabled')[];

  /** State visibility requirements */
  stateVisibility: {
    minDifference: number;        // Minimum perceptual difference from default
    transitionRequired: boolean;
    transitionDuration: { min: number; max: number };
  };

  /** Loading states */
  loading: {
    skeletonRequired: boolean;
    layoutShiftTolerance: number;
    loadingIndicatorRequired: boolean;
  };

  /** Touch and gesture targets */
  touch: {
    minSize: number;
    spacing: number;              // Minimum spacing between touch targets
    gestureTolerance: number;
  };
}

/**
 * Design system consistency rules
 */
export interface ConsistencyRules {
  /** Component pattern detection */
  patterns: {
    card: {
      paddingScale: number[];
      borderRadiusScale: number[];
      shadowRequired: boolean;
    };
    button: {
      heightScale: number[];
      widthConstraints: { min: number; max?: number };
    };
    form: {
      inputHeight: number;
      labelSpacing: number;
      groupSpacing: number;
    };
  };

  /** Design token validation */
  tokens: {
    spacingTokens: string[];
    colorTokens: string[];
    typographyTokens: string[];
    strictTokenUsage: boolean;
  };

  /** Similarity thresholds for grouping */
  similarity: {
    spacing: number;              // How similar spacing must be to be considered consistent
    sizing: number;
    color: number;
  };
}

/**
 * Responsive design analysis rules
 */
export interface ResponsiveRules {
  /** Standard breakpoints */
  breakpoints: {
    sm: number;
    md: number;
    lg: number;
    xl: number;
    '2xl': number;
  };

  /** Mobile-first validation */
  mobileFirst: {
    preferMinWidth: boolean;
    maxWidthAllowed: boolean;
  };

  /** Content overflow detection */
  overflow: {
    horizontalScrollPenalty: number;
    textOverflowHandling: boolean;
  };

  /** Viewport and container queries */
  containers: {
    allowContainerQueries: boolean;
    maxContainerWidth: number;
  };
}

/**
 * Performance optimization rules
 */
export interface PerformanceRules {
  /** Layout shift prevention */
  layoutShift: {
    imageDimensionsRequired: boolean;
    fontLoadingStrategy: 'swap' | 'optional' | 'block';
    dynamicContentSpaceReserved: boolean;
  };

  /** Animation performance */
  animation: {
    preferTransform: boolean;
    avoidProperties: string[];
    maxDuration: number;
  };

  /** Resource loading */
  resources: {
    lazyLoadingRecommended: boolean;
    preloadCritical: boolean;
    compressionRequired: boolean;
  };
}
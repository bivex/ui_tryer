/**
 * Copyright (c) 2025 Pixel Perfect Inspector
 *
 * Author: Pixel Perfect Inspector
 * Available for contact via email: support@b-b.top
 * For up-to-date contact information:
 * https://github.com/bivex
 *
 * Created: 2025-12-22T07:27:51
 * Last Updated: 2025-12-22T08:32:19
 *
 * Licensed under the MIT License.
 * Commercial licensing available upon request.
 */

/**
 * Domain entity representing Tailwind CSS design system rules and constraints
 * Used for validating UI elements against established Tailwind design guidelines
 */
export interface DesignRules {
  /** Tailwind spacing scale - all allowed spacing values in px */
  spacingScale: TailwindSpacingScale;

  /** Spacing grid for alignment (0.25rem increments) */
  spacingGrid: number[];

  /** Minimum size for clickable elements (44px for accessibility) */
  minClickableSize: number;

  /** Tailwind color palette */
  colorPalette: TailwindColorPalette;

  /** Tailwind responsive breakpoints */
  breakpoints: TailwindBreakpoint[];

  /** Typography scale following Tailwind conventions */
  typographyScale: TailwindTypographyScale;

  /** Component constraints following Tailwind patterns */
  componentConstraints: TailwindComponentConstraints;

  /** Border radius scale */
  borderRadiusScale: TailwindBorderRadiusScale;

  /** Shadow scale */
  shadowScale: TailwindShadowScale;

  /** Essential design rules (must-have) */
  essentialRules: EssentialDesignRules;
}

/**
 * Tailwind spacing scale (0.25rem = 4px increments)
 */
export interface TailwindSpacingScale {
  // Spacing tokens (0.25rem = 4px)
  px: number;      // 1px
  '0': number;     // 0px
  '0.5': number;   // 2px
  '1': number;     // 4px
  '1.5': number;   // 6px
  '2': number;     // 8px
  '2.5': number;   // 10px
  '3': number;     // 12px
  '3.5': number;   // 14px
  '4': number;     // 16px
  '5': number;     // 20px
  '6': number;     // 24px
  '7': number;     // 28px
  '8': number;     // 32px
  '9': number;     // 36px
  '10': number;    // 40px
  '11': number;    // 44px
  '12': number;    // 48px
  '14': number;    // 56px
  '16': number;    // 64px
  '20': number;    // 80px
  '24': number;    // 96px
  '28': number;    // 112px
  '32': number;    // 128px
  '36': number;    // 144px
  '40': number;    // 160px
  '44': number;    // 176px
  '48': number;    // 192px
  '52': number;    // 208px
  '56': number;    // 224px
  '60': number;    // 240px
  '64': number;    // 256px
  '72': number;    // 288px
  '80': number;    // 320px
  '96': number;    // 384px
}

/**
 * Tailwind responsive breakpoint definition
 */
export interface TailwindBreakpoint {
  /** Tailwind breakpoint name (sm, md, lg, xl, 2xl) */
  name: 'sm' | 'md' | 'lg' | 'xl' | '2xl';

  /** Human-readable label */
  label: string;

  /** Minimum width in pixels */
  minWidth: number;

  /** Example device */
  device: 'mobile' | 'tablet' | 'desktop' | 'large-desktop';

  /** Tailwind container max-width */
  containerMaxWidth?: number;
}

/**
 * Tailwind typography scale
 */
export interface TailwindTypographyScale {
  /** Font size scale (text-*) */
  fontSize: {
    'xs': number;      // 12px
    'sm': number;      // 14px
    'base': number;    // 16px
    'lg': number;      // 18px
    'xl': number;      // 20px
    '2xl': number;     // 24px
    '3xl': number;     // 30px
    '4xl': number;     // 36px
    '5xl': number;     // 48px
    '6xl': number;     // 60px
    '7xl': number;     // 72px
    '8xl': number;     // 96px
    '9xl': number;     // 128px
  };

  /** Line height scale (leading-*) */
  lineHeight: {
    'tight': number;   // 1.25
    'snug': number;    // 1.375
    'normal': number;  // 1.5
    'relaxed': number; // 1.625
    'loose': number;   // 2
  };

  /** Font weight scale */
  fontWeight: {
    'thin': number;    // 100
    'extralight': number; // 200
    'light': number;   // 300
    'normal': number;  // 400
    'medium': number;  // 500
    'semibold': number; // 600
    'bold': number;    // 700
    'extrabold': number; // 800
    'black': number;   // 900
  };

  /** Minimum readable font size for mobile */
  minMobileSize: number;

  /** Minimum contrast ratio */
  minContrastRatio: number;
}

/**
 * Tailwind color palette
 */
export interface TailwindColorPalette {
  /** Neutral grays */
  slate: { [key: string]: string };
  gray: { [key: string]: string };
  zinc: { [key: string]: string };
  neutral: { [key: string]: string };
  stone: { [key: string]: string };

  /** Brand colors */
  red: { [key: string]: string };
  orange: { [key: string]: string };
  amber: { [key: string]: string };
  yellow: { [key: string]: string };
  lime: { [key: string]: string };
  green: { [key: string]: string };
  emerald: { [key: string]: string };
  teal: { [key: string]: string };
  cyan: { [key: string]: string };
  sky: { [key: string]: string };
  blue: { [key: string]: string };
  indigo: { [key: string]: string };
  violet: { [key: string]: string };
  purple: { [key: string]: string };
  fuchsia: { [key: string]: string };
  pink: { [key: string]: string };
  rose: { [key: string]: string };

  /** Semantic colors */
  white: string;
  black: string;
}

/**
 * Tailwind border radius scale
 */
export interface TailwindBorderRadiusScale {
  none: number;     // 0px
  sm: number;       // 2px
  default: number;  // 4px
  md: number;       // 6px
  lg: number;       // 8px
  xl: number;       // 12px
  '2xl': number;    // 16px
  '3xl': number;    // 24px
  full: number;     // 9999px
}

/**
 * Tailwind shadow scale
 */
export interface TailwindShadowScale {
  sm: string;
  default: string;
  md: string;
  lg: string;
  xl: string;
  '2xl': string;
  inner: string;
  none: string;
}

/**
 * Essential design rules that are must-have for modern web interfaces
 */
export interface EssentialDesignRules {
  /** Accessibility requirements */
  accessibility: {
    /** WCAG contrast ratios */
    contrastRatios: {
      aa: {
        normal: number;  // 4.5:1
        large: number;   // 3:1
      };
      aaa: {
        normal: number;  // 7:1
        large: number;   // 4.5:1
      };
    };
    /** Minimum touch target size */
    minTouchTarget: number; // 44px
    /** Minimum focus indicator width */
    minFocusWidth: number; // 2px
    /** Skip link requirements */
    skipLinks: boolean;
  };

  /** Typography essentials */
  typography: {
    /** Maximum line length (characters) */
    maxLineLength: number; // 80-100 characters
    /** Optimal line height ratios */
    lineHeightRatios: {
      headings: number; // 1.2
      body: number;     // 1.5
      captions: number; // 1.4
    };
    /** Heading hierarchy validation */
    requireHeadingHierarchy: boolean;
    /** Maximum heading levels */
    maxHeadingLevels: number; // 6
  };

  /** Layout and spacing essentials */
  layout: {
    /** Container max widths */
    containerMaxWidths: {
      sm: number;   // 640px
      md: number;   // 768px
      lg: number;   // 1024px
      xl: number;   // 1280px
      '2xl': number; // 1536px
    };
    /** Minimum whitespace requirements */
    minWhitespace: {
      betweenSections: number; // 48px
      aroundContent: number;    // 24px
      betweenElements: number;  // 16px
    };
    /** Grid requirements */
    grid: {
      columns: number; // 12
      gutter: number;  // 24px
      margin: number;  // 16px
    };
  };

  /** Color and contrast essentials */
  color: {
    /** Prohibited color combinations */
    prohibitedCombinations: Array<{
      foreground: string;
      background: string;
      reason: string;
    }>;
    /** Required color roles */
    requiredRoles: {
      primary: boolean;
      secondary: boolean;
      success: boolean;
      warning: boolean;
      error: boolean;
      info: boolean;
    };
  };

  /** Interaction essentials */
  interaction: {
    /** Hover state requirements */
    requireHoverStates: boolean;
    /** Focus indicator requirements */
    requireFocusIndicators: boolean;
    /** Loading state requirements */
    requireLoadingStates: boolean;
    /** Animation duration limits */
    animationLimits: {
      min: number; // 150ms
      max: number; // 300ms
    };
    /** Debounce requirements for inputs */
    inputDebounce: number; // 300ms
  };

  /** Mobile-first essentials */
  mobile: {
    /** Mobile viewport requirements */
    viewportMeta: boolean;
    /** Touch gesture support */
    touchGestures: boolean;
    /** Swipe gesture requirements */
    swipeGestures: {
      horizontal: boolean;
      vertical: boolean;
    };
    /** Pull-to-refresh support */
    pullToRefresh: boolean;
  };

  /** Performance essentials */
  performance: {
    /** Maximum image size */
    maxImageSize: {
      width: number;  // 1920px
      height: number; // 1080px
    };
    /** Lazy loading requirements */
    lazyLoading: boolean;
    /** Critical CSS requirements */
    criticalCss: boolean;
    /** Bundle size limits */
    bundleSizeLimit: number; // 200KB
  };

  /** Content essentials */
  content: {
    /** Alt text requirements */
    requireAltText: boolean;
    /** Language declaration */
    requireLangAttribute: boolean;
    /** Semantic HTML requirements */
    semanticHtml: boolean;
    /** Content hierarchy */
    contentHierarchy: boolean;
  };
}

/**
 * Tailwind component constraints
 */
export interface TailwindComponentConstraints {
  /** Button constraints */
  button: {
    minHeight: {
      sm: number;  // 32px
      default: number; // 40px
      lg: number; // 48px
    };
    minWidth: number; // 80px
    paddingX: {
      sm: number; // 12px
      default: number; // 16px
      lg: number; // 24px
    };
  };

  /** Input field constraints */
  input: {
    minHeight: {
      sm: number; // 32px
      default: number; // 40px
      lg: number; // 48px
    };
    paddingX: number; // 12px
    paddingY: number; // 8px
  };

  /** Card component constraints */
  card: {
    padding: number; // 24px
    borderRadius: number; // 8px
  };

  /** Icon constraints */
  icon: {
    sizes: {
      xs: number; // 12px
      sm: number; // 16px
      default: number; // 20px
      lg: number; // 24px
      xl: number; // 32px
      '2xl': number; // 48px
    };
  };
}

/**
 * Factory for creating Tailwind CSS DesignRules instances
 */
export class DesignRulesFactory {
  static createDefault(): DesignRules {
    return {
      spacingScale: {
        px: 1, '0': 0, '0.5': 2, '1': 4, '1.5': 6, '2': 8, '2.5': 10, '3': 12, '3.5': 14, '4': 16,
        '5': 20, '6': 24, '7': 28, '8': 32, '9': 36, '10': 40, '11': 44, '12': 48, '14': 56, '16': 64,
        '20': 80, '24': 96, '28': 112, '32': 128, '36': 144, '40': 160, '44': 176, '48': 192, '52': 208,
        '56': 224, '60': 240, '64': 256, '72': 288, '80': 320, '96': 384
      },
      spacingGrid: [
        0, 1, 2, 4, 6, 8, 10, 12, 14, 16, 20, 24, 28, 32, 36, 40, 44, 48, 56, 64, 80, 96, 112, 128,
        144, 160, 176, 192, 208, 224, 240, 256, 288, 320, 384
      ],
      minClickableSize: 44,
      colorPalette: this.createTailwindColorPalette(),
      breakpoints: [
        { name: 'sm', label: 'Small (640px+)', minWidth: 640, device: 'tablet', containerMaxWidth: 640 },
        { name: 'md', label: 'Medium (768px+)', minWidth: 768, device: 'tablet', containerMaxWidth: 768 },
        { name: 'lg', label: 'Large (1024px+)', minWidth: 1024, device: 'desktop', containerMaxWidth: 1024 },
        { name: 'xl', label: 'Extra Large (1280px+)', minWidth: 1280, device: 'desktop', containerMaxWidth: 1280 },
        { name: '2xl', label: '2X Large (1536px+)', minWidth: 1536, device: 'large-desktop', containerMaxWidth: 1536 },
      ],
      typographyScale: {
        fontSize: {
          'xs': 12, 'sm': 14, 'base': 16, 'lg': 18, 'xl': 20, '2xl': 24, '3xl': 30, '4xl': 36,
          '5xl': 48, '6xl': 60, '7xl': 72, '8xl': 96, '9xl': 128
        },
        lineHeight: {
          'tight': 1.25, 'snug': 1.375, 'normal': 1.5, 'relaxed': 1.625, 'loose': 2
        },
        fontWeight: {
          'thin': 100, 'extralight': 200, 'light': 300, 'normal': 400, 'medium': 500,
          'semibold': 600, 'bold': 700, 'extrabold': 800, 'black': 900
        },
        minMobileSize: 14,
        minContrastRatio: 4.5,
      },
      borderRadiusScale: {
        none: 0, sm: 2, default: 4, md: 6, lg: 8, xl: 12, '2xl': 16, '3xl': 24, full: 9999
      },
      shadowScale: {
        sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
        default: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
        md: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
        lg: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
        xl: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
        '2xl': '0 25px 50px -12px rgb(0 0 0 / 0.25)',
        inner: 'inset 0 2px 4px 0 rgb(0 0 0 / 0.05)',
        none: '0 0 #0000'
      },
      componentConstraints: {
        button: {
          minHeight: { sm: 32, default: 40, lg: 48 },
          minWidth: 80,
          paddingX: { sm: 12, default: 16, lg: 24 }
        },
        input: {
          minHeight: { sm: 32, default: 40, lg: 48 },
          paddingX: 12,
          paddingY: 8
        },
        card: {
          padding: 24,
          borderRadius: 8
        },
        icon: {
          sizes: { xs: 12, sm: 16, default: 20, lg: 24, xl: 32, '2xl': 48 }
        },
      },
      essentialRules: {
        accessibility: {
          contrastRatios: {
            aa: { normal: 4.5, large: 3.0 },
            aaa: { normal: 7.0, large: 4.5 }
          },
          minTouchTarget: 44,
          minFocusWidth: 2,
          skipLinks: true
        },
        typography: {
          maxLineLength: 80,
          lineHeightRatios: {
            headings: 1.2,
            body: 1.5,
            captions: 1.4
          },
          requireHeadingHierarchy: true,
          maxHeadingLevels: 6
        },
        layout: {
          containerMaxWidths: {
            sm: 640,
            md: 768,
            lg: 1024,
            xl: 1280,
            '2xl': 1536
          },
          minWhitespace: {
            betweenSections: 48,
            aroundContent: 24,
            betweenElements: 16
          },
          grid: {
            columns: 12,
            gutter: 24,
            margin: 16
          }
        },
        color: {
          prohibitedCombinations: [
            {
              foreground: '#ffffff',
              background: '#ffffff',
              reason: 'White on white - invisible text'
            },
            {
              foreground: '#000000',
              background: '#000000',
              reason: 'Black on black - invisible text'
            }
          ],
          requiredRoles: {
            primary: true,
            secondary: true,
            success: true,
            warning: true,
            error: true,
            info: true
          }
        },
        interaction: {
          requireHoverStates: true,
          requireFocusIndicators: true,
          requireLoadingStates: true,
          animationLimits: {
            min: 150,
            max: 300
          },
          inputDebounce: 300
        },
        mobile: {
          viewportMeta: true,
          touchGestures: true,
          swipeGestures: {
            horizontal: true,
            vertical: false
          },
          pullToRefresh: false
        },
        performance: {
          maxImageSize: {
            width: 1920,
            height: 1080
          },
          lazyLoading: true,
          criticalCss: true,
          bundleSizeLimit: 204800 // 200KB
        },
        content: {
          requireAltText: true,
          requireLangAttribute: true,
          semanticHtml: true,
          contentHierarchy: true
        }
      }
    };
  }

  /**
   * Creates the complete Tailwind color palette
   */
  private static createTailwindColorPalette(): TailwindColorPalette {
    return {
      slate: {
        50: '#f8fafc', 100: '#f1f5f9', 200: '#e2e8f0', 300: '#cbd5e1', 400: '#94a3b8', 500: '#64748b',
        600: '#475569', 700: '#334155', 800: '#1e293b', 900: '#0f172a', 950: '#020617'
      },
      gray: {
        50: '#f9fafb', 100: '#f3f4f6', 200: '#e5e7eb', 300: '#d1d5db', 400: '#9ca3af', 500: '#6b7280',
        600: '#4b5563', 700: '#374151', 800: '#1f2937', 900: '#111827', 950: '#030712'
      },
      zinc: {
        50: '#fafafa', 100: '#f4f4f5', 200: '#e4e4e7', 300: '#d4d4d8', 400: '#a1a1aa', 500: '#71717a',
        600: '#52525b', 700: '#3f3f46', 800: '#27272a', 900: '#18181b', 950: '#09090b'
      },
      neutral: {
        50: '#fafafa', 100: '#f5f5f5', 200: '#e5e5e5', 300: '#d4d4d4', 400: '#a3a3a3', 500: '#737373',
        600: '#525252', 700: '#404040', 800: '#262626', 900: '#171717', 950: '#0a0a0a'
      },
      stone: {
        50: '#fafaf9', 100: '#f5f5f4', 200: '#e7e5e4', 300: '#d6d3d1', 400: '#a8a29e', 500: '#78716c',
        600: '#57534e', 700: '#44403c', 800: '#292524', 900: '#1c1917', 950: '#0c0a09'
      },
      red: {
        50: '#fef2f2', 100: '#fee2e2', 200: '#fecaca', 300: '#fca5a5', 400: '#f87171', 500: '#ef4444',
        600: '#dc2626', 700: '#b91c1c', 800: '#991b1b', 900: '#7f1d1d', 950: '#450a0a'
      },
      orange: {
        50: '#fff7ed', 100: '#ffedd5', 200: '#fed7aa', 300: '#fdba74', 400: '#fb923c', 500: '#f97316',
        600: '#ea580c', 700: '#c2410c', 800: '#9a3412', 900: '#7c2d12', 950: '#431407'
      },
      amber: {
        50: '#fffbeb', 100: '#fef3c7', 200: '#fde68a', 300: '#fcd34d', 400: '#fbbf24', 500: '#f59e0b',
        600: '#d97706', 700: '#b45309', 800: '#92400e', 900: '#78350f', 950: '#451a03'
      },
      yellow: {
        50: '#fefce8', 100: '#fef9c3', 200: '#fef08a', 300: '#fde047', 400: '#facc15', 500: '#eab308',
        600: '#ca8a04', 700: '#a16207', 800: '#854d0e', 900: '#713f12', 950: '#422006'
      },
      lime: {
        50: '#f7fee7', 100: '#ecfccb', 200: '#d9f99d', 300: '#bef264', 400: '#a3e635', 500: '#84cc16',
        600: '#65a30d', 700: '#4d7c0f', 800: '#3f6212', 900: '#365314', 950: '#1a2e05'
      },
      green: {
        50: '#f0fdf4', 100: '#dcfce7', 200: '#bbf7d0', 300: '#86efac', 400: '#4ade80', 500: '#22c55e',
        600: '#16a34a', 700: '#15803d', 800: '#166534', 900: '#14532d', 950: '#052e16'
      },
      emerald: {
        50: '#ecfdf5', 100: '#d1fae5', 200: '#a7f3d0', 300: '#6ee7b7', 400: '#34d399', 500: '#10b981',
        600: '#059669', 700: '#047857', 800: '#065f46', 900: '#064e3b', 950: '#022c22'
      },
      teal: {
        50: '#f0fdfa', 100: '#ccfbf1', 200: '#99f6e4', 300: '#5eead4', 400: '#2dd4bf', 500: '#14b8a6',
        600: '#0d9488', 700: '#0f766e', 800: '#115e59', 900: '#134e4a', 950: '#042f2e'
      },
      cyan: {
        50: '#ecfeff', 100: '#cffafe', 200: '#a5f3fc', 300: '#67e8f9', 400: '#22d3ee', 500: '#06b6d4',
        600: '#0891b2', 700: '#0e7490', 800: '#155e75', 900: '#164e63', 950: '#083344'
      },
      sky: {
        50: '#f0f9ff', 100: '#e0f2fe', 200: '#bae6fd', 300: '#7dd3fc', 400: '#38bdf8', 500: '#0ea5e9',
        600: '#0284c7', 700: '#0369a1', 800: '#075985', 900: '#0c4a6e', 950: '#082f49'
      },
      blue: {
        50: '#eff6ff', 100: '#dbeafe', 200: '#bfdbfe', 300: '#93c5fd', 400: '#60a5fa', 500: '#3b82f6',
        600: '#2563eb', 700: '#1d4ed8', 800: '#1e40af', 900: '#1e3a8a', 950: '#172554'
      },
      indigo: {
        50: '#eef2ff', 100: '#e0e7ff', 200: '#c7d2fe', 300: '#a5b4fc', 400: '#818cf8', 500: '#6366f1',
        600: '#4f46e5', 700: '#4338ca', 800: '#3730a3', 900: '#312e81', 950: '#1e1b4b'
      },
      violet: {
        50: '#f5f3ff', 100: '#ede9fe', 200: '#ddd6fe', 300: '#c4b5fd', 400: '#a78bfa', 500: '#8b5cf6',
        600: '#7c3aed', 700: '#6d28d9', 800: '#5b21b6', 900: '#4c1d95', 950: '#2e1065'
      },
      purple: {
        50: '#faf5ff', 100: '#f3e8ff', 200: '#e9d5ff', 300: '#d8b4fe', 400: '#c084fc', 500: '#a855f7',
        600: '#9333ea', 700: '#7c3aed', 800: '#6b21a8', 900: '#581c87', 950: '#3b0764'
      },
      fuchsia: {
        50: '#fdf4ff', 100: '#fae8ff', 200: '#f5d0fe', 300: '#f0abfc', 400: '#e879f9', 500: '#d946ef',
        600: '#c026d3', 700: '#a21caf', 800: '#86198f', 900: '#701a75', 950: '#4a044e'
      },
      pink: {
        50: '#fdf2f8', 100: '#fce7f3', 200: '#fbcfe8', 300: '#f9a8d4', 400: '#f472b6', 500: '#ec4899',
        600: '#db2777', 700: '#be185d', 800: '#9d174d', 900: '#831843', 950: '#500724'
      },
      rose: {
        50: '#fff1f2', 100: '#ffe4e6', 200: '#fecdd3', 300: '#fda4af', 400: '#fb7185', 500: '#f43f5e',
        600: '#e11d48', 700: '#be123c', 800: '#9f1239', 900: '#881337', 950: '#4c0519'
      },
      white: '#ffffff',
      black: '#000000'
    };
  }

  static createFromConfig(config: Partial<DesignRules>): DesignRules {
    return {
      ...this.createDefault(),
      ...config,
    };
  }

  /**
   * Validates if a spacing value is on the allowed grid
   */
  static isSpacingOnGrid(rules: DesignRules, value: number): boolean {
    return rules.spacingGrid.includes(value);
  }

  /**
   * Gets the closest allowed spacing value
   */
  static getClosestSpacing(rules: DesignRules, value: number): number {
    return rules.spacingGrid.reduce((prev, curr) =>
      Math.abs(curr - value) < Math.abs(prev - value) ? curr : prev
    );
  }

  /**
   * Checks if a breakpoint is active for given viewport size
   */
  static getActiveBreakpoint(rules: DesignRules, viewportWidth: number): TailwindBreakpoint | null {
    return rules.breakpoints.find(bp => viewportWidth >= bp.minWidth) || null;
  }

  /**
   * Gets the Tailwind spacing class name for a pixel value
   */
  static getTailwindSpacingClass(rules: DesignRules, pixels: number): string {
    const closest = this.getClosestSpacing(rules, pixels);
    const spacingKey = Object.keys(rules.spacingScale).find(key => rules.spacingScale[key as keyof TailwindSpacingScale] === closest);
    return spacingKey || '4';
  }

  /**
   * Validates if a color is in the Tailwind palette
   */
  static isValidTailwindColor(rules: DesignRules, color: string): boolean {
    // Check if color exists in any of the color palettes
    for (const colorGroup of Object.values(rules.colorPalette)) {
      if (typeof colorGroup === 'string') {
        if (colorGroup === color) return true;
      } else if (Object.values(colorGroup).includes(color)) {
        return true;
      }
    }
    return false;
  }

  /**
   * Gets the closest Tailwind font size
   */
  static getClosestFontSize(rules: DesignRules, pixels: number): { size: number; className: string } {
    const sizes = Object.entries(rules.typographyScale.fontSize);
    const closest = sizes.reduce((prev, curr) =>
      Math.abs(curr[1] - pixels) < Math.abs(prev[1] - pixels) ? curr : prev
    );

    return { size: closest[1], className: closest[0] };
  }

  /**
   * Validates component sizing against Tailwind constraints
   */
  static validateComponentSize(rules: DesignRules, component: 'button' | 'input' | 'card' | 'icon', width: number, height: number): boolean {
    const constraints = rules.componentConstraints[component];

    if (component === 'button') {
      const buttonConstraints = constraints as any;
      return width >= buttonConstraints.minWidth && height >= buttonConstraints.minHeight.default;
    }

    if (component === 'input') {
      const inputConstraints = constraints as any;
      return height >= inputConstraints.minHeight.default;
    }

    if (component === 'icon') {
      const iconConstraints = constraints as any;
      return Object.values(iconConstraints.sizes).includes(Math.min(width, height));
    }

    return true; // Card has no strict size constraints
  }

  /**
   * Validates contrast ratio against WCAG standards
   */
  static validateContrastRatio(rules: DesignRules, ratio: number, isLargeText: boolean = false): 'aa' | 'aaa' | 'fail' {
    const { aa, aaa } = rules.essentialRules.accessibility.contrastRatios;

    if (ratio >= aaa.normal && !isLargeText) return 'aaa';
    if (ratio >= aaa.large && isLargeText) return 'aaa';
    if (ratio >= aa.normal && !isLargeText) return 'aa';
    if (ratio >= aa.large && isLargeText) return 'aa';

    return 'fail';
  }

  /**
   * Checks if element meets touch target requirements
   */
  static validateTouchTarget(rules: DesignRules, width: number, height: number): boolean {
    const minSize = rules.essentialRules.accessibility.minTouchTarget;
    return Math.min(width, height) >= minSize;
  }

  /**
   * Validates line length against readability standards
   */
  static validateLineLength(rules: DesignRules, lineLength: number): boolean {
    return lineLength <= rules.essentialRules.typography.maxLineLength;
  }

  /**
   * Gets recommended line height for text type
   */
  static getRecommendedLineHeight(rules: DesignRules, textType: 'headings' | 'body' | 'captions'): number {
    return rules.essentialRules.typography.lineHeightRatios[textType];
  }

  /**
   * Validates container width against responsive breakpoints
   */
  static validateContainerWidth(rules: DesignRules, width: number, breakpoint: string): boolean {
    const maxWidths = rules.essentialRules.layout.containerMaxWidths;
    const breakpointMaxWidth = maxWidths[breakpoint as keyof typeof maxWidths];

    if (!breakpointMaxWidth) return true; // Unknown breakpoint, allow any width
    return width <= breakpointMaxWidth;
  }

  /**
   * Checks if color combination is prohibited
   */
  static isProhibitedColorCombination(rules: DesignRules, foreground: string, background: string): string | null {
    const combination = rules.essentialRules.color.prohibitedCombinations.find(
      combo => combo.foreground === foreground && combo.background === background
    );

    return combination ? combination.reason : null;
  }

  /**
   * Validates animation duration
   */
  static validateAnimationDuration(rules: DesignRules, duration: number): boolean {
    const { min, max } = rules.essentialRules.interaction.animationLimits;
    return duration >= min && duration <= max;
  }

  /**
   * Gets performance recommendations
   */
  static getPerformanceRecommendations(rules: DesignRules): string[] {
    const recommendations: string[] = [];

    if (rules.essentialRules.performance.lazyLoading) {
      recommendations.push('Implement lazy loading for images below the fold');
    }

    if (rules.essentialRules.performance.criticalCss) {
      recommendations.push('Extract and inline critical CSS');
    }

    return recommendations;
  }
}

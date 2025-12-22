/**
 * Copyright (c) 2025 Pixel Perfect Inspector
 *
 * Author: Pixel Perfect Inspector
 * Available for contact via email: support@b-b.top
 * For up-to-date contact information:
 * https://github.com/bivex
 *
 * Created: 2025-12-22T07:27:51
 * Last Updated: 2025-12-22T07:46:23
 *
 * Licensed under the MIT License.
 * Commercial licensing available upon request.
 */

/**
 * Domain entity representing design system rules and constraints
 * Used for validating UI elements against established design guidelines
 */
export interface DesignRules {
  /** Spacing scale - allowed spacing values */
  spacingScale: SpacingScale;

  /** Grid system for alignment */
  spacingGrid: number[];

  /** Minimum size for clickable elements */
  minClickableSize: number;

  /** Allowed color palette */
  colorPalette: string[];

  /** Responsive breakpoints */
  breakpoints: Breakpoint[];

  /** Typography scale */
  typographyScale: TypographyScale;

  /** Component size constraints */
  componentConstraints: ComponentConstraints;
}

/**
 * Spacing scale with semantic names
 */
export interface SpacingScale {
  xs: number;  // 4px
  sm: number;  // 8px
  md: number;  // 16px
  lg: number;  // 24px
  xl: number;  // 32px
  xxl: number; // 48px
}

/**
 * Responsive breakpoint definition
 */
export interface Breakpoint {
  /** Human-readable name */
  name: string;

  /** Viewport width */
  width: number;

  /** Viewport height */
  height: number;

  /** Device category */
  device: 'mobile' | 'tablet' | 'desktop';

  /** Minimum width for this breakpoint */
  minWidth?: number;

  /** Maximum width for this breakpoint */
  maxWidth?: number;
}

/**
 * Typography scale definitions
 */
export interface TypographyScale {
  /** Body text sizes */
  body: {
    xs: number;
    sm: number;
    md: number;
    lg: number;
  };

  /** Heading sizes */
  heading: {
    h1: number;
    h2: number;
    h3: number;
    h4: number;
    h5: number;
    h6: number;
  };

  /** Minimum readable font size for mobile */
  minMobileSize: number;

  /** Minimum contrast ratio */
  minContrastRatio: number;
}

/**
 * Component size constraints
 */
export interface ComponentConstraints {
  /** Button minimum sizes */
  button: {
    minWidth: number;
    minHeight: number;
  };

  /** Input field constraints */
  input: {
    minHeight: number;
    minWidth: number;
  };

  /** Card component constraints */
  card: {
    minPadding: number;
    maxWidth?: number;
  };

  /** Icon constraints */
  icon: {
    minSize: number;
    standardSizes: number[];
  };
}

/**
 * Factory for creating DesignRules instances
 */
export class DesignRulesFactory {
  static createDefault(): DesignRules {
    return {
      spacingScale: {
        xs: 4,
        sm: 8,
        md: 16,
        lg: 24,
        xl: 32,
        xxl: 48,
      },
      spacingGrid: [4, 8, 12, 16, 20, 24, 32, 40, 48, 56, 64, 72, 80, 96],
      minClickableSize: 44,
      colorPalette: [
        '#000000', '#ffffff', '#f8f9fa', '#e9ecef', '#dee2e6', '#ced4da', '#adb5bd', '#6c757d', '#495057', '#343a40', '#212529',
        '#007bff', '#0056b3', '#004085', '#28a745', '#1e7e34', '#155724', '#dc3545', '#bd2130', '#721c24',
        '#ffc107', '#e0a800', '#d39e00', '#6f42c1', '#e83e8c', '#fd7e14', '#20c997', '#17a2b8', '#6c757d'
      ],
      breakpoints: [
        { name: 'Mobile S', width: 320, height: 568, device: 'mobile', maxWidth: 375 },
        { name: 'Mobile M', width: 375, height: 667, device: 'mobile', minWidth: 375, maxWidth: 414 },
        { name: 'Mobile L', width: 414, height: 896, device: 'mobile', minWidth: 414, maxWidth: 768 },
        { name: 'Tablet', width: 768, height: 1024, device: 'tablet', minWidth: 768, maxWidth: 1024 },
        { name: 'Desktop S', width: 1024, height: 768, device: 'desktop', minWidth: 1024, maxWidth: 1440 },
        { name: 'Desktop M', width: 1440, height: 900, device: 'desktop', minWidth: 1440, maxWidth: 1920 },
        { name: 'Desktop L', width: 1920, height: 1080, device: 'desktop', minWidth: 1920 },
      ],
      typographyScale: {
        body: {
          xs: 12,
          sm: 14,
          md: 16,
          lg: 18,
        },
        heading: {
          h1: 32,
          h2: 24,
          h3: 20,
          h4: 18,
          h5: 16,
          h6: 14,
        },
        minMobileSize: 14,
        minContrastRatio: 4.5,
      },
      componentConstraints: {
        button: {
          minWidth: 64,
          minHeight: 36,
        },
        input: {
          minHeight: 40,
          minWidth: 200,
        },
        card: {
          minPadding: 16,
        },
        icon: {
          minSize: 16,
          standardSizes: [16, 20, 24, 32, 48],
        },
      },
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
  static getActiveBreakpoint(rules: DesignRules, viewportWidth: number): Breakpoint | null {
    return rules.breakpoints.find(bp =>
      (!bp.minWidth || viewportWidth >= bp.minWidth) &&
      (!bp.maxWidth || viewportWidth <= bp.maxWidth)
    ) || null;
  }
}

/**
 * Copyright (c) 2025 Pixel Perfect Inspector
 *
 * Author: Pixel Perfect Inspector
 * Available for contact via email: support@b-b.top
 * For up-to-date contact information:
 * https://github.com/bivex
 *
 * Created: 2025-12-22T13:15:00
 * Last Updated: 2025-12-22T11:34:34
 *
 * Licensed under the MIT License.
 * Commercial licensing available upon request.
 */

import { AdvancedDesignRules } from '../entities/AdvancedDesignRules';

/**
 * APCA (Advanced Perceptual Contrast Algorithm) implementation
 * Provides accurate contrast analysis for modern web accessibility
 */
export class APCAContrastAnalyzer {
  /**
   * Calculate APCA contrast score between foreground and background colors
   */
  static calculateContrast(foreground: string, background: string): number {
    const fgLum = this.sRGBToY(foreground);
    const bgLum = this.sRGBToY(background);

    let deltaY: number;
    if (bgLum > fgLum) {
      // Light background, dark text
      deltaY = Math.pow(bgLum, 0.56) - Math.pow(fgLum, 0.57);
    } else {
      // Dark background, light text
      deltaY = Math.pow(bgLum, 0.65) - Math.pow(fgLum, 0.62);
    }

    // Scale to Lc units (approximately 0-108 range)
    return deltaY * 144;
  }

  /**
   * Check if contrast meets accessibility requirements
   */
  static isAccessible(
    foreground: string,
    background: string,
    rules: AdvancedDesignRules['apcaContrast'],
    contentType: 'body' | 'heading' | 'large' | 'ui' = 'body',
    fontWeight: number = 400
  ): AccessibilityResult {
    const score = this.calculateContrast(foreground, background);
    const absScore = Math.abs(score);

    // Get thresholds based on content type
    const thresholds = rules.thresholds;
    let required: number;

    switch (contentType) {
      case 'heading':
        required = thresholds.headingText.preferred;
        break;
      case 'large':
        required = thresholds.largeText.min;
        break;
      case 'ui':
        required = thresholds.uiComponents.min;
        break;
      case 'body':
      default:
        required = thresholds.bodyText.preferred;
    }

    // Apply adjustments
    if (fontWeight >= 600) {
      required -= rules.adjustments.boldText;
    }

    const isAccessible = absScore >= required;

    return {
      score: absScore,
      isAccessible,
      required,
      contentType,
      level: this.getWCAGLevel(absScore),
      suggestions: isAccessible ? [] : this.generateSuggestions(foreground, background, required)
    };
  }

  /**
   * Convert sRGB color to relative luminance (Y)
   */
  private static sRGBToY(color: string): number {
    const rgb = this.parseColor(color);
    if (!rgb) return 0.5; // fallback

    // RGB values are already in 0-1 range from parseColor
    // Convert sRGB to linear RGB
    const r = rgb.r <= 0.04045 ? rgb.r / 12.92 : Math.pow((rgb.r + 0.055) / 1.055, 2.4);
    const g = rgb.g <= 0.04045 ? rgb.g / 12.92 : Math.pow((rgb.g + 0.055) / 1.055, 2.4);
    const b = rgb.b <= 0.04045 ? rgb.b / 12.92 : Math.pow((rgb.b + 0.055) / 1.055, 2.4);

    // Calculate luminance (Y) using sRGB coefficients
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  }

  /**
   * Parse color string to RGB values (0-1 range)
   */
  private static parseColor(color: string): { r: number; g: number; b: number } | null {
    const cleanColor = color.trim().toLowerCase();

    // Handle hex colors
    if (cleanColor.startsWith('#')) {
      const hex = cleanColor.substring(1);
      if (hex.length === 3) {
        const r = parseInt(hex[0] + hex[0], 16) / 255;
        const g = parseInt(hex[1] + hex[1], 16) / 255;
        const b = parseInt(hex[2] + hex[2], 16) / 255;
        return { r, g, b };
      } else if (hex.length === 6) {
        const r = parseInt(hex.substring(0, 2), 16) / 255;
        const g = parseInt(hex.substring(2, 4), 16) / 255;
        const b = parseInt(hex.substring(4, 6), 16) / 255;
        return { r, g, b };
      }
    }

    // Handle rgb/rgba colors
    const rgbMatch = cleanColor.match(/rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*(?:,\s*[\d.]+\s*)?\)/);
    if (rgbMatch) {
      const r = parseInt(rgbMatch[1]) / 255;
      const g = parseInt(rgbMatch[2]) / 255;
      const b = parseInt(rgbMatch[3]) / 255;
      return { r, g, b };
    }

    // Handle named colors (simplified - would need full color map)
    const namedColors: Record<string, string> = {
      'black': '#000000',
      'white': '#ffffff',
      'red': '#ff0000',
      'green': '#008000',
      'blue': '#0000ff',
      'gray': '#808080',
      'grey': '#808080'
    };

    if (namedColors[cleanColor]) {
      return this.parseColor(namedColors[cleanColor]);
    }

    return null;
  }

  /**
   * Determine WCAG conformance level based on APCA score
   */
  private static getWCAGLevel(score: number): 'A' | 'AA' | 'AAA' | 'fail' {
    if (score >= 75) return 'AAA';
    if (score >= 60) return 'AA';
    if (score >= 45) return 'A';
    return 'fail';
  }

  /**
   * Generate color suggestions for better contrast
   */
  private static generateSuggestions(
    foreground: string,
    background: string,
    requiredScore: number
  ): ColorSuggestion[] {
    const suggestions: ColorSuggestion[] = [];

    // Parse colors
    const fgRGB = this.parseColor(foreground);
    const bgRGB = this.parseColor(background);

    if (!fgRGB || !bgRGB) return suggestions;

    // Determine if we need darker or lighter foreground
    const bgLuminance = this.sRGBToY(background);
    const needsDarkerFg = bgLuminance > 0.5;

    // Generate suggestions by adjusting foreground color
    const adjustments = needsDarkerFg ? [-0.2, -0.3, -0.4] : [0.2, 0.3, 0.4];

    for (const adjustment of adjustments) {
      const newFg = this.adjustColorLuminance(fgRGB, adjustment);
      const newFgHex = this.rgbToHex(newFg);
      const newScore = this.calculateContrast(newFgHex, background);

      if (Math.abs(newScore) >= requiredScore) {
        suggestions.push({
          foreground: newFgHex,
          background,
          contrast: Math.abs(newScore),
          reason: `Adjusted foreground luminance by ${Math.round(adjustment * 100)}%`
        });
      }
    }

    // Also try adjusting background if foreground suggestions don't work
    if (suggestions.length === 0) {
      const bgAdjustment = needsDarkerFg ? -0.1 : 0.1;
      const newBg = this.adjustColorLuminance(bgRGB, bgAdjustment);
      const newBgHex = this.rgbToHex(newBg);
      const newScore = this.calculateContrast(foreground, newBgHex);

      if (Math.abs(newScore) >= requiredScore) {
        suggestions.push({
          foreground,
          background: newBgHex,
          contrast: Math.abs(newScore),
          reason: `Adjusted background luminance by ${Math.round(bgAdjustment * 100)}%`
        });
      }
    }

    return suggestions.slice(0, 3); // Return top 3 suggestions
  }

  /**
   * Adjust color luminance by a factor
   */
  private static adjustColorLuminance(rgb: { r: number; g: number; b: number }, factor: number): { r: number; g: number; b: number } {
    // Convert to HSL for easier luminance adjustment
    const hsl = this.rgbToHsl(rgb);
    hsl.l = Math.max(0, Math.min(1, hsl.l + factor));
    return this.hslToRgb(hsl);
  }

  /**
   * Convert RGB to HSL
   */
  private static rgbToHsl(rgb: { r: number; g: number; b: number }): { h: number; s: number; l: number } {
    const { r, g, b } = rgb;
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const diff = max - min;

    const l = (max + min) / 2;
    let h = 0;
    let s = 0;

    if (diff !== 0) {
      s = l > 0.5 ? diff / (2 - max - min) : diff / (max + min);

      switch (max) {
        case r: h = (g - b) / diff + (g < b ? 6 : 0); break;
        case g: h = (b - r) / diff + 2; break;
        case b: h = (r - g) / diff + 4; break;
      }
      h /= 6;
    }

    return { h, s, l };
  }

  /**
   * Convert HSL to RGB
   */
  private static hslToRgb(hsl: { h: number; s: number; l: number }): { r: number; g: number; b: number } {
    const { h, s, l } = hsl;

    if (s === 0) {
      return { r: l, g: l, b: l };
    }

    const hue2rgb = (p: number, q: number, t: number) => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1/6) return p + (q - p) * 6 * t;
      if (t < 1/2) return q;
      if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
      return p;
    };

    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;

    return {
      r: hue2rgb(p, q, h + 1/3),
      g: hue2rgb(p, q, h),
      b: hue2rgb(p, q, h - 1/3)
    };
  }

  /**
   * Convert RGB to hex color
   */
  private static rgbToHex(rgb: { r: number; g: number; b: number }): string {
    const toHex = (n: number) => {
      const hex = Math.round(n * 255).toString(16);
      return hex.length === 1 ? '0' + hex : hex;
    };
    return `#${toHex(rgb.r)}${toHex(rgb.g)}${toHex(rgb.b)}`;
  }
}

/**
 * Result of accessibility check
 */
export interface AccessibilityResult {
  score: number;
  isAccessible: boolean;
  required: number;
  contentType: string;
  level: 'A' | 'AA' | 'AAA' | 'fail';
  suggestions: ColorSuggestion[];
}

/**
 * Color suggestion for improving contrast
 */
export interface ColorSuggestion {
  foreground: string;
  background: string;
  contrast: number;
  reason: string;
}
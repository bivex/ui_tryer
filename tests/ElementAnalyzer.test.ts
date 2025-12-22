/**
 * Copyright (c) 2025 Bivex
 *
 * Author: Bivex
 * Available for contact via email: support@b-b.top
 * For up-to-date contact information:
 * https://github.com/bivex
 *
 * Created: 2025-12-22T07:44:42
 * Last Updated: 2025-12-22T11:34:34
 *
 * Licensed under the MIT License.
 * Commercial licensing available upon request.
 */

import { ElementAnalyzer } from '../src/domain/services/ElementAnalyzer';
import { DesignRulesFactory } from '../src/domain/entities/DesignRules';

describe('ElementAnalyzer', () => {
  const rules = DesignRulesFactory.createDefault();

  describe('Spacing Analysis', () => {
    it('should detect spacing not on grid', () => {
      const boxModel = {
        content: { width: 100, height: 50, x: 0, y: 0 },
        padding: { top: 7, right: 8, bottom: 7, left: 8 }, // 7px not on grid
        border: { top: 0, right: 0, bottom: 0, left: 0 },
        margin: { top: 0, right: 0, bottom: 0, left: 0 },
        totalWidth: 116,
        totalHeight: 64,
      };

      const computedStyles = {
        display: 'block',
        position: 'static',
        width: '100px',
        height: '50px',
        fontSize: '16px',
        lineHeight: '1.5',
        color: '#000000',
        backgroundColor: '#ffffff',
        borderColor: '#000000',
        margin: '0px',
        padding: '7px 8px 7px 8px',
        border: '0px',
        cursor: 'auto',
        pointerEvents: 'auto',
        visibility: 'visible',
        opacity: '1',
      };

      const result = ElementAnalyzer.analyzeElement('test-element', '.test', boxModel, computedStyles, rules);

      expect(result.issues).toContainEqual(
        expect.objectContaining({
          type: 'spacing_not_on_grid',
          severity: 'warning',
          message: expect.stringContaining('не соответствует сетке дизайна'),
        })
      );
    });

    it('should detect asymmetric spacing', () => {
      const boxModel = {
        content: { width: 100, height: 50, x: 0, y: 0 },
        padding: { top: 8, right: 16, bottom: 8, left: 16 }, // symmetric
        border: { top: 0, right: 0, bottom: 0, left: 0 },
        margin: { top: 8, right: 0, bottom: 16, left: 0 }, // asymmetric
        totalWidth: 132,
        totalHeight: 74,
      };

      const computedStyles = {
        display: 'block',
        position: 'static',
        width: '100px',
        height: '50px',
        fontSize: '16px',
        lineHeight: '1.5',
        color: '#000000',
        backgroundColor: '#ffffff',
        borderColor: '#000000',
        margin: '8px 0px 16px 0px',
        padding: '8px 16px 8px 16px',
        border: '0px',
        cursor: 'auto',
        pointerEvents: 'auto',
        visibility: 'visible',
        opacity: '1',
      };

      const result = ElementAnalyzer.analyzeElement('test-element', '.test', boxModel, computedStyles, rules);

      expect(result.issues).toContainEqual(
        expect.objectContaining({
          type: 'asymmetric_spacing',
          severity: 'info',
          message: expect.stringContaining('Margin несимметричный'),
        })
      );
    });
  });

  describe('Clickable Elements Analysis', () => {
    it('should detect too small clickable elements', () => {
      const boxModel = {
        content: { width: 30, height: 20, x: 0, y: 0 },
        padding: { top: 0, right: 0, bottom: 0, left: 0 },
        border: { top: 0, right: 0, bottom: 0, left: 0 },
        margin: { top: 0, right: 0, bottom: 0, left: 0 },
        totalWidth: 30,
        totalHeight: 20,
      };

      const computedStyles = {
        display: 'inline-block',
        position: 'static',
        width: '30px',
        height: '20px',
        fontSize: '16px',
        lineHeight: '1.5',
        color: '#000000',
        backgroundColor: '#ffffff',
        borderColor: '#000000',
        margin: '0px',
        padding: '0px',
        border: '0px',
        cursor: 'pointer', // clickable
        pointerEvents: 'auto',
        visibility: 'visible',
        opacity: '1',
      };

      const result = ElementAnalyzer.analyzeElement('test-button', 'button.test', boxModel, computedStyles, rules);

      expect(result.issues).toContainEqual(
        expect.objectContaining({
          type: 'too_small_clickable_area',
          severity: 'error',
          message: expect.stringContaining('Кликабельная область слишком маленькая'),
        })
      );
    });

    it('should not flag non-clickable small elements', () => {
      const boxModel = {
        content: { width: 10, height: 10, x: 0, y: 0 },
        padding: { top: 0, right: 0, bottom: 0, left: 0 },
        border: { top: 0, right: 0, bottom: 0, left: 0 },
        margin: { top: 0, right: 0, bottom: 0, left: 0 },
        totalWidth: 10,
        totalHeight: 10,
      };

      const computedStyles = {
        display: 'inline-block',
        position: 'static',
        width: '10px',
        height: '10px',
        fontSize: '16px',
        lineHeight: '1.5',
        color: '#000000',
        backgroundColor: '#ffffff',
        borderColor: '#000000',
        margin: '0px',
        padding: '0px',
        border: '0px',
        cursor: 'default', // not clickable
        pointerEvents: 'auto',
        visibility: 'visible',
        opacity: '1',
      };

      const result = ElementAnalyzer.analyzeElement('test-element', '.test', boxModel, computedStyles, rules);

      const sizingIssues = result.issues.filter(issue => issue.type === 'too_small_clickable_area');
      expect(sizingIssues).toHaveLength(0);
    });

    it('should skip clickable area check for microscopic elements', () => {
      const boxModel = {
        content: { width: 5, height: 5, x: 0, y: 0 },
        padding: { top: 0, right: 0, bottom: 0, left: 0 },
        border: { top: 0, right: 0, bottom: 0, left: 0 },
        margin: { top: 0, right: 0, bottom: 0, left: 0 },
        totalWidth: 5,
        totalHeight: 5,
      };

      const computedStyles = {
        display: 'inline-block',
        position: 'static',
        width: '5px',
        height: '5px',
        fontSize: '16px',
        lineHeight: '1.5',
        color: '#000000',
        backgroundColor: '#ffffff',
        borderColor: '#000000',
        margin: '0px',
        padding: '0px',
        border: '0px',
        cursor: 'pointer', // clickable but microscopic
        pointerEvents: 'auto',
        visibility: 'visible',
        opacity: '1',
      };

      const result = ElementAnalyzer.analyzeElement('micro-element', '.micro', boxModel, computedStyles, rules);

      const sizingIssues = result.issues.filter(issue => issue.type === 'too_small_clickable_area');
      expect(sizingIssues).toHaveLength(0); // Should be skipped due to microscopic size
    });

    it('should skip clickable area check for small elements without visual prominence', () => {
      const boxModel = {
        content: { width: 25, height: 15, x: 0, y: 0 },
        padding: { top: 0, right: 0, bottom: 0, left: 0 },
        border: { top: 0, right: 0, bottom: 0, left: 0 },
        margin: { top: 0, right: 0, bottom: 0, left: 0 },
        totalWidth: 25,
        totalHeight: 15,
      };

      const computedStyles = {
        display: 'inline',
        position: 'static',
        width: '25px',
        height: '15px',
        fontSize: '14px',
        lineHeight: '1.4',
        color: '#333333',
        backgroundColor: 'transparent', // No background
        border: 'none', // No border
        margin: '0px',
        padding: '0px',
        cursor: 'pointer',
        pointerEvents: 'auto',
        visibility: 'visible',
        opacity: '1',
      };

      const result = ElementAnalyzer.analyzeElement('text-link', 'a.small', boxModel, computedStyles, rules);

      const sizingIssues = result.issues.filter(issue => issue.type === 'too_small_clickable_area');
      expect(sizingIssues).toHaveLength(0); // Should be skipped due to lack of visual prominence
    });

    it('should skip clickable area check for navigation elements with small padding', () => {
      const boxModel = {
        content: { width: 60, height: 16, x: 0, y: 0 },
        padding: { top: 2, right: 4, bottom: 2, left: 4 }, // Small padding like .px-2.py-1
        border: { top: 0, right: 0, bottom: 0, left: 0 },
        margin: { top: 0, right: 0, bottom: 0, left: 0 },
        totalWidth: 68,
        totalHeight: 20,
      };

      const computedStyles = {
        display: 'inline-block',
        position: 'static',
        width: 'auto',
        height: 'auto',
        fontSize: '14px',
        lineHeight: '1.4',
        color: '#007bff',
        backgroundColor: 'transparent',
        border: 'none',
        margin: '0px',
        padding: '2px 4px',
        cursor: 'pointer',
        pointerEvents: 'auto',
        visibility: 'visible',
        opacity: '1',
      };

      const result = ElementAnalyzer.analyzeElement('nav-link', 'a.px-2.py-1', boxModel, computedStyles, rules);

      const sizingIssues = result.issues.filter(issue => issue.type === 'too_small_clickable_area');
      expect(sizingIssues).toHaveLength(0); // Should be skipped due to navigation element pattern
    });

    it('should flag elements with visual prominence even if small', () => {
      const boxModel = {
        content: { width: 35, height: 25, x: 0, y: 0 },
        padding: { top: 4, right: 8, bottom: 4, left: 8 }, // Add padding to total size
        border: { top: 1, right: 1, bottom: 1, left: 1 }, // Add border
        margin: { top: 0, right: 0, bottom: 0, left: 0 },
        totalWidth: 35 + 16 + 2, // 35 content + 16 padding + 2 border = 53
        totalHeight: 25 + 8 + 2, // 25 content + 8 padding + 2 border = 35
      };

      const computedStyles = {
        display: 'inline-block',
        position: 'static',
        width: '35px',
        height: '25px',
        fontSize: '14px',
        lineHeight: '1.4',
        color: '#ffffff',
        backgroundColor: '#007bff', // Has background
        border: '1px solid #0056b3', // Has border
        borderRadius: '4px',
        margin: '0px',
        padding: '4px 8px',
        cursor: 'pointer',
        pointerEvents: 'auto',
        visibility: 'visible',
        opacity: '1',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)', // Has shadow
      };

      const result = ElementAnalyzer.analyzeElement('styled-button', 'button.styled', boxModel, computedStyles, rules);

      expect(result.issues).toContainEqual(
        expect.objectContaining({
          type: 'too_small_clickable_area',
          severity: 'warning', // 53x35 is not significantly below 44px, so warning
          message: expect.stringContaining('Кликабельная область слишком маленькая'),
        })
      );
    });

    it('should correctly identify clickable elements with various cursor types', () => {
      const testCases = [
        { cursor: 'pointer', shouldBeClickable: true },
        { cursor: 'grab', shouldBeClickable: true },
        { cursor: 'grabbing', shouldBeClickable: true },
        { cursor: 'default', shouldBeClickable: false },
        { cursor: 'auto', shouldBeClickable: false },
        { cursor: 'text', shouldBeClickable: false },
        { cursor: 'crosshair', shouldBeClickable: false },
      ];

      testCases.forEach(({ cursor, shouldBeClickable }) => {
        const boxModel = {
          content: { width: 50, height: 30, x: 0, y: 0 },
          padding: { top: 0, right: 0, bottom: 0, left: 0 },
          border: { top: 0, right: 0, bottom: 0, left: 0 },
          margin: { top: 0, right: 0, bottom: 0, left: 0 },
          totalWidth: 50,
          totalHeight: 30,
        };

        const computedStyles = {
          display: 'block',
          position: 'static',
          width: '50px',
          height: '30px',
          fontSize: '16px',
          lineHeight: '1.5',
          color: '#000000',
          backgroundColor: '#ffffff',
          margin: '0px',
          padding: '0px',
          border: '0px',
          cursor,
          pointerEvents: 'auto',
          visibility: 'visible',
          opacity: '1',
        };

        const result = ElementAnalyzer.analyzeElement(`test-${cursor}`, `.test-${cursor}`, boxModel, computedStyles, rules);

        const clickableAreaIssues = result.issues.filter(issue => issue.type === 'too_small_clickable_area');

        if (shouldBeClickable) {
          expect(clickableAreaIssues).toHaveLength(1);
          expect(clickableAreaIssues[0].severity).toBe('error');
        } else {
          expect(clickableAreaIssues).toHaveLength(0);
        }
      });
    });
  });

  describe('Typography Analysis', () => {
    it('should detect too small text', () => {
      const boxModel = {
        content: { width: 200, height: 50, x: 0, y: 0 },
        padding: { top: 8, right: 8, bottom: 8, left: 8 },
        border: { top: 0, right: 0, bottom: 0, left: 0 },
        margin: { top: 0, right: 0, bottom: 0, left: 0 },
        totalWidth: 216,
        totalHeight: 66,
      };

      const computedStyles = {
        display: 'block',
        position: 'static',
        width: '200px',
        height: 'auto',
        fontSize: '10px', // too small
        lineHeight: '1.5',
        color: '#000000',
        backgroundColor: '#ffffff',
        borderColor: '#000000',
        margin: '0px',
        padding: '8px',
        border: '0px',
        cursor: 'auto',
        pointerEvents: 'auto',
        visibility: 'visible',
        opacity: '1',
      };

      const result = ElementAnalyzer.analyzeElement('test-text', 'p.test', boxModel, computedStyles, rules);

      expect(result.issues).toContainEqual(
        expect.objectContaining({
          type: 'text_too_small',
          severity: 'error',
          message: expect.stringContaining('Текст слишком мелкий'),
        })
      );
    });
  });

  describe('Color Analysis', () => {
    it('should detect colors not in palette', () => {
      // Enable color palette checking for this test
      const rulesWithColorCheck = {
        ...rules,
        featureToggles: {
          ...rules.featureToggles,
          checkColorPalette: true,
        }
      };

      const boxModel = {
        content: { width: 100, height: 50, x: 0, y: 0 },
        padding: { top: 8, right: 8, bottom: 8, left: 8 },
        border: { top: 0, right: 0, bottom: 0, left: 0 },
        margin: { top: 0, right: 0, bottom: 0, left: 0 },
        totalWidth: 116,
        totalHeight: 66,
      };

      const computedStyles = {
        display: 'block',
        position: 'static',
        width: '100px',
        height: '50px',
        fontSize: '16px',
        lineHeight: '1.5',
        color: '#000000',
        backgroundColor: '#ff69b4', // hot pink - not in palette
        borderColor: '#000000',
        margin: '0px',
        padding: '8px',
        border: '0px',
        cursor: 'auto',
        pointerEvents: 'auto',
        visibility: 'visible',
        opacity: '1',
      };

      const result = ElementAnalyzer.analyzeElement('test-element', '.test', boxModel, computedStyles, rulesWithColorCheck);

      expect(result.issues).toContainEqual(
        expect.objectContaining({
          type: 'color_not_in_palette',
          severity: 'info',
          message: expect.stringContaining('не входит в палитру дизайна'),
        })
      );
    });
  });

  describe('Semantic Clickability Analysis', () => {
    it('should detect button elements as clickable even without cursor:pointer', () => {
      const boxModel = {
        content: { width: 30, height: 20, x: 0, y: 0 },
        padding: { top: 0, right: 0, bottom: 0, left: 0 },
        border: { top: 0, right: 0, bottom: 0, left: 0 },
        margin: { top: 0, right: 0, bottom: 0, left: 0 },
        totalWidth: 30,
        totalHeight: 20,
      };

      const computedStyles = {
        display: 'inline-block',
        position: 'static',
        width: '30px',
        height: '20px',
        fontSize: '16px',
        lineHeight: '1.5',
        color: '#000000',
        backgroundColor: '#ffffff',
        borderColor: '#000000',
        margin: '0px',
        padding: '0px',
        border: '0px',
        cursor: 'default', // NO cursor:pointer
        pointerEvents: 'auto',
        visibility: 'visible',
        opacity: '1',
      };

      const semanticInfo = {
        tagName: 'button',
        attributes: { role: null },
        hasClickHandler: false,
      };

      const result = ElementAnalyzer.analyzeElement('test-button', 'button', boxModel, computedStyles, rules, semanticInfo);

      expect(result.issues).toContainEqual(
        expect.objectContaining({
          type: 'too_small_clickable_area',
          severity: 'error',
          message: expect.stringContaining('Кликабельная область слишком маленькая'),
        })
      );
    });

    it('should detect link elements as clickable even without cursor:pointer', () => {
      const boxModel = {
        content: { width: 35, height: 18, x: 0, y: 0 },
        padding: { top: 0, right: 0, bottom: 0, left: 0 },
        border: { top: 0, right: 0, bottom: 0, left: 0 },
        margin: { top: 0, right: 0, bottom: 0, left: 0 },
        totalWidth: 35,
        totalHeight: 18,
      };

      const computedStyles = {
        display: 'inline',
        position: 'static',
        width: '35px',
        height: '18px',
        fontSize: '14px',
        lineHeight: '1.4',
        color: '#0066cc',
        backgroundColor: 'transparent',
        margin: '0px',
        padding: '0px',
        border: '0px',
        cursor: 'default', // NO cursor:pointer
        pointerEvents: 'auto',
        visibility: 'visible',
        opacity: '1',
      };

      const semanticInfo = {
        tagName: 'a',
        attributes: { href: '/page', role: null },
        hasClickHandler: false,
      };

      const result = ElementAnalyzer.analyzeElement('test-link', 'a', boxModel, computedStyles, rules, semanticInfo);

      expect(result.issues).toContainEqual(
        expect.objectContaining({
          type: 'too_small_clickable_area',
          severity: 'error',
          message: expect.stringContaining('Кликабельная область слишком маленькая'),
        })
      );
    });

    it('should detect elements with role="button" as clickable', () => {
      const boxModel = {
        content: { width: 28, height: 22, x: 0, y: 0 },
        padding: { top: 0, right: 0, bottom: 0, left: 0 },
        border: { top: 0, right: 0, bottom: 0, left: 0 },
        margin: { top: 0, right: 0, bottom: 0, left: 0 },
        totalWidth: 28,
        totalHeight: 22,
      };

      const computedStyles = {
        display: 'inline-block',
        position: 'static',
        width: '28px',
        height: '22px',
        fontSize: '14px',
        lineHeight: '1.4',
        color: '#ffffff',
        backgroundColor: '#007bff',
        margin: '0px',
        padding: '0px',
        border: '0px',
        cursor: 'default', // NO cursor:pointer
        pointerEvents: 'auto',
        visibility: 'visible',
        opacity: '1',
      };

      const semanticInfo = {
        tagName: 'div',
        attributes: { role: 'button' },
        hasClickHandler: true,
      };

      const result = ElementAnalyzer.analyzeElement('test-aria-button', 'div[role="button"]', boxModel, computedStyles, rules, semanticInfo);

      expect(result.issues).toContainEqual(
        expect.objectContaining({
          type: 'too_small_clickable_area',
          severity: 'error',
          message: expect.stringContaining('Кликабельная область слишком маленькая'),
        })
      );
    });

    it('should detect elements with onclick handler as clickable', () => {
      const boxModel = {
        content: { width: 32, height: 24, x: 0, y: 0 },
        padding: { top: 0, right: 0, bottom: 0, left: 0 },
        border: { top: 0, right: 0, bottom: 0, left: 0 },
        margin: { top: 0, right: 0, bottom: 0, left: 0 },
        totalWidth: 32,
        totalHeight: 24,
      };

      const computedStyles = {
        display: 'block',
        position: 'static',
        width: '32px',
        height: '24px',
        fontSize: '14px',
        lineHeight: '1.4',
        color: '#333333',
        backgroundColor: '#f0f0f0',
        margin: '0px',
        padding: '0px',
        border: '0px',
        cursor: 'default', // NO cursor:pointer
        pointerEvents: 'auto',
        visibility: 'visible',
        opacity: '1',
      };

      const semanticInfo = {
        tagName: 'div',
        attributes: { onclick: 'handleClick()', role: null },
        hasClickHandler: true,
      };

      const result = ElementAnalyzer.analyzeElement('test-onclick', 'div[onclick]', boxModel, computedStyles, rules, semanticInfo);

      expect(result.issues).toContainEqual(
        expect.objectContaining({
          type: 'too_small_clickable_area',
          severity: 'error',
          message: expect.stringContaining('Кликабельная область слишком маленькая'),
        })
      );
    });

    it('should detect elements with tabindex as clickable', () => {
      const boxModel = {
        content: { width: 36, height: 20, x: 0, y: 0 },
        padding: { top: 0, right: 0, bottom: 0, left: 0 },
        border: { top: 0, right: 0, bottom: 0, left: 0 },
        margin: { top: 0, right: 0, bottom: 0, left: 0 },
        totalWidth: 36,
        totalHeight: 20,
      };

      const computedStyles = {
        display: 'inline-block',
        position: 'static',
        width: '36px',
        height: '20px',
        fontSize: '14px',
        lineHeight: '1.4',
        color: '#000000',
        backgroundColor: '#e0e0e0',
        margin: '0px',
        padding: '0px',
        border: '0px',
        cursor: 'default', // NO cursor:pointer
        pointerEvents: 'auto',
        visibility: 'visible',
        opacity: '1',
      };

      const semanticInfo = {
        tagName: 'span',
        attributes: { tabindex: '0', role: null },
        hasClickHandler: false,
      };

      const result = ElementAnalyzer.analyzeElement('test-tabindex', 'span[tabindex="0"]', boxModel, computedStyles, rules, semanticInfo);

      expect(result.issues).toContainEqual(
        expect.objectContaining({
          type: 'too_small_clickable_area',
          severity: 'error',
          message: expect.stringContaining('Кликабельная область слишком маленькая'),
        })
      );
    });

    it('should NOT flag non-interactive elements with role="presentation"', () => {
      const boxModel = {
        content: { width: 30, height: 20, x: 0, y: 0 },
        padding: { top: 0, right: 0, bottom: 0, left: 0 },
        border: { top: 0, right: 0, bottom: 0, left: 0 },
        margin: { top: 0, right: 0, bottom: 0, left: 0 },
        totalWidth: 30,
        totalHeight: 20,
      };

      const computedStyles = {
        display: 'block',
        position: 'static',
        width: '30px',
        height: '20px',
        fontSize: '14px',
        lineHeight: '1.4',
        color: '#000000',
        backgroundColor: '#ffffff',
        margin: '0px',
        padding: '0px',
        border: '0px',
        cursor: 'default',
        pointerEvents: 'auto',
        visibility: 'visible',
        opacity: '1',
      };

      const semanticInfo = {
        tagName: 'div',
        attributes: { role: 'presentation' },
        hasClickHandler: false,
      };

      const result = ElementAnalyzer.analyzeElement('test-presentation', 'div[role="presentation"]', boxModel, computedStyles, rules, semanticInfo);

      const sizingIssues = result.issues.filter(issue => issue.type === 'too_small_clickable_area');
      expect(sizingIssues).toHaveLength(0);
    });
  });
});

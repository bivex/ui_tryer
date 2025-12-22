/**
 * Copyright (c) 2025 Bivex
 *
 * Author: Bivex
 * Available for contact via email: support@b-b.top
 * For up-to-date contact information:
 * https://github.com/bivex
 *
 * Created: 2025-12-22T07:44:42
 * Last Updated: 2025-12-22T07:46:56
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

      const result = ElementAnalyzer.analyzeElement('test-element', '.test', boxModel, computedStyles, rules);

      expect(result.issues).toContainEqual(
        expect.objectContaining({
          type: 'color_not_in_palette',
          severity: 'info',
          message: expect.stringContaining('не входит в палитру дизайна'),
        })
      );
    });
  });
});

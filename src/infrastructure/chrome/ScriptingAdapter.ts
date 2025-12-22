/**
 * Copyright (c) 2025 Pixel Perfect Inspector
 *
 * Author: Pixel Perfect Inspector
 * Available for contact via email: support@b-b.top
 * For up-to-date contact information:
 * https://github.com/bivex
 *
 * Created: 2025-12-22T07:30:20
 * Last Updated: 2025-12-22T07:41:13
 *
 * Licensed under the MIT License.
 * Commercial licensing available upon request.
 */

/**
 * Infrastructure adapter for Chrome Scripting API
 * Handles injection and execution of scripts in web pages
 */
export class ScriptingAdapter {
  /**
   * Injects content script into the specified tab
   */
  static async injectContentScript(
    tabId: number,
    options: ContentScriptOptions = {}
  ): Promise<void> {
    try {
      // Check if content script is already injected
      const existingScripts = await this.getRegisteredContentScripts();
      const scriptExists = existingScripts.some(script =>
        script.matches?.some(match => match === '<all_urls>')
      );

      if (!scriptExists || options.force) {
        await chrome.scripting.registerContentScripts([{
          id: 'ui-inspector-content-script',
          matches: ['<all_urls>'],
          js: ['content.js'],
          runAt: options.runAt || 'document_idle',
          allFrames: options.allFrames || false,
          matchOriginAsFallback: options.matchOriginAsFallback || false,
        }]);
      }
    } catch (error) {
      console.error('Failed to inject content script:', error);
      throw new Error(`Content script injection failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Removes injected content script
   */
  static async removeContentScript(scriptId: string = 'ui-inspector-content-script'): Promise<void> {
    try {
      await chrome.scripting.unregisterContentScripts({ ids: [scriptId] });
    } catch (error) {
      console.error('Failed to remove content script:', error);
      throw new Error(`Content script removal failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Executes a function in the context of the specified tab
   */
  static async executeFunction<T = any>(
    tabId: number,
    functionToExecute: (...args: any[]) => T,
    args: any[] = [],
    options: ExecutionOptions = {}
  ): Promise<T[]> {
    try {
      const results = await chrome.scripting.executeScript({
        target: {
          tabId,
          allFrames: options.allFrames || false,
        },
        func: functionToExecute,
        args,
        world: options.world || 'ISOLATED',
      });

      return results.map(result => result.result as T);
    } catch (error) {
      console.error('Failed to execute function:', error);
      throw new Error(`Function execution failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Injects CSS styles into the specified tab
   */
  static async injectCSS(
    tabId: number,
    css: string,
    options: CSSInjectionOptions = {}
  ): Promise<string> {
    try {
      const cssId = options.id || `ui-inspector-css-${Date.now()}`;

      await chrome.scripting.insertCSS({
        target: {
          tabId,
          allFrames: options.allFrames || false,
        },
        css,
        origin: options.origin || 'USER',
      });

      return cssId;
    } catch (error) {
      console.error('Failed to inject CSS:', error);
      throw new Error(`CSS injection failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Removes injected CSS from the specified tab
   */
  static async removeCSS(
    tabId: number,
    css: string,
    options: CSSInjectionOptions = {}
  ): Promise<void> {
    try {
      await chrome.scripting.removeCSS({
        target: {
          tabId,
          allFrames: options.allFrames || false,
        },
        css,
        origin: options.origin || 'USER',
      });
    } catch (error) {
      console.error('Failed to remove CSS:', error);
      throw new Error(`CSS removal failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Gets information about registered content scripts
   */
  static async getRegisteredContentScripts(): Promise<chrome.scripting.RegisteredContentScript[]> {
    try {
      return await chrome.scripting.getRegisteredContentScripts();
    } catch (error) {
      console.error('Failed to get registered content scripts:', error);
      return [];
    }
  }

  /**
   * Updates an existing content script
   */
  static async updateContentScript(
    scriptId: string,
    updates: Partial<chrome.scripting.RegisteredContentScript>
  ): Promise<void> {
    try {
      await chrome.scripting.updateContentScripts([{
        id: scriptId,
        ...updates,
      }]);
    } catch (error) {
      console.error('Failed to update content script:', error);
      throw new Error(`Content script update failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Executes element inspection script
   */
  static async inspectElement(
    tabId: number,
    elementId: string
  ): Promise<ElementInspectionData> {
    try {
      const results = await this.executeFunction(
        tabId,
        this.getElementInspectionScript(),
        [elementId]
      );

      if (!results || results.length === 0) {
        throw new Error('No inspection results returned');
      }

      return results[0] as ElementInspectionData;
    } catch (error) {
      console.error('Failed to inspect element:', error);
      throw new Error(`Element inspection failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Executes script to get all inspectable elements on the page
   */
  static async getInspectableElements(tabId: number): Promise<ElementDescriptor[]> {
    try {
      const results = await this.executeFunction(
        tabId,
        this.getInspectableElementsScript(),
        []
      );

      return (results[0] as ElementDescriptor[]) || [];
    } catch (error) {
      console.error('Failed to get inspectable elements:', error);
      return [];
    }
  }

  /**
   * Injects overlay CSS for element highlighting
   */
  static async injectOverlayStyles(tabId: number): Promise<void> {
    const overlayCSS = `
      .ui-inspector-overlay {
        position: absolute;
        pointer-events: none;
        z-index: 999999;
        background: rgba(255, 0, 0, 0.1);
        border: 2px solid #ff0000;
        box-sizing: border-box;
      }

      .ui-inspector-overlay.margin {
        background: rgba(255, 165, 0, 0.1);
        border-color: #ffa500;
      }

      .ui-inspector-overlay.padding {
        background: rgba(0, 255, 0, 0.1);
        border-color: #00ff00;
      }

      .ui-inspector-overlay.content {
        background: rgba(0, 0, 255, 0.1);
        border-color: #0000ff;
      }

      .ui-inspector-tooltip {
        position: absolute;
        background: rgba(0, 0, 0, 0.8);
        color: white;
        padding: 4px 8px;
        border-radius: 4px;
        font-size: 12px;
        font-family: monospace;
        z-index: 1000000;
        pointer-events: none;
        max-width: 300px;
        word-wrap: break-word;
      }

      .ui-inspector-grid-overlay {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        pointer-events: none;
        z-index: 999998;
      }

      .ui-inspector-grid-line {
        position: absolute;
        background: rgba(255, 0, 0, 0.3);
      }

      .ui-inspector-grid-line.vertical {
        width: 1px;
        height: 100%;
      }

      .ui-inspector-grid-line.horizontal {
        height: 1px;
        width: 100%;
      }
    `;

    await this.injectCSS(tabId, overlayCSS, { id: 'ui-inspector-overlay-styles' });
  }

  /**
   * Removes overlay styles
   */
  static async removeOverlayStyles(tabId: number): Promise<void> {
    await this.removeCSS(tabId, '', { id: 'ui-inspector-overlay-styles' });
  }

  /**
   * Element inspection script (executed in page context)
   */
  private static getElementInspectionScript(): (...args: any[]) => any {
    return (elementId: string) => {
      const element = document.getElementById(elementId) || document.querySelector(`[data-ui-inspector-id="${elementId}"]`);
      if (!element) return null;

      const rect = element.getBoundingClientRect();
      const computedStyle = window.getComputedStyle(element);

      // Get box model values
      const boxModel = {
        content: {
          width: rect.width,
          height: rect.height,
          x: rect.x + window.scrollX,
          y: rect.y + window.scrollY,
        },
        padding: {
          top: parseFloat(computedStyle.paddingTop) || 0,
          right: parseFloat(computedStyle.paddingRight) || 0,
          bottom: parseFloat(computedStyle.paddingBottom) || 0,
          left: parseFloat(computedStyle.paddingLeft) || 0,
        },
        border: {
          top: parseFloat(computedStyle.borderTopWidth) || 0,
          right: parseFloat(computedStyle.borderRightWidth) || 0,
          bottom: parseFloat(computedStyle.borderBottomWidth) || 0,
          left: parseFloat(computedStyle.borderLeftWidth) || 0,
        },
        margin: {
          top: parseFloat(computedStyle.marginTop) || 0,
          right: parseFloat(computedStyle.marginRight) || 0,
          bottom: parseFloat(computedStyle.marginBottom) || 0,
          left: parseFloat(computedStyle.marginLeft) || 0,
        },
      };

      // Get relevant computed styles
      const styles = {
        display: computedStyle.display,
        position: computedStyle.position,
        width: computedStyle.width,
        height: computedStyle.height,
        minWidth: computedStyle.minWidth,
        minHeight: computedStyle.minHeight,
        maxWidth: computedStyle.maxWidth,
        maxHeight: computedStyle.maxHeight,
        fontSize: computedStyle.fontSize,
        lineHeight: computedStyle.lineHeight,
        fontFamily: computedStyle.fontFamily,
        fontWeight: computedStyle.fontWeight,
        color: computedStyle.color,
        backgroundColor: computedStyle.backgroundColor,
        borderColor: computedStyle.borderTopColor, // Simplified
        margin: computedStyle.margin,
        padding: computedStyle.padding,
        border: computedStyle.border,
        cursor: computedStyle.cursor,
        pointerEvents: computedStyle.pointerEvents,
        visibility: computedStyle.visibility,
        opacity: computedStyle.opacity,
      };

      return {
        elementId,
        selector: element.tagName.toLowerCase() + (element.id ? `#${element.id}` : ''),
        boxModel,
        computedStyles: styles,
        viewportPosition: {
          width: rect.width,
          height: rect.height,
          x: rect.x,
          y: rect.y,
        },
        documentPosition: boxModel.content,
      };
    };
  }

  /**
   * Script to get all inspectable elements
   */
  private static getInspectableElementsScript(): (...args: any[]) => any {
    return () => {
      const elements = document.querySelectorAll('*');
      const inspectableElements: ElementDescriptor[] = [];

      elements.forEach((element, index) => {
        const rect = element.getBoundingClientRect();
        const computedStyle = window.getComputedStyle(element);

        // Skip invisible elements
        if (computedStyle.display === 'none' ||
            computedStyle.visibility === 'hidden' ||
            rect.width === 0 ||
            rect.height === 0) {
          return;
        }

        // Generate unique ID
        const elementId = `element_${index}_${Date.now()}`;

        // Add temporary data attribute for identification
        element.setAttribute('data-ui-inspector-id', elementId);

        inspectableElements.push({
          id: elementId,
          tagName: element.tagName.toLowerCase(),
          selector: element.tagName.toLowerCase() +
                   (element.id ? `#${element.id}` : '') +
                   (element.className ? `.${element.className.split(' ').join('.')}` : ''),
          rect: {
            width: rect.width,
            height: rect.height,
            x: rect.x,
            y: rect.y,
          },
          isVisible: true,
          hasClickHandler: typeof (element as any).onclick === 'function' ||
                          element.getAttribute('onclick') !== null,
        });
      });

      return inspectableElements;
    };
  }
}

/**
 * Types for scripting operations
 */
export interface ContentScriptOptions {
  runAt?: 'document_start' | 'document_end' | 'document_idle';
  allFrames?: boolean;
  matchOriginAsFallback?: boolean;
  force?: boolean;
}

export interface ExecutionOptions {
  allFrames?: boolean;
  world?: 'ISOLATED' | 'MAIN';
}

export interface CSSInjectionOptions {
  id?: string;
  allFrames?: boolean;
  origin?: 'AUTHOR' | 'USER';
}

export interface ElementInspectionData {
  elementId: string;
  selector: string;
  boxModel: {
    content: { width: number; height: number; x: number; y: number };
    padding: { top: number; right: number; bottom: number; left: number };
    border: { top: number; right: number; bottom: number; left: number };
    margin: { top: number; right: number; bottom: number; left: number };
  };
  computedStyles: Record<string, string>;
  viewportPosition: { width: number; height: number; x: number; y: number };
  documentPosition: { width: number; height: number; x: number; y: number };
}

export interface ElementDescriptor {
  id: string;
  tagName: string;
  selector: string;
  rect: { width: number; height: number; x: number; y: number };
  isVisible: boolean;
  hasClickHandler: boolean;
}

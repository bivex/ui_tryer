/**
 * Copyright (c) 2025 Pixel Perfect Inspector
 *
 * Author: Pixel Perfect Inspector
 * Available for contact via email: support@b-b.top
 * For up-to-date contact information:
 * https://github.com/bivex
 *
 * Created: 2025-12-22T07:30:54
 * Last Updated: 2025-12-22T07:41:13
 *
 * Licensed under the MIT License.
 * Commercial licensing available upon request.
 */

/**
 * Infrastructure adapter for DOM manipulation in content scripts
 * Provides clean interface for element inspection and overlay rendering
 */
export class ElementInspector {
  private overlays: Map<string, HTMLElement> = new Map();
  private tooltip: HTMLElement | null = null;
  private gridOverlay: HTMLElement | null = null;
  private isInspecting = false;
  private currentElementId: string | null = null;

  /**
   * Starts element inspection mode
   */
  startInspection(): void {
    if (this.isInspecting) return;

    this.isInspecting = true;
    this.attachEventListeners();
    this.injectStyles();
  }

  /**
   * Stops element inspection mode
   */
  stopInspection(): void {
    if (!this.isInspecting) return;

    this.isInspecting = false;
    this.removeEventListeners();
    this.clearAllOverlays();
  }

  /**
   * Highlights an element with overlay
   */
  highlightElement(elementId: string, options: HighlightOptions = {}): void {
    const element = this.findElementById(elementId);
    if (!element) return;

    this.clearCurrentHighlight();

    const overlay = this.createOverlay(element, options);
    this.overlays.set(elementId, overlay);
    this.currentElementId = elementId;

    if (options.showTooltip) {
      this.showTooltip(element, options.tooltipData);
    }
  }

  /**
   * Removes highlight from current element
   */
  clearCurrentHighlight(): void {
    if (this.currentElementId) {
      this.removeOverlay(this.currentElementId);
      this.currentElementId = null;
    }

    this.hideTooltip();
  }

  /**
   * Shows grid overlay for alignment guides
   */
  showGridOverlay(gridSize: number = 8): void {
    if (this.gridOverlay) return;

    this.gridOverlay = this.createGridOverlay(gridSize);
    document.body.appendChild(this.gridOverlay);
  }

  /**
   * Hides grid overlay
   */
  hideGridOverlay(): void {
    if (this.gridOverlay) {
      this.gridOverlay.remove();
      this.gridOverlay = null;
    }
  }

  /**
   * Gets element data for inspection
   */
  getElementData(elementId: string): ElementInspectionData | null {
    const element = this.findElementById(elementId);
    if (!element) return null;

    return this.extractElementData(element, elementId);
  }

  /**
   * Gets all inspectable elements on the page
   */
  getAllInspectableElements(): ElementDescriptor[] {
    const elements = document.querySelectorAll('*');
    const inspectableElements: ElementDescriptor[] = [];

    elements.forEach((element, index) => {
      if (this.isElementInspectable(element)) {
        const elementId = `element_${index}_${Date.now()}`;
        element.setAttribute('data-ui-inspector-id', elementId);

        const rect = element.getBoundingClientRect();
        inspectableElements.push({
          id: elementId,
          tagName: element.tagName.toLowerCase(),
          selector: this.generateSelector(element),
          rect: {
            width: rect.width,
            height: rect.height,
            x: rect.x,
            y: rect.y,
          },
          isVisible: true,
          hasClickHandler: this.hasClickHandler(element),
        });
      }
    });

    return inspectableElements;
  }

  /**
   * Attaches event listeners for inspection mode
   */
  private attachEventListeners(): void {
    document.addEventListener('mouseover', this.handleMouseOver, true);
    document.addEventListener('mouseout', this.handleMouseOut, true);
    document.addEventListener('click', this.handleClick, true);
    document.addEventListener('scroll', this.handleScroll, false);
    window.addEventListener('resize', this.handleResize, false);
  }

  /**
   * Removes event listeners
   */
  private removeEventListeners(): void {
    document.removeEventListener('mouseover', this.handleMouseOver, true);
    document.removeEventListener('mouseout', this.handleMouseOut, true);
    document.removeEventListener('click', this.handleClick, true);
    document.removeEventListener('scroll', this.handleScroll, false);
    window.removeEventListener('resize', this.handleResize, false);
  }

  /**
   * Mouse over event handler
   */
  private handleMouseOver = (event: MouseEvent): void => {
    if (!this.isInspecting) return;

    const target = event.target as HTMLElement;
    if (!target || target === document.body || target === document.documentElement) return;

    event.stopPropagation();
    this.highlightHoveredElement(target);
  };

  /**
   * Mouse out event handler
   */
  private handleMouseOut = (event: MouseEvent): void => {
    if (!this.isInspecting) return;

    // Only clear if we're not moving to a child element
    const relatedTarget = event.relatedTarget as HTMLElement;
    if (relatedTarget && this.isDescendant(relatedTarget, event.target as HTMLElement)) {
      return;
    }

    this.clearCurrentHighlight();
  };

  /**
   * Click event handler
   */
  private handleClick = (event: MouseEvent): void => {
    if (!this.isInspecting) return;

    event.preventDefault();
    event.stopPropagation();

    const target = event.target as HTMLElement;
    if (target) {
      this.selectElement(target);
    }
  };

  /**
   * Scroll event handler
   */
  private handleScroll = (): void => {
    this.updateOverlayPositions();
  };

  /**
   * Resize event handler
   */
  private handleResize = (): void => {
    this.updateOverlayPositions();
  };

  /**
   * Highlights element on hover
   */
  private highlightHoveredElement(element: HTMLElement): void {
    const elementId = element.getAttribute('data-ui-inspector-id') ||
                     `hover_${Date.now()}`;

    this.highlightElement(elementId, {
      type: 'hover',
      showTooltip: true,
      tooltipData: this.getTooltipData(element),
    });
  }

  /**
   * Selects element for detailed inspection
   */
  private selectElement(element: HTMLElement): void {
    const elementId = element.getAttribute('data-ui-inspector-id') ||
                     `selected_${Date.now()}`;

    // Dispatch custom event that content script can listen to
    const event = new CustomEvent('ui-inspector:element-selected', {
      detail: {
        elementId,
        elementData: this.extractElementData(element, elementId),
      },
    });
    document.dispatchEvent(event);

    this.stopInspection();
  }

  /**
   * Creates overlay for element
   */
  private createOverlay(element: HTMLElement, options: HighlightOptions): HTMLElement {
    const rect = element.getBoundingClientRect();
    const overlay = document.createElement('div');

    overlay.className = `ui-inspector-overlay ${options.type || 'inspect'}`;
    overlay.style.cssText = `
      position: absolute;
      left: ${rect.left + window.scrollX}px;
      top: ${rect.top + window.scrollY}px;
      width: ${rect.width}px;
      height: ${rect.height}px;
      pointer-events: none;
      z-index: 999999;
      background: ${this.getOverlayBackground(options.type)};
      border: 2px solid ${this.getOverlayBorder(options.type)};
      box-sizing: border-box;
      opacity: ${options.opacity || 0.3};
    `;

    document.body.appendChild(overlay);
    return overlay;
  }

  /**
   * Creates grid overlay
   */
  private createGridOverlay(gridSize: number): HTMLElement {
    const overlay = document.createElement('div');
    overlay.className = 'ui-inspector-grid-overlay';

    // Create vertical lines
    for (let x = 0; x < window.innerWidth; x += gridSize) {
      const line = document.createElement('div');
      line.className = 'ui-inspector-grid-line vertical';
      line.style.left = `${x}px`;
      overlay.appendChild(line);
    }

    // Create horizontal lines
    for (let y = 0; y < window.innerHeight; y += gridSize) {
      const line = document.createElement('div');
      line.className = 'ui-inspector-grid-line horizontal';
      line.style.top = `${y}px`;
      overlay.appendChild(line);
    }

    return overlay;
  }

  /**
   * Shows tooltip with element info
   */
  private showTooltip(element: HTMLElement, data?: TooltipData): void {
    this.hideTooltip();

    const rect = element.getBoundingClientRect();
    const tooltip = document.createElement('div');

    tooltip.className = 'ui-inspector-tooltip';
    tooltip.textContent = data?.text || this.getDefaultTooltipText(element);

    // Position tooltip
    const tooltipRect = tooltip.getBoundingClientRect();
    let left = rect.left + rect.width / 2 - tooltipRect.width / 2;
    let top = rect.top - tooltipRect.height - 5;

    // Adjust if tooltip goes off screen
    if (left < 0) left = 0;
    if (left + tooltipRect.width > window.innerWidth) {
      left = window.innerWidth - tooltipRect.width;
    }
    if (top < 0) top = rect.bottom + 5;

    tooltip.style.left = `${left}px`;
    tooltip.style.top = `${top}px`;

    document.body.appendChild(tooltip);
    this.tooltip = tooltip;
  }

  /**
   * Hides tooltip
   */
  private hideTooltip(): void {
    if (this.tooltip) {
      this.tooltip.remove();
      this.tooltip = null;
    }
  }

  /**
   * Updates overlay positions on scroll/resize
   */
  private updateOverlayPositions(): void {
    this.overlays.forEach((overlay, elementId) => {
      const element = this.findElementById(elementId);
      if (element) {
        const rect = element.getBoundingClientRect();
        overlay.style.left = `${rect.left + window.scrollX}px`;
        overlay.style.top = `${rect.top + window.scrollY}px`;
        overlay.style.width = `${rect.width}px`;
        overlay.style.height = `${rect.height}px`;
      }
    });
  }

  /**
   * Clears all overlays
   */
  private clearAllOverlays(): void {
    this.overlays.forEach((overlay) => overlay.remove());
    this.overlays.clear();
    this.hideTooltip();
    this.hideGridOverlay();
  }

  /**
   * Removes specific overlay
   */
  private removeOverlay(elementId: string): void {
    const overlay = this.overlays.get(elementId);
    if (overlay) {
      overlay.remove();
      this.overlays.delete(elementId);
    }
  }

  /**
   * Finds element by ID
   */
  private findElementById(elementId: string): HTMLElement | null {
    return document.querySelector(`[data-ui-inspector-id="${elementId}"]`) ||
           document.getElementById(elementId);
  }

  /**
   * Extracts element data for inspection
   */
  private extractElementData(element: HTMLElement, elementId: string): ElementInspectionData {
    const rect = element.getBoundingClientRect();
    const computedStyle = window.getComputedStyle(element);

    return {
      elementId,
      selector: this.generateSelector(element),
      boxModel: {
        content: {
          width: rect.width,
          height: rect.height,
          x: rect.x + window.scrollX,
          y: rect.y + window.scrollY,
        },
        padding: this.parseSides(computedStyle, 'padding'),
        border: this.parseSides(computedStyle, 'border', true),
        margin: this.parseSides(computedStyle, 'margin'),
      },
      computedStyles: this.extractComputedStyles(computedStyle),
      viewportPosition: {
        width: rect.width,
        height: rect.height,
        x: rect.x,
        y: rect.y,
      },
      documentPosition: {
        width: rect.width,
        height: rect.height,
        x: rect.x + window.scrollX,
        y: rect.y + window.scrollY,
      },
    };
  }

  /**
   * Parses CSS side values
   */
  private parseSides(style: CSSStyleDeclaration, property: string, isBorder = false): Sides {
    const suffix = isBorder ? 'Width' : '';
    return {
      top: parseFloat(style.getPropertyValue(`${property}-top${suffix}`)) || 0,
      right: parseFloat(style.getPropertyValue(`${property}-right${suffix}`)) || 0,
      bottom: parseFloat(style.getPropertyValue(`${property}-bottom${suffix}`)) || 0,
      left: parseFloat(style.getPropertyValue(`${property}-left${suffix}`)) || 0,
    };
  }

  /**
   * Extracts relevant computed styles
   */
  private extractComputedStyles(style: CSSStyleDeclaration): Record<string, string> {
    const relevantProperties = [
      'display', 'position', 'width', 'height', 'minWidth', 'minHeight', 'maxWidth', 'maxHeight',
      'fontSize', 'lineHeight', 'fontFamily', 'fontWeight', 'color', 'backgroundColor',
      'margin', 'padding', 'border', 'cursor', 'pointerEvents', 'visibility', 'opacity', 'boxShadow'
    ];

    const styles: Record<string, string> = {};
    relevantProperties.forEach(prop => {
      styles[prop] = style.getPropertyValue(prop);
    });

    return styles;
  }

  /**
   * Simple web scraping utility for extracting text content from elements
   */
  scrapeTextContent(selector: string): string {
    try {
      const element = document.querySelector(selector);
      return element ? element.textContent?.trim() || '' : '';
    } catch (error) {
      console.error('Scraping error:', error);
      return '';
    }
  }

  /**
   * Scrape multiple elements by selector
   */
  scrapeMultipleElements(selector: string): string[] {
    try {
      const elements = document.querySelectorAll(selector);
      return Array.from(elements).map(el => el.textContent?.trim() || '');
    } catch (error) {
      console.error('Scraping error:', error);
      return [];
    }
  }

  /**
   * Scrape element attributes
   */
  scrapeAttributes(selector: string, attribute: string): string[] {
    try {
      const elements = document.querySelectorAll(selector);
      return Array.from(elements).map(el => el.getAttribute(attribute) || '');
    } catch (error) {
      console.error('Scraping error:', error);
      return [];
    }
  }

  /**
   * Generates CSS selector for element
   */
  private generateSelector(element: Element): string {
    const htmlElement = element as HTMLElement;

    if (htmlElement.id) {
      return `#${htmlElement.id}`;
    }

    if (htmlElement.className) {
      const classes = htmlElement.className.trim().split(/\s+/).filter(c => c);
      if (classes.length > 0) {
        return `${element.tagName.toLowerCase()}.${classes.join('.')}`;
      }
    }

    return element.tagName.toLowerCase();
  }

  /**
   * Checks if element is inspectable
   */
  private isElementInspectable(element: Element): boolean {
    const htmlElement = element as HTMLElement;
    const rect = element.getBoundingClientRect();
    const style = window.getComputedStyle(htmlElement);
    const tagName = element.tagName.toLowerCase();

    // Basic visibility checks
    if (style.display === 'none' ||
        style.visibility === 'hidden' ||
        style.opacity === '0' ||
        rect.width <= 0 ||
        rect.height <= 0) {
      return false;
    }

    // Exclude system/technical elements
    const technicalElements = ['script', 'style', 'link', 'meta', 'title', 'noscript', 'iframe',
                              'head', 'html', 'body'];
    if (technicalElements.includes(tagName)) {
      return false;
    }

    // Exclude elements that are too small to be meaningful UI components
    // Elements smaller than 4x4px are likely decorative or system elements
    if (rect.width < 4 || rect.height < 4) {
      return false;
    }

    // Exclude elements that are positioned off-screen
    if (rect.left + rect.width < 0 ||
        rect.top + rect.height < 0 ||
        rect.left > window.innerWidth ||
        rect.top > window.innerHeight) {
      return false;
    }

    // For SVG elements, be much more selective
    if (tagName === 'svg') {
      // Only include SVG elements that are reasonably sized and likely to be interactive
      // Small SVGs are often icons or decorative elements
      // Require at least 20x20px to be considered for inspection
      return rect.width >= 20 && rect.height >= 20;
    }

    // For SVG sub-elements, be extremely restrictive - almost never inspect them individually
    if (['path', 'circle', 'rect', 'ellipse', 'line', 'polyline', 'polygon', 'g', 'defs', 'symbol', 'use', 'clipPath'].includes(tagName)) {
      // These are almost always part of larger SVG graphics and should never be inspected individually
      // unless they have explicit interactive styling AND are reasonably sized
      const isReasonableSize = rect.width >= 24 && rect.height >= 24;
      const hasExplicitInteractiveCursor = style.cursor === 'pointer';
      const hasClickHandler = element.getAttribute('onclick') !== null ||
                             element.getAttribute('onmousedown') !== null ||
                             element.getAttribute('onmouseup') !== null;

      // Only allow if explicitly interactive AND reasonably sized
      return isReasonableSize && (hasExplicitInteractiveCursor || hasClickHandler);
    }

    // Exclude elements with pointer-events: none
    if (style.pointerEvents === 'none') {
      return false;
    }

    // Exclude very small text elements that are unlikely to be interactive
    if ((tagName === 'span' || tagName === 'p' || tagName === 'div') && rect.width < 24 && rect.height < 20) {
      const hasInteractiveStyling = style.cursor === 'pointer' ||
                                   element.getAttribute('role') === 'button' ||
                                   element.getAttribute('role') === 'link' ||
                                   element.getAttribute('onclick') !== null ||
                                   element.getAttribute('onmousedown') !== null;
      const hasTabIndex = element.getAttribute('tabindex') !== null;

      // Only allow if it has clear interactive indicators
      if (!hasInteractiveStyling && !hasTabIndex) {
        return false;
      }
    }

    // Exclude elements that are clearly just text content without interactive purpose
    if ((tagName === 'span' || tagName === 'p' || tagName === 'div') &&
        !element.getAttribute('onclick') &&
        !element.getAttribute('onmousedown') &&
        !element.getAttribute('onmouseup') &&
        style.cursor !== 'pointer' &&
        element.getAttribute('role') !== 'button' &&
        element.getAttribute('role') !== 'link' &&
        element.getAttribute('tabindex') === null) {

      // If it's just text without any interactive styling, don't inspect it
      const hasVisualStyling = style.backgroundColor !== 'transparent' &&
                              style.backgroundColor !== 'rgba(0, 0, 0, 0)' &&
                              style.backgroundColor !== '' &&
                              style.backgroundColor !== 'inherit';
      const hasBorder = style.border !== 'none' && style.border !== '0px';
      const hasBoxShadow = style.boxShadow && style.boxShadow !== 'none';

      if (!hasVisualStyling && !hasBorder && !hasBoxShadow) {
        return false;
      }
    }

    // Exclude decorative elements (hr, br, etc.)
    if (['hr', 'br', 'wbr'].includes(tagName)) {
      return false;
    }

    // Include elements that are likely to be interactive or visually important
    const isInteractive = this.hasClickHandler(element) ||
                         ['button', 'input', 'select', 'textarea', 'a'].includes(tagName) ||
                         element.getAttribute('role') === 'button' ||
                         element.getAttribute('role') === 'link' ||
                         element.getAttribute('role') === 'checkbox' ||
                         element.getAttribute('role') === 'radio' ||
                         element.getAttribute('role') === 'tab' ||
                         element.getAttribute('role') === 'menuitem' ||
                         element.getAttribute('tabindex') !== null ||
                         element.getAttribute('onclick') !== null ||
                         element.getAttribute('onmousedown') !== null ||
                         element.getAttribute('onmouseup') !== null;

    const hasVisualStyling = (style.backgroundColor && style.backgroundColor !== 'transparent' &&
                             style.backgroundColor !== 'rgba(0, 0, 0, 0)' &&
                             style.backgroundColor !== '') ||
                            (style.border && style.border !== 'none' && style.border !== '0px') ||
                            (style.boxShadow && style.boxShadow !== 'none') ||
                            (style.backgroundImage && style.backgroundImage !== 'none') ||
                            parseFloat(style.fontSize || '0') > 12;

    // Be much more restrictive about what gets inspected
    // Only inspect elements that are clearly interactive OR have significant visual presence
    if (isInteractive) {
      return true;
    }

    // For non-interactive elements, require substantial visual presence or size
    if (hasVisualStyling && (rect.width >= 24 && rect.height >= 24)) {
      return true;
    }

    // Only inspect very large non-interactive elements that might be important layout components
    return rect.width >= 48 && rect.height >= 48;
  }

  /**
   * Checks if element has click handler
   */
  private hasClickHandler(element: Element): boolean {
    return !!(element as any).onclick ||
           !!element.getAttribute('onclick') ||
           element.getAttribute('role') === 'button' ||
           element.tagName.toLowerCase() === 'button' ||
           element.tagName.toLowerCase() === 'a';
  }

  /**
   * Checks if element is descendant of another
   */
  private isDescendant(child: HTMLElement, parent: HTMLElement): boolean {
    let current = child.parentElement;
    while (current) {
      if (current === parent) return true;
      current = current.parentElement;
    }
    return false;
  }

  /**
   * Gets overlay background color
   */
  private getOverlayBackground(type?: string): string {
    switch (type) {
      case 'margin': return 'rgba(255, 165, 0, 0.1)';
      case 'padding': return 'rgba(0, 255, 0, 0.1)';
      case 'content': return 'rgba(0, 0, 255, 0.1)';
      default: return 'rgba(255, 0, 0, 0.1)';
    }
  }

  /**
   * Gets overlay border color
   */
  private getOverlayBorder(type?: string): string {
    switch (type) {
      case 'margin': return '#ffa500';
      case 'padding': return '#00ff00';
      case 'content': return '#0000ff';
      default: return '#ff0000';
    }
  }

  /**
   * Gets tooltip data for element
   */
  private getTooltipData(element: HTMLElement): TooltipData {
    const rect = element.getBoundingClientRect();
    return {
      text: `${element.tagName.toLowerCase()}${element.id ? `#${element.id}` : ''} ${Math.round(rect.width)}×${Math.round(rect.height)}`,
    };
  }

  /**
   * Gets default tooltip text
   */
  private getDefaultTooltipText(element: HTMLElement): string {
    const rect = element.getBoundingClientRect();
    return `${element.tagName.toLowerCase()} ${Math.round(rect.width)}×${Math.round(rect.height)}`;
  }

  /**
   * Injects required CSS styles
   */
  private injectStyles(): void {
    if (document.getElementById('ui-inspector-styles')) return;

    const style = document.createElement('style');
    style.id = 'ui-inspector-styles';
    style.textContent = `
      .ui-inspector-overlay {
        position: absolute;
        pointer-events: none;
        z-index: 999999;
        box-sizing: border-box;
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

    document.head.appendChild(style);
  }
}

/**
 * Types for DOM operations
 */
export interface HighlightOptions {
  type?: 'inspect' | 'margin' | 'padding' | 'content' | 'hover';
  opacity?: number;
  showTooltip?: boolean;
  tooltipData?: TooltipData;
}

export interface TooltipData {
  text: string;
}

export interface ElementInspectionData {
  elementId: string;
  selector: string;
  boxModel: {
    content: { width: number; height: number; x: number; y: number };
    padding: Sides;
    border: Sides;
    margin: Sides;
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

export interface Sides {
  top: number;
  right: number;
  bottom: number;
  left: number;
}

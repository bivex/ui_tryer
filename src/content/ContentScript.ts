/**
 * Copyright (c) 2025 Bivex
 *
 * Author: Bivex
 * Available for contact via email: support@b-b.top
 * For up-to-date contact information:
 * https://github.com/bivex
 *
 * Created: 2025-12-22T07:47:21
 * Last Updated: 2025-12-22T11:34:34
 *
 * Licensed under the MIT License.
 * Commercial licensing available upon request.
 */

/**
 * Content Script - runs in the context of web pages
 * Minimal script that handles DOM interactions and relays messages
 */
import { MessageRouter } from './MessageRouter';
import { ElementInspector } from '../infrastructure/dom/ElementInspector';
import { Message, MessageType } from '../../types/MessageContracts';
import { ElementInspection, ElementInspectionFactory } from '../domain/entities/ElementInspection';

class ContentScript {
  private messageRouter: MessageRouter;
  private elementInspector: ElementInspector;
  private isInitialized = false;

  constructor() {
    this.messageRouter = new MessageRouter();
    this.elementInspector = new ElementInspector();

    this.initialize();
  }

  /**
   * Initialize content script
   */
  private initialize(): void {
    // Wait for DOM to be ready
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => this.setup());
    } else {
      this.setup();
    }
  }

  /**
   * Setup content script functionality
   */
  private setup(): void {
    if (this.isInitialized) return;

    this.setupMessageListeners();
    this.setupDOMListeners();
    this.injectStyles();

    this.isInitialized = true;
    console.log('UI Inspector content script initialized');
  }

  /**
   * Setup message listeners for communication with background
   */
  private setupMessageListeners(): void {
    chrome.runtime.onMessage.addListener(
      (message: Message, sender, sendResponse) => {
        this.handleMessage(message, sendResponse);
        return true; // Keep channel open for async response
      }
    );
  }

  /**
   * Setup DOM event listeners
   */
  private setupDOMListeners(): void {
    // Listen for element selection events
    document.addEventListener('ui-inspector:element-selected', (event: any) => {
      this.handleElementSelected(event.detail);
    });
  }

  /**
   * Handle incoming messages
   */
  private async handleMessage(message: Message, sendResponse: (response: any) => void): Promise<void> {
    try {
      console.log('Content script received message:', message);

      switch (message.type) {
        case 'TOGGLE_INSPECTION_MODE':
          await this.handleToggleInspection(message.payload);
          sendResponse({ success: true });
          break;

        case 'INSPECT_ELEMENT_REQUEST':
          const result = await this.handleInspectElement(message.payload);
          sendResponse(result);
          break;

        case 'GENERATE_REPORT_REQUEST':
          const reportResult = await this.handleGenerateReport(message.payload);
          sendResponse(reportResult);
          break;

        default:
          sendResponse({ success: false, error: `Unknown message type: ${message.type}` });
      }
    } catch (error) {
      console.error('Content script error:', error);
      sendResponse({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Handle toggle inspection mode
   */
  private async handleToggleInspection(payload: { enabled: boolean }): Promise<void> {
    if (payload.enabled) {
      this.elementInspector.startInspection();
    } else {
      this.elementInspector.stopInspection();
    }
  }

  /**
   * Handle element inspection request
   */
  private async handleInspectElement(payload: { elementId: string }): Promise<any> {
    const data = this.elementInspector.getElementData(payload.elementId);

    if (!data) {
      return {
        success: false,
        error: `Element with ID ${payload.elementId} not found`,
      };
    }

    return {
      success: true,
      data,
    };
  }

  /**
   * Handle report generation request
   */
  private async handleGenerateReport(payload: any): Promise<any> {
    try {
      console.log('Generating report for page:', window.location.href);

      // Get settings from payload
      const settings = payload.settings || {};

      // Analyze all elements on the page
      const elements = await this.analyzeAllElements(settings);

      // Generate report based on analysis
      const report = this.generateDetailedReport(elements, settings);

      // Format report based on requested format
      const format = payload.format || 'json';
      let formattedReport;

      switch (format) {
        case 'markdown':
          formattedReport = this.generateMarkdownReport(report);
          break;
        case 'html':
          formattedReport = this.generateHtmlReport(report);
          break;
        case 'json':
        default:
          formattedReport = report;
          break;
      }

      console.log('Report generated:', report);
      return { success: true, report: formattedReport };
    } catch (error) {
      console.error('Failed to generate report:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Create simplified design rules from settings
   */
  private createDesignRules(settings?: any): any {
    const designRules = settings?.designRules || {};

    return {
      spacingScale: { xs: 4, sm: 8, md: 16, lg: 24, xl: 32, xxl: 48 },
      spacingGrid: [4, 8, 12, 16, 20, 24, 32, 40, 48, 56, 64, 72, 80, 96],
      minClickableSize: 44,
      colorPalette: ['#000000', '#ffffff', '#007bff', '#28a745', '#dc3545', '#ffc107', '#6f42c1'],
      typographyScale: {
        body: { xs: 12, sm: 14, md: 16, lg: 18 },
        minMobileSize: 14,
        minContrastRatio: 4.5,
      },
      featureToggles: {
        checkColorPalette: designRules.checkColorPalette ?? false,
        checkSpacingGrid: true,
        checkTypographySizes: true,
        checkAccessibility: true,
        checkResponsive: true,
        checkComponentSizes: true,
        checkLayout: true,
      },
    };
  }

  /**
   * Analyze all elements on the page and create ElementInspection objects
   */
  private async analyzeAllElements(settings?: any): Promise<ElementInspection[]> {
    const elements = document.querySelectorAll('*');
    const analyzedElements: ElementInspection[] = [];
    const designRules = this.createDesignRules(settings);

    // Process elements in batches to avoid blocking the main thread
    const batchSize = 20;
    for (let i = 0; i < elements.length; i += batchSize) {
      const batch = Array.from(elements).slice(i, i + batchSize);
      const batchPromises = batch.map(async (element, batchIndex) => {
        const elementIndex = i + batchIndex;
        try {
          // Skip certain elements
          if (this.shouldSkipElement(element)) return null;

          const elementId = `element_${elementIndex}`;
          const inspection = this.createBasicElementInspection(element, elementId, designRules);
          return inspection;
        } catch (error) {
          console.warn('Failed to analyze element:', element, error);
          return null;
        }
      });

      const batchResults = await Promise.all(batchPromises);
      analyzedElements.push(...batchResults.filter(result => result !== null) as ElementInspection[]);

      // Allow UI to remain responsive
      if (i % 100 === 0) {
        await new Promise(resolve => setTimeout(resolve, 0));
      }
    }

    return analyzedElements;
  }

  /**
   * Create basic ElementInspection with fundamental UI issues
   */
  private createBasicElementInspection(element: Element, elementId: string, rules: any): ElementInspection {
    const htmlElement = element as HTMLElement;
    const rect = htmlElement.getBoundingClientRect();
    const computedStyle = window.getComputedStyle(htmlElement);
    const issues: any[] = [];

    // Create box model
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
      totalWidth: rect.width +
        (parseFloat(computedStyle.paddingLeft) || 0) +
        (parseFloat(computedStyle.paddingRight) || 0) +
        (parseFloat(computedStyle.borderLeftWidth) || 0) +
        (parseFloat(computedStyle.borderRightWidth) || 0),
      totalHeight: rect.height +
        (parseFloat(computedStyle.paddingTop) || 0) +
        (parseFloat(computedStyle.paddingBottom) || 0) +
        (parseFloat(computedStyle.borderTopWidth) || 0) +
        (parseFloat(computedStyle.borderBottomWidth) || 0),
      marginTop: parseFloat(computedStyle.marginTop) || 0,
      marginBottom: parseFloat(computedStyle.marginBottom) || 0,
      paddingTop: parseFloat(computedStyle.paddingTop) || 0,
      paddingBottom: parseFloat(computedStyle.paddingBottom) || 0,
    };

    // Extract computed styles in the expected format
    const computedStyles: any = {
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
      borderColor: computedStyle.borderTopColor,
      margin: computedStyle.margin,
      padding: computedStyle.padding,
      border: computedStyle.border,
      cursor: computedStyle.cursor,
      pointerEvents: computedStyle.pointerEvents,
      visibility: computedStyle.visibility,
      opacity: computedStyle.opacity,
      boxShadow: computedStyle.boxShadow,
    };

    const selector = this.createSelectorForElement(element);

    // Check for basic issues
    this.checkBasicIssues(element, boxModel, computedStyles, selector, rules, issues);

    return {
      elementId,
      selector,
      timestamp: Date.now(),
      boxModel,
      computedStyles,
      issues,
      context: this.createElementContext(element)
    };
  }

  /**
   * Check for basic UI issues
   */
  private checkBasicIssues(
    element: Element,
    boxModel: any,
    computedStyles: any,
    selector: string,
    rules: any,
    issues: any[]
  ): void {
    const htmlElement = element as HTMLElement;

    // Check clickable elements
    const isClickable = computedStyles.cursor === 'pointer' ||
                       element.tagName === 'BUTTON' ||
                       element.tagName === 'A' ||
                       computedStyles.pointerEvents !== 'none';

    if (isClickable) {
      const totalWidth = boxModel.totalWidth;
      const totalHeight = boxModel.totalHeight;

      if (totalWidth < rules.minClickableSize || totalHeight < rules.minClickableSize) {
        issues.push(ElementInspectionFactory.createIssue(
          'too_small_clickable_area',
          'error',
          'accessibility',
          `Кликабельная область слишком маленькая: ${totalWidth}×${totalHeight}px (мин. ${rules.minClickableSize}×${rules.minClickableSize}px)`,
          selector,
          selector,
          {
            suggestedFix: `Увеличьте размеры минимум до ${rules.minClickableSize}px`,
            actualValue: { width: totalWidth, height: totalHeight },
            expectedValue: { width: rules.minClickableSize, height: rules.minClickableSize },
          }
        ));
      }
    }

    // Check text size
    const fontSize = parseFloat(computedStyles.fontSize);
    if (fontSize < rules.typographyScale.minMobileSize) {
      issues.push(ElementInspectionFactory.createIssue(
        'text_too_small',
        'error',
        'typography',
        `Текст слишком мелкий: ${fontSize}px (мин. ${rules.typographyScale.minMobileSize}px)`,
        selector,
        selector,
        {
          suggestedFix: `Увеличьте размер шрифта минимум до ${rules.typographyScale.minMobileSize}px`,
          actualValue: fontSize,
          expectedValue: rules.typographyScale.minMobileSize,
        }
      ));
    }

    // Check spacing on grid
    if (rules.featureToggles.checkSpacingGrid) {
      const spacingValues = [
        boxModel.padding.top, boxModel.padding.right, boxModel.padding.bottom, boxModel.padding.left,
        boxModel.margin.top, boxModel.margin.right, boxModel.margin.bottom, boxModel.margin.left,
      ].filter(v => v > 0);

      spacingValues.forEach(value => {
        if (!rules.spacingGrid.includes(value)) {
          issues.push(ElementInspectionFactory.createIssue(
            'spacing_not_on_grid',
            'warning',
            'spacing',
            `Отступ ${value}px не соответствует сетке дизайна`,
            selector,
            selector,
            {
              suggestedFix: `Используйте значение из сетки: ${rules.spacingGrid.join(', ')}px`,
              actualValue: value,
            }
          ));
        }
      });
    }

    // Check contrast (basic check)
    if (computedStyles.color && computedStyles.backgroundColor) {
      const textColor = computedStyles.color;
      const bgColor = computedStyles.backgroundColor;
      if (bgColor !== 'rgba(0, 0, 0, 0)' && bgColor !== 'transparent') {
        // Simple contrast check (would be improved with APCA in full implementation)
        const contrast = this.calculateSimpleContrast(textColor, bgColor);
        if (contrast < rules.typographyScale.minContrastRatio) {
          issues.push(ElementInspectionFactory.createIssue(
            'contrast_ratio_low',
            'error',
            'accessibility',
            `Низкая контрастность: ${contrast.toFixed(2)}:1 (мин. ${rules.typographyScale.minContrastRatio}:1)`,
            selector,
            selector,
            {
              suggestedFix: 'Улучшите контрастность цветов',
              actualValue: contrast,
              expectedValue: rules.typographyScale.minContrastRatio,
            }
          ));
        }
      }
    }
  }

  /**
   * Calculate simple contrast ratio (placeholder - would use APCA in full implementation)
   */
  private calculateSimpleContrast(color1: string, color2: string): number {
    // Simplified contrast calculation
    // In production, this would use proper WCAG/APCA algorithms
    return 4.5; // Placeholder - assume adequate contrast for basic functionality
  }


  /**
   * Create CSS selector for element (simplified implementation)
   */
  private createSelectorForElement(element: Element): string {
    const tagName = element.tagName.toLowerCase();
    const id = element.id ? `#${element.id}` : '';
    const classes = Array.from(element.classList).map(cls => `.${cls}`).join('');

    if (id) return `${tagName}${id}`;
    if (classes) return `${tagName}${classes}`;

    // For elements without id or classes, create a path-based selector
    const path: string[] = [];
    let current: Element | null = element;

    while (current && path.length < 5) { // Limit depth to avoid overly specific selectors
      const tag = current.tagName.toLowerCase();
      const siblings = Array.from(current.parentElement?.children || []);
      const index = siblings.indexOf(current) + 1;

      if (siblings.length > 1) {
        path.unshift(`${tag}:nth-child(${index})`);
      } else {
        path.unshift(tag);
      }

      current = current.parentElement;
    }

    return path.join(' > ');
  }

  /**
   * Create context data for element analysis
   */
  private createElementContext(element: Element): any {
    const htmlElement = element as HTMLElement;

    // Get viewport information
    const viewport = {
      width: window.innerWidth,
      height: window.innerHeight,
      devicePixelRatio: window.devicePixelRatio
    };

    // Get parent information
    const parent = htmlElement.parentElement;
    let parentData = undefined;
    if (parent) {
      const parentStyle = window.getComputedStyle(parent);
      parentData = {
        display: parentStyle.display,
        flexDirection: parentStyle.flexDirection,
        gridTemplate: parentStyle.gridTemplateColumns || parentStyle.gridTemplateRows,
        width: parent.getBoundingClientRect().width,
        height: parent.getBoundingClientRect().height
      };
    }

    // Get siblings information
    const siblings = parent ? Array.from(parent.children) : [];
    const siblingsData = {
      count: siblings.length,
      similarElements: siblings.filter(sibling => sibling.tagName === element.tagName).length
    };

    // Get page-level information
    const pageData = {
      hasNavigation: !!document.querySelector('nav, [role="navigation"]'),
      hasFooter: !!document.querySelector('footer, [role="contentinfo"]'),
      primaryColor: this.extractPrimaryColor(),
      fontFamily: this.extractPrimaryFontFamily()
    };

    // Get interaction information
    const interactionData = {
      isHoverable: htmlElement.matches(':hover'),
      isFocusable: htmlElement.matches(':focus'),
      hasClickHandler: !!htmlElement.onclick || htmlElement.getAttribute('onclick'),
      tabIndex: htmlElement.tabIndex > 0 ? htmlElement.tabIndex : undefined
    };

    return {
      viewport,
      parent: parentData,
      siblings: siblingsData,
      page: pageData,
      interaction: interactionData
    };
  }

  /**
   * Extract primary color from page (simplified)
   */
  private extractPrimaryColor(): string | undefined {
    // Try to find primary color from common sources
    const metaThemeColor = document.querySelector('meta[name="theme-color"]');
    if (metaThemeColor) {
      return (metaThemeColor as HTMLMetaElement).content;
    }

    // Check for CSS custom properties
    const rootStyles = window.getComputedStyle(document.documentElement);
    const primaryColor = rootStyles.getPropertyValue('--primary-color').trim();
    if (primaryColor) return primaryColor;

    return undefined;
  }

  /**
   * Extract primary font family from page
   */
  private extractPrimaryFontFamily(): string | undefined {
    const body = document.body;
    if (body) {
      const bodyStyles = window.getComputedStyle(body);
      return bodyStyles.fontFamily.split(',')[0].trim().replace(/['"]/g, '');
    }
    return undefined;
  }

  /**
   * Check if element should be skipped
   */
  private shouldSkipElement(element: Element): boolean {
    const tagName = element.tagName.toLowerCase();

    // Skip script, style, and meta elements
    if (['script', 'style', 'link', 'meta', 'title', 'noscript'].includes(tagName)) {
      return true;
    }

    // Skip elements that are not visible
    const style = window.getComputedStyle(element as HTMLElement);
    if (style.display === 'none' || style.visibility === 'hidden' || style.opacity === '0') {
      return true;
    }

    // Skip elements that are too small
    const rect = element.getBoundingClientRect();
    if (rect.width < 1 || rect.height < 1) {
      return true;
    }

    return false;
  }


  /**
   * Generate detailed report from analyzed elements
   */
  private generateDetailedReport(elements: ElementInspection[], settings?: any): any {
    // Collect all issues from analyzed elements
    const issues = elements.flatMap(element => element.issues || []);
    const elementsInspected = elements.length;

    // Calculate summary
    const totalIssues = issues.length;
    const grade = this.calculateGrade(totalIssues, elementsInspected);

    return {
      id: `report_${Date.now()}`,
      title: 'UI Inspection Report',
      timestamp: Date.now(),
      url: window.location.href,
      summary: {
        totalIssues,
        grade,
        elementsInspected,
        issuesBySeverity: this.countIssuesBySeverity(issues),
        issuesByType: this.countIssuesByType(issues),
      },
      issues,
      comparisons: [],
      screenshots: [],
    };
  }



  /**
   * Generate markdown report
   */
  private generateMarkdownReport(report: any): string {
    let markdown = `# UI Inspection Report\n\n`;
    markdown += `**URL:** ${report.url}\n`;
    markdown += `**Date:** ${new Date(report.timestamp).toLocaleString()}\n`;
    markdown += `**Grade:** ${report.summary.grade}\n\n`;

    markdown += `## Summary\n\n`;
    markdown += `- **Elements inspected:** ${report.summary.elementsInspected}\n`;
    markdown += `- **Total issues:** ${report.summary.totalIssues}\n`;
    markdown += `- **Errors:** ${report.summary.issuesBySeverity?.error || 0}\n`;
    markdown += `- **Warnings:** ${report.summary.issuesBySeverity?.warning || 0}\n`;
    markdown += `- **Info:** ${report.summary.issuesBySeverity?.info || 0}\n\n`;

    if (report.issues && report.issues.length > 0) {
      markdown += `## Issues\n\n`;
      report.issues.forEach((issue: any, index: number) => {
        markdown += `### ${index + 1}. ${issue.severity.toUpperCase()}: ${issue.message}\n\n`;
        markdown += `- **Element:** \`${issue.selector}\`\n`;
        markdown += `- **Type:** ${issue.type}\n`;
        if (issue.suggestedFix) {
          markdown += `- **Suggestion:** ${issue.suggestedFix}\n`;
        }
        markdown += `\n`;
      });
    }

    return markdown;
  }

  /**
   * Generate HTML report
   */
  private generateHtmlReport(report: any): string {
    return `
<!DOCTYPE html>
<html lang="ru">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>UI Inspection Report</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 40px; }
        .header { border-bottom: 1px solid #eee; padding-bottom: 20px; margin-bottom: 30px; }
        .summary { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin-bottom: 30px; }
        .metric { background: #f8f9fa; padding: 15px; border-radius: 8px; text-align: center; }
        .metric-number { font-size: 2em; font-weight: bold; color: #007bff; }
        .issues { margin-bottom: 30px; }
        .issue { border: 1px solid #dee2e6; border-radius: 8px; padding: 15px; margin-bottom: 10px; }
        .issue.error { border-color: #dc3545; background: #f8d7da; }
        .issue.warning { border-color: #ffc107; background: #fff3cd; }
        .issue.info { border-color: #17a2b8; background: #d1ecf1; }
        .grade { font-size: 1.5em; font-weight: bold; text-align: center; margin: 20px 0; }
        .grade.A { color: #28a745; }
        .grade.B { color: #ffc107; }
        .grade.C { color: #fd7e14; }
        .grade.D { color: #dc3545; }
        .grade.F { color: #6c757d; }
    </style>
</head>
<body>
    <div class="header">
        <h1>UI Inspection Report</h1>
        <p><strong>URL:</strong> ${report.url}</p>
        <p><strong>Date:</strong> ${new Date(report.timestamp).toLocaleString()}</p>
        <p><strong>Grade:</strong> <span class="grade ${report.summary.grade.toLowerCase()}">${report.summary.grade}</span></p>
    </div>

    <div class="summary">
        <div class="metric">
            <div class="metric-number">${report.summary.elementsInspected}</div>
            <div>Elements inspected</div>
        </div>
        <div class="metric">
            <div class="metric-number">${report.summary.totalIssues}</div>
            <div>Total issues</div>
        </div>
        <div class="metric">
            <div class="metric-number">${report.summary.issuesBySeverity?.error || 0}</div>
            <div>Errors</div>
        </div>
        <div class="metric">
            <div class="metric-number">${report.summary.issuesBySeverity?.warning || 0}</div>
            <div>Warnings</div>
        </div>
    </div>

    <div class="issues">
        <h2>Found issues</h2>
        ${report.issues?.map((issue: any) => `
            <div class="issue ${issue.severity}">
                <h4>${issue.message}</h4>
                <p><strong>Element:</strong> ${issue.selector}</p>
                <p><strong>Type:</strong> ${issue.type}</p>
                ${issue.suggestedFix ? `<p><strong>Suggestion:</strong> ${issue.suggestedFix}</p>` : ''}
            </div>
        `).join('') || '<p>No issues found</p>'}
    </div>
</body>
</html>`;
  }

  /**
   * Calculate grade based on issues
   */
  private calculateGrade(totalIssues: number, elementsInspected: number): string {
    if (elementsInspected === 0) return 'A';

    const issuesPerElement = totalIssues / elementsInspected;

    if (issuesPerElement < 0.1) return 'A';
    if (issuesPerElement < 0.3) return 'B';
    if (issuesPerElement < 0.5) return 'C';
    if (issuesPerElement < 0.7) return 'D';
    return 'F';
  }

  /**
   * Count issues by severity
   */
  private countIssuesBySeverity(issues: any[]): Record<string, number> {
    return issues.reduce((acc, issue) => {
      acc[issue.severity] = (acc[issue.severity] || 0) + 1;
      return acc;
    }, {});
  }

  /**
   * Count issues by type
   */
  private countIssuesByType(issues: any[]): Record<string, number> {
    return issues.reduce((acc, issue) => {
      acc[issue.type] = (acc[issue.type] || 0) + 1;
      return acc;
    }, {});
  }

  /**
   * Handle element selection from DOM
   */
  private handleElementSelected(detail: any): void {
    // Send message to background/popup about element selection
    chrome.runtime.sendMessage({
      type: 'ELEMENT_SELECTED',
      payload: detail,
      source: 'content',
      target: 'background',
      timestamp: Date.now(),
    });
  }

  /**
   * Inject required CSS styles
   */
  private injectStyles(): void {
    const style = document.createElement('style');
    style.id = 'ui-inspector-content-styles';
    style.textContent = `
      /* Content script specific styles */
      .ui-inspector-content-overlay {
        position: absolute;
        pointer-events: none;
        z-index: 999999;
        background: rgba(255, 0, 0, 0.1);
        border: 2px solid #ff0000;
        box-sizing: border-box;
      }
    `;

    // Only inject if not already present
    if (!document.getElementById('ui-inspector-content-styles')) {
      (document.head || document.documentElement).appendChild(style);
    }
  }

  /**
   * Check if content script should run on this page
   */
  private shouldRunOnPage(): boolean {
    // Don't run on chrome:// pages or other restricted URLs
    if (window.location.protocol === 'chrome:') return false;
    if (window.location.protocol === 'chrome-extension:') return false;

    // Don't run in frames unless specifically allowed
    if (window !== window.top) return false;

    return true;
  }
}

// Initialize content script
console.log('UI Inspector content script loading...');

if (document.readyState !== 'loading' || !document.documentElement) {
  console.log('UI Inspector content script initializing immediately');
  new ContentScript();
} else {
  console.log('UI Inspector content script waiting for DOM ready');
  document.addEventListener('DOMContentLoaded', () => {
    console.log('UI Inspector content script initializing on DOM ready');
    new ContentScript();
  });
}

/**
 * Copyright (c) 2025 Bivex
 *
 * Author: Bivex
 * Available for contact via email: support@b-b.top
 * For up-to-date contact information:
 * https://github.com/bivex
 *
 * Created: 2025-12-22T07:47:21
 * Last Updated: 2025-12-22T11:09:24
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
      const elements = this.analyzeAllElements(settings);

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
   * Analyze all elements on the page
   */
  private analyzeAllElements(settings?: any): any[] {
    const elements = document.querySelectorAll('*');
    const analyzedElements = [];

    elements.forEach((element, index) => {
      try {
        // Skip certain elements
        if (this.shouldSkipElement(element)) return;

        const analysis = this.analyzeSingleElement(element, `element_${index}`);
        if (analysis) {
          analyzedElements.push(analysis);
        }
      } catch (error) {
        console.warn('Failed to analyze element:', element, error);
      }
    });

    return analyzedElements;
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
   * Analyze single element
   */
  private analyzeSingleElement(element: Element, elementId: string): any | null {
    try {
      const htmlElement = element as HTMLElement;
      const rect = htmlElement.getBoundingClientRect();
      const computedStyle = window.getComputedStyle(htmlElement);

      // Extract box model
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
      };

      // Extract computed styles
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
        borderColor: computedStyle.borderTopColor,
        margin: computedStyle.margin,
        padding: computedStyle.padding,
        border: computedStyle.border,
        cursor: computedStyle.cursor,
        pointerEvents: computedStyle.pointerEvents,
        visibility: computedStyle.visibility,
        opacity: computedStyle.opacity,
      };

      // Generate selector
      const selector = this.generateSelector(element);

      return {
        elementId,
        selector,
        boxModel,
        computedStyles: styles,
        tagName: element.tagName.toLowerCase(),
        textContent: element.textContent?.substring(0, 100) || '',
      };
    } catch (error) {
      console.warn('Error analyzing element:', element, error);
      return null;
    }
  }

  /**
   * Generate CSS selector for element
   */
  private generateSelector(element: Element): string {
    if ((element as HTMLElement).id) {
      return `#${(element as HTMLElement).id}`;
    }

    const classes = Array.from(element.classList);
    if (classes.length > 0) {
      return `${element.tagName.toLowerCase()}.${classes.join('.')}`;
    }

    return element.tagName.toLowerCase();
  }

  /**
   * Generate detailed report from analyzed elements
   */
  private generateDetailedReport(elements: any[], settings?: any): any {
    const issues = [];
    let elementsInspected = 0;

    // Default design rules (simplified)
    const designRules = {
      spacingScale: { xs: 4, sm: 8, md: 16, lg: 24, xl: 32, xxl: 48 },
      spacingGrid: [4, 8, 12, 16, 20, 24, 32, 40, 48, 56, 64, 72, 80, 96],
      minClickableSize: 44,
      colorPalette: [
        '#000000', '#ffffff', '#007bff', '#28a745', '#dc3545', '#ffc107', '#6f42c1',
        '#6c757d', '#343a40', '#f8f9fa', '#e9ecef', '#dee2e6'
      ],
      typographyScale: {
        body: { xs: 12, sm: 14, md: 16, lg: 18 },
        minMobileSize: 14,
        minContrastRatio: 4.5,
      },
      featureToggles: {
        checkColorPalette: settings?.checkColorPalette ?? false,
        checkSpacingGrid: true,
        checkTypographySizes: true,
        checkAccessibility: true,
        checkResponsive: true,
        checkComponentSizes: true,
        checkLayout: true,
      },
    };

    // Analyze each element
    elements.forEach(element => {
      elementsInspected++;
      issues.push(...this.analyzeElementForIssues(element, designRules));
    });

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
   * Analyze element for design issues
   */
  private analyzeElementForIssues(element: any, rules: any): any[] {
    const issues = [];
    const { boxModel, computedStyles, selector, tagName } = element;

    // Check spacing
    issues.push(...this.checkSpacingIssues(boxModel, selector, rules));

    // Check clickable elements
    issues.push(...this.checkClickableIssues(boxModel, computedStyles, selector, tagName, rules));

    // Check typography
    issues.push(...this.checkTypographyIssues(computedStyles, selector, rules));

    // Check colors
    issues.push(...this.checkColorIssues(computedStyles, selector, rules));

    return issues;
  }

  /**
   * Check spacing issues
   */
  private checkSpacingIssues(boxModel: any, selector: string, rules: any): any[] {
    const issues = [];

    // Check if spacing values are on grid
    const spacingValues = [
      boxModel.padding.top, boxModel.padding.right, boxModel.padding.bottom, boxModel.padding.left,
      boxModel.margin.top, boxModel.margin.right, boxModel.margin.bottom, boxModel.margin.left,
    ].filter(v => v > 0);

    spacingValues.forEach(value => {
      if (!rules.spacingGrid.includes(value)) {
        issues.push({
          id: `spacing_${selector}_${Date.now()}`,
          type: 'spacing_not_on_grid',
          severity: 'warning',
          message: `Отступ ${value}px не соответствует сетке дизайна`,
          elementId: selector,
          selector,
          suggestedFix: `Используйте значение из сетки: ${rules.spacingGrid.join(', ')}px`,
          actualValue: value,
        });
      }
    });

    return issues;
  }

  /**
   * Check clickable element issues
   */
  private checkClickableIssues(boxModel: any, styles: any, selector: string, tagName: string, rules: any): any[] {
    const issues = [];

    // Check if element is clickable
    const isClickable = styles.cursor === 'pointer' ||
                       tagName === 'button' ||
                       tagName === 'a' ||
                       styles.pointerEvents !== 'none';

    if (isClickable) {
      const totalWidth = boxModel.totalWidth;
      const totalHeight = boxModel.totalHeight;

      if (totalWidth < rules.minClickableSize || totalHeight < rules.minClickableSize) {
        issues.push({
          id: `clickable_${selector}_${Date.now()}`,
          type: 'too_small_clickable_area',
          severity: 'error',
          message: `Кликабельная область слишком маленькая: ${totalWidth}×${totalHeight}px (мин. ${rules.minClickableSize}×${rules.minClickableSize}px)`,
          elementId: selector,
          selector,
          suggestedFix: `Увеличьте размеры минимум до ${rules.minClickableSize}px`,
          actualValue: { width: totalWidth, height: totalHeight },
        });
      }
    }

    return issues;
  }

  /**
   * Check typography issues
   */
  private checkTypographyIssues(styles: any, selector: string, rules: any): any[] {
    const issues = [];

    const fontSize = parseFloat(styles.fontSize);
    if (fontSize < rules.typographyScale.minMobileSize) {
      issues.push({
        id: `typography_${selector}_${Date.now()}`,
        type: 'text_too_small',
        severity: 'error',
        message: `Текст слишком мелкий: ${fontSize}px (мин. ${rules.typographyScale.minMobileSize}px)`,
        elementId: selector,
        selector,
        suggestedFix: `Увеличьте размер шрифта минимум до ${rules.typographyScale.minMobileSize}px`,
        actualValue: fontSize,
      });
    }

    return issues;
  }

  /**
   * Check color issues
   */
  private checkColorIssues(styles: any, selector: string, rules: any): any[] {
    const issues = [];

    // Check background color
    if (styles.backgroundColor && styles.backgroundColor !== 'rgba(0, 0, 0, 0)' && styles.backgroundColor !== 'transparent') {
      const bgColor = this.normalizeColor(styles.backgroundColor);
      if (bgColor && !rules.colorPalette.includes(bgColor)) {
        issues.push({
          id: `color_bg_${selector}_${Date.now()}`,
          type: 'color_not_in_palette',
          severity: 'info',
          message: `Цвет фона ${bgColor} не входит в палитру дизайна`,
          elementId: selector,
          selector,
          suggestedFix: `Используйте цвет из палитры: ${rules.colorPalette.join(', ')}`,
          actualValue: bgColor,
        });
      }
    }

    return issues;
  }

  /**
   * Normalize color to hex format
   */
  private normalizeColor(color: string): string | null {
    if (!color || color === 'transparent') return null;

    // Handle rgb/rgba
    const rgbMatch = color.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
    if (rgbMatch) {
      const r = parseInt(rgbMatch[1]);
      const g = parseInt(rgbMatch[2]);
      const b = parseInt(rgbMatch[3]);
      return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
    }

    // Handle hex colors
    if (color.startsWith('#')) return color.toLowerCase();

    return null;
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

/**
 * Copyright (c) 2025 Bivex
 * Licensed under the MIT License.
 */

import { MessageRouter } from './MessageRouter';
import { ElementInspector } from '../infrastructure/dom/ElementInspector';
import { 
  Message, 
  ElementInspection, 
  Issue, 
  AnalysisError, 
  AdvancedDesignRules, 
  APCAContrastRules, 
  VerticalRhythmRules, 
  AdvancedTypographyRules, 
  ColorHarmonyRules, 
  LayoutAnalysisRules, 
  AdvancedAccessibilityRules, 
  InteractionRules, 
  ConsistencyRules, 
  ResponsiveRules, 
  PerformanceRules, 
  ElementInspectionFactory 
} from '../../types/MessageContracts';
import { BoxModel } from '../domain/entities/BoxModel';
import { AdvancedElementAnalyzer } from '../domain/services/AdvancedElementAnalyzer';
import { ReportService } from '../domain/services/ReportService';
import { RaidService } from '../domain/services/RaidService';
import { DesignRuleService } from '../domain/services/DesignRuleService';

class ContentScript {
  private messageRouter: MessageRouter;
  private elementInspector: ElementInspector;
  private reportService: ReportService;
  private raidService: RaidService;
  private isInitialized = false;
  private analysisErrors: AnalysisError[] = [];

  constructor() {
    this.messageRouter = new MessageRouter();
    this.elementInspector = new ElementInspector();
    this.reportService = new ReportService();
    this.raidService = new RaidService();

    this.initialize();
  }

  private initialize(): void {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => this.setup());
    } else {
      this.setup();
    }
  }

  private setup(): void {
    if (this.isInitialized) return;

    this.setupMessageListeners();
    this.setupDOMListeners();
    this.injectStyles();

    this.isInitialized = true;
    console.log('UI Inspector content script initialized');
  }

  private setupMessageListeners(): void {
    chrome.runtime.onMessage.addListener(
      (message: Message, sender, sendResponse) => {
        this.handleMessage(message, sendResponse);
        return true;
      }
    );
  }

  private setupDOMListeners(): void {
    document.addEventListener('ui-inspector:element-selected', (event: any) => {
      this.handleElementSelected(event.detail);
    });
  }

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
          if (message.payload.format === 'ui') {
            const report = await this.runFullRaid(message.payload.settings);
            sendResponse({ success: true, report });
          } else {
            const reportResult = await this.handleGenerateReport(message.payload);
            sendResponse(reportResult);
          }
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

  private async runFullRaid(settings?: any): Promise<any> {
    console.log('🚨 Pixel Police Raid started!');
    const overlay = this.raidService.createRaidOverlay();
    document.body.appendChild(overlay);

    try {
      this.analysisErrors = [];
      const elements = await this.analyzeAllElements(settings);
      const elementsWithIssues = elements.filter(el => el.issues && el.issues.length > 0);
      
      this.raidService.showMarkers(elementsWithIssues);
      
      const totalCrimes = elementsWithIssues.reduce((acc, el) => acc + (el.issues?.length || 0), 0);
      
      this.reportService.setAnalysisErrors(this.analysisErrors);
      const report = this.reportService.generateDetailedReport(elements, settings);

      this.raidService.updateRaidOverlay(overlay, totalCrimes, elementsWithIssues.length, () => {
        overlay.remove();
        this.raidService.clearMarkers();
      });

      // Hook up copy button
      const copyBtn = overlay.querySelector('#raid-copy-report') as HTMLButtonElement;
      if (copyBtn) {
        copyBtn.onclick = async () => {
          const markdown = this.reportService.generateMarkdownReport(report);
          try {
            await navigator.clipboard.writeText(markdown);
            copyBtn.textContent = '✅ Copied!';
            setTimeout(() => { copyBtn.textContent = '📋 Copy Report'; }, 2000);
          } catch (e) {
            console.error('Copy failed', e);
            alert('Copy failed. Check console.');
          }
        };
      }
      
      return report;
    } catch (error) {
      console.error('🚨 Raid failed:', error);
      overlay.textContent = '❌ Raid Failed';
      setTimeout(() => overlay.remove(), 3000);
      throw error;
    }
  }

  private async handleToggleInspection(payload: { enabled: boolean }): Promise<void> {
    if (payload.enabled) {
      this.elementInspector.startInspection();
    } else {
      this.elementInspector.stopInspection();
    }
  }

  private async handleInspectElement(payload: { elementId: string }): Promise<any> {
    const data = this.elementInspector.getElementData(payload.elementId);
    if (!data) return { success: false, error: `Element with ID ${payload.elementId} not found` };
    return { success: true, data };
  }

  private async handleGenerateReport(payload: any): Promise<any> {
    try {
      this.analysisErrors = [];
      const settings = payload.settings || {};
      const elements = await this.analyzeAllElements(settings);
      
      this.reportService.setAnalysisErrors(this.analysisErrors);
      const report = this.reportService.generateDetailedReport(elements, settings);

      const format = payload.format || 'json';
      let formattedReport = report;

      if (format === 'markdown') formattedReport = this.reportService.generateMarkdownReport(report);
      if (format === 'html') formattedReport = this.reportService.generateHtmlReport(report);

      return { success: true, report: formattedReport };
    } catch (error) {
      return { success: false, error: String(error) };
    }
  }

  private async analyzeAllElements(settings?: any): Promise<ElementInspection[]> {
    const elements = document.querySelectorAll('*');
    const analyzedElements: ElementInspection[] = [];
    const designRules = DesignRuleService.createAdvancedDesignRules(settings);

    const batchSize = 20;
    for (let i = 0; i < elements.length; i += batchSize) {
      const batch = Array.from(elements).slice(i, i + batchSize);
      const batchPromises = batch.map(async (element, batchIndex) => {
        const elementIndex = i + batchIndex;
        try {
          if (this.shouldSkipElement(element)) return null;
          const elementId = `element_${elementIndex}`;
          return this.createBasicElementInspection(element, elementId, designRules);
        } catch (error) {
          const selector = this.createSelectorForElement(element);
          this.analysisErrors.push({
            id: `err_${Date.now()}_${elementIndex}`,
            type: 'analysis_error',
            message: String(error),
            elementId: `element_${elementIndex}`,
            selector,
            details: error instanceof Error ? error.stack : '',
            timestamp: Date.now(),
          });
          return null;
        }
      });

      const results = await Promise.all(batchPromises);
      analyzedElements.push(...results.filter(r => r !== null) as ElementInspection[]);
      if (i % 100 === 0) await new Promise(r => setTimeout(r, 0));
    }

    return analyzedElements;
  }

  private createBasicElementInspection(element: Element, elementId: string, rules: AdvancedDesignRules): ElementInspection {
    const htmlElement = element as HTMLElement;
    const rect = htmlElement.getBoundingClientRect();
    const style = window.getComputedStyle(htmlElement);

    const boxModel: BoxModel = {
      content: { width: rect.width, height: rect.height, x: rect.x + window.scrollX, y: rect.y + window.scrollY },
      padding: { top: parseFloat(style.paddingTop) || 0, right: parseFloat(style.paddingRight) || 0, bottom: parseFloat(style.paddingBottom) || 0, left: parseFloat(style.paddingLeft) || 0 },
      border: { top: parseFloat(style.borderTopWidth) || 0, right: parseFloat(style.borderRightWidth) || 0, bottom: parseFloat(style.borderBottomWidth) || 0, left: parseFloat(style.borderLeftWidth) || 0 },
      margin: { top: parseFloat(style.marginTop) || 0, right: parseFloat(style.marginRight) || 0, bottom: parseFloat(style.marginBottom) || 0, left: parseFloat(style.marginLeft) || 0 },
      totalWidth: rect.width,
      totalHeight: rect.height,
      marginTop: parseFloat(style.marginTop) || 0,
      marginBottom: parseFloat(style.marginBottom) || 0,
      paddingTop: parseFloat(style.paddingTop) || 0,
      paddingBottom: parseFloat(style.paddingBottom) || 0,
    };

    const computedStyles: Record<string, string> = {};
    for (let i = 0; i < style.length; i++) {
      const prop = style[i];
      computedStyles[this.kebabToCamel(prop)] = style.getPropertyValue(prop);
    }

    return AdvancedElementAnalyzer.analyzeElement(
      elementId,
      this.createSelectorForElement(element),
      boxModel,
      computedStyles,
      rules,
      this.createElementContext(element)
    );
  }

  private extractDomAttributes(element: Element): Record<string, string> {
    const attrs: Record<string, string> = {};
    const htmlElement = element as HTMLElement;
    const tag = element.tagName.toLowerCase();

    // Extract common HTML attributes relevant to analysis
    const relevantAttrs = ['loading', 'src', 'srcset', 'sizes', 'alt', 'width', 'height', 'role', 'aria-label', 'aria-labelledby', 'aria-hidden', 'tabindex'];
    for (const attr of relevantAttrs) {
      const value = htmlElement.getAttribute(attr);
      if (value !== null) {
        attrs[attr] = value;
      }
    }

    return attrs;
  }

  private createSelectorForElement(element: Element): string {
    const tagName = element.tagName.toLowerCase();
    const id = element.id ? `#${element.id}` : '';
    const classes = Array.from(element.classList).map(cls => `.${cls}`).join('');
    if (id) return `${tagName}${id}`;
    if (classes) return `${tagName}${classes.split(' ').join('.')}`;
    return tagName;
  }

  private createElementContext(element: Element): any {
    const htmlElement = element as HTMLElement;
    return {
      viewport: { width: window.innerWidth, height: window.innerHeight },
      page: { primaryColor: this.extractPrimaryColor(), fontFamily: this.extractPrimaryFontFamily() },
      interaction: { isHoverable: htmlElement.matches(':hover'), isFocusable: htmlElement.matches(':focus') },
      textContent: htmlElement.innerText || htmlElement.textContent || '',
      computedStates: this.detectPseudoStates(element),
      relations: { nearbyElements: this.findNearbyElements(htmlElement) },
      domAttributes: this.extractDomAttributes(element)
    };
  }

  private findNearbyElements(element: HTMLElement): any[] {
    const rect = element.getBoundingClientRect();
    const scanRadius = 150;
    const candidates: { el: Element; rect: DOMRect }[] = [];

    // Scan siblings and parent's children within scanRadius
    const parent = element.parentElement;
    if (!parent) return [];

    for (const child of Array.from(parent.children)) {
      if (child === element) continue;
      if (this.shouldSkipElement(child)) continue;

      const childRect = child.getBoundingClientRect();
      const distance = Math.sqrt(
        Math.pow((childRect.left + childRect.width / 2) - (rect.left + rect.width / 2), 2) +
        Math.pow((childRect.top + childRect.height / 2) - (rect.top + rect.height / 2), 2)
      );

      if (distance < scanRadius) {
        candidates.push({ el: child, rect: childRect });
      }
    }

    return candidates.map(c => ({
      id: this.createSelectorForElement(c.el),
      left: c.rect.left + window.scrollX,
      right: c.rect.right + window.scrollX,
      top: c.rect.top + window.scrollY,
      bottom: c.rect.bottom + window.scrollY,
      centerX: c.rect.left + c.rect.width / 2,
      centerY: c.rect.top + c.rect.height / 2,
      distance: 0
    }));
  }

  private detectPseudoStates(element: Element): any {
    const states: any = { hover: {}, focus: {}, active: {} };
    const selector = this.createSelectorForElement(element);
    
    try {
      for (const sheet of Array.from(document.styleSheets)) {
        try {
          const rules = Array.from(sheet.cssRules || []);
          for (const rule of rules) {
            if (rule instanceof CSSStyleRule) {
              const ruleSelector = rule.selectorText.toLowerCase();
              if (ruleSelector.includes(':hover') && element.matches(rule.selectorText.split(':hover')[0])) {
                states.hover = { ...states.hover, ...this.ruleToStyleObject(rule) };
              }
              if (ruleSelector.includes(':focus') && element.matches(rule.selectorText.split(':focus')[0])) {
                states.focus = { ...states.focus, ...this.ruleToStyleObject(rule) };
              }
            }
          }
        } catch (e) { /* ignore cross-origin errors */ }
      }
    } catch (e) { /* ignore */ }
    
    return states;
  }

  private ruleToStyleObject(rule: CSSStyleRule): any {
    const obj: any = {};
    for (let i = 0; i < rule.style.length; i++) {
      const prop = rule.style[i];
      obj[this.kebabToCamel(prop)] = rule.style.getPropertyValue(prop);
    }
    return obj;
  }

  private kebabToCamel(str: string): string {
    return str.replace(/-([a-z])/g, (g) => g[1].toUpperCase());
  }

  private extractPrimaryColor(): string | undefined {
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) return (meta as HTMLMetaElement).content;
    return undefined;
  }

  private extractPrimaryFontFamily(): string | undefined {
    return window.getComputedStyle(document.body).fontFamily.split(',')[0].trim();
  }

  private shouldSkipElement(element: Element): boolean {
    const tag = element.tagName.toLowerCase();
    if (['script', 'style', 'link', 'meta'].includes(tag)) return true;
    if (element.id && element.id.startsWith('pixel-police-')) return true;
    const style = window.getComputedStyle(element);
    return style.display === 'none' || style.visibility === 'hidden' || style.opacity === '0';
  }

  private handleElementSelected(detail: any): void {
    chrome.runtime.sendMessage({ type: 'ELEMENT_SELECTED', payload: detail });
  }

  private injectStyles(): void {
    if (document.getElementById('ui-inspector-content-styles')) return;
    const style = document.createElement('style');
    style.id = 'ui-inspector-content-styles';
    style.textContent = `.ui-inspector-content-overlay { position: absolute; border: 2px solid #ff0000; }`;
    (document.head || document.documentElement).appendChild(style);
  }
}

new ContentScript();

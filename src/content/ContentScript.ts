/**
 * Copyright (c) 2025 Bivex
 *
 * Author: Bivex
 * Available for contact via email: support@b-b.top
 * For up-to-date contact information:
 * https://github.com/bivex
 *
 * Created: 2025-12-22T07:47:21
 * Last Updated: 2025-12-22T11:41:53
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
import { Message, MessageType, ElementInspection, Issue, AnalysisError, AdvancedDesignRules, APCAContrastRules, VerticalRhythmRules, AdvancedTypographyRules, ColorHarmonyRules, LayoutAnalysisRules, AdvancedAccessibilityRules, InteractionRules, ConsistencyRules, ResponsiveRules, PerformanceRules, ElementInspectionFactory } from '../../types/MessageContracts';
import { BoxModel } from '../domain/entities/BoxModel';
import { AdvancedElementAnalyzer } from '../domain/services/AdvancedElementAnalyzer';

class ContentScript {
  private messageRouter: MessageRouter;
  private elementInspector: ElementInspector;
  private isInitialized = false;
  private analysisErrors: AnalysisError[] = [];

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

      // Reset analysis errors for new report
      this.analysisErrors = [];

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
   * Create advanced design rules from settings
   */
  private createAdvancedDesignRules(settings?: any): AdvancedDesignRules {
    const designRules = settings?.designRules || {};

    // Create basic advanced design rules structure
    // This is a simplified version - in production, you'd want more comprehensive defaults
    return {
      apcaContrast: {
        thresholds: {
          bodyText: { min: designRules.apcaContrast?.thresholds?.bodyText?.min || 75, preferred: designRules.apcaContrast?.thresholds?.bodyText?.preferred || 90 },
          headingText: { min: designRules.apcaContrast?.thresholds?.headingText?.min || 75, preferred: designRules.apcaContrast?.thresholds?.headingText?.preferred || 90 },
          largeText: { min: designRules.apcaContrast?.thresholds?.largeText?.min || 60, preferred: designRules.apcaContrast?.thresholds?.largeText?.preferred || 75 },
          uiComponents: { min: designRules.apcaContrast?.thresholds?.uiComponents?.min || 30, preferred: designRules.apcaContrast?.thresholds?.uiComponents?.preferred || 45 },
        },
        adjustments: {
          boldText: designRules.apcaContrast?.adjustments?.boldText || 0,
          italicText: designRules.apcaContrast?.adjustments?.italicText || 0,
          smallText: designRules.apcaContrast?.adjustments?.smallText || 0,
        },
      } as APCAContrastRules,
      verticalRhythm: {
        baseLineHeight: designRules.verticalRhythm?.baseLineHeight || 1.5,
        allowedRatios: designRules.verticalRhythm?.allowedRatios || [1, 2, 3, 4],
        tolerance: designRules.verticalRhythm?.tolerance || 2,
        minSpacingDifference: designRules.verticalRhythm?.minSpacingDifference || 4,
        opticalAlignment: {
          textDescenders: designRules.verticalRhythm?.opticalAlignment?.textDescenders || 0,
          iconPadding: designRules.verticalRhythm?.opticalAlignment?.iconPadding || 0,
          avatarWeight: designRules.verticalRhythm?.opticalAlignment?.avatarWeight || 0,
        },
      } as VerticalRhythmRules,
      typography: {
        lineLength: {
          narrow: { min: designRules.typography?.lineLength?.narrow?.min || 45, max: designRules.typography?.lineLength?.narrow?.max || 60 },
          comfortable: { min: designRules.typography?.lineLength?.comfortable?.min || 60, max: designRules.typography?.lineLength?.comfortable?.max || 80 },
          wide: { min: designRules.typography?.lineLength?.wide?.min || 80, max: designRules.typography?.lineLength?.wide?.max || 100 },
        },
        lineHeightRatios: {
          small: designRules.typography?.lineHeightRatios?.small || 1.4,
          body: designRules.typography?.lineHeightRatios?.body || 1.5,
          subheading: designRules.typography?.lineHeightRatios?.subheading || 1.2,
          heading: designRules.typography?.lineHeightRatios?.heading || 1.1,
          display: designRules.typography?.lineHeightRatios?.display || 1.0,
        },
        typeScales: designRules.typography?.typeScales || {
          'minor-second': 1.067,
          'major-second': 1.125,
          'minor-third': 1.2,
          'major-third': 1.25,
          'perfect-fourth': 1.333,
          'golden-ratio': 1.618
        },
        orphansWidows: {
          maxOrphanLines: designRules.typography?.orphansWidows?.maxOrphanLines || 2,
          maxWidowLines: designRules.typography?.orphansWidows?.maxWidowLines || 2,
          minLastLineRatio: designRules.typography?.orphansWidows?.minLastLineRatio || 0.3,
        },
      } as AdvancedTypographyRules,
      colorHarmony: {
        schemes: {
          monochromatic: { hueTolerance: designRules.colorHarmony?.schemes?.monochromatic?.hueTolerance || 10 },
          analogous: { hueTolerance: designRules.colorHarmony?.schemes?.analogous?.hueTolerance || 30 },
          complementary: { angle: designRules.colorHarmony?.schemes?.complementary?.angle || 180, tolerance: designRules.colorHarmony?.schemes?.complementary?.tolerance || 10 },
          triadic: { angle: designRules.colorHarmony?.schemes?.triadic?.angle || 120, tolerance: designRules.colorHarmony?.schemes?.triadic?.tolerance || 10 },
          splitComplementary: { angle: designRules.colorHarmony?.schemes?.splitComplementary?.angle || 150, tolerance: designRules.colorHarmony?.schemes?.splitComplementary?.tolerance || 10 },
          tetradic: { angles: designRules.colorHarmony?.schemes?.tetradic?.angles || [60, 180, 240], tolerance: designRules.colorHarmony?.schemes?.tetradic?.tolerance || 10 },
        },
        semantics: {
          error: designRules.colorHarmony?.semantics?.error || ['#D32F2F'],
          success: designRules.colorHarmony?.semantics?.success || ['#388E3C'],
          warning: designRules.colorHarmony?.semantics?.warning || ['#FBC02D'],
          info: designRules.colorHarmony?.semantics?.info || ['#1976D2'],
          primary: designRules.colorHarmony?.semantics?.primary || ['#1976D2'],
          secondary: designRules.colorHarmony?.semantics?.secondary || ['#424242'],
        },
        consistency: {
          maxSaturationDeviation: designRules.colorHarmony?.consistency?.maxSaturationDeviation || 10,
          maxLightnessDeviation: designRules.colorHarmony?.consistency?.maxLightnessDeviation || 10,
          requiredSemanticRoles: designRules.colorHarmony?.consistency?.requiredSemanticRoles || ['primary', 'error'],
        },
        colorBlindness: {
          simulateTypes: designRules.colorHarmony?.colorBlindness?.simulateTypes || ['protanopia', 'deuteranopia'],
          minimumDifference: designRules.colorHarmony?.colorBlindness?.minimumDifference || 10,
        },
      } as ColorHarmonyRules,
      layout: {
        alignment: {
          pixelTolerance: designRules.layout?.alignment?.pixelTolerance || 2,
          minElementsInLine: designRules.layout?.alignment?.minElementsInLine || 3,
        },
        zIndex: {
          scale: designRules.layout?.zIndex?.scale || 10,
          maxRecommended: designRules.layout?.zIndex?.maxRecommended || 1000,
          negativeAllowed: designRules.layout?.zIndex?.negativeAllowed || false,
        },
        visualHierarchy: {
          weightFactors: {
            size: designRules.layout?.visualHierarchy?.weightFactors?.size || 0.4,
            colorSaturation: designRules.layout?.visualHierarchy?.weightFactors?.colorSaturation || 0.2,
            borderWeight: designRules.layout?.visualHierarchy?.weightFactors?.borderWeight || 0.1,
            shadowPresence: designRules.layout?.visualHierarchy?.weightFactors?.shadowPresence || 0.1,
            fontWeight: designRules.layout?.visualHierarchy?.weightFactors?.fontWeight || 0.1,
            position: designRules.layout?.visualHierarchy?.weightFactors?.position || 0.1,
          },
          focalPointThreshold: designRules.layout?.visualHierarchy?.focalPointThreshold || 0.6,
          maxFocalPoints: designRules.layout?.visualHierarchy?.maxFocalPoints || 3,
        },
        grid: {
          detectGridSize: designRules.layout?.grid?.detectGridSize || true,
          commonGridSizes: designRules.layout?.grid?.commonGridSizes || [4, 8, 12, 16, 24],
          alignmentTolerance: designRules.layout?.grid?.alignmentTolerance || 2,
        },
      } as LayoutAnalysisRules,
      accessibility: {
        aria: {
          requiredAttributes: designRules.accessibility?.aria?.requiredAttributes || {
            img: ['alt'],
            link: ['aria-label'],
            button: ['aria-label'],
          },
          allowedRoles: designRules.accessibility?.aria?.allowedRoles || ['button', 'link', 'heading', 'img', 'list', 'listitem', 'main', 'navigation', 'region'],
          nameSources: designRules.accessibility?.aria?.nameSources || ['title', 'aria-label', 'aria-labelledby', 'content'],
        },
        keyboard: {
          tabOrderTolerance: designRules.accessibility?.keyboard?.tabOrderTolerance || 5,
          focusIndicatorMinSize: designRules.accessibility?.keyboard?.focusIndicatorMinSize || 2,
          skipLinkRequired: designRules.accessibility?.keyboard?.skipLinkRequired || false,
        },
        semantics: {
          requiredLandmarks: designRules.accessibility?.semantics?.requiredLandmarks || ['main', 'navigation', 'contentinfo'],
          headingHierarchyMaxSkip: designRules.accessibility?.semantics?.headingHierarchyMaxSkip || 1,
          listStructureRequired: designRules.accessibility?.semantics?.listStructureRequired || true,
        },
        motion: {
          prefersReducedMotion: designRules.accessibility?.motion?.prefersReducedMotion || false,
          animationDurationLimits: designRules.accessibility?.motion?.animationDurationLimits || { min: 0.1, max: 0.5 },
        },
      } as AdvancedAccessibilityRules,
      interaction: {
        requiredStates: designRules.interaction?.requiredStates || ['hover', 'focus', 'active'],
        stateVisibility: {
          minDifference: designRules.interaction?.stateVisibility?.minDifference || 0.1,
          transitionRequired: designRules.interaction?.stateVisibility?.transitionRequired || true,
          transitionDuration: designRules.interaction?.stateVisibility?.transitionDuration || { min: 0.1, max: 0.3 },
        },
        loading: {
          skeletonRequired: designRules.interaction?.loading?.skeletonRequired || false,
          layoutShiftTolerance: designRules.interaction?.loading?.layoutShiftTolerance || 0.1,
          loadingIndicatorRequired: designRules.interaction?.loading?.loadingIndicatorRequired || true,
        },
        touch: {
          minSize: designRules.interaction?.touch?.minSize || 44,
          spacing: designRules.interaction?.touch?.spacing || 8,
          gestureTolerance: designRules.interaction?.touch?.gestureTolerance || 5,
        },
      } as InteractionRules,
      consistency: {
        patterns: {
          card: {
            paddingScale: designRules.consistency?.patterns?.card?.paddingScale || [16, 24],
            borderRadiusScale: designRules.consistency?.patterns?.card?.borderRadiusScale || [4, 8],
            shadowRequired: designRules.consistency?.patterns?.card?.shadowRequired || true,
          },
          button: {
            heightScale: designRules.consistency?.patterns?.button?.heightScale || [36, 44, 52],
            widthConstraints: designRules.consistency?.patterns?.button?.widthConstraints || { min: 64 },
          },
          form: {
            inputHeight: designRules.consistency?.patterns?.form?.inputHeight || 40,
            labelSpacing: designRules.consistency?.patterns?.form?.labelSpacing || 8,
            groupSpacing: designRules.consistency?.patterns?.form?.groupSpacing || 16,
          },
        },
        tokens: {
          spacingTokens: designRules.consistency?.tokens?.spacingTokens || ['--spacing-sm', '--spacing-md'],
          colorTokens: designRules.consistency?.tokens?.colorTokens || ['--color-primary', '--color-text'],
          typographyTokens: designRules.consistency?.tokens?.typographyTokens || ['--font-body', '--font-heading'],
          strictTokenUsage: designRules.consistency?.tokens?.strictTokenUsage || false,
        },
        similarity: {
          spacing: designRules.consistency?.similarity?.spacing || 0.9,
          sizing: designRules.consistency?.similarity?.sizing || 0.9,
          color: designRules.consistency?.similarity?.color || 0.9,
        },
      } as ConsistencyRules,
      responsive: {
        breakpoints: {
          sm: designRules.responsive?.breakpoints?.sm || 640,
          md: designRules.responsive?.breakpoints?.md || 768,
          lg: designRules.responsive?.breakpoints?.lg || 1024,
          xl: designRules.responsive?.breakpoints?.xl || 1280,
          '2xl': designRules.responsive?.breakpoints?.['2xl'] || 1536,
        },
        mobileFirst: {
          preferMinWidth: designRules.responsive?.mobileFirst?.preferMinWidth || true,
          maxWidthAllowed: designRules.responsive?.mobileFirst?.maxWidthAllowed || false,
        },
        overflow: {
          horizontalScrollPenalty: designRules.responsive?.overflow?.horizontalScrollPenalty || 10,
          textOverflowHandling: designRules.responsive?.overflow?.textOverflowHandling || true,
        },
        containers: {
          allowContainerQueries: designRules.responsive?.containers?.allowContainerQueries || false,
          maxContainerWidth: designRules.responsive?.containers?.maxContainerWidth || 1440,
        },
      } as ResponsiveRules,
      performance: {
        layoutShift: {
          imageDimensionsRequired: designRules.performance?.layoutShift?.imageDimensionsRequired || true,
          fontLoadingStrategy: designRules.performance?.layoutShift?.fontLoadingStrategy || 'swap',
          dynamicContentSpaceReserved: designRules.performance?.layoutShift?.dynamicContentSpaceReserved || true,
        },
        animation: {
          preferTransform: designRules.performance?.animation?.preferTransform || true,
          avoidProperties: designRules.performance?.animation?.avoidProperties || ['width', 'height', 'left', 'top'],
          maxDuration: designRules.performance?.animation?.maxDuration || 500,
        },
        resources: {
          lazyLoadingRecommended: designRules.performance?.resources?.lazyLoadingRecommended || true,
          preloadCritical: designRules.performance?.resources?.preloadCritical || true,
          compressionRequired: designRules.performance?.resources?.compressionRequired || true,
        },
      } as PerformanceRules,
    };
  }

  /**
   * Analyze all elements on the page and create ElementInspection objects
   */
  private async analyzeAllElements(settings?: any): Promise<ElementInspection[]> {
    const elements = document.querySelectorAll('*');
    const analyzedElements: ElementInspection[] = [];
    const designRules = this.createAdvancedDesignRules(settings);

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

          // Collect analysis error
          const selector = this.createSelectorForElement(element);
          this.analysisErrors.push({
            id: `analysis_error_${Date.now()}_${elementIndex}`,
            type: 'analysis_error',
            message: error instanceof Error ? error.message : 'Unknown analysis error',
            elementId: `element_${elementIndex}`,
            selector,
            details: error instanceof Error ? error.stack : String(error),
            timestamp: Date.now(),
          });

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
   * Create ElementInspection using AdvancedElementAnalyzer
   */
  private createBasicElementInspection(element: Element, elementId: string, rules: AdvancedDesignRules): ElementInspection {
    const htmlElement = element as HTMLElement;
    const rect = htmlElement.getBoundingClientRect();
    const computedStyle = window.getComputedStyle(htmlElement);

    // Create proper BoxModel
    const boxModel: BoxModel = {
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

    // Extract computed styles as Record<string, string> for AdvancedElementAnalyzer
    const computedStyles: Record<string, string> = {};
    for (let i = 0; i < computedStyle.length; i++) {
      const property = computedStyle[i];
      computedStyles[property] = computedStyle.getPropertyValue(property);
    }

    const selector = this.createSelectorForElement(element);
    const context = this.createElementContext(element);

    // Create advanced design rules (simplified)
    const advancedRules = this.createAdvancedDesignRules({ designRules: rules });

    // Use AdvancedElementAnalyzer to get comprehensive issues
    const inspection = AdvancedElementAnalyzer.analyzeElement(
      elementId,
      selector,
      boxModel,
      computedStyles,
      advancedRules,
      context
    );

    return inspection;
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
    let issues = elements.flatMap(element => element.issues || []);
    const elementsInspected = elements.length;

    // Remove duplicate issues
    issues = this.removeDuplicateIssues(issues);

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
      analysisErrors: this.analysisErrors,
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

      // Limit issues in markdown report to avoid performance issues
      const maxIssuesInReport = 100;
      const issuesToShow = report.issues.slice(0, maxIssuesInReport);

      issuesToShow.forEach((issue: any, index: number) => {
        try {
          const severity = issue.severity ? issue.severity.toUpperCase() : 'UNKNOWN';
          const message = issue.message || 'No message provided';
          const selector = issue.selector || 'No selector';
          const type = issue.type || 'unknown_type';

          markdown += `### ${index + 1}. ${severity}: ${message}\n\n`;
          markdown += `- **Element:** \`${selector}\`\n`;
          markdown += `- **Type:** ${type}\n`;
          if (issue.suggestedFix) {
            markdown += `- **Suggestion:** ${issue.suggestedFix}\n`;
          }
          if (issue.actualValue) {
            markdown += `- **Current value:** ${issue.actualValue}\n`;
          }
          if (issue.expectedValue) {
            markdown += `- **Expected value:** ${issue.expectedValue}\n`;
          }
          markdown += `\n`;
        } catch (error) {
          console.warn('Error formatting issue:', issue, error);
          markdown += `### ${index + 1}. Error formatting issue\n\n`;
          markdown += `- **Raw issue data:** ${JSON.stringify(issue).substring(0, 200)}...\n\n`;
        }
      });

      if (report.issues.length > maxIssuesInReport) {
        const remaining = report.issues.length - maxIssuesInReport;
        markdown += `*Note: ${remaining} additional issues not shown in this report (showing first ${maxIssuesInReport} issues only)*\n\n`;
      }
    }

    if (report.analysisErrors && report.analysisErrors.length > 0) {
      markdown += `## Analysis Errors\n\n`;
      markdown += `During the analysis process, the following errors occurred:\n\n`;
      report.analysisErrors.forEach((error: any, index: number) => {
        markdown += `### ${index + 1}. ${error.type.replace('_', ' ').toUpperCase()}: ${error.message}\n\n`;
        if (error.selector) {
          markdown += `- **Element:** \`${error.selector}\`\n`;
        }
        if (error.elementId) {
          markdown += `- **Element ID:** ${error.elementId}\n`;
        }
        if (error.details) {
          markdown += `- **Details:** ${error.details}\n`;
        }
        markdown += `- **Time:** ${new Date(error.timestamp).toLocaleTimeString()}\n\n`;
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

  /**
   * Remove duplicate issues based on key properties
   */
  private removeDuplicateIssues(issues: Issue[]): Issue[] {
    const seen = new Set<string>();
    const uniqueIssues: Issue[] = [];

    for (const issue of issues) {
      // Create a unique key based on essential properties
      let key: string;

      // Special handling for design_token_mismatch issues - group by element and type
      if (issue.type === 'design_token_mismatch') {
        // For design token issues, group all similar issues for the same element
        // This prevents duplicates like multiple font-* properties for the same element
        key = `${issue.elementId || ''}|${issue.type || ''}|${issue.severity || ''}`;
      } else {
        // For other issue types, use the full combination
        key = `${issue.selector || ''}|${issue.type || ''}|${issue.message || ''}|${issue.severity || ''}|${issue.elementId || ''}`;
      }

      if (!seen.has(key)) {
        seen.add(key);
        uniqueIssues.push(issue);
      }
    }

    return uniqueIssues;
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

/**
 * Copyright (c) 2025 Pixel Perfect Inspector
 *
 * Author: Pixel Perfect Inspector
 * Available for contact via email: support@b-b.top
 * For up-to-date contact information:
 * https://github.com/bivex
 *
 * Created: 2025-12-22T07:29:22
 * Last Updated: 2025-12-22T07:41:13
 *
 * Licensed under the MIT License.
 * Commercial licensing available upon request.
 */

import { ElementInspection } from '../../domain/entities/ElementInspection';
import { DesignRules } from '../../domain/entities/DesignRules';

/**
 * Use case for generating UI inspection reports
 * Creates comprehensive reports with issues, screenshots, and recommendations
 */
export class GenerateReportUseCase {
  /**
   * Generates a complete UI inspection report
   */
  async execute(input: GenerateReportInput): Promise<GenerateReportOutput> {
    try {
      this.validateInput(input);

      // Collect all issues from elements
      const allIssues = this.collectAllIssues(input.elements);

      // Generate report data
      const report = this.createReport(input, allIssues);

      // Generate export formats
      const exports = await this.generateExports(report, input.format);

      return {
        success: true,
        report,
        exports,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error during report generation',
        report: null,
        exports: {},
      };
    }
  }

  /**
   * Generates a quick summary report
   */
  async executeQuick(input: GenerateQuickReportInput): Promise<GenerateQuickReportOutput> {
    try {
      this.validateQuickInput(input);

      const allIssues = this.collectAllIssues(input.elements);
      const summary = this.createQuickSummary(allIssues, input.elements);

      return {
        success: true,
        summary,
        criticalIssues: allIssues.filter(issue => issue.severity === 'error'),
        recommendations: this.generateQuickRecommendations(allIssues),
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error during quick report generation',
        summary: this.createEmptySummary(),
        criticalIssues: [],
        recommendations: [],
      };
    }
  }

  /**
   * Validates input parameters
   */
  private validateInput(input: GenerateReportInput): void {
    if (!input.elements || input.elements.length === 0) {
      throw new Error('Elements array is required and cannot be empty');
    }

    if (!input.url) {
      throw new Error('Page URL is required');
    }

    if (!input.format) {
      throw new Error('Report format is required');
    }
  }

  private validateQuickInput(input: GenerateQuickReportInput): void {
    if (!input.elements || input.elements.length === 0) {
      throw new Error('Elements array is required and cannot be empty');
    }
  }

  /**
   * Collects all issues from elements
   */
  private collectAllIssues(elements: ElementInspection[]): ElementInspection['issues'] {
    return elements.flatMap(element => element.issues);
  }

  /**
   * Creates the main report structure
   */
  private createReport(input: GenerateReportInput, allIssues: ElementInspection['issues']): UIReport {
    const summary = this.createReportSummary(allIssues, input.elements);
    const screenshots = input.screenshots || [];

    return {
      id: this.generateReportId(),
      title: input.title || `UI Inspection Report - ${new Date().toLocaleDateString()}`,
      timestamp: Date.now(),
      url: input.url,
      summary,
      issues: allIssues,
      comparisons: input.comparisons || [],
      screenshots,
      metadata: {
        inspectedElements: input.elements.length,
        inspectionDuration: Date.now() - (input.startTime || Date.now()),
        designRulesVersion: input.rules ? '1.0' : undefined,
        extensionVersion: '1.0.0',
      },
    };
  }

  /**
   * Creates report summary
   */
  private createReportSummary(
    issues: ElementInspection['issues'],
    elements: ElementInspection[]
  ): ReportSummary {
    const issuesBySeverity = issues.reduce((acc, issue) => {
      acc[issue.severity] = (acc[issue.severity] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const issuesByType = issues.reduce((acc, issue) => {
      acc[issue.type] = (acc[issue.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Group issues by category
    const spacingIssues = issues.filter(issue => issue.type.includes('spacing')).length;
    const sizingIssues = issues.filter(issue =>
      issue.type.includes('sizing') || issue.type === 'too_small_clickable_area'
    ).length;
    const colorIssues = issues.filter(issue =>
      issue.type === 'color_not_in_palette' || issue.type === 'contrast_ratio_low'
    ).length;
    const responsiveIssues = issues.filter(issue =>
      issue.type.includes('responsive') || issue.type === 'text_too_small'
    ).length;

    return {
      totalIssues: issues.length,
      issuesBySeverity,
      issuesByType,
      elementsInspected: elements.length,
      issuesByCategory: {
        spacing: spacingIssues,
        sizing: sizingIssues,
        color: colorIssues,
        responsive: responsiveIssues,
        accessibility: issues.filter(issue => issue.type.includes('accessible') || issue.type === 'contrast_ratio_low').length,
      },
      overallScore: this.calculateOverallScore(issues, elements),
      grade: this.calculateGrade(issues, elements),
    };
  }

  /**
   * Creates quick summary for rapid feedback
   */
  private createQuickSummary(
    issues: ElementInspection['issues'],
    elements: ElementInspection[]
  ): QuickReportSummary {
    const errors = issues.filter(issue => issue.severity === 'error').length;
    const warnings = issues.filter(issue => issue.severity === 'warning').length;
    const info = issues.filter(issue => issue.severity === 'info').length;

    return {
      totalElements: elements.length,
      totalIssues: issues.length,
      errors,
      warnings,
      info,
      score: this.calculateOverallScore(issues, elements),
      topIssues: this.getTopIssues(issues, 5),
    };
  }

  /**
   * Generates export formats
   */
  private async generateExports(report: UIReport, format: ReportFormat): Promise<ReportExports> {
    const exports: ReportExports = {};

    if (format === 'json' || format === 'all') {
      exports.json = {
        data: JSON.stringify(report, null, 2),
        filename: `ui-inspection-${report.id}.json`,
        mimeType: 'application/json',
      };
    }

    if (format === 'html' || format === 'all') {
      exports.html = {
        data: this.generateHTMLReport(report),
        filename: `ui-inspection-${report.id}.html`,
        mimeType: 'text/html',
      };
    }

    if (format === 'markdown' || format === 'all') {
      exports.markdown = {
        data: this.generateMarkdownReport(report),
        filename: `ui-inspection-${report.id}.md`,
        mimeType: 'text/markdown',
      };
    }

    return exports;
  }

  /**
   * Generates HTML report
   */
  private generateHTMLReport(report: UIReport): string {
    return `
<!DOCTYPE html>
<html lang="ru">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${report.title}</title>
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
        <h1>${report.title}</h1>
        <p><strong>URL:</strong> ${report.url}</p>
        <p><strong>Дата:</strong> ${new Date(report.timestamp).toLocaleString('ru')}</p>
        <p><strong>Оценка:</strong> <span class="grade ${report.summary.grade.toLowerCase()}">${report.summary.grade}</span></p>
    </div>

    <div class="summary">
        <div class="metric">
            <div class="metric-number">${report.summary.elementsInspected}</div>
            <div>Элементов проверено</div>
        </div>
        <div class="metric">
            <div class="metric-number">${report.summary.totalIssues}</div>
            <div>Всего проблем</div>
        </div>
        <div class="metric">
            <div class="metric-number">${report.summary.issuesBySeverity.error || 0}</div>
            <div>Ошибок</div>
        </div>
        <div class="metric">
            <div class="metric-number">${report.summary.overallScore}%</div>
            <div>Оценка соответствия</div>
        </div>
    </div>

    <div class="issues">
        <h2>Найденные проблемы</h2>
        ${report.issues.map(issue => `
            <div class="issue ${issue.severity}">
                <h4>${issue.message}</h4>
                <p><strong>Элемент:</strong> ${issue.selector}</p>
                <p><strong>Тип:</strong> ${issue.type}</p>
                ${issue.suggestedFix ? `<p><strong>Рекомендация:</strong> ${issue.suggestedFix}</p>` : ''}
            </div>
        `).join('')}
    </div>
</body>
</html>`;
  }

  /**
   * Generates Markdown report
   */
  private generateMarkdownReport(report: UIReport): string {
    return `# ${report.title}

**URL:** ${report.url}
**Дата:** ${new Date(report.timestamp).toLocaleString('ru')}
**Оценка:** ${report.summary.grade}

## Сводка

- **Элементов проверено:** ${report.summary.elementsInspected}
- **Всего проблем:** ${report.summary.totalIssues}
- **Ошибок:** ${report.summary.issuesBySeverity.error || 0}
- **Предупреждений:** ${report.summary.issuesBySeverity.warning || 0}
- **Оценка соответствия:** ${report.summary.overallScore}%

## Проблемы по категориям

- **Отступы:** ${report.summary.issuesByCategory.spacing}
- **Размеры:** ${report.summary.issuesByCategory.sizing}
- **Цвета:** ${report.summary.issuesByCategory.color}
- **Адаптивность:** ${report.summary.issuesByCategory.responsive}
- **Доступность:** ${report.summary.issuesByCategory.accessibility}

## Найденные проблемы

${report.issues.map(issue => `### ${issue.severity.toUpperCase()}: ${issue.message}

- **Элемент:** \`${issue.selector}\`
- **Тип:** ${issue.type}
${issue.suggestedFix ? `- **Рекомендация:** ${issue.suggestedFix}` : ''}

`).join('\n')}`;
  }

  /**
   * Generates quick recommendations
   */
  private generateQuickRecommendations(issues: ElementInspection['issues']): string[] {
    const recommendations: string[] = [];
    const hasSpacingIssues = issues.some(issue => issue.type.includes('spacing'));
    const hasColorIssues = issues.some(issue => issue.type === 'color_not_in_palette');
    const hasResponsiveIssues = issues.some(issue => issue.type.includes('responsive'));

    if (hasSpacingIssues) {
      recommendations.push('Проверьте отступы на соответствие дизайн-системе (4px/8px grid)');
    }

    if (hasColorIssues) {
      recommendations.push('Используйте только утвержденные цвета из палитры');
    }

    if (hasResponsiveIssues) {
      recommendations.push('Протестируйте интерфейс на разных размерах экрана');
    }

    const errorCount = issues.filter(issue => issue.severity === 'error').length;
    if (errorCount > 0) {
      recommendations.push(`${errorCount} критических ошибок требуют немедленного исправления`);
    }

    return recommendations;
  }

  /**
   * Calculates overall score (0-100)
   */
  private calculateOverallScore(issues: ElementInspection['issues'], elements: ElementInspection[]): number {
    if (elements.length === 0) return 100;

    const totalPossibleIssues = elements.length * 5; // Simplified metric
    const errorWeight = 3;
    const warningWeight = 1;
    const infoWeight = 0.5;

    const weightedIssues = issues.reduce((sum, issue) => {
      switch (issue.severity) {
        case 'error': return sum + errorWeight;
        case 'warning': return sum + warningWeight;
        case 'info': return sum + infoWeight;
        default: return sum;
      }
    }, 0);

    const score = Math.max(0, 100 - (weightedIssues / totalPossibleIssues) * 100);
    return Math.round(score);
  }

  /**
   * Calculates grade based on score
   */
  private calculateGrade(issues: ElementInspection['issues'], elements: ElementInspection[]): ReportGrade {
    const score = this.calculateOverallScore(issues, elements);

    if (score >= 90) return 'A';
    if (score >= 80) return 'B';
    if (score >= 70) return 'C';
    if (score >= 60) return 'D';
    return 'F';
  }

  /**
   * Gets top issues by severity
   */
  private getTopIssues(issues: ElementInspection['issues'], limit: number): ElementInspection['issues'] {
    return issues
      .sort((a, b) => {
        const severityOrder = { error: 3, warning: 2, info: 1 };
        return severityOrder[b.severity] - severityOrder[a.severity];
      })
      .slice(0, limit);
  }

  /**
   * Generates unique report ID
   */
  private generateReportId(): string {
    return `report_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Creates empty summary for error cases
   */
  private createEmptySummary(): QuickReportSummary {
    return {
      totalElements: 0,
      totalIssues: 0,
      errors: 0,
      warnings: 0,
      info: 0,
      score: 100,
      topIssues: [],
    };
  }
}

/**
 * Input interfaces
 */
export interface GenerateReportInput {
  elements: ElementInspection[];
  url: string;
  format: ReportFormat;
  title?: string;
  screenshots?: Screenshot[];
  comparisons?: ElementComparison[];
  rules?: DesignRules;
  startTime?: number;
}

export interface GenerateQuickReportInput {
  elements: ElementInspection[];
}

/**
 * Output interfaces
 */
export interface GenerateReportOutput {
  success: boolean;
  report: UIReport | null;
  exports: ReportExports;
  error?: string;
}

export interface GenerateQuickReportOutput {
  success: boolean;
  summary: QuickReportSummary;
  criticalIssues: ElementInspection['issues'];
  recommendations: string[];
  error?: string;
}

/**
 * Supporting interfaces
 */
export interface UIReport {
  id: string;
  title: string;
  timestamp: number;
  url: string;
  summary: ReportSummary;
  issues: ElementInspection['issues'];
  comparisons: ElementComparison[];
  screenshots: Screenshot[];
  metadata: ReportMetadata;
}

export interface ReportSummary {
  totalIssues: number;
  issuesBySeverity: Record<string, number>;
  issuesByType: Record<string, number>;
  elementsInspected: number;
  issuesByCategory: {
    spacing: number;
    sizing: number;
    color: number;
    responsive: number;
    accessibility: number;
  };
  overallScore: number;
  grade: ReportGrade;
}

export interface ReportMetadata {
  inspectedElements: number;
  inspectionDuration: number;
  designRulesVersion?: string;
  extensionVersion: string;
}

export interface QuickReportSummary {
  totalElements: number;
  totalIssues: number;
  errors: number;
  warnings: number;
  info: number;
  score: number;
  topIssues: ElementInspection['issues'];
}

export interface Screenshot {
  id: string;
  data: string;
  description: string;
  timestamp: number;
}

export interface ElementComparison {
  elements: ElementInspection[];
  differences: ComparisonDifference[];
  summary: ComparisonSummary;
}

export interface ComparisonDifference {
  property: string;
  values: Record<string, any>;
  variance: number;
}

export interface ComparisonSummary {
  totalElements: number;
  consistentProperties: string[];
  inconsistentProperties: string[];
}

export interface ReportExports {
  json?: ReportExport;
  html?: ReportExport;
  markdown?: ReportExport;
}

export interface ReportExport {
  data: string;
  filename: string;
  mimeType: string;
}

export type ReportFormat = 'json' | 'html' | 'markdown' | 'all';
export type ReportGrade = 'A' | 'B' | 'C' | 'D' | 'F';

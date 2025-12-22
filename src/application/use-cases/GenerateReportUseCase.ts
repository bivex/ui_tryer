/**
 * Copyright (c) 2025 Pixel Perfect Inspector
 *
 * Author: Pixel Perfect Inspector
 * Available for contact via email: support@b-b.top
 * For up-to-date contact information:
 * https://github.com/bivex
 *
 * Created: 2025-12-22T07:29:22
 * Last Updated: 2025-12-22T09:03:35
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
    // Group issues by element for better organization
    const issuesByElement = report.issues.reduce((acc, issue) => {
      if (!acc[issue.elementId]) {
        acc[issue.elementId] = [];
      }
      acc[issue.elementId].push(issue);
      return acc;
    }, {} as Record<string, typeof report.issues>);

    return `
<!DOCTYPE html>
<html lang="ru">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${report.title}</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            margin: 40px;
            line-height: 1.6;
            color: #333;
        }
        .header {
            border-bottom: 1px solid #eee;
            padding-bottom: 20px;
            margin-bottom: 30px;
        }
        .summary {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 20px;
            margin-bottom: 30px;
        }
        .metric {
            background: #f8f9fa;
            padding: 15px;
            border-radius: 8px;
            text-align: center;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        .metric-number {
            font-size: 2em;
            font-weight: bold;
            color: #007bff;
            display: block;
            margin-bottom: 5px;
        }
        .issues {
            margin-bottom: 30px;
        }
        .element-group {
            border: 1px solid #dee2e6;
            border-radius: 8px;
            margin-bottom: 20px;
            overflow: hidden;
        }
        .element-header {
            background: #f8f9fa;
            padding: 15px;
            border-bottom: 1px solid #dee2e6;
            font-weight: bold;
        }
        .element-position {
            font-size: 0.9em;
            color: #666;
            margin-top: 5px;
        }
        .issue {
            border-left: 4px solid #dee2e6;
            padding: 15px;
            margin-bottom: 10px;
            background: white;
        }
        .issue.error {
            border-left-color: #dc3545;
            background: #f8d7da;
        }
        .issue.warning {
            border-left-color: #ffc107;
            background: #fff3cd;
        }
        .issue.info {
            border-left-color: #17a2b8;
            background: #d1ecf1;
        }
        .issue-details {
            margin-top: 10px;
            font-size: 0.9em;
            color: #666;
        }
        .position-info {
            background: rgba(255,255,255,0.8);
            padding: 8px 12px;
            border-radius: 4px;
            margin-top: 8px;
            font-family: monospace;
            font-size: 0.85em;
        }
        .grade {
            font-size: 1.5em;
            font-weight: bold;
            text-align: center;
            margin: 20px 0;
            padding: 10px;
            border-radius: 8px;
        }
        .grade.A { color: #28a745; background: rgba(40, 167, 69, 0.1); }
        .grade.B { color: #ffc107; background: rgba(255, 193, 7, 0.1); }
        .grade.C { color: #fd7e14; background: rgba(253, 126, 20, 0.1); }
        .grade.D { color: #dc3545; background: rgba(220, 53, 69, 0.1); }
        .grade.F { color: #6c757d; background: rgba(108, 117, 125, 0.1); }

        .todo-section {
            background: #f8f9fa;
            border: 1px solid #dee2e6;
            border-radius: 8px;
            padding: 20px;
            margin-top: 30px;
        }
        .todo-item {
            margin-bottom: 10px;
            padding: 10px;
            background: white;
            border-radius: 4px;
            border-left: 3px solid #007bff;
        }
        .todo-priority-critical { border-left-color: #dc3545; }
        .todo-priority-important { border-left-color: #ffc107; }
        .todo-priority-recommendation { border-left-color: #17a2b8; }
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

        ${Object.entries(issuesByElement).map(([elementId, elementIssues]) => {
          const firstIssue = elementIssues[0];
          const element = report.issues.find(i => i.elementId === elementId);
          const positionInfo = this.generatePositionInfo(element, report);

          return `
            <div class="element-group">
                <div class="element-header">
                    Элемент: <code>${firstIssue.selector}</code>
                    <div class="element-position">${positionInfo}</div>
                </div>

                ${elementIssues.map(issue => `
                    <div class="issue ${issue.severity}">
                        <h4>${issue.message}</h4>
                        <div class="issue-details">
                            <strong>Тип проблемы:</strong> ${this.getIssueTypeLabel(issue.type)}<br>
                            <strong>Важность:</strong> ${this.getSeverityLabel(issue.severity)}<br>
                            ${issue.actualValue ? `<strong>Текущее значение:</strong> ${issue.actualValue}<br>` : ''}
                            ${issue.expectedValue ? `<strong>Ожидаемое значение:</strong> ${issue.expectedValue}<br>` : ''}
                            ${issue.position ? `
                                <div class="position-info">
                                    📍 Позиция проблемы: x=${issue.position.x}, y=${issue.position.y}
                                    (размер: ${issue.position.width}×${issue.position.height})
                                </div>
                            ` : ''}
                        </div>
                        ${issue.suggestedFix ? `<p><strong>💡 Рекомендация:</strong> ${issue.suggestedFix}</p>` : ''}
                    </div>
                `).join('')}
            </div>
          `;
        }).join('')}
    </div>

    <div class="todo-section">
        <h2>📋 План исправлений</h2>
        ${this.generateHTMLTodoList(report.issues)}
    </div>
</body>
</html>`;
  }

  /**
   * Generates Markdown report
   */
  private generateMarkdownReport(report: UIReport): string {
    const todoList = this.generateTodoList(report.issues);

    // Group issues by element for better organization
    const issuesByElement = report.issues.reduce((acc, issue) => {
      if (!acc[issue.elementId]) {
        acc[issue.elementId] = [];
      }
      acc[issue.elementId].push(issue);
      return acc;
    }, {} as Record<string, typeof report.issues>);

    let issuesSection = '';

    for (const [elementId, elementIssues] of Object.entries(issuesByElement)) {
      const firstIssue = elementIssues[0];
      const positionInfo = this.generateMarkdownPositionInfo(firstIssue, report);

      issuesSection += `### 📍 Элемент: \`${firstIssue.selector}\`

${positionInfo}`;

      for (const issue of elementIssues) {
        issuesSection += `#### ${this.getSeverityEmoji(issue.severity)} ${issue.severity.toUpperCase()}: ${issue.message}

- **Тип проблемы:** ${this.getIssueTypeLabel(issue.type)}
- **Важность:** ${this.getSeverityLabel(issue.severity)}
${issue.actualValue ? `- **Текущее значение:** ${issue.actualValue}\n` : ''}${issue.expectedValue ? `- **Ожидаемое значение:** ${issue.expectedValue}\n` : ''}${issue.position ? `- **📍 Позиция проблемы:** x=${issue.position.x}, y=${issue.position.y} (размер: ${issue.position.width}×${issue.position.height})\n` : ''}${issue.suggestedFix ? `- **💡 Рекомендация:** ${issue.suggestedFix}\n` : ''}\n`;
      }
    }

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

${issuesSection}
## 📋 План исправлений

${todoList}`;
  }

  /**
   * Generates detailed todo list with specific solutions for each issue
   */
  private generateTodoList(issues: ElementInspection['issues']): string {
    if (issues.length === 0) {
      return '✅ Поздравляем! Критических проблем не найдено.';
    }

    const todos: string[] = [];
    const processedIssues = new Set<string>();

    // Group issues by type and selector to avoid duplicates
    const groupedIssues = issues.reduce((acc, issue) => {
      const key = `${issue.type}-${issue.selector}`;
      if (!acc[key]) {
        acc[key] = [];
      }
      acc[key].push(issue);
      return acc;
    }, {} as Record<string, ElementInspection['issues']>);

    // Generate todos for each issue group
    Object.entries(groupedIssues).forEach(([key, issueGroup]) => {
      const firstIssue = issueGroup[0];
      const solution = this.getIssueSolution(firstIssue);

      if (solution && !processedIssues.has(key)) {
        const priority = this.getIssuePriority(firstIssue);
        const checked = false; // All items start unchecked
        const checkbox = checked ? '- [x]' : '- [ ]';

        todos.push(`${checkbox} **${priority}** ${solution}`);
        processedIssues.add(key);
      }
    });

    // Add summary at the end
    const criticalCount = issues.filter(i => i.severity === 'error').length;
    const warningCount = issues.filter(i => i.severity === 'warning').length;

    if (criticalCount > 0 || warningCount > 0) {
      todos.push('');
      todos.push('## 📊 Сводка исправлений');
      if (criticalCount > 0) {
        todos.push(`- **🚨 Критических проблем:** ${criticalCount} (требуют немедленного исправления)`);
      }
      if (warningCount > 0) {
        todos.push(`- **⚠️ Предупреждений:** ${warningCount} (рекомендуется исправить)`);
      }
      todos.push(`- **📈 После исправлений оценка вырастет до:** ${this.calculateProjectedScore(issues)}%`);
    }

    return todos.join('\n');
  }

  /**
   * Generates HTML todo list with styling
   */
  private generateHTMLTodoList(issues: ElementInspection['issues']): string {
    if (issues.length === 0) {
      return '<p>✅ Поздравляем! Критических проблем не найдено.</p>';
    }

    const todos: string[] = [];
    const processedIssues = new Set<string>();

    // Group issues by type and selector to avoid duplicates
    const groupedIssues = issues.reduce((acc, issue) => {
      const key = `${issue.type}-${issue.selector}`;
      if (!acc[key]) {
        acc[key] = [];
      }
      acc[key].push(issue);
      return acc;
    }, {} as Record<string, ElementInspection['issues']>);

    // Generate todos for each issue group
    Object.entries(groupedIssues).forEach(([key, issueGroup]) => {
      const firstIssue = issueGroup[0];
      const solution = this.getIssueSolution(firstIssue);
      const priority = this.getIssuePriority(firstIssue);
      const priorityClass = priority.includes('КРИТИЧНО') ? 'critical' :
                           priority.includes('ВАЖНО') ? 'important' : 'recommendation';

      if (solution && !processedIssues.has(key)) {
        todos.push(`<div class="todo-item todo-priority-${priorityClass}">
            <strong>${priority}</strong><br>
            ${solution}
        </div>`);
        processedIssues.add(key);
      }
    });

    // Add summary at the end
    const criticalCount = issues.filter(i => i.severity === 'error').length;
    const warningCount = issues.filter(i => i.severity === 'warning').length;

    if (criticalCount > 0 || warningCount > 0) {
      todos.push('<div class="todo-item" style="background: #e9ecef; border-left-color: #6c757d;">');
      todos.push('<strong>📊 Сводка исправлений</strong><br>');
      if (criticalCount > 0) {
        todos.push(`<span style="color: #dc3545;">🚨 Критических проблем: ${criticalCount} (требуют немедленного исправления)</span><br>`);
      }
      if (warningCount > 0) {
        todos.push(`<span style="color: #ffc107;">⚠️ Предупреждений: ${warningCount} (рекомендуется исправить)</span><br>`);
      }
      todos.push(`<span style="color: #28a745;">📈 После исправлений оценка вырастет до: ${this.calculateProjectedScore(issues)}%</span>`);
      todos.push('</div>');
    }

    return todos.join('\n');
  }

  /**
   * Generates position information for an element
   */
  private generatePositionInfo(issue: ElementInspection['issues'][0] | undefined, report: UIReport): string {
    if (!issue) return '';

    // Find the element in the report to get its inspection data
    const elementInspection = report.issues.find(i => i.elementId === issue.elementId);

    if (elementInspection && elementInspection.position) {
      const pos = elementInspection.position;
      return `📍 Позиция: ${pos.x}, ${pos.y} | Размер: ${pos.width}×${pos.height}px`;
    }

    return '📍 Позиция: информация недоступна';
  }

  /**
   * Gets human-readable label for issue type
   */
  private getIssueTypeLabel(type: string): string {
    const labels: Record<string, string> = {
      'too_small_clickable_area': 'Слишком маленькая кликабельная область',
      'color_not_in_palette': 'Цвет не из палитры',
      'contrast_ratio_low': 'Низкий контраст',
      'spacing_not_on_grid': 'Отступы не на сетке',
      'asymmetric_spacing': 'Асимметричные отступы',
      'text_too_small': 'Слишком маленький текст',
      'missing_alt_text': 'Отсутствует alt текст',
      'inaccessible_click_area': 'Недоступная область клика',
      'spacing_not_in_scale': 'Отступы не в шкале',
      'layout_shift': 'Сдвиг макета',
      'responsive_overflow': 'Переполнение на мобильных',
      'alignment_issue': 'Проблема выравнивания',
      'inconsistent_sizing': 'Несоответствующие размеры'
    };

    return labels[type] || type;
  }

  /**
   * Gets human-readable label for severity
   */
  private getSeverityLabel(severity: string): string {
    const labels: Record<string, string> = {
      'error': '🚨 Критично',
      'warning': '⚠️ Предупреждение',
      'info': 'ℹ️ Рекомендация'
    };

    return labels[severity] || severity;
  }

  /**
   * Gets emoji for severity level
   */
  private getSeverityEmoji(severity: string): string {
    const emojis: Record<string, string> = {
      'error': '🚨',
      'warning': '⚠️',
      'info': 'ℹ️'
    };

    return emojis[severity] || '❓';
  }

  /**
   * Generates position information for markdown
   */
  private generateMarkdownPositionInfo(issue: ElementInspection['issues'][0], report: UIReport): string {
    // Find the element in the report to get its inspection data
    const elementInspection = report.issues.find(i => i.elementId === issue.elementId);

    if (elementInspection && elementInspection.position) {
      const pos = elementInspection.position;
      return `**📍 Расположение:** x=${pos.x}, y=${pos.y} | **Размер:** ${pos.width}×${pos.height}px

---
`;
    }

    return '**📍 Информация о расположении:** недоступна\n\n---\n';
  }

  /**
   * Gets specific solution for an issue type
   */
  private getIssueSolution(issue: ElementInspection['issues'][0]): string {
    const selector = issue.selector;

    switch (issue.type) {
      case 'too_small_clickable_area':
        return `Увеличить размер кликабельной области для \`${selector}\` минимум до 44px`;

      case 'color_not_in_palette':
        return `Заменить цвет для \`${selector}\` на цвет из Tailwind палитры`;

      case 'contrast_ratio_low':
        return `Улучшить контраст для \`${selector}\` (минимум 4.5:1 для нормального текста)`;

      case 'spacing_not_on_grid':
        return `Выровнять отступы для \`${selector}\` по 4px сетке (4, 8, 12, 16, 20, 24, 32...)`;

      case 'asymmetric_spacing':
        return `Исправить асимметричные отступы для \`${selector}\` для визуальной гармонии`;

      case 'text_too_small':
        return `Увеличить размер текста для \`${selector}\` минимум до 14px для мобильных`;

      case 'missing_alt_text':
        return `Добавить alt текст для изображения \`${selector}\``;

      case 'inaccessible_click_area':
        return `Сделать область \`${selector}\` доступной для клавиатуры и скринридеров`;

      case 'spacing_not_in_scale':
        return `Использовать стандартные отступы из дизайн-системы для \`${selector}\``;

      case 'layout_shift':
        return `Зафиксировать размеры для \`${selector}\` чтобы избежать сдвига макета`;

      case 'responsive_overflow':
        return `Исправить переполнение контента для \`${selector}\` на мобильных устройствах`;

      case 'alignment_issue':
        return `Выровнять элемент \`${selector}\` по сетке дизайна`;

      case 'inconsistent_sizing':
        return `Привести размеры \`${selector}\` к консистентным значениям`;

      default:
        return `Исправить проблему "${issue.message}" для \`${selector}\``;
    }
  }

  /**
   * Gets priority level for an issue
   */
  private getIssuePriority(issue: ElementInspection['issues'][0]): string {
    switch (issue.severity) {
      case 'error':
        return '🚨 КРИТИЧНО';
      case 'warning':
        return '⚠️ ВАЖНО';
      case 'info':
        return 'ℹ️ РЕКОМЕНДАЦИЯ';
      default:
        return '📝 ЗАМЕТКА';
    }
  }

  /**
   * Calculates projected score after fixing all issues
   */
  private calculateProjectedScore(issues: ElementInspection['issues']): number {
    // Simplified calculation - assume fixing issues improves score
    const currentScore = this.calculateOverallScore(issues, []);
    const improvement = Math.min(issues.length * 2, 30); // Max 30% improvement
    return Math.min(100, Math.round(currentScore + improvement));
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

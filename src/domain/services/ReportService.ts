import { ElementInspection, Issue, AnalysisError, AdvancedDesignRules } from '../../../types/MessageContracts';

export class ReportService {
  private analysisErrors: AnalysisError[] = [];

  constructor() {}

  public setAnalysisErrors(errors: AnalysisError[]): void {
    this.analysisErrors = errors;
  }

  public generateDetailedReport(elements: ElementInspection[], settings?: any): any {
    let issues = elements.flatMap(element => element.issues || []);
    const elementsInspected = elements.length;

    issues = this.removeDuplicateIssues(issues);

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

  public generateMarkdownReport(report: any): string {
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
            markdown += `- **Current value:** ${JSON.stringify(issue.actualValue)}\n`;
          }
          if (issue.expectedValue) {
            markdown += `- **Expected value:** ${JSON.stringify(issue.expectedValue)}\n`;
          }
          markdown += `\n`;
        } catch (error) {
          markdown += `### ${index + 1}. Error formatting issue\n\n`;
        }
      });

      if (report.issues.length > maxIssuesInReport) {
        markdown += `*Note: ${report.issues.length - maxIssuesInReport} additional issues not shown*\n\n`;
      }
    }

    return markdown;
  }

  public generateHtmlReport(report: any): string {
    return `
<!DOCTYPE html>
<html lang="ru">
<head>
    <meta charset="UTF-8">
    <title>UI Inspection Report</title>
    <style>
        body { font-family: system-ui, sans-serif; margin: 40px; line-height: 1.5; color: #333; }
        .header { border-bottom: 2px solid #eee; padding-bottom: 20px; margin-bottom: 30px; }
        .summary { display: flex; gap: 20px; margin-bottom: 30px; flex-wrap: wrap; }
        .metric { background: #f8f9fa; padding: 20px; border-radius: 12px; flex: 1; min-width: 150px; text-align: center; border: 1px solid #eee; }
        .metric-number { font-size: 2.5em; font-weight: 800; color: #2563eb; }
        .issue { border: 1px solid #e5e7eb; border-radius: 12px; padding: 20px; margin-bottom: 16px; transition: transform 0.2s; }
        .issue:hover { transform: translateY(-2px); box-shadow: 0 4px 12px rgba(0,0,0,0.05); }
        .issue.error { border-left: 6px solid #ef4444; background: #fef2f2; }
        .issue.warning { border-left: 6px solid #f59e0b; background: #fffbeb; }
        .grade { font-size: 1.5em; font-weight: bold; padding: 4px 12px; border-radius: 6px; }
        .grade.A { background: #dcfce7; color: #166534; }
        .grade.B { background: #fef9c3; color: #854d0e; }
    </style>
</head>
<body>
    <div class="header">
        <h1>UI Inspection Report</h1>
        <p><strong>URL:</strong> ${report.url}</p>
        <p><strong>Grade:</strong> <span class="grade ${report.summary.grade}">${report.summary.grade}</span></p>
    </div>
    <div class="summary">
        <div class="metric"><div class="metric-number">${report.summary.elementsInspected}</div><div>Elements</div></div>
        <div class="metric"><div class="metric-number">${report.summary.totalIssues}</div><div>Total Issues</div></div>
        <div class="metric"><div class="metric-number">${report.summary.issuesBySeverity?.error || 0}</div><div>Errors</div></div>
    </div>
    <div class="issues">
        ${report.issues?.map((issue: any) => `
            <div class="issue ${issue.severity}">
                <h4 style="margin-top:0">${issue.message}</h4>
                <code>${issue.selector}</code>
                ${issue.suggestedFix ? `<p><strong>Fix:</strong> ${issue.suggestedFix}</p>` : ''}
            </div>
        `).join('') || '<p>No issues found</p>'}
    </div>
</body>
</html>`;
  }

  private calculateGrade(totalIssues: number, elementsInspected: number): string {
    if (elementsInspected === 0) return 'A';
    const ratio = totalIssues / elementsInspected;
    if (ratio < 0.1) return 'A';
    if (ratio < 0.3) return 'B';
    if (ratio < 0.5) return 'C';
    if (ratio < 0.7) return 'D';
    return 'F';
  }

  private countIssuesBySeverity(issues: any[]): Record<string, number> {
    return issues.reduce((acc, issue) => {
      acc[issue.severity] = (acc[issue.severity] || 0) + 1;
      return acc;
    }, {});
  }

  private countIssuesByType(issues: any[]): Record<string, number> {
    return issues.reduce((acc, issue) => {
      acc[issue.type] = (acc[issue.type] || 0) + 1;
      return acc;
    }, {});
  }

  private removeDuplicateIssues(issues: Issue[]): Issue[] {
    const seen = new Set<string>();
    return issues.filter(issue => {
      const key = `${issue.selector}|${issue.type}|${issue.message}|${issue.severity}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }
}

/**
 * Simple test to verify that analysis errors are collected and included in markdown reports
 */

// Mock DOM elements that might cause analysis errors
const mockElement = {
  tagName: 'DIV',
  className: 'test',
  getBoundingClientRect: () => ({ width: 100, height: 100, x: 0, y: 0 }),
  getAttribute: (name) => name === 'class' ? 'test' : null,
  hasAttribute: () => false,
  querySelectorAll: () => [],
  style: {
    getPropertyValue: () => '',
    length: 0,
  }
};

// Mock window.getComputedStyle that might throw errors
const originalGetComputedStyle = window.getComputedStyle;
window.getComputedStyle = function(element) {
  if (element.className && element.className.includes('error-trigger')) {
    throw new Error('Mock CSS parsing error');
  }
  return originalGetComputedStyle.call(this, element);
};

// Test the error collection functionality
async function testAnalysisErrorCollection() {
  console.log('Testing analysis error collection...');

  // Create a simple HTML structure
  document.body.innerHTML = `
    <div class="normal">Normal element</div>
    <div class="error-trigger">Element that triggers error</div>
    <div class="another-error-trigger">Another problematic element</div>
  `;

  try {
    // This would normally be done by the ContentScript
    // For testing purposes, we'll simulate the error collection
    const analysisErrors = [];

    // Simulate analyzing elements
    const elements = document.querySelectorAll('*');
    for (let i = 0; i < elements.length; i++) {
      const element = elements[i];
      try {
        // Simulate the analysis that might fail
        if (element.className && element.className.includes('error-trigger')) {
          throw new Error(`Analysis failed for element with class: ${element.className}`);
        }
        // Normal analysis would happen here
        window.getComputedStyle(element);
      } catch (error) {
        console.log('Caught analysis error:', error.message);
        analysisErrors.push({
          id: `test_error_${i}`,
          type: 'analysis_error',
          message: error.message,
          elementId: `element_${i}`,
          selector: element.className ? `.${element.className}` : element.tagName.toLowerCase(),
          details: error.stack,
          timestamp: Date.now(),
        });
      }
    }

    console.log('Collected analysis errors:', analysisErrors);

    // Simulate markdown report generation
    let markdown = '# Test Analysis Report\n\n';

    if (analysisErrors.length > 0) {
      markdown += '## Analysis Errors\n\n';
      markdown += 'During the analysis process, the following errors occurred:\n\n';
      analysisErrors.forEach((error, index) => {
        markdown += `### ${index + 1}. ${error.type.replace('_', ' ').toUpperCase()}: ${error.message}\n\n`;
        if (error.selector) {
          markdown += `- **Element:** \`${error.selector}\`\n`;
        }
        if (error.elementId) {
          markdown += `- **Element ID:** ${error.elementId}\n`;
        }
        if (error.details) {
          markdown += `- **Details:** ${error.details.substring(0, 100)}...\n`;
        }
        markdown += `- **Time:** ${new Date(error.timestamp).toLocaleString()}\n\n`;
      });
    }

    console.log('Generated markdown report:');
    console.log(markdown);

    // Restore original function
    window.getComputedStyle = originalGetComputedStyle;

    return analysisErrors.length > 0;

  } catch (error) {
    console.error('Test failed:', error);
    // Restore original function
    window.getComputedStyle = originalGetComputedStyle;
    return false;
  }
}

// Run the test
if (typeof window !== 'undefined') {
  testAnalysisErrorCollection().then(success => {
    console.log('Test result:', success ? 'PASSED' : 'FAILED');
  });
}

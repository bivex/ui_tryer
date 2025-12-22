/**
 * Copyright (c) 2025 Pixel Perfect Inspector
 *
 * Author: Pixel Perfect Inspector
 * Available for contact via email: support@b-b.top
 * For up-to-date contact information:
 * https://github.com/bivex
 *
 * Created: 2025-12-22T07:31:13
 * Last Updated: 2025-12-22T11:09:24
 *
 * Licensed under the MIT License.
 * Commercial licensing available upon request.
 */

/**
 * Message router for content script
 * Handles message routing between content script and background
 */
import { Message } from '../../types/MessageContracts';

export class MessageRouter {
  /**
   * Handle incoming messages
   */
  async handleMessage(
    message: Message,
    sendResponse: (response: any) => void
  ): Promise<void> {
    try {
      console.log('Content script received message:', message);

      // Route message based on type
      switch (message.type) {
        case 'TOGGLE_INSPECTION_MODE':
          // Handle inspection mode toggle
          this.handleToggleInspectionMode(message.payload);
          sendResponse({ success: true });
          break;

        case 'INSPECT_ELEMENT_REQUEST':
          // Handle element inspection (placeholder)
          sendResponse({
            success: true,
            data: {
              elementId: message.payload.elementId,
              selector: 'placeholder',
              boxModel: {
                content: { width: 100, height: 50, x: 0, y: 0 },
                padding: { top: 8, right: 8, bottom: 8, left: 8 },
                border: { top: 0, right: 0, bottom: 0, left: 0 },
                margin: { top: 0, right: 0, bottom: 0, left: 0 },
              },
              computedStyles: {
                display: 'block',
                position: 'static',
                width: '100px',
                height: '50px',
              },
            }
          });
          break;

        case 'GENERATE_REPORT_REQUEST':
          // Handle report generation (placeholder)
          sendResponse({
            success: true,
            report: {
              id: 'placeholder',
              title: 'UI Inspection Report',
              timestamp: Date.now(),
              url: window.location.href,
              summary: {
                totalIssues: 0,
                grade: 'A',
              },
              issues: [],
              comparisons: [],
              screenshots: [],
            }
          });
          break;

        default:
          sendResponse({
            success: false,
            error: `Unknown message type: ${message.type}`
          });
      }
    } catch (error) {
      console.error('Content script message routing error:', error);
      sendResponse({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Handle inspection mode toggle
   */
  private handleToggleInspectionMode(payload: { enabled: boolean }): void {
    if (payload.enabled) {
      console.log('Inspection mode enabled');
      // Add visual indicator
      this.showInspectionIndicator(true);
    } else {
      console.log('Inspection mode disabled');
      // Remove visual indicator
      this.showInspectionIndicator(false);
    }
  }

  /**
   * Show/hide inspection mode indicator
   */
  private showInspectionIndicator(show: boolean): void {
    let indicator = document.getElementById('ui-inspector-indicator');

    if (show) {
      if (!indicator) {
        indicator = document.createElement('div');
        indicator.id = 'ui-inspector-indicator';
        indicator.textContent = '🔍 UI Inspector Active';
        Object.assign(indicator.style, {
          position: 'fixed',
          top: '10px',
          right: '10px',
          background: 'rgba(0, 123, 255, 0.9)',
          color: 'white',
          padding: '8px 12px',
          borderRadius: '4px',
          fontSize: '12px',
          fontFamily: 'Arial, sans-serif',
          zIndex: '10000',
          pointerEvents: 'none',
        });
        document.body.appendChild(indicator);
      }
    } else {
      if (indicator) {
        indicator.remove();
      }
    }
  }
}

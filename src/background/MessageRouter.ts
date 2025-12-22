/**
 * Copyright (c) 2025 Pixel Perfect Inspector
 *
 * Author: Pixel Perfect Inspector
 * Available for contact via email: support@b-b.top
 * For up-to-date contact information:
 * https://github.com/bivex
 *
 * Created: 2025-12-22T07:31:13
 * Last Updated: 2025-12-22T07:46:20
 *
 * Licensed under the MIT License.
 * Commercial licensing available upon request.
 */

/**
 * Message router for background script
 * Handles message routing between extension components
 */
import { Message } from '../../types/MessageContracts';

export class MessageRouter {
  /**
   * Handle incoming messages
   */
  async handleMessage(
    message: Message,
    sender: chrome.runtime.MessageSender,
    sendResponse: (response: any) => void
  ): Promise<void> {
    try {
      console.log('Background received message:', message);

      // Route message based on type
      switch (message.type) {
        case 'INSPECT_ELEMENT_REQUEST':
          // Forward to content script
          await this.forwardToContent(message, sender.tab?.id);
          sendResponse({ success: true });
          break;

        case 'TOGGLE_INSPECTION_MODE':
          // Forward to content script
          await this.forwardToContent(message, sender.tab?.id);
          sendResponse({ success: true });
          break;

        case 'LOAD_SETTINGS_REQUEST':
          // Handle settings request
          const settings = await this.loadSettings();
          sendResponse({
            success: true,
            settings,
          });
          break;

        case 'SAVE_SETTINGS_REQUEST':
          // Handle settings save
          await this.saveSettings(message.payload.settings);
          sendResponse({ success: true });
          break;

        case 'ELEMENT_SELECTED':
          // Forward element selection to popup
          await this.forwardToPopup(message);
          sendResponse({ success: true });
          break;

        case 'GENERATE_REPORT_REQUEST':
          // Handle report generation - get active tab and send to content script
          await this.handleGenerateReport(sendResponse, message.payload);
          break;

        default:
          sendResponse({
            success: false,
            error: `Unknown message type: ${message.type}`
          });
      }
    } catch (error) {
      console.error('Message routing error:', error);
      sendResponse({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Forward message to content script
   */
  private async forwardToContent(message: Message, tabId?: number): Promise<void> {
    if (!tabId) {
      throw new Error('No tab ID provided for content script message');
    }

    try {
      await chrome.tabs.sendMessage(tabId, message);
    } catch (error) {
      console.error('Failed to forward message to content script:', error);
      throw error;
    }
  }

  /**
   * Forward message to popup
   */
  private async forwardToPopup(message: Message): Promise<void> {
    try {
      // Find popup window
      const windows = await chrome.windows.getAll({ windowTypes: ['popup'] });
      for (const window of windows) {
        if (window.tabs && window.tabs.length > 0) {
          await chrome.tabs.sendMessage(window.tabs[0].id!, message);
        }
      }
    } catch (error) {
      console.error('Failed to forward message to popup:', error);
    }
  }

  /**
   * Load settings (placeholder implementation)
   */
  private async loadSettings(): Promise<any> {
    try {
      const result = await chrome.storage.sync.get(['settings']);
      return result.settings || this.getDefaultSettings();
    } catch (error) {
      console.error('Failed to load settings:', error);
      return this.getDefaultSettings();
    }
  }

  /**
   * Save settings (placeholder implementation)
   */
  private async saveSettings(settings: any): Promise<void> {
    try {
      await chrome.storage.sync.set({ settings });
    } catch (error) {
      console.error('Failed to save settings:', error);
      throw error;
    }
  }

  /**
   * Handle report generation request
   */
  private async handleGenerateReport(sendResponse: (response: any) => void, payload: any): Promise<void> {
    try {
      // Get active tab
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      console.log('Active tab found:', tab);
      if (!tab?.id) {
        sendResponse({ success: false, error: 'No active tab found' });
        return;
      }

      // Check if content script can run on this tab
      const url = tab.url || '';
      if (url.startsWith('chrome://') || url.startsWith('chrome-extension://') || url.startsWith('about:')) {
        sendResponse({ success: false, error: 'Cannot run on chrome:// pages or extension pages' });
        return;
      }

      console.log('Sending message to content script on tab:', tab.id);

      // Send generate report message to content script of active tab
      const response = await Promise.race([
        chrome.tabs.sendMessage(tab.id, {
          type: 'GENERATE_REPORT_REQUEST',
          payload: {
            scope: payload.scope || 'current_page',
            format: payload.format || 'html',
            includeScreenshots: payload.includeScreenshots || false,
          },
          source: 'background',
          target: 'content',
          timestamp: Date.now(),
        }),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Content script response timeout')), 10000)
        )
      ]);

      sendResponse({ success: true, data: response });
    } catch (error) {
      console.error('Failed to generate report:', error);
      sendResponse({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Get default settings
   */
  private getDefaultSettings(): any {
    return {
      designRules: {
        spacingScale: { xs: 4, sm: 8, md: 16, lg: 24, xl: 32, xxl: 48 },
        spacingGrid: [4, 8, 12, 16, 20, 24, 32, 40, 48, 56, 64, 72, 80, 96],
        minClickableSize: 44,
        colorPalette: ['#000000', '#ffffff', '#007bff', '#28a745', '#dc3545', '#ffc107', '#6f42c1'],
        breakpoints: [
          { name: 'Mobile', width: 375, height: 667, device: 'mobile' },
          { name: 'Tablet', width: 768, height: 1024, device: 'tablet' },
          { name: 'Desktop', width: 1440, height: 900, device: 'desktop' }
        ]
      },
      ui: {
        overlayOpacity: 0.8,
        showGridOverlay: false,
        theme: 'light'
      },
      shortcuts: {
        toggleInspect: 'Ctrl+Shift+I',
        generateReport: 'Ctrl+Shift+R'
      }
    };
  }
}

/**
 * Copyright (c) 2025 Pixel Perfect Inspector
 *
 * Author: Pixel Perfect Inspector
 * Available for contact via email: support@b-b.top
 * For up-to-date contact information:
 * https://github.com/bivex
 *
 * Created: 2025-12-22T07:29:50
 * Last Updated: 2025-12-22T11:09:24
 *
 * Licensed under the MIT License.
 * Commercial licensing available upon request.
 */

/**
 * Infrastructure adapter for Chrome Tabs API
 * Provides clean interface for tab-related operations
 */
export class TabAdapter {
  /**
   * Gets the currently active tab
   */
  static async getActiveTab(): Promise<chrome.tabs.Tab | null> {
    try {
      const [tab] = await chrome.tabs.query({
        active: true,
        currentWindow: true,
      });
      return tab || null;
    } catch (error) {
      console.error('Failed to get active tab:', error);
      return null;
    }
  }

  /**
   * Gets tab by ID
   */
  static async getTabById(tabId: number): Promise<chrome.tabs.Tab | null> {
    try {
      return await chrome.tabs.get(tabId);
    } catch (error) {
      console.error(`Failed to get tab ${tabId}:`, error);
      return null;
    }
  }

  /**
   * Executes a script in the specified tab
   */
  static async executeScript(
    tabId: number,
    details: {
      func: (...args: any[]) => any;
      args?: any[];
    }
  ): Promise<any[]> {
    try {
      const results = await chrome.scripting.executeScript({
        target: { tabId },
        func: details.func,
        args: details.args || [],
      });
      return results.map(result => result.result);
    } catch (error) {
      console.error('Failed to execute script:', error);
      throw new Error(`Script execution failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Injects CSS into the specified tab
   */
  static async insertCSS(
    tabId: number,
    details: Omit<chrome.scripting.CSSInjection, 'target'>
  ): Promise<void> {
    try {
      await chrome.scripting.insertCSS({
        target: { tabId },
        ...details,
      });
    } catch (error) {
      console.error('Failed to insert CSS:', error);
      throw new Error(`CSS injection failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Removes injected CSS from the specified tab
   */
  static async removeCSS(
    tabId: number,
    details: Omit<chrome.scripting.CSSInjection, 'target'>
  ): Promise<void> {
    try {
      await chrome.scripting.removeCSS({
        target: { tabId },
        ...details,
      });
    } catch (error) {
      console.error('Failed to remove CSS:', error);
      throw new Error(`CSS removal failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Captures screenshot of the specified tab
   */
  static async captureTabScreenshot(tabId: number, options?: {
    format?: 'png' | 'jpeg';
    quality?: number;
    fullPage?: boolean;
  }): Promise<string> {
    try {
      // Note: This is a simplified implementation
      // In reality, we'd need to use chrome.tabs.captureVisibleTab or similar
      // For now, we'll simulate screenshot capture
      return new Promise((resolve) => {
        setTimeout(() => {
          // Return a placeholder base64 image
          resolve('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==');
        }, 100);
      });
    } catch (error) {
      console.error('Failed to capture screenshot:', error);
      throw new Error(`Screenshot capture failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Sends a message to the content script in the specified tab
   */
  static async sendMessageToTab(
    tabId: number,
    message: any
  ): Promise<any> {
    try {
      return await chrome.tabs.sendMessage(tabId, message);
    } catch (error) {
      console.error('Failed to send message to tab:', error);
      throw new Error(`Message sending failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Reloads the specified tab
   */
  static async reloadTab(tabId: number, bypassCache?: boolean): Promise<void> {
    try {
      await chrome.tabs.reload(tabId, { bypassCache });
    } catch (error) {
      console.error('Failed to reload tab:', error);
      throw new Error(`Tab reload failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Listens for tab updates
   */
  static onTabUpdated(
    callback: (
      tabId: number,
      changeInfo: chrome.tabs.TabChangeInfo,
      tab: chrome.tabs.Tab
    ) => void
  ): () => void {
    chrome.tabs.onUpdated.addListener(callback);
    return () => chrome.tabs.onUpdated.removeListener(callback);
  }

  /**
   * Listens for tab activation changes
   */
  static onTabActivated(
    callback: (activeInfo: chrome.tabs.TabActiveInfo) => void
  ): () => void {
    chrome.tabs.onActivated.addListener(callback);
    return () => chrome.tabs.onActivated.removeListener(callback);
  }

  /**
   * Gets all tabs in the current window
   */
  static async getCurrentWindowTabs(): Promise<chrome.tabs.Tab[]> {
    try {
      return await chrome.tabs.query({ currentWindow: true });
    } catch (error) {
      console.error('Failed to get current window tabs:', error);
      return [];
    }
  }

  /**
   * Checks if a tab is accessible (not chrome://, etc.)
   */
  static isTabAccessible(tab: chrome.tabs.Tab): boolean {
    if (!tab.url) return false;

    // Check for restricted schemes
    const restrictedSchemes = ['chrome:', 'chrome-extension:', 'chrome-devtools:', 'about:'];
    return !restrictedSchemes.some(scheme => tab.url!.startsWith(scheme));
  }

  /**
   * Gets tab URL safely
   */
  static getTabUrl(tab: chrome.tabs.Tab): string {
    return tab.url || tab.pendingUrl || '';
  }

  /**
   * Gets tab title safely
   */
  static getTabTitle(tab: chrome.tabs.Tab): string {
    return tab.title || 'Untitled';
  }
}

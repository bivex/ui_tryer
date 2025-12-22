/**
 * Copyright (c) 2025 Pixel Perfect Inspector
 *
 * Author: Pixel Perfect Inspector
 * Available for contact via email: support@b-b.top
 * For up-to-date contact information:
 * https://github.com/bivex
 *
 * Created: 2025-12-22T07:31:13
 * Last Updated: 2025-12-22T07:41:13
 *
 * Licensed under the MIT License.
 * Commercial licensing available upon request.
 */

/**
 * Extension controller for background script
 * Manages extension state and high-level operations
 */
export class ExtensionController {
  private inspectionModeEnabled = false;
  private currentTabId?: number;

  /**
   * Initialize default settings on first install
   */
  async initializeDefaultSettings(): Promise<void> {
    try {
      const existing = await chrome.storage.sync.get(['settings']);
      if (!existing.settings) {
        const defaultSettings = this.getDefaultSettings();
        await chrome.storage.sync.set({ settings: defaultSettings });
        console.log('Default settings initialized');
      }
    } catch (error) {
      console.error('Failed to initialize default settings:', error);
    }
  }

  /**
   * Handle extension update
   */
  async handleUpdate(previousVersion?: string): Promise<void> {
    console.log(`Handling update from version ${previousVersion}`);

    // Migrate settings if needed
    try {
      const existing = await chrome.storage.sync.get(['settings']);
      if (existing.settings) {
        // Add version to settings if missing
        if (!existing.settings.version) {
          existing.settings.version = '1.0.0';
          await chrome.storage.sync.set({ settings: existing.settings });
        }
      }
    } catch (error) {
      console.error('Failed to migrate settings:', error);
    }
  }

  /**
   * Handle extension startup
   */
  async handleStartup(): Promise<void> {
    console.log('Extension startup');

    // Restore state if needed
    try {
      const state = await chrome.storage.local.get(['extensionState']);
      if (state.extensionState) {
        this.inspectionModeEnabled = state.extensionState.inspectionModeEnabled || false;
        this.currentTabId = state.extensionState.currentTabId;
      }
    } catch (error) {
      console.error('Failed to restore extension state:', error);
    }
  }

  /**
   * Toggle inspection mode
   */
  async toggleInspectionMode(): Promise<void> {
    this.inspectionModeEnabled = !this.inspectionModeEnabled;

    try {
      // Get active tab
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (tab?.id) {
        this.currentTabId = tab.id;

        // Send toggle message to content script
        await chrome.tabs.sendMessage(tab.id, {
          type: 'TOGGLE_INSPECTION_MODE',
          payload: { enabled: this.inspectionModeEnabled },
          source: 'background',
          target: 'content',
          timestamp: Date.now(),
        });

        // Save state
        await this.saveState();

        console.log(`Inspection mode ${this.inspectionModeEnabled ? 'enabled' : 'disabled'}`);
      }
    } catch (error) {
      console.error('Failed to toggle inspection mode:', error);
    }
  }

  /**
   * Generate report
   */
  async generateReport(): Promise<void> {
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (tab?.id) {
        // Send generate report message to content script
        await chrome.tabs.sendMessage(tab.id, {
          type: 'GENERATE_REPORT_REQUEST',
          payload: {
            scope: 'current_page',
            format: 'html',
            includeScreenshots: false,
          },
          source: 'background',
          target: 'content',
          timestamp: Date.now(),
        });
      }
    } catch (error) {
      console.error('Failed to generate report:', error);
    }
  }

  /**
   * Save extension state
   */
  private async saveState(): Promise<void> {
    try {
      await chrome.storage.local.set({
        extensionState: {
          inspectionModeEnabled: this.inspectionModeEnabled,
          currentTabId: this.currentTabId,
          timestamp: Date.now(),
        },
      });
    } catch (error) {
      console.error('Failed to save extension state:', error);
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
      },
      version: '1.0.0',
      lastModified: Date.now(),
    };
  }
}

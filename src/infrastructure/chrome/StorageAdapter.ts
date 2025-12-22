/**
 * Copyright (c) 2025 Pixel Perfect Inspector
 *
 * Author: Pixel Perfect Inspector
 * Available for contact via email: support@b-b.top
 * For up-to-date contact information:
 * https://github.com/bivex
 *
 * Created: 2025-12-22T07:34:22
 * Last Updated: 2025-12-22T11:34:34
 *
 * Licensed under the MIT License.
 * Commercial licensing available upon request.
 */

import { DesignRules } from '../../domain/entities/DesignRules';

/**
 * Infrastructure adapter for Chrome Storage API
 * Handles persistence of extension settings and data
 */
export class StorageAdapter {
  private static readonly SETTINGS_KEY = 'ui_inspector_settings';
  private static readonly INSPECTIONS_KEY = 'ui_inspections_history';
  private static readonly MAX_HISTORY_ITEMS = 100;

  /**
   * Loads extension settings from storage
   */
  static async loadSettings(): Promise<ExtensionSettings | null> {
    try {
      const result = await chrome.storage.sync.get([this.SETTINGS_KEY]);
      const settings = result[this.SETTINGS_KEY];

      if (!settings) {
        // Return default settings if none exist
        return this.createDefaultSettings();
      }

      // Validate and migrate settings if needed
      return this.validateAndMigrateSettings(settings);
    } catch (error) {
      console.error('Failed to load settings:', error);
      return this.createDefaultSettings();
    }
  }

  /**
   * Saves extension settings to storage
   */
  static async saveSettings(settings: ExtensionSettings): Promise<void> {
    try {
      // Validate settings before saving
      const validatedSettings = this.validateSettings(settings);

      await chrome.storage.sync.set({
        [this.SETTINGS_KEY]: {
          ...validatedSettings,
          lastModified: Date.now(),
          version: '1.0',
        },
      });
    } catch (error) {
      console.error('Failed to save settings:', error);
      throw new Error(`Settings save failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Loads inspection history
   */
  static async loadInspectionHistory(limit?: number): Promise<ElementInspectionSummary[]> {
    try {
      const result = await chrome.storage.local.get([this.INSPECTIONS_KEY]);
      const history = (result[this.INSPECTIONS_KEY] as ElementInspectionSummary[]) || [];

      // Sort by timestamp (newest first) and limit results
      return history
        .sort((a: ElementInspectionSummary, b: ElementInspectionSummary) => b.timestamp - a.timestamp)
        .slice(0, limit || this.MAX_HISTORY_ITEMS);
    } catch (error) {
      console.error('Failed to load inspection history:', error);
      return [];
    }
  }

  /**
   * Saves inspection result to history
   */
  static async saveInspectionResult(
    url: string,
    summary: InspectionSummary
  ): Promise<void> {
    try {
      const history = await this.loadInspectionHistory();

      const newEntry: ElementInspectionSummary = {
        id: this.generateId(),
        url,
        timestamp: Date.now(),
        summary,
      };

      // Add to beginning of array
      history.unshift(newEntry);

      // Keep only recent items
      const trimmedHistory = history.slice(0, this.MAX_HISTORY_ITEMS);

      await chrome.storage.local.set({
        [this.INSPECTIONS_KEY]: trimmedHistory,
      });
    } catch (error) {
      console.error('Failed to save inspection result:', error);
      throw new Error(`Inspection save failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Clears all stored data
   */
  static async clearAllData(): Promise<void> {
    try {
      await chrome.storage.sync.clear();
      await chrome.storage.local.clear();
    } catch (error) {
      console.error('Failed to clear data:', error);
      throw new Error(`Data clear failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Exports all data for backup
   */
  static async exportData(): Promise<StorageExport> {
    try {
      const syncData = (await chrome.storage.sync.get(null)) as unknown as Record<string, any>;
      const localData = (await chrome.storage.local.get(null)) as unknown as Record<string, any>;

      return {
        sync: syncData || {},
        local: localData || {},
        exportTimestamp: Date.now(),
        version: '1.0',
      };
    } catch (error) {
      console.error('Failed to export data:', error);
      throw new Error(`Data export failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Imports data from backup
   */
  static async importData(data: StorageExport): Promise<void> {
    try {
      // Validate import data
      this.validateImportData(data);

      // Clear existing data
      await this.clearAllData();

      // Import data
      if (data.sync) {
        await chrome.storage.sync.set(data.sync);
      }

      if (data.local) {
        await chrome.storage.local.set(data.local);
      }
    } catch (error) {
      console.error('Failed to import data:', error);
      throw new Error(`Data import failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Listens for storage changes
   */
  static onStorageChanged(
    callback: (changes: { [key: string]: chrome.storage.StorageChange }) => void
  ): () => void {
    chrome.storage.onChanged.addListener(callback);
    return () => chrome.storage.onChanged.removeListener(callback);
  }

  /**
   * Gets storage usage information
   */
  static async getStorageUsage(): Promise<StorageUsage> {
    try {
      // Note: Chrome doesn't provide direct quota info, so we'll estimate
      const syncData = await chrome.storage.sync.get(null);
      const localData = await chrome.storage.local.get(null);

      const syncSize = this.calculateObjectSize(syncData);
      const localSize = this.calculateObjectSize(localData);

      // Chrome sync storage limit is ~100KB, local storage is ~5MB
      const syncQuota = 100 * 1024; // 100KB
      const localQuota = 5 * 1024 * 1024; // 5MB

      return {
        sync: {
          used: syncSize,
          quota: syncQuota,
          percentage: (syncSize / syncQuota) * 100,
        },
        local: {
          used: localSize,
          quota: localQuota,
          percentage: (localSize / localQuota) * 100,
        },
      };
    } catch (error) {
      console.error('Failed to get storage usage:', error);
      return {
        sync: { used: 0, quota: 100 * 1024, percentage: 0 },
        local: { used: 0, quota: 5 * 1024 * 1024, percentage: 0 },
      };
    }
  }

  /**
   * Creates default settings
   */
  private static createDefaultSettings(): ExtensionSettings {
    return {
      designRules: DesignRulesFactory.createDefault(),
      ui: {
        overlayOpacity: 0.8,
        showGridOverlay: false,
        theme: 'light',
      },
      shortcuts: {
        toggleInspect: 'Ctrl+Shift+I',
        generateReport: 'Ctrl+Shift+R',
      },
      version: '1.0',
      lastModified: Date.now(),
    };
  }

  /**
   * Validates settings structure
   */
  private static validateSettings(settings: any): ExtensionSettings {
    if (!settings || typeof settings !== 'object') {
      throw new Error('Invalid settings format');
    }

    // Basic validation - in real app, would be more comprehensive
    if (!settings.designRules) {
      settings.designRules = DesignRulesFactory.createDefault();
    }

    if (!settings.ui) {
      settings.ui = this.createDefaultSettings().ui;
    }

    return settings as ExtensionSettings;
  }

  /**
   * Validates and migrates settings if needed
   */
  private static validateAndMigrateSettings(settings: any): ExtensionSettings {
    let validatedSettings = this.validateSettings(settings);

    // Handle version migrations
    if (!validatedSettings.version) {
      validatedSettings = this.migrateFromLegacy(validatedSettings);
    }

    return validatedSettings;
  }

  /**
   * Migrates from legacy settings format
   */
  private static migrateFromLegacy(settings: any): ExtensionSettings {
    // Migration logic would go here
    return {
      ...settings,
      version: '1.0',
      lastModified: Date.now(),
    };
  }

  /**
   * Validates import data
   */
  private static validateImportData(data: StorageExport): void {
    if (!data || typeof data !== 'object') {
      throw new Error('Invalid import data format');
    }

    if (!data.exportTimestamp) {
      throw new Error('Missing export timestamp');
    }
  }

  /**
   * Calculates approximate object size in bytes
   */
  private static calculateObjectSize(obj: any): number {
    return new Blob([JSON.stringify(obj)]).size;
  }

  /**
   * Generates unique ID
   */
  private static generateId(): string {
    return `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

// Import required types
import { DesignRulesFactory } from '../../domain/entities/DesignRules';

/**
 * Types for storage operations
 */
export interface ExtensionSettings {
  designRules: DesignRules;
  ui: {
    overlayOpacity: number;
    showGridOverlay: boolean;
    theme: 'light' | 'dark';
  };
  shortcuts: {
    toggleInspect: string;
    generateReport: string;
  };
  version: string;
  lastModified: number;
}

export interface ElementInspectionSummary {
  id: string;
  url: string;
  timestamp: number;
  summary: InspectionSummary;
}

export interface InspectionSummary {
  totalElements: number;
  totalIssues: number;
  criticalIssues: number;
  score: number;
}

export interface StorageExport {
  sync: Record<string, any>;
  local: Record<string, any>;
  exportTimestamp: number;
  version: string;
}

export interface StorageUsage {
  sync: {
    used: number;
    quota: number;
    percentage: number;
  };
  local: {
    used: number;
    quota: number;
    percentage: number;
  };
}

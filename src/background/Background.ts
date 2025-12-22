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
 * Background script (Service Worker) - Manifest V3
 * Handles extension lifecycle, message routing, and background tasks
 */
import { MessageRouter } from './MessageRouter';
import { ExtensionController } from './ExtensionController';

class Background {
  private messageRouter: MessageRouter;
  private controller: ExtensionController;

  constructor() {
    this.messageRouter = new MessageRouter();
    this.controller = new ExtensionController();

    this.initialize();
  }

  /**
   * Initialize background script
   */
  private initialize(): void {
    this.setupMessageListeners();
    this.setupExtensionListeners();
    this.setupCommandListeners();

    console.log('UI Inspector background script initialized');
  }

  /**
   * Setup message listeners for communication with popup/content
   */
  private setupMessageListeners(): void {
    chrome.runtime.onMessage.addListener(
      (message, sender, sendResponse) => {
        this.messageRouter.handleMessage(message, sender, sendResponse);
        // Return true to indicate async response
        return true;
      }
    );
  }

  /**
   * Setup extension lifecycle listeners
   */
  private setupExtensionListeners(): void {
    // Handle extension installation
    chrome.runtime.onInstalled.addListener((details) => {
      if (details.reason === 'install') {
        this.handleFirstInstall();
      } else if (details.reason === 'update') {
        this.handleUpdate(details.previousVersion);
      }
    });

    // Handle extension startup
    chrome.runtime.onStartup.addListener(() => {
      this.handleStartup();
    });
  }

  /**
   * Setup keyboard command listeners
   */
  private setupCommandListeners(): void {
    chrome.commands.onCommand.addListener((command) => {
      this.handleCommand(command);
    });
  }

  /**
   * Handle first time installation
   */
  private async handleFirstInstall(): Promise<void> {
    console.log('UI Inspector installed');

    // Initialize default settings
    await this.controller.initializeDefaultSettings();

    // Open welcome page or options
    chrome.tabs.create({
      url: chrome.runtime.getURL('ui/options/options.html'),
    });
  }

  /**
   * Handle extension update
   */
  private async handleUpdate(previousVersion?: string): Promise<void> {
    console.log(`UI Inspector updated from ${previousVersion}`);

    // Handle data migration if needed
    await this.controller.handleUpdate(previousVersion);

    // Show update notification
    this.showUpdateNotification();
  }

  /**
   * Handle extension startup
   */
  private async handleStartup(): Promise<void> {
    console.log('UI Inspector started');

    // Restore any necessary state
    await this.controller.handleStartup();
  }

  /**
   * Handle keyboard commands
   */
  private handleCommand(command: string): void {
    switch (command) {
      case 'toggle-inspect':
        this.controller.toggleInspectionMode();
        break;

      case 'generate-report':
        this.controller.generateReport();
        break;

      default:
        console.warn(`Unknown command: ${command}`);
    }
  }

  /**
   * Show update notification
   */
  private showUpdateNotification(): void {
    chrome.notifications.create({
      type: 'basic',
      iconUrl: chrome.runtime.getURL('icons/icon128.png'),
      title: 'UI Inspector обновлен',
      message: 'Расширение обновлено до новой версии. Проверьте новые возможности!',
      buttons: [
        { title: 'Открыть настройки' },
        { title: 'Посмотреть changelog' },
      ],
    });
  }
}

// Initialize background script
new Background();

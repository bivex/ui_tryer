/**
 * Copyright (c) 2025 Bivex
 *
 * Author: Bivex
 * Available for contact via email: support@b-b.top
 * For up-to-date contact information:
 * https://github.com/bivex
 *
 * Created: 2025-12-22T07:47:16
 * Last Updated: 2025-12-22T11:34:34
 *
 * Licensed under the MIT License.
 * Commercial licensing available upon request.
 */

// Jest setup file
import 'jest';

// Mock Chrome API for tests
const mockChrome = {
  runtime: {
    sendMessage: jest.fn(),
    onMessage: {
      addListener: jest.fn(),
      removeListener: jest.fn(),
    },
  },
  tabs: {
    query: jest.fn(),
    sendMessage: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  },
  storage: {
    sync: {
      get: jest.fn(),
      set: jest.fn(),
    },
    local: {
      get: jest.fn(),
      set: jest.fn(),
    },
    onChanged: {
      addListener: jest.fn(),
      removeListener: jest.fn(),
    },
  },
  windows: {
    getAll: jest.fn(),
  },
  commands: {
    onCommand: {
      addListener: jest.fn(),
      removeListener: jest.fn(),
    },
  },
  notifications: {
    create: jest.fn(),
  },
};

// Global Chrome API mock
(global as any).chrome = mockChrome;

// Mock DOM APIs
Object.defineProperty(window, 'getComputedStyle', {
  value: jest.fn(() => ({
    getPropertyValue: jest.fn(),
    display: 'block',
    position: 'static',
    width: '100px',
    height: '50px',
    fontSize: '16px',
    lineHeight: '1.5',
    color: '#000000',
    backgroundColor: '#ffffff',
    margin: '0px',
    padding: '8px',
    border: '0px',
  })),
});

Object.defineProperty(window, 'innerWidth', {
  value: 1920,
  writable: true,
});

Object.defineProperty(window, 'innerHeight', {
  value: 1080,
  writable: true,
});

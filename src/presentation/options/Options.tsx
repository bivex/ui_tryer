/**
 * Copyright (c) 2025 Pixel Perfect Inspector
 *
 * Author: Pixel Perfect Inspector
 * Available for contact via email: support@b-b.top
 * For up-to-date contact information:
 * https://github.com/bivex
 *
 * Created: 2025-12-22T07:31:13
 * Last Updated: 2025-12-22T11:09:25
 *
 * Licensed under the MIT License.
 * Commercial licensing available upon request.
 */

import React, { useState, useEffect } from 'react';
import { createRoot } from 'react-dom/client';

/**
 * Options page component for the extension
 */
const Options: React.FC = () => {
  const [settings, setSettings] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<string>('');

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const response = await chrome.runtime.sendMessage({
        type: 'LOAD_SETTINGS_REQUEST',
        source: 'options',
        target: 'background',
        timestamp: Date.now(),
      });

      if (response.success) {
        setSettings(response.settings);
      } else {
        setMessage('Failed to load settings');
      }
    } catch (error) {
      console.error('Failed to load settings:', error);
      setMessage('Failed to load settings');
    } finally {
      setIsLoading(false);
    }
  };

  const saveSettings = async () => {
    if (!settings) return;

    setIsSaving(true);
    setMessage('');

    try {
      const response = await chrome.runtime.sendMessage({
        type: 'SAVE_SETTINGS_REQUEST',
        payload: { settings },
        source: 'options',
        target: 'background',
        timestamp: Date.now(),
      });

      if (response.success) {
        setMessage('Settings saved successfully!');
        setTimeout(() => setMessage(''), 3000);
      } else {
        setMessage('Failed to save settings');
      }
    } catch (error) {
      console.error('Failed to save settings:', error);
      setMessage('Failed to save settings');
    } finally {
      setIsSaving(false);
    }
  };

  const updateSetting = (path: string, value: any) => {
    if (!settings) return;

    const newSettings = { ...settings };
    const keys = path.split('.');
    let current = newSettings;

    for (let i = 0; i < keys.length - 1; i++) {
      if (!current[keys[i]]) current[keys[i]] = {};
      current = current[keys[i]];
    }

    current[keys[keys.length - 1]] = value;
    setSettings(newSettings);
  };

  if (isLoading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '200px',
        fontFamily: 'Arial, sans-serif'
      }}>
        Loading settings...
      </div>
    );
  }

  return (
    <div style={{
      maxWidth: '800px',
      margin: '0 auto',
      padding: '20px',
      fontFamily: 'Arial, sans-serif'
    }}>
      <h1 style={{
        marginBottom: '30px',
        color: '#333',
        borderBottom: '2px solid #007bff',
        paddingBottom: '10px'
      }}>
        UI Inspector Settings
      </h1>

      {message && (
        <div style={{
          padding: '10px',
          marginBottom: '20px',
          borderRadius: '4px',
          backgroundColor: message.includes('success') ? '#d4edda' : '#f8d7da',
          color: message.includes('success') ? '#155724' : '#721c24',
          border: `1px solid ${message.includes('success') ? '#c3e6cb' : '#f5c6cb'}`,
        }}>
          {message}
        </div>
      )}

      <div style={{ marginBottom: '30px' }}>
        <h2 style={{ color: '#555', marginBottom: '15px' }}>Design Rules</h2>

        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
            Minimum Clickable Size (px):
          </label>
          <input
            type="number"
            value={settings?.designRules?.minClickableSize || 44}
            onChange={(e) => updateSetting('designRules.minClickableSize', parseInt(e.target.value))}
            style={{
              padding: '8px',
              border: '1px solid #ddd',
              borderRadius: '4px',
              width: '100px'
            }}
          />
        </div>

        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
            Spacing Grid (comma-separated values):
          </label>
          <input
            type="text"
            value={settings?.designRules?.spacingGrid?.join(', ') || ''}
            onChange={(e) => updateSetting('designRules.spacingGrid', e.target.value.split(',').map(v => parseInt(v.trim())).filter(v => !isNaN(v)))}
            style={{
              padding: '8px',
              border: '1px solid #ddd',
              borderRadius: '4px',
              width: '100%'
            }}
          />
        </div>
      </div>

      <div style={{ marginBottom: '30px' }}>
        <h2 style={{ color: '#555', marginBottom: '15px' }}>UI Settings</h2>

        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
            Overlay Opacity:
          </label>
          <input
            type="range"
            min="0.1"
            max="1"
            step="0.1"
            value={settings?.ui?.overlayOpacity || 0.8}
            onChange={(e) => updateSetting('ui.overlayOpacity', parseFloat(e.target.value))}
            style={{ width: '100%' }}
          />
          <span style={{ fontSize: '12px', color: '#666' }}>
            {settings?.ui?.overlayOpacity || 0.8}
          </span>
        </div>

        <div style={{ marginBottom: '20px' }}>
          <label style={{
            display: 'flex',
            alignItems: 'center',
            fontWeight: 'bold',
            cursor: 'pointer'
          }}>
            <input
              type="checkbox"
              checked={settings?.ui?.showGridOverlay || false}
              onChange={(e) => updateSetting('ui.showGridOverlay', e.target.checked)}
              style={{ marginRight: '8px' }}
            />
            Show Grid Overlay
          </label>
        </div>

        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
            Theme:
          </label>
          <select
            value={settings?.ui?.theme || 'light'}
            onChange={(e) => updateSetting('ui.theme', e.target.value)}
            style={{
              padding: '8px',
              border: '1px solid #ddd',
              borderRadius: '4px'
            }}
          >
            <option value="light">Light</option>
            <option value="dark">Dark</option>
          </select>
        </div>
      </div>

      <div style={{
        borderTop: '1px solid #eee',
        paddingTop: '20px',
        textAlign: 'right'
      }}>
        <button
          onClick={saveSettings}
          disabled={isSaving}
          style={{
            padding: '12px 24px',
            backgroundColor: '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            fontSize: '14px',
            cursor: isSaving ? 'not-allowed' : 'pointer',
            opacity: isSaving ? 0.6 : 1
          }}
        >
          {isSaving ? 'Saving...' : 'Save Settings'}
        </button>
      </div>

      <div style={{
        marginTop: '30px',
        padding: '15px',
        backgroundColor: '#f8f9fa',
        borderRadius: '4px',
        fontSize: '12px',
        color: '#666'
      }}>
        <h3 style={{ margin: '0 0 10px 0', color: '#333' }}>About</h3>
        <p style={{ margin: '0' }}>
          UI Inspector v1.0.0 - Chrome extension for UI design validation<br/>
          Checks spacing, sizing, colors, and responsive behavior against design system rules.
        </p>
      </div>
    </div>
  );
};

export default Options;

// Initialize React app
const container = document.getElementById('options-root');
if (container) {
  const root = createRoot(container);
  root.render(<Options />);
} else {
  console.error('Options root element not found');
}

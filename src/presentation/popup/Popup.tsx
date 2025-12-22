/**
 * Copyright (c) 2025 Pixel Perfect Inspector
 *
 * Author: Pixel Perfect Inspector
 * Available for contact via email: support@b-b.top
 * For up-to-date contact information:
 * https://github.com/bivex
 *
 * Created: 2025-12-22T07:31:13
 * Last Updated: 2025-12-22T09:07:19
 *
 * Licensed under the MIT License.
 * Commercial licensing available upon request.
 */

import React, { useState, useEffect } from 'react';
import { createRoot } from 'react-dom/client';

// shadcn/ui inspired dark theme styles
const styles = {
  container: {
    width: '380px',
    minHeight: '500px',
    backgroundColor: '#0f172a', // slate-900
    fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    borderRadius: '12px',
    overflow: 'hidden',
    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.8)',
    border: '1px solid #1e293b', // slate-800
  },
  header: {
    backgroundColor: '#1e293b', // slate-800
    padding: '24px 24px 20px 24px',
    textAlign: 'center' as const,
    borderBottom: '1px solid #334155', // slate-700
  },
  title: {
    margin: '0 0 6px 0',
    fontSize: '22px',
    fontWeight: '700',
    color: '#f1f5f9', // slate-100
    letterSpacing: '-0.025em',
  },
  subtitle: {
    margin: '0',
    fontSize: '14px',
    color: '#94a3b8', // slate-400
    fontWeight: '500',
  },
  content: {
    padding: '24px',
    backgroundColor: '#0f172a', // slate-900
  },
  statusBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    padding: '6px 12px',
    borderRadius: '20px',
    fontSize: '12px',
    fontWeight: '600',
    letterSpacing: '0.025em',
    marginBottom: '20px',
  },
  statusActive: {
    backgroundColor: '#dc2626', // red-600
    color: 'white',
  },
  statusInactive: {
    backgroundColor: '#16a34a', // green-600
    color: 'white',
  },
  card: {
    backgroundColor: '#1e293b', // slate-800
    border: '1px solid #334155', // slate-700
    borderRadius: '8px',
    padding: '20px',
    marginBottom: '20px',
  },
  cardTitle: {
    fontSize: '16px',
    fontWeight: '600',
    color: '#f1f5f9', // slate-100
    marginBottom: '16px',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  button: {
    width: '100%',
    padding: '12px 16px',
    border: '1px solid #475569', // slate-600
    borderRadius: '6px',
    fontSize: '14px',
    fontWeight: '500',
    cursor: 'pointer',
    transition: 'all 0.15s ease',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    marginBottom: '8px',
    backgroundColor: '#1e293b', // slate-800
    color: '#f1f5f9', // slate-100
  },
  buttonHover: {
    backgroundColor: '#334155', // slate-700
    borderColor: '#64748b', // slate-500
    transform: 'translateY(-1px)',
  },
  buttonPrimary: {
    backgroundColor: '#3b82f6', // blue-500
    borderColor: '#3b82f6',
    color: 'white',
  },
  buttonPrimaryHover: {
    backgroundColor: '#2563eb', // blue-600
    borderColor: '#2563eb',
  },
  buttonDestructive: {
    backgroundColor: '#dc2626', // red-600
    borderColor: '#dc2626',
    color: 'white',
  },
  buttonDestructiveHover: {
    backgroundColor: '#b91c1c', // red-700
    borderColor: '#b91c1c',
  },
  buttonSecondary: {
    backgroundColor: '#16a34a', // green-600
    borderColor: '#16a34a',
    color: 'white',
  },
  buttonSecondaryHover: {
    backgroundColor: '#15803d', // green-700
    borderColor: '#15803d',
  },
  buttonOutline: {
    backgroundColor: 'transparent',
    borderColor: '#475569', // slate-600
    color: '#cbd5e1', // slate-300
  },
  buttonOutlineHover: {
    backgroundColor: '#1e293b', // slate-800
    borderColor: '#64748b', // slate-500
    color: '#f1f5f9', // slate-100
  },
  description: {
    fontSize: '13px',
    color: '#94a3b8', // slate-400
    lineHeight: '1.5',
    marginTop: '8px',
    textAlign: 'center' as const,
  },
  hotkeyList: {
    backgroundColor: '#1e293b', // slate-800
    border: '1px solid #334155', // slate-700
    borderRadius: '8px',
    padding: '16px',
  },
  hotkeyTitle: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#f1f5f9', // slate-100
    marginBottom: '12px',
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
  },
  hotkeyItem: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '10px 0',
    borderBottom: '1px solid #334155', // slate-700
  },
  hotkeyItemLast: {
    borderBottom: 'none',
  },
  hotkeyKey: {
    backgroundColor: '#0f172a', // slate-900
    border: '1px solid #334155', // slate-700
    padding: '4px 8px',
    borderRadius: '4px',
    fontSize: '11px',
    fontWeight: '600',
    color: '#cbd5e1', // slate-300
    fontFamily: 'ui-monospace, SFMono-Regular, monospace',
    letterSpacing: '0.025em',
  },
  hotkeyDesc: {
    fontSize: '13px',
    color: '#94a3b8', // slate-400
  },
  footer: {
    padding: '16px 24px',
    borderTop: '1px solid #334155', // slate-700
    backgroundColor: '#1e293b', // slate-800
    textAlign: 'center' as const,
  },
  footerLink: {
    color: '#3b82f6', // blue-500
    textDecoration: 'none',
    fontSize: '13px',
    fontWeight: '500',
    transition: 'color 0.15s ease',
  },
  footerLinkHover: {
    color: '#60a5fa', // blue-400
  },
  loading: {
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    justifyContent: 'center',
    height: '450px',
    color: '#f1f5f9', // slate-100
  },
  loadingSpinner: {
    width: '32px',
    height: '32px',
    border: '2px solid #334155', // slate-700
    borderTop: '2px solid #3b82f6', // blue-500
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
    marginBottom: '16px',
  },
};

/**
 * Main popup component for the extension
 */
const Popup: React.FC = () => {
  const [isInspecting, setIsInspecting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [buttonHover, setButtonHover] = useState<string | null>(null);
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);
  const [isCopyingReport, setIsCopyingReport] = useState(false);
  const [checkColorPalette, setCheckColorPalette] = useState(true);

  useEffect(() => {
    // Initialize popup
    initializePopup();
  }, []);

  const initializePopup = async () => {
    try {
      // Load current state
      const response = await chrome.runtime.sendMessage({
        type: 'LOAD_SETTINGS_REQUEST',
        source: 'popup',
        target: 'background',
        timestamp: Date.now(),
      });

      if (response.success) {
        // Set initial state based on settings
        setIsInspecting(false); // Default to false
      }
    } catch (error) {
      console.error('Failed to initialize popup:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleInspection = async () => {
    try {
      await chrome.runtime.sendMessage({
        type: 'TOGGLE_INSPECTION_MODE',
        payload: { enabled: !isInspecting },
        source: 'popup',
        target: 'background',
        timestamp: Date.now(),
      });

      setIsInspecting(!isInspecting);
    } catch (error) {
      console.error('Failed to toggle inspection mode:', error);
    }
  };

  const generateReport = async () => {
    setIsGeneratingReport(true);
    try {
      const response = await chrome.runtime.sendMessage({
        type: 'GENERATE_REPORT_REQUEST',
        payload: {
          scope: 'current_page',
          format: 'html',
          includeScreenshots: false,
          settings: {
            checkColorPalette,
          },
        },
        source: 'popup',
        target: 'background',
        timestamp: Date.now(),
      });

      if (response.success) {
        alert('✅ HTML отчет сгенерирован! Проверьте новую вкладку.');
      } else {
        alert('❌ Не удалось сгенерировать HTML отчет');
      }

      // Close popup after generating report
      window.close();
    } catch (error) {
      console.error('Failed to generate report:', error);
      alert('❌ Ошибка при генерации отчета');
    } finally {
      setIsGeneratingReport(false);
    }
  };

  const copyMarkdownReport = async () => {
    setIsCopyingReport(true);
    try {
      const response = await chrome.runtime.sendMessage({
        type: 'GENERATE_REPORT_REQUEST',
        payload: {
          scope: 'current_page',
          format: 'markdown',
          includeScreenshots: false,
          settings: {
            checkColorPalette,
          },
        },
        source: 'popup',
        target: 'background',
        timestamp: Date.now(),
      });

      if (response.success && response.data?.report) {
        await navigator.clipboard.writeText(response.data.report);

        // Show brief success feedback and log full report to console
        console.log('Pixel Police Report copied to clipboard:', response.data.report);
      } else {
        alert('❌ Не удалось сгенерировать отчет');
      }
    } catch (error) {
      console.error('Failed to copy markdown report:', error);
      alert('❌ Ошибка при копировании отчета');
    } finally {
      setIsCopyingReport(false);
    }
  };

  const handleButtonHover = (buttonId: string | null) => {
    setButtonHover(buttonId);
  };

  if (isLoading) {
    return (
      <div style={styles.container}>
        <div style={styles.loading}>
          <div style={styles.loadingSpinner}></div>
          <div style={{ fontSize: '16px', fontWeight: '600', letterSpacing: '-0.025em' }}>
            Loading Pixel Police...
          </div>
        </div>
        <style>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.title}>🚔 Pixel Police</h1>
        <p style={styles.subtitle}>UI Crime Investigation Unit</p>
      </div>

      <div style={styles.content}>
        {/* Status Badge */}
        <div style={{
          ...styles.statusBadge,
          ...(isInspecting ? styles.statusActive : styles.statusInactive)
        }}>
          <span>{isInspecting ? '●' : '●'}</span>
          <span>{isInspecting ? 'INSPECTION ACTIVE' : 'READY TO INSPECT'}</span>
        </div>

        {/* Inspection Card */}
        <div style={styles.card}>
          <h3 style={styles.cardTitle}>
            <span>🔍</span>
            Element Inspection
          </h3>

          <button
            onClick={toggleInspection}
            onMouseEnter={() => handleButtonHover('inspect')}
            onMouseLeave={() => handleButtonHover(null)}
            style={{
              ...styles.button,
              ...(isInspecting ? styles.buttonDestructive : styles.buttonPrimary),
              ...(buttonHover === 'inspect' ? (isInspecting ? styles.buttonDestructiveHover : styles.buttonPrimaryHover) : {}),
            }}
          >
            <span>{isInspecting ? '⏹️' : '🔍'}</span>
            <span>{isInspecting ? 'Stop Inspection' : 'Start Inspection'}</span>
          </button>

          <p style={styles.description}>
            {isInspecting
              ? 'Hover over elements to inspect them and reveal UI crimes'
              : 'Click to activate inspection mode and catch design violations'
            }
          </p>
        </div>

        {/* Settings Card */}
        <div style={styles.card}>
          <h3 style={styles.cardTitle}>
            <span>⚙️</span>
            Settings
          </h3>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
            <input
              type="checkbox"
              id="colorPaletteCheck"
              checked={checkColorPalette}
              onChange={(e) => setCheckColorPalette(e.target.checked)}
              style={{
                width: '16px',
                height: '16px',
                accentColor: '#3b82f6',
              }}
            />
            <label
              htmlFor="colorPaletteCheck"
              style={{
                fontSize: '14px',
                color: '#f1f5f9',
                cursor: 'pointer',
                userSelect: 'none',
              }}
            >
              Check color palette compliance
            </label>
          </div>

          <p style={{
            fontSize: '12px',
            color: '#94a3b8',
            margin: '0',
            lineHeight: '1.4',
          }}>
            When enabled, Pixel Police will validate that all colors used match the Tailwind CSS color palette.
          </p>
        </div>

        {/* Reports Card */}
        <div style={styles.card}>
          <h3 style={styles.cardTitle}>
            <span>📊</span>
            Reports & Analysis
          </h3>

          <button
            onClick={generateReport}
            disabled={isGeneratingReport}
            onMouseEnter={() => handleButtonHover('report')}
            onMouseLeave={() => handleButtonHover(null)}
            style={{
              ...styles.button,
              ...styles.buttonSecondary,
              ...(buttonHover === 'report' ? styles.buttonSecondaryHover : {}),
              ...(isGeneratingReport ? { opacity: 0.6, cursor: 'not-allowed' } : {}),
            }}
          >
            <span>{isGeneratingReport ? '⏳' : '📊'}</span>
            <span>{isGeneratingReport ? 'Generating...' : 'Generate HTML Report'}</span>
          </button>

          <button
            onClick={copyMarkdownReport}
            disabled={isCopyingReport}
            onMouseEnter={() => handleButtonHover('copy')}
            onMouseLeave={() => handleButtonHover(null)}
            style={{
              ...styles.button,
              ...styles.buttonOutline,
              ...(buttonHover === 'copy' ? styles.buttonOutlineHover : {}),
              ...(isCopyingReport ? { opacity: 0.6, cursor: 'not-allowed' } : {}),
            }}
          >
            <span>{isCopyingReport ? '⏳' : '📋'}</span>
            <span>{isCopyingReport ? 'Copying...' : 'Copy Markdown Report'}</span>
          </button>
        </div>

        {/* Hotkeys Card */}
        <div style={styles.hotkeyList}>
          <h4 style={styles.hotkeyTitle}>
            <span>⌨️</span>
            Keyboard Shortcuts
          </h4>

          <div style={styles.hotkeyItem}>
            <span style={styles.hotkeyDesc}>Toggle inspection mode</span>
            <span style={styles.hotkeyKey}>Ctrl+Shift+I</span>
          </div>

          <div style={{...styles.hotkeyItem, ...styles.hotkeyItemLast}}>
            <span style={styles.hotkeyDesc}>Generate report</span>
            <span style={styles.hotkeyKey}>Ctrl+Shift+R</span>
          </div>
        </div>
      </div>

      {/* Footer with GitHub link */}
      <div style={styles.footer}>
        <a
          href="https://github.com/bivex"
          target="_blank"
          rel="noopener noreferrer"
          style={styles.footerLink}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = styles.footerLinkHover.color;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = styles.footerLink.color;
          }}
        >
          Made by bivex
        </a>
      </div>
    </div>
  );
};

export default Popup;

// Initialize React app
const container = document.getElementById('popup-root');
if (container) {
  const root = createRoot(container);
  root.render(<Popup />);
} else {
  console.error('Popup root element not found');
}

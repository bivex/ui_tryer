import { ElementInspection } from '../../../types/MessageContracts';

export class RaidService {
  constructor() {}

  public createRaidOverlay(): HTMLElement {
    const overlay = document.createElement('div');
    overlay.id = 'pixel-police-raid-overlay';
    Object.assign(overlay.style, {
      position: 'fixed',
      top: '20px',
      left: '50%',
      transform: 'translateX(-50%)',
      backgroundColor: '#dc2626',
      color: 'white',
      padding: '12px 24px',
      borderRadius: '30px',
      boxShadow: '0 10px 25px rgba(0,0,0,0.5)',
      zIndex: '2147483647',
      fontWeight: 'bold',
      fontSize: '16px',
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      transition: 'all 0.3s ease',
      fontFamily: 'system-ui, -apple-system, sans-serif'
    });
    overlay.innerHTML = '🚨 <span id="pixel-police-raid-status">Investigating UI Crimes...</span>';
    return overlay;
  }

  public updateRaidOverlay(overlay: HTMLElement, crimeCount: number, elementCount: number, onClose: () => void): void {
    const status = overlay.querySelector('#pixel-police-raid-status');
    if (status) {
      if (crimeCount > 0) {
        status.textContent = `CRIME WAVE DETECTED: ${crimeCount} violations in ${elementCount} elements!`;
        overlay.style.backgroundColor = '#dc2626'; // Red
      } else {
        status.textContent = 'Не найдено (UI crimes not found)';
        overlay.style.backgroundColor = '#16a34a'; // Green
        // Auto-remove green overlay after 3s if no crimes
        setTimeout(onClose, 3000);
      }
    }
    
    // Add a close button
    const closeBtn = document.createElement('span');
    closeBtn.textContent = '✕';
    closeBtn.style.marginLeft = '12px';
    closeBtn.style.cursor = 'pointer';
    closeBtn.onclick = onClose;
    overlay.appendChild(closeBtn);

    // Add Copy Report button
    const copyBtn = document.createElement('button');
    copyBtn.textContent = '📋 Copy Report';
    copyBtn.style.marginLeft = '12px';
    copyBtn.style.padding = '4px 8px';
    copyBtn.style.borderRadius = '4px';
    copyBtn.style.border = 'none';
    copyBtn.style.cursor = 'pointer';
    copyBtn.style.backgroundColor = 'white';
    copyBtn.style.color = '#dc2626';
    copyBtn.style.fontWeight = 'bold';
    copyBtn.id = 'raid-copy-report';
    overlay.appendChild(copyBtn);
  }

  public showMarkers(elements: ElementInspection[]): void {
    this.clearMarkers();
    
    elements.forEach(element => {
      if (!element.issues || element.issues.length === 0) return;
      
      const marker = document.createElement('div');
      marker.className = 'pixel-police-crime-marker';
      const severity = element.issues.some(i => i.severity === 'error') ? 'error' : 'warning';
      
      Object.assign(marker.style, {
        position: 'absolute',
        top: `${element.boxModel.content.y}px`,
        left: `${element.boxModel.content.x}px`,
        width: `${element.boxModel.content.width}px`,
        height: `${element.boxModel.content.height}px`,
        border: `2px solid ${severity === 'error' ? '#dc2626' : '#facc15'}`,
        backgroundColor: `${severity === 'error' ? 'rgba(220, 38, 38, 0.1)' : 'rgba(250, 204, 21, 0.1)'}`,
        zIndex: '2147483646',
        pointerEvents: 'none',
        boxSizing: 'border-box'
      });
      
      const badge = document.createElement('div');
      badge.textContent = element.issues.length.toString();
      Object.assign(badge.style, {
        position: 'absolute',
        top: '-10px',
        right: '-10px',
        backgroundColor: severity === 'error' ? '#dc2626' : '#facc15',
        color: severity === 'error' ? 'white' : 'black',
        borderRadius: '50%',
        width: '20px',
        height: '20px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '12px',
        fontWeight: 'bold',
        boxShadow: '0 2px 4px rgba(0,0,0,0.3)'
      });
      
      marker.appendChild(badge);
      document.body.appendChild(marker);
    });
  }

  public clearMarkers(): void {
    const markers = document.querySelectorAll('.pixel-police-crime-marker');
    markers.forEach(m => m.remove());
  }
}

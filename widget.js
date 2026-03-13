/**
 * widget.js — VulnScan Embeddable Security Widget
 * 
 * VIRAL BACKLINK MACHINE:
 * Any site that pastes this one script tag gets a "Scan this site" button
 * that links back to vulnscan.tech with their domain pre-filled.
 * 
 * Each install = permanent DA-whatever backlink from that site's domain.
 * Spreads without ANY effort once seeded.
 * 
 * USAGE (paste on any site):
 * <script src="https://vulnscan.tech/widget.js" async></script>
 */

(function() {
  'use strict';
  
  // Don't double-load
  if (window.__vulnscanLoaded) return;
  window.__vulnscanLoaded = true;
  
  const VULNSCAN = 'https://vulnscan.tech';
  const domain = window.location.hostname;
  
  // ── Inject styles ──────────────────────────────────────────
  const style = document.createElement('style');
  style.textContent = `
    #vulnscan-widget {
      position: fixed;
      bottom: 20px;
      right: 20px;
      z-index: 99999;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    }
    #vulnscan-btn {
      display: flex;
      align-items: center;
      gap: 8px;
      background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
      border: 1px solid rgba(99,102,241,0.4);
      border-radius: 12px;
      padding: 10px 16px;
      cursor: pointer;
      color: #e2e8f0;
      font-size: 13px;
      font-weight: 500;
      text-decoration: none;
      box-shadow: 0 4px 24px rgba(0,0,0,0.4), 0 0 0 1px rgba(99,102,241,0.1);
      transition: all 0.2s ease;
      white-space: nowrap;
    }
    #vulnscan-btn:hover {
      border-color: rgba(99,102,241,0.8);
      box-shadow: 0 4px 24px rgba(99,102,241,0.3), 0 0 0 1px rgba(99,102,241,0.3);
      transform: translateY(-1px);
      color: #fff;
    }
    #vulnscan-icon {
      font-size: 16px;
      line-height: 1;
    }
    #vulnscan-badge {
      display: flex;
      flex-direction: column;
      line-height: 1.3;
    }
    #vulnscan-label {
      font-size: 11px;
      color: #6366f1;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    #vulnscan-action {
      font-size: 13px;
      color: #e2e8f0;
    }
    #vulnscan-powered {
      display: block;
      text-align: right;
      font-size: 10px;
      color: rgba(148,163,184,0.5);
      margin-top: 4px;
      text-decoration: none;
    }
    #vulnscan-powered:hover { color: rgba(99,102,241,0.7); }
    @media (max-width: 480px) {
      #vulnscan-widget { bottom: 12px; right: 12px; }
    }
  `;
  document.head.appendChild(style);
  
  // ── Build widget ───────────────────────────────────────────
  const widget = document.createElement('div');
  widget.id = 'vulnscan-widget';
  
  const scanUrl = `${VULNSCAN}/?scan=${encodeURIComponent(domain)}&ref=widget`;
  
  widget.innerHTML = `
    <a id="vulnscan-btn" href="${scanUrl}" target="_blank" rel="noopener">
      <span id="vulnscan-icon">⚡</span>
      <span id="vulnscan-badge">
        <span id="vulnscan-label">Security</span>
        <span id="vulnscan-action">Scan this site</span>
      </span>
    </a>
    <a id="vulnscan-powered" href="${VULNSCAN}" target="_blank" rel="noopener">
      Powered by VulnScan
    </a>
  `;
  
  // Mount after DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => document.body.appendChild(widget));
  } else {
    document.body.appendChild(widget);
  }
  
  // ── Track installations (optional analytics) ───────────────
  try {
    const img = new Image();
    img.src = `${VULNSCAN}/widget-ping.gif?d=${encodeURIComponent(domain)}&v=2`;
  } catch(e) {}
  
})();

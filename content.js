// Reverse Image Prompt — Content Script
// Displays an overlay panel with the reverse-engineered prompt

(function () {
  const PANEL_ID = 'rip-ext-panel';

  // Remove existing panel if any
  function removePanel() {
    const existing = document.getElementById(PANEL_ID);
    if (existing) existing.remove();
  }

  // Create and show the panel
  function showPanel(imageUrl) {
    removePanel();

    const overlay = document.createElement('div');
    overlay.id = PANEL_ID;
    overlay.innerHTML = `
      <style>
        #${PANEL_ID} {
          position: fixed;
          top: 0; right: 0;
          width: 420px;
          height: 100vh;
          z-index: 2147483647;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          box-sizing: border-box;
        }
        #${PANEL_ID} * { box-sizing: border-box; }
        #${PANEL_ID} .rip-backdrop {
          position: fixed;
          top: 0; left: 0; right: 0; bottom: 0;
          background: rgba(0,0,0,0.3);
          z-index: -1;
        }
        #${PANEL_ID} .rip-panel {
          position: relative;
          width: 100%;
          height: 100%;
          background: #1a1a2e;
          color: #e0e0e0;
          display: flex;
          flex-direction: column;
          box-shadow: -4px 0 24px rgba(0,0,0,0.4);
          animation: rip-slide-in 0.25s ease-out;
        }
        @keyframes rip-slide-in {
          from { transform: translateX(100%); }
          to { transform: translateX(0); }
        }
        #${PANEL_ID} .rip-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 16px 20px;
          background: linear-gradient(135deg, #7c3aed, #2563eb);
          flex-shrink: 0;
        }
        #${PANEL_ID} .rip-header h2 {
          margin: 0;
          font-size: 16px;
          font-weight: 600;
          color: #fff;
        }
        #${PANEL_ID} .rip-close {
          background: rgba(255,255,255,0.15);
          border: none;
          color: #fff;
          width: 28px;
          height: 28px;
          border-radius: 6px;
          cursor: pointer;
          font-size: 18px;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: background 0.15s;
        }
        #${PANEL_ID} .rip-close:hover {
          background: rgba(255,255,255,0.3);
        }
        #${PANEL_ID} .rip-body {
          flex: 1;
          overflow-y: auto;
          padding: 20px;
        }
        #${PANEL_ID} .rip-image-preview {
          width: 100%;
          max-height: 200px;
          object-fit: contain;
          border-radius: 8px;
          border: 1px solid rgba(255,255,255,0.1);
          margin-bottom: 16px;
          background: #0d0d1a;
        }
        #${PANEL_ID} .rip-label {
          font-size: 11px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          color: #8b8ba3;
          margin-bottom: 8px;
        }
        #${PANEL_ID} .rip-result-box {
          background: #0d0d1a;
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 8px;
          padding: 16px;
          font-size: 14px;
          line-height: 1.6;
          color: #d0d0e0;
          min-height: 80px;
          white-space: pre-wrap;
          word-break: break-word;
        }
        #${PANEL_ID} .rip-loading {
          display: flex;
          align-items: center;
          gap: 12px;
          color: #8b8ba3;
          font-size: 14px;
        }
        #${PANEL_ID} .rip-spinner {
          width: 20px;
          height: 20px;
          border: 2px solid rgba(124,58,237,0.3);
          border-top: 2px solid #7c3aed;
          border-radius: 50%;
          animation: rip-spin 0.8s linear infinite;
        }
        @keyframes rip-spin {
          to { transform: rotate(360deg); }
        }
        #${PANEL_ID} .rip-error {
          color: #f87171;
          font-size: 13px;
          padding: 12px;
          background: rgba(248,113,113,0.1);
          border-radius: 8px;
          border: 1px solid rgba(248,113,113,0.2);
        }
        #${PANEL_ID} .rip-actions {
          display: flex;
          gap: 8px;
          padding: 16px 20px;
          border-top: 1px solid rgba(255,255,255,0.06);
          flex-shrink: 0;
        }
        #${PANEL_ID} .rip-btn {
          flex: 1;
          padding: 10px 16px;
          border: none;
          border-radius: 8px;
          font-size: 13px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.15s;
        }
        #${PANEL_ID} .rip-btn-primary {
          background: linear-gradient(135deg, #7c3aed, #2563eb);
          color: #fff;
        }
        #${PANEL_ID} .rip-btn-primary:hover {
          filter: brightness(1.1);
        }
        #${PANEL_ID} .rip-btn-primary:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
        #${PANEL_ID} .rip-btn-secondary {
          background: rgba(255,255,255,0.08);
          color: #d0d0e0;
        }
        #${PANEL_ID} .rip-btn-secondary:hover {
          background: rgba(255,255,255,0.14);
        }
        #${PANEL_ID} .rip-copied {
          color: #34d399;
          font-size: 12px;
          text-align: center;
          padding: 4px;
          opacity: 0;
          transition: opacity 0.2s;
        }
        #${PANEL_ID} .rip-copied.show {
          opacity: 1;
        }
      </style>
      <div class="rip-backdrop"></div>
      <div class="rip-panel">
        <div class="rip-header">
          <h2>Reverse Image Prompt</h2>
          <button class="rip-close" title="Close">&times;</button>
        </div>
        <div class="rip-body">
          <img class="rip-image-preview" src="${escapeAttr(imageUrl)}" alt="Selected image" />
          <div class="rip-label">Generated Prompt</div>
          <div class="rip-result-box" id="rip-result">
            <div class="rip-loading">
              <div class="rip-spinner"></div>
              Analyzing image...
            </div>
          </div>
        </div>
        <div class="rip-copied" id="rip-copied">Copied to clipboard!</div>
        <div class="rip-actions">
          <button class="rip-btn rip-btn-primary" id="rip-copy" disabled>Copy Prompt</button>
          <button class="rip-btn rip-btn-secondary" id="rip-close-btn">Close</button>
        </div>
      </div>
    `;

    document.body.appendChild(overlay);

    // Event listeners
    overlay.querySelector('.rip-close').addEventListener('click', removePanel);
    overlay.querySelector('#rip-close-btn').addEventListener('click', removePanel);
    overlay.querySelector('.rip-backdrop').addEventListener('click', removePanel);

    overlay.querySelector('#rip-copy').addEventListener('click', () => {
      const resultEl = document.getElementById('rip-result');
      const text = resultEl.textContent;
      if (text) {
        navigator.clipboard.writeText(text).then(() => {
          const copiedEl = document.getElementById('rip-copied');
          copiedEl.classList.add('show');
          setTimeout(() => copiedEl.classList.remove('show'), 2000);
        });
      }
    });

    // Close on Escape
    const escHandler = (e) => {
      if (e.key === 'Escape') {
        removePanel();
        document.removeEventListener('keydown', escHandler);
      }
    };
    document.addEventListener('keydown', escHandler);
  }

  function escapeAttr(str) {
    return str.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/'/g, '&#39;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  // Listen for messages from background script
  chrome.runtime.onMessage.addListener((message) => {
    if (message.action === 'showPanel') {
      showPanel(message.imageUrl);
    }

    if (message.action === 'result') {
      const resultEl = document.getElementById('rip-result');
      if (resultEl) {
        resultEl.textContent = message.prompt;
      }
      const copyBtn = document.getElementById('rip-copy');
      if (copyBtn) {
        copyBtn.disabled = false;
      }
    }

    if (message.action === 'error') {
      const resultEl = document.getElementById('rip-result');
      if (resultEl) {
        resultEl.innerHTML = `<div class="rip-error">${escapeHtml(message.message)}</div>`;
      }
    }
  });

  function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }
})();

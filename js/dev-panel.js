/**
 * Developer Panel
 * Developer control panel - for controlling Mock mode and viewing test data
 */

class DevPanel {
  constructor() {
    this.isVisible = false;
    this.isMinimized = false;
    this.config = null;
    this.init();
  }

  async init() {
    // Wait for config to load
    await this.waitForConfig();
    
    // Only show when showDevPanel is enabled
    if (this.config?.dev?.showDevPanel) {
      this.createPanel();
      this.attachEventListeners();
      console.log('🛠️ Dev Panel enabled');
    }
  }

  async waitForConfig() {
    // Wait for apiManager to initialize
    let attempts = 0;
    while (!window.apiManager && attempts < 50) {
      await new Promise(resolve => setTimeout(resolve, 100));
      attempts++;
    }
    
    if (window.apiManager) {
      this.config = window.apiManager.config;
    }
  }

  createPanel() {
    const panel = document.createElement('div');
    panel.id = 'dev-panel';
    panel.innerHTML = `
      <style>
        #dev-panel {
          position: fixed;
          bottom: 20px;
          right: 20px;
          width: 320px;
          background: linear-gradient(135deg, #8D705C 0%, #805146 100%);
          border-radius: 12px;
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
          color: white;
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          z-index: 9999;
          overflow: hidden;
          transition: all 0.3s ease;
        }

        #dev-panel.minimized {
          width: 180px;
          height: auto;
        }

        #dev-panel.minimized .dev-panel-body {
          display: none;
        }

        #dev-panel.minimized .dev-panel-header {
          cursor: pointer;
        }

        .dev-panel-header {
          padding: 12px 16px;
          background: rgba(0, 0, 0, 0.2);
          display: flex;
          justify-content: space-between;
          align-items: center;
          cursor: move;
          user-select: none;
        }

        .dev-panel-title {
          font-weight: bold;
          font-size: 14px;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .dev-panel-controls {
          display: flex;
          gap: 8px;
        }

        .dev-panel-btn {
          background: rgba(255, 255, 255, 0.2);
          border: none;
          color: white;
          width: 24px;
          height: 24px;
          border-radius: 4px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: background 0.2s;
        }

        .dev-panel-btn:hover {
          background: rgba(255, 255, 255, 0.3);
        }

        .dev-panel-btn.minimize {
          transition: transform 0.3s ease;
        }

        .dev-panel-btn.minimize.rotated {
          transform: rotate(180deg);
        }

        .dev-panel-body {
          padding: 16px;
          max-height: 500px;
          overflow-y: auto;
        }

        .dev-section {
          margin-bottom: 16px;
        }

        .dev-section-title {
          font-size: 12px;
          font-weight: bold;
          margin-bottom: 8px;
          opacity: 0.9;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .dev-toggle {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 10px 12px;
          background: rgba(255, 255, 255, 0.1);
          border-radius: 8px;
          margin-bottom: 8px;
          cursor: pointer;
          transition: background 0.2s;
        }

        .dev-toggle:hover {
          background: rgba(255, 255, 255, 0.15);
        }

        .dev-toggle-label {
          font-size: 13px;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .dev-switch {
          position: relative;
          width: 44px;
          height: 24px;
          background: rgba(255, 255, 255, 0.3);
          border-radius: 12px;
          transition: background 0.3s;
        }

        .dev-switch.active {
          background: #10b981;
        }

        .dev-switch-slider {
          position: absolute;
          top: 2px;
          left: 2px;
          width: 20px;
          height: 20px;
          background: white;
          border-radius: 50%;
          transition: transform 0.3s;
        }

        .dev-switch.active .dev-switch-slider {
          transform: translateX(20px);
        }

        .dev-scenario {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 8px 12px;
          background: rgba(255, 255, 255, 0.1);
          border-radius: 6px;
          margin-bottom: 6px;
          font-size: 12px;
        }

        .dev-scenario-name {
          font-weight: 500;
        }

        .dev-scenario-select {
          background: rgba(0, 0, 0, 0.3);
          color: white;
          border: 1px solid rgba(255, 255, 255, 0.2);
          border-radius: 4px;
          padding: 4px 8px;
          font-size: 11px;
          cursor: pointer;
        }

        .dev-scenario-select option {
          background: #2d3748;
          color: white;
        }

        .dev-button {
          width: 100%;
          padding: 10px;
          background: rgba(255, 255, 255, 0.2);
          border: 1px solid rgba(255, 255, 255, 0.3);
          border-radius: 6px;
          color: white;
          font-size: 13px;
          cursor: pointer;
          transition: all 0.2s;
          margin-bottom: 8px;
        }

        .dev-button:hover {
          background: rgba(255, 255, 255, 0.3);
          transform: translateY(-1px);
        }

        .dev-stats {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 8px;
          margin-top: 8px;
        }

        .dev-stat {
          background: rgba(255, 255, 255, 0.1);
          padding: 8px;
          border-radius: 6px;
          text-align: center;
        }

        .dev-stat-value {
          font-size: 20px;
          font-weight: bold;
          margin-bottom: 4px;
        }

        .dev-stat-label {
          font-size: 10px;
          opacity: 0.8;
          text-transform: uppercase;
        }
      </style>

      <div class="dev-panel-header" id="dev-panel-header">
        <div class="dev-panel-title">
          🛠️ <span id="dev-panel-title-text">Dev Panel</span>
        </div>
        <div class="dev-panel-controls">
          <button class="dev-panel-btn minimize" id="dev-panel-minimize" title="最小化/展開">▼</button>
          <button class="dev-panel-btn" id="dev-panel-close" title="關閉">×</button>
        </div>
      </div>

      <div class="dev-panel-body">
        <!-- Mock Mode Toggle -->
        <div class="dev-section">
          <div class="dev-section-title">模式控制</div>
          <div class="dev-toggle" id="mock-mode-toggle">
            <div class="dev-toggle-label">
              <span id="mock-mode-icon">🎭</span>
              <span>Mock Mode</span>
            </div>
            <div class="dev-switch ${this.config?.dev?.mockMode ? 'active' : ''}" id="mock-mode-switch">
              <div class="dev-switch-slider"></div>
            </div>
          </div>
        </div>

        <!-- Scenarios -->
        <div class="dev-section">
          <div class="dev-section-title">API 場景設定</div>
          <div id="scenarios-container"></div>
        </div>

        <!-- Actions -->
        <div class="dev-section">
          <div class="dev-section-title">動作</div>
          <button class="dev-button" id="view-mock-data">📊 查看 Mock 數據</button>
          <button class="dev-button" id="reset-mock-data">🔄 重置 Mock 數據</button>
          <button class="dev-button" id="clear-addresses">🗑️ 清空地址</button>
        </div>

        <!-- Stats -->
        <div class="dev-section">
          <div class="dev-section-title">統計</div>
          <div class="dev-stats">
            <div class="dev-stat">
              <div class="dev-stat-value" id="stat-addresses">-</div>
              <div class="dev-stat-label">地址數</div>
            </div>
            <div class="dev-stat">
              <div class="dev-stat-value" id="stat-delay">-</div>
              <div class="dev-stat-label">延遲 (ms)</div>
            </div>
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(panel);
    this.panel = panel;

    // Initialize scenario selectors
    this.renderScenarios();
    this.updateStats();

    // Make panel draggable
    this.makeDraggable();
  }

  renderScenarios() {
    if (!window.MockData) return;

    const container = document.getElementById('scenarios-container');
    if (!container) return;

    container.innerHTML = '';

    Object.keys(MockData.scenarios).forEach(action => {
      const scenario = document.createElement('div');
      scenario.className = 'dev-scenario';
      scenario.innerHTML = `
        <div class="dev-scenario-name">${action}</div>
        <select class="dev-scenario-select" data-action="${action}">
          <option value="success" ${MockData.scenarios[action] === 'success' ? 'selected' : ''}>✓ 成功</option>
          <option value="error" ${MockData.scenarios[action] === 'error' ? 'selected' : ''}>✗ 失敗</option>
          <option value="timeout" ${MockData.scenarios[action] === 'timeout' ? 'selected' : ''}>⏱ 超時</option>
          <option value="notfound" ${MockData.scenarios[action] === 'notfound' ? 'selected' : ''}>🔍 不存在</option>
          <option value="duplicate" ${MockData.scenarios[action] === 'duplicate' ? 'selected' : ''}>📝 重複</option>
        </select>
      `;
      container.appendChild(scenario);
    });
  }

  updateStats() {
    const addressCount = window.MockData?.addresses?.length || 0;
    const delay = this.config?.dev?.mockDelay || 0;

    const statAddresses = document.getElementById('stat-addresses');
    const statDelay = document.getElementById('stat-delay');

    if (statAddresses) statAddresses.textContent = addressCount;
    if (statDelay) statDelay.textContent = delay;
  }

  attachEventListeners() {
    // Close button
    document.getElementById('dev-panel-close')?.addEventListener('click', () => {
      this.panel.remove();
    });

    // Minimize button
    const minimizeBtn = document.getElementById('dev-panel-minimize');
    const toggleMinimize = () => {
      this.isMinimized = !this.isMinimized;
      this.panel.classList.toggle('minimized');
      minimizeBtn.classList.toggle('rotated');
      minimizeBtn.title = this.isMinimized ? '點擊展開' : '最小化/展開';
    };
    
    minimizeBtn?.addEventListener('click', (e) => {
      e.stopPropagation();
      toggleMinimize();
    });

    // Click title bar to expand (only when minimized)
    document.getElementById('dev-panel-header')?.addEventListener('click', () => {
      if (this.isMinimized) {
        toggleMinimize();
      }
    });

    // Mock Mode Toggle
    document.getElementById('mock-mode-toggle')?.addEventListener('click', () => {
      this.toggleMockMode();
    });

    // Scenario selection
    document.querySelectorAll('.dev-scenario-select').forEach(select => {
      select.addEventListener('change', (e) => {
        const action = e.target.dataset.action;
        const scenario = e.target.value;
        if (window.MockData) {
          MockData.scenarios[action] = scenario;
          console.log(`🎭 Scenario updated: ${action} = ${scenario}`);
        }
      });
    });

    // View Mock Data
    document.getElementById('view-mock-data')?.addEventListener('click', () => {
      console.log('📊 Mock Data:', window.MockData);
      alert('Mock 數據已輸出到 Console (按 F12 查看)');
    });

    // Reset Mock Data
    document.getElementById('reset-mock-data')?.addEventListener('click', () => {
      if (window.MockData && confirm('確定要重置 Mock 數據嗎？')) {
        MockData.reset();
        this.updateStats();
        alert('✅ Mock 數據已重置');
      }
    });

    // Clear addresses
    document.getElementById('clear-addresses')?.addEventListener('click', () => {
      if (window.MockData && confirm('確定要清空所有地址嗎？')) {
        MockData.clearAddresses();
        this.updateStats();
        alert('✅ 所有地址已清空');
      }
    });
  }

  toggleMockMode() {
    if (!this.config?.dev) return;

    this.config.dev.mockMode = !this.config.dev.mockMode;
    
    const switchEl = document.getElementById('mock-mode-switch');
    const icon = document.getElementById('mock-mode-icon');
    
    if (switchEl) {
      switchEl.classList.toggle('active');
    }
    
    if (icon) {
      icon.textContent = this.config.dev.mockMode ? '🎭' : '🌐';
    }

    console.log(`🔄 Mock Mode: ${this.config.dev.mockMode ? 'ON' : 'OFF'}`);
    alert(`Mock Mode 已${this.config.dev.mockMode ? '啟用' : '停用'}\n${this.config.dev.mockMode ? '將使用模擬數據' : '將呼叫真實 API'}`);
  }

  makeDraggable() {
    const header = document.getElementById('dev-panel-header');
    let isDragging = false;
    let currentX;
    let currentY;
    let initialX;
    let initialY;

    header.addEventListener('mousedown', (e) => {
      if (e.target.closest('.dev-panel-btn')) return;
      
      isDragging = true;
      initialX = e.clientX - this.panel.offsetLeft;
      initialY = e.clientY - this.panel.offsetTop;
    });

    document.addEventListener('mousemove', (e) => {
      if (!isDragging) return;

      e.preventDefault();
      currentX = e.clientX - initialX;
      currentY = e.clientY - initialY;

      this.panel.style.left = currentX + 'px';
      this.panel.style.top = currentY + 'px';
      this.panel.style.right = 'auto';
      this.panel.style.bottom = 'auto';
    });

    document.addEventListener('mouseup', () => {
      isDragging = false;
    });
  }
}

// Auto initialize
if (typeof window !== 'undefined') {
  window.addEventListener('DOMContentLoaded', () => {
    window.devPanel = new DevPanel();
  });
}

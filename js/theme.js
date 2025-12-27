/**
 * Spring Festival Theme Manager
 * 深色模式管理、本地儲存、自動偵測系統主題
 */

class ThemeManager {
  constructor(config) {
    this.config = config;
    this.storageKey = config.storage.keys.theme;
    this.currentTheme = null;
    this.mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    
    this.init();
  }

  /**
   * 初始化主題系統
   */
  init() {
    // 載入已儲存的主題偏好
    const savedTheme = this.loadTheme();
    
    if (savedTheme) {
      // 使用已儲存的主題
      this.setTheme(savedTheme, false);
    } else {
      // 使用系統主題
      this.setTheme(this.getSystemTheme(), false);
    }

    // 監聽系統主題變化
    this.mediaQuery.addEventListener('change', (e) => {
      // 只在沒有用戶偏好時才自動切換
      if (!this.loadTheme()) {
        this.setTheme(e.matches ? 'dark' : 'light', false);
      }
    });

    console.log('✅ Theme Manager 初始化成功');
  }

  /**
   * 取得系統主題
   */
  getSystemTheme() {
    return this.mediaQuery.matches ? 'dark' : 'light';
  }

  /**
   * 取得當前主題
   */
  getCurrentTheme() {
    return this.currentTheme || this.getSystemTheme();
  }

  /**
   * 設定主題
   * @param {string} theme - 'light' 或 'dark'
   * @param {boolean} save - 是否儲存到 localStorage
   */
  setTheme(theme, save = true) {
    const validTheme = theme === 'dark' ? 'dark' : 'light';
    
    // 更新 HTML class
    if (validTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }

    // 更新當前主題
    this.currentTheme = validTheme;

    // 儲存偏好
    if (save) {
      this.saveTheme(validTheme);
    }

    // 觸發主題變更事件
    window.dispatchEvent(new CustomEvent('theme-changed', {
      detail: { theme: validTheme }
    }));

    // 更新主題切換按鈕圖示
    this.updateToggleButton();

    console.log(`主題已切換為: ${validTheme}`);
  }

  /**
   * 切換主題
   */
  toggle() {
    const newTheme = this.getCurrentTheme() === 'dark' ? 'light' : 'dark';
    this.setTheme(newTheme);
  }

  /**
   * 儲存主題偏好到 localStorage
   */
  saveTheme(theme) {
    try {
      localStorage.setItem(this.storageKey, theme);
    } catch (error) {
      console.error('無法儲存主題偏好:', error);
    }
  }

  /**
   * 從 localStorage 載入主題偏好
   */
  loadTheme() {
    try {
      return localStorage.getItem(this.storageKey);
    } catch (error) {
      console.error('無法載入主題偏好:', error);
      return null;
    }
  }

  /**
   * 清除已儲存的主題偏好
   */
  clearTheme() {
    try {
      localStorage.removeItem(this.storageKey);
      // 恢復使用系統主題
      this.setTheme(this.getSystemTheme(), false);
    } catch (error) {
      console.error('無法清除主題偏好:', error);
    }
  }

  /**
   * 更新主題切換按鈕
   */
  updateToggleButton() {
    const toggleButtons = document.querySelectorAll('[data-theme-toggle]');
    const isDark = this.getCurrentTheme() === 'dark';

    toggleButtons.forEach(button => {
      // 更新按鈕圖示
      const sunIcon = button.querySelector('[data-theme-icon="sun"]');
      const moonIcon = button.querySelector('[data-theme-icon="moon"]');

      if (sunIcon && moonIcon) {
        if (isDark) {
          sunIcon.classList.remove('hidden');
          moonIcon.classList.add('hidden');
        } else {
          sunIcon.classList.add('hidden');
          moonIcon.classList.remove('hidden');
        }
      }

      // 更新 aria-label
      button.setAttribute('aria-label', 
        isDark ? '切換至淺色模式' : '切換至深色模式'
      );
    });
  }

  /**
   * 建立主題切換按鈕
   */
  createToggleButton() {
    const button = document.createElement('button');
    button.setAttribute('data-theme-toggle', '');
    button.className = `
      fixed bottom-6 right-6 z-50
      w-14 h-14 rounded-full
      bg-white dark:bg-gray-800
      shadow-lg hover:shadow-xl
      border-2 border-gray-200 dark:border-gray-700
      transition-all duration-300
      flex items-center justify-center
      focus:outline-none focus:ring-2 focus:ring-red-500
      hover:scale-110
    `.trim().replace(/\s+/g, ' ');

    button.innerHTML = `
      <!-- Sun Icon (顯示在深色模式) -->
      <svg data-theme-icon="sun" class="w-6 h-6 text-yellow-500 hidden" fill="currentColor" viewBox="0 0 20 20">
        <path fill-rule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" clip-rule="evenodd" />
      </svg>
      
      <!-- Moon Icon (顯示在淺色模式) -->
      <svg data-theme-icon="moon" class="w-6 h-6 text-gray-700" fill="currentColor" viewBox="0 0 20 20">
        <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
      </svg>
    `;

    button.addEventListener('click', () => this.toggle());

    return button;
  }

  /**
   * 自動插入主題切換按鈕
   */
  insertToggleButton() {
    // 檢查是否已存在按鈕
    const existingButton = document.querySelector('[data-theme-toggle]');
    
    if (existingButton) {
      // 如果按鈕已存在，綁定點擊事件
      existingButton.addEventListener('click', (e) => {
        e.preventDefault();
        this.toggle();
      });
      // 初始化按鈕狀態
      this.updateToggleButton();
      console.log('主題切換按鈕已綁定');
      return;
    }

    // 如果不存在，建立並插入按鈕
    const button = this.createToggleButton();
    document.body.appendChild(button);

    // 初始化按鈕狀態
    this.updateToggleButton();
    console.log('主題切換按鈕已創建');
  }
}

// ============================================
// 全域實例化
// ============================================

let themeManager = null;

/**
 * 初始化 Theme Manager
 */
async function initTheme() {
  try {
    // 載入配置
    const response = await fetch('./config.json');
    const config = await response.json();

    // 檢查是否啟用深色模式
    if (!config.features.darkMode) {
      console.log('深色模式已停用');
      return null;
    }

    // 建立 Theme Manager 實例
    themeManager = new ThemeManager(config);
    
    // 自動插入主題切換按鈕
    themeManager.insertToggleButton();

    return themeManager;

  } catch (error) {
    console.error('❌ Theme Manager 初始化失敗:', error);
    return null;
  }
}

// 自動初始化
if (typeof window !== 'undefined') {
  window.addEventListener('DOMContentLoaded', () => {
    initTheme();
  });
}

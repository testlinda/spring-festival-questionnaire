/**
 * Spring Festival Theme Manager
 * Dark mode management, local storage, automatic system theme detection
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
   * Initialize theme system
   */
  init() {
    // Load saved theme preference
    const savedTheme = this.loadTheme();
    const defaultTheme = 'dark'; // Default to dark when no preference is saved
    
    if (savedTheme) {
      // Use saved theme
      this.setTheme(savedTheme, false);
    } else {
      // Use default dark theme when no saved preference exists
      this.setTheme(defaultTheme, false);
    }

    // Listen for system theme changes
    this.mediaQuery.addEventListener('change', (e) => {
      // Auto switch only when no user preference
      if (!this.loadTheme()) {
        this.setTheme(e.matches ? 'dark' : 'light', false);
      }
    });

    console.log('✅ Theme Manager initialized successfully');
  }

  /**
   * Get system theme
   */
  getSystemTheme() {
    return this.mediaQuery.matches ? 'dark' : 'light';
  }

  /**
   * Get current theme
   */
  getCurrentTheme() {
    return this.currentTheme || this.getSystemTheme();
  }

  /**
   * Set theme
   * @param {string} theme - 'light' or 'dark'
   * @param {boolean} save - Whether to save to localStorage
   */
  setTheme(theme, save = true) {
    const validTheme = theme === 'dark' ? 'dark' : 'light';
    
    // Update HTML class
    if (validTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }

    // Update current theme
    this.currentTheme = validTheme;

    // Save preference
    if (save) {
      this.saveTheme(validTheme);
    }

    // Trigger theme change event
    window.dispatchEvent(new CustomEvent('theme-changed', {
      detail: { theme: validTheme }
    }));

    // Update toggle button icon
    this.updateToggleButton();

    console.log(`Theme switched to: ${validTheme}`);
  }

  /**
   * Toggle theme
   */
  toggle() {
    const newTheme = this.getCurrentTheme() === 'dark' ? 'light' : 'dark';
    this.setTheme(newTheme);
  }

  /**
   * Save theme preference to localStorage
   */
  saveTheme(theme) {
    try {
      localStorage.setItem(this.storageKey, theme);
    } catch (error) {
      console.error('Failed to save theme preference:', error);
    }
  }

  /**
   * Load theme preference from localStorage
   */
  loadTheme() {
    try {
      return localStorage.getItem(this.storageKey);
    } catch (error) {
      console.error('Failed to load theme preference:', error);
      return null;
    }
  }

  /**
   * Clear saved theme preference
   */
  clearTheme() {
    try {
      localStorage.removeItem(this.storageKey);
      // Restore to system theme
      this.setTheme(this.getSystemTheme(), false);
    } catch (error) {
      console.error('Failed to clear theme preference:', error);
    }
  }

  /**
   * Update theme toggle button
   */
  updateToggleButton() {
    const toggleButtons = document.querySelectorAll('[data-theme-toggle]');
    const isDark = this.getCurrentTheme() === 'dark';

    toggleButtons.forEach(button => {
      // Update button icon
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

      // Update aria-label
      button.setAttribute('aria-label', 
        isDark ? '切換至淺色模式' : '切換至深色模式'
      );
    });
  }

  /**
   * Create theme toggle button
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
      focus:outline-none focus:ring-2 focus:ring-green-500
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
   * Auto insert theme toggle button
   */
  insertToggleButton() {
    // Check if button already exists
    const existingButton = document.querySelector('[data-theme-toggle]');
    
    if (existingButton) {
      // If button exists, bind click event
      existingButton.addEventListener('click', (e) => {
        e.preventDefault();
        this.toggle();
      });
      // Initialize button state
      this.updateToggleButton();
      console.log('Theme toggle button bound');
      return;
    }

    // If not exists, create and insert button
    const button = this.createToggleButton();
    document.body.appendChild(button);

    // Initialize button state
    this.updateToggleButton();
    console.log('Theme toggle button created');
  }
}

// ============================================
// Global Instance
// ============================================

let themeManager = null;

/**
 * Initialize Theme Manager
 */
async function initTheme() {
  try {
    // Load config
    const response = await fetch('./config.json');
    const config = await response.json();

    // Check if dark mode is enabled
    if (!config.features.darkMode) {
      console.log('Dark mode disabled');
      return null;
    }

    // Create Theme Manager instance
    themeManager = new ThemeManager(config);
    
    // Auto insert theme toggle button
    themeManager.insertToggleButton();

    return themeManager;

  } catch (error) {
    console.error('❌ Theme Manager initialization failed:', error);
    return null;
  }
}

// Auto initialize
if (typeof window !== 'undefined') {
  window.addEventListener('DOMContentLoaded', () => {
    initTheme();
  });
}

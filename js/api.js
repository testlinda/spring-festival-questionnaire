/**
 * Spring Festival API Manager
 * Centralized management for all API calls, error handling, and loading states
 */

class SpringFestivalAPI {
  constructor(config) {
    this.config = config;
    this.baseUrl = config.api.baseUrl;
    this.timeout = config.api.timeout;
    this.retryAttempts = config.api.retryAttempts;
    this.retryDelay = config.api.retryDelay;
    this.requestQueue = [];
    this.isProcessing = false;
    this.cachedConfig = null;
    this.cachedMessages = null;
  }

  /**
   * Generic API request method
   * @param {string} action - API action
   * @param {Object} params - Query parameters
   * @param {Object} data - POST data
   * @param {Object} options - Additional options
   */
  async request(action, params = {}, data = null, options = {}) {
    // Check if Mock mode is enabled
    if (this.config.dev && this.config.dev.mockMode) {
      return this.mockRequest(action, params, data, options);
    }

    // Parse options
    const retry = options.retry !== undefined ? options.retry : true;
    const showLoading = options.showLoading !== undefined ? options.showLoading : true;
    const timeout = options.timeout || this.timeout;
    const method = options.method || (data ? 'POST' : 'GET');

    console.log(`🔵 API Request: ${method} ${action}`, { params, data, options });

    // Show loading
    if (showLoading) {
      this.showLoading();
    }

    try {
      // Build URL
      const url = this.buildUrl(action, params);

      // Prepare fetch options
      const fetchOptions = {
        method: method
      };

      // Add headers and body for POST requests
      if (method === 'POST') {
        // Use text/plain to avoid CORS preflight
        fetchOptions.headers = {
          'Content-Type': 'text/plain'
        };
        fetchOptions.body = JSON.stringify(data || {});
      }

      console.log(`📤 Sending: ${method} ${url}`, fetchOptions);
      
      // Send request
      const response = await this.fetchWithTimeout(url, fetchOptions, timeout);

      // Check response
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();

      // Check API response status
      if (result.status === 'error') {
        throw new Error(result.message || 'Operation failed');
      }

      return result;

    } catch (error) {
      console.error('API Error:', error);

      // Retry mechanism
      if (retry && this.retryAttempts > 0) {
        return this.retryRequest(action, params, data, options);
      }

      // Error handling
      this.handleError(error);
      throw error;

    } finally {
      // Hide loading
      if (showLoading) {
        this.hideLoading();
      }
    }
  }

  /**
   * Fetch with timeout
   */
  async fetchWithTimeout(url, options, timeout) {
    return Promise.race([
      fetch(url, options),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Request timeout')), timeout)
      )
    ]);
  }

  /**
   * Retry request
   */
  async retryRequest(action, params, data, options, attempt = 1) {
    if (attempt > this.retryAttempts) {
      throw new Error('重試次數已達上限');
    }

    console.log(`Retrying attempt ${attempt}...`);
    
    // Delay before retry
    await this.delay(this.retryDelay * attempt);

    try {
      return await this.request(action, params, data, {
        ...options,
        retry: false  // Avoid infinite recursion
      });
    } catch (error) {
      return this.retryRequest(action, params, data, options, attempt + 1);
    }
  }

  /**
   * Build complete URL
   */
  buildUrl(action, params = {}) {
    const url = new URL(this.baseUrl);
    url.searchParams.append('action', action);
    
    Object.entries(params).forEach(([key, value]) => {
      if (value !== null && value !== undefined) {
        url.searchParams.append(key, value);
      }
    });

    return url.toString();
  }

  /**
   * Delay function
   */
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Error handling
   */
  handleError(error) {
    const errorMessage = error.message || this.config.messages.error;
    
    // 判斷錯誤類型
    if (error.message.includes('網路') || error.message.includes('超時')) {
      this.showMessage(this.config.messages.networkError, 'error');
    } else {
      this.showMessage(errorMessage, 'error');
    }
  }

  /**
   * Show message
   */
  showMessage(message, type = 'info') {
    // Can use toast library or custom notification
    console.log(`[${type.toUpperCase()}] ${message}`);
    
    // Trigger custom event
    window.dispatchEvent(new CustomEvent('api-message', {
      detail: { message, type }
    }));
  }

  /**
   * Show toast notification (alias method)
   */
  showToast(message, type = 'info') {
    this.showMessage(message, type);
  }

  /**
   * Show loading
   */
  showLoading() {
    window.dispatchEvent(new CustomEvent('api-loading', {
      detail: { loading: true }
    }));
  }

  /**
   * Hide loading
   */
  hideLoading() {
    window.dispatchEvent(new CustomEvent('api-loading', {
      detail: { loading: false }
    }));
  }

  // ============================================
  // Address API
  // ============================================

  /**
   * Get address
   */
  async getAddress(name) {
    return this.request('getAddress', { name }, {}, { method: 'POST' });
  }

  /**
   * Set address
   */
  async setAddress(name, zoneId, address) {
    return this.request('setAddress', {}, {
      name,
      zone_id: zoneId,
      address
    });
  }

  /**
   * List all addresses (Admin only)
   */
  async listAddresses(password) {
    return this.request('listAddresses', {}, { password }, { method: 'POST' });
  }

  /**
   * Delete address (Admin only)
   */
  async deleteAddress(name, password) {
    // API expects name in the POST body (not query params)
    return this.request('deleteAddress', {}, { name, password }, { method: 'POST' });
  }

  // ============================================
  // Message API
  // ============================================

  /**
   * Get all messages (public) with cache
   */
  async getMessages(options = {}) {
    const reuseCache = options.reuseCache !== false;
    const showLoading = options.showLoading !== undefined ? options.showLoading : false;
    const cacheKey = 'spring-festival-messages-cache';
    const cacheTtlMs = 60 * 60 * 1000; // 1 hour

    if (reuseCache && this.cachedMessages) {
      return this.cachedMessages;
    }

    if (reuseCache) {
      try {
        const cachedRaw = localStorage.getItem(cacheKey);
        if (cachedRaw) {
          const { data, timestamp } = JSON.parse(cachedRaw);
          if (timestamp && Date.now() - timestamp < cacheTtlMs) {
            this.cachedMessages = data;
            return data;
          }
        }
      } catch (err) {
        console.error('Failed to read messages cache:', err);
      }
    }

    const result = await this.request('getMessages', {}, {}, { method: 'POST', showLoading });

    if (result && result.status === 'ok') {
      this.cachedMessages = result;
      try {
        localStorage.setItem(cacheKey, JSON.stringify({ data: result, timestamp: Date.now() }));
      } catch (err) {
        console.error('Failed to save messages cache:', err);
      }
    }

    return result;
  }

  /**
   * Get message
   */
  async getMessage(type) {
    const all = await this.getMessages({ reuseCache: true, showLoading: false });

    if (all && all.status === 'ok' && Array.isArray(all.messages)) {
      const entry = all.messages.find(msg => msg.type === type);
      if (entry) {
        return {
          status: 'ok',
          type,
          message: entry.message,
          last_update: entry.last_update
        };
      }
    }

    // Fallback to single fetch if not found
    return this.request('getMessage', { type }, {}, { method: 'POST', showLoading: false });
  }

  /**
   * List all messages (Admin only)
   */
  async listMessages(password) {
    return this.request('listMessages', {}, { password }, { method: 'POST' });
  }

  /**
   * Set message (Admin only)
   */
  async setMessage(type, message, password) {
    const result = await this.request('setMessage', {}, { type, message, password });
    this.clearMessagesCache();
    return result;
  }

  // ============================================
  // Config API
  // ============================================

  /**
   * Get configuration
   */
  async getConfig() {
    // Check memory cache first
    if (this.cachedConfig) {
      return this.cachedConfig;
    }
    
    // Check localStorage cache (cross-page sharing)
    try {
      const cached = localStorage.getItem('spring-festival-config-cache');
      if (cached) {
        const { data, timestamp } = JSON.parse(cached);
        const now = Date.now();
        const cacheAge = now - timestamp;
        const maxAge = 60 * 60 * 1000; // 1 hour
        
        // Cache not expired, use cache
        if (cacheAge < maxAge) {
          console.log('✅ Using config cache (cached for ' + Math.floor(cacheAge / 1000) + ' seconds)');
          this.cachedConfig = data;
          return data;
        } else {
          console.log('⏰ Config cache expired, fetching new data');
        }
      }
    } catch (error) {
      console.error('Failed to read config cache:', error);
    }
    
    // Fetch config from API
    const result = await this.request('getConfig', {}, {}, { method: 'POST', showLoading: false });
    
    // Cache successful config
    if (result.status === 'ok') {
      this.cachedConfig = result;
      
      // Save to localStorage (cross-page sharing)
      try {
        localStorage.setItem('spring-festival-config-cache', JSON.stringify({
          data: result,
          timestamp: Date.now()
        }));
        console.log('💾 Config cached to localStorage');
      } catch (error) {
        console.error('Failed to save config cache:', error);
      }
    }
    
    return result;
  }
  
  /**
   * Clear config cache (call after admin updates config)
   */
  clearConfigCache() {
    this.cachedConfig = null;
    // Also clear localStorage cache
    try {
      localStorage.removeItem('spring-festival-config-cache');
      console.log('🗑️ Config cache cleared');
    } catch (error) {
      console.error('Failed to clear config cache:', error);
    }
  }

  /**
   * Clear messages cache (call after admin updates messages)
   */
  clearMessagesCache() {
    this.cachedMessages = null;
    try {
      localStorage.removeItem('spring-festival-messages-cache');
    } catch (err) {
      console.error('Failed to clear messages cache:', err);
    }
  }

  /**
   * Set configuration (Admin only)
   */
  async setConfig(config, password) {
    const result = await this.request('setConfig', {}, { config, password });
    // Clear cache to get latest config next time
    this.clearConfigCache();
    return result;
  }

  // ============================================
  // Image API
  // ============================================

  /**
   * Upload image to ImageKit
   */
  async uploadImage(imageBase64, type, password, title = '', description = '') {
    return this.request('uploadImage', {}, {
      image: imageBase64,
      type,
      password,
      title,
      description
    }, {
      timeout: 30000  // Extended timeout for image upload
    });
  }

  /**
   * Delete image (Admin only)
   */
  async deleteImage(fileId, password) {
    return this.request('deleteImage', { fileId }, { password }, { method: 'POST' });
  }

  /**
   * Purge ImageKit CDN cache (Admin only)
   */
  async purgeImageCache(type, password, url = '') {
    return this.request('purgeImageCache', {}, { type, url, password }, { method: 'POST' });
  }

  // ============================================
  // Auth API
  // ============================================

  /**
   * Check if user is admin
   */
  async checkAdmin(password) {
    return this.request('checkAdmin', {}, { password }, { method: 'POST', showLoading: false });
  }

  // ============================================
  // Mock API Methods
  // ============================================

  /**
   * Mock API request
   * @param {string} action - API action
   * @param {Object} params - Query parameters
   * @param {Object} data - POST data
   * @param {Object} options - Additional options
   */
  async mockRequest(action, params = {}, data = null, options = {}) {
    const showLoading = options.showLoading !== undefined ? options.showLoading : true;
    const delay = this.config.dev.mockDelay || 500;

    console.log(`🎭 Mock API Request: ${action}`, { params, data, options });

    // Show loading
    if (showLoading) {
      this.showLoading();
    }

    try {
      // Simulate network delay
      await this.delay(delay);

      // Check if MockData exists
      if (typeof MockData === 'undefined') {
        throw new Error('MockData 未載入，請確認已引入 mock-data.js');
      }

      // Get mock response
      const result = MockData.getMockResponse(action, params, data);

      console.log(`✅ Mock Response: ${action}`, result);

      // Check response status
      if (result.status === 'error') {
        throw new Error(result.message || '模擬錯誤');
      }

      return result;

    } catch (error) {
      console.error('Mock API Error:', error);
      this.handleError(error);
      throw error;

    } finally {
      // Hide loading
      if (showLoading) {
        this.hideLoading();
      }
    }
  }
}

// ============================================
// Global Instantiation
// ============================================

let apiManager = null;

/**
 * Initialize API Manager
 */
async function initAPI() {
  try {
    // Load configuration
    const response = await fetch('./config.json');
    const config = await response.json();

    // Check API URL
    if (config.api.baseUrl === 'YOUR_WEB_APP_URL_HERE') {
      console.warn('⚠️ 請在 config.json 中設定正確的 API URL');
      return null;
    }

    // Create API Manager instance
    apiManager = new SpringFestivalAPI(config);
    
    console.log('✅ API Manager initialized successfully');
    return apiManager;

  } catch (error) {
    console.error('❌ API Manager initialization failed:', error);
    return null;
  }
}

// Expose to global scope
window.apiManager = apiManager;
window.initAPI = initAPI;

/**
 * Global waitForAPI utility function
 * Wait for API Manager initialization to complete
 */
window.waitForAPI = async function() {
  let attempts = 0;
  while (!window.apiManager && attempts < 50) {
    await new Promise(resolve => setTimeout(resolve, 100));
    attempts++;
  }
  if (!window.apiManager) {
    console.error('API Manager initialization timeout');
  }
  return window.apiManager;
};

// Auto-initialize
if (typeof window !== 'undefined') {
  // Initialize immediately, don't wait for DOMContentLoaded
  initAPI().then(manager => {
    window.apiManager = manager;
  });
}

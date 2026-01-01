/**
 * Spring Festival API Manager
 * 統一管理所有 API 呼叫、錯誤處理、Loading 狀態
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
  }

  /**
   * 通用 API 請求方法
   * @param {string} action - API action
   * @param {Object} params - 查詢參數
   * @param {Object} data - POST 資料
   * @param {Object} options - 額外選項
   */
  async request(action, params = {}, data = null, options = {}) {
    // 🎭 檢查是否啟用 Mock 模式
    if (this.config.dev && this.config.dev.mockMode) {
      return this.mockRequest(action, params, data, options);
    }

    // 解析選項
    const retry = options.retry !== undefined ? options.retry : true;
    const showLoading = options.showLoading !== undefined ? options.showLoading : true;
    const timeout = options.timeout || this.timeout;
    const method = options.method || (data ? 'POST' : 'GET');

    console.log(`🔵 API Request: ${method} ${action}`, { params, data, options });

    // 顯示 Loading
    if (showLoading) {
      this.showLoading();
    }

    try {
      // 構建 URL
      const url = this.buildUrl(action, params);

      // 準備 fetch 選項
      const fetchOptions = {
        method: method
      };

      // POST 請求時添加 headers 和 body
      if (method === 'POST') {
        // 使用 text/plain 避免觸發 CORS preflight
        fetchOptions.headers = {
          'Content-Type': 'text/plain'
        };
        fetchOptions.body = JSON.stringify(data || {});
      }

      console.log(`📤 Sending: ${method} ${url}`, fetchOptions);
      
      // 發送請求
      const response = await this.fetchWithTimeout(url, fetchOptions, timeout);

      // 檢查回應
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();

      // 檢查 API 回應狀態
      if (result.status === 'error') {
        throw new Error(result.message || '操作失敗');
      }

      return result;

    } catch (error) {
      console.error('API Error:', error);

      // 重試機制
      if (retry && this.retryAttempts > 0) {
        return this.retryRequest(action, params, data, options);
      }

      // 錯誤處理
      this.handleError(error);
      throw error;

    } finally {
      // 隱藏 Loading
      if (showLoading) {
        this.hideLoading();
      }
    }
  }

  /**
   * 帶超時的 fetch
   */
  async fetchWithTimeout(url, options, timeout) {
    return Promise.race([
      fetch(url, options),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error('請求超時')), timeout)
      )
    ]);
  }

  /**
   * 重試請求
   */
  async retryRequest(action, params, data, options, attempt = 1) {
    if (attempt > this.retryAttempts) {
      throw new Error('重試次數已達上限');
    }

    console.log(`重試第 ${attempt} 次...`);
    
    // 延遲後重試
    await this.delay(this.retryDelay * attempt);

    try {
      return await this.request(action, params, data, {
        ...options,
        retry: false  // 避免無限遞迴
      });
    } catch (error) {
      return this.retryRequest(action, params, data, options, attempt + 1);
    }
  }

  /**
   * 構建完整 URL
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
   * 延遲函數
   */
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * 錯誤處理
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
   * 顯示訊息
   */
  showMessage(message, type = 'info') {
    // 可以使用 toast 庫或自定義通知
    console.log(`[${type.toUpperCase()}] ${message}`);
    
    // 觸發自定義事件
    window.dispatchEvent(new CustomEvent('api-message', {
      detail: { message, type }
    }));
  }

  /**
   * 顯示 Toast 通知（別名方法）
   */
  showToast(message, type = 'info') {
    this.showMessage(message, type);
  }

  /**
   * 顯示 Loading
   */
  showLoading() {
    window.dispatchEvent(new CustomEvent('api-loading', {
      detail: { loading: true }
    }));
  }

  /**
   * 隱藏 Loading
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
   * 取得地址
   */
  async getAddress(name) {
    return this.request('getAddress', { name }, {}, { method: 'POST' });
  }

  /**
   * 設定地址
   */
  async setAddress(name, zoneId, address) {
    return this.request('setAddress', {}, {
      name,
      zone_id: zoneId,
      address
    });
  }

  /**
   * 列出所有地址（需要 Admin 權限）
   */
  async listAddresses(password) {
    return this.request('listAddresses', {}, { password }, { method: 'POST' });
  }

  /**
   * 刪除地址（需要 Admin 權限）
   */
  async deleteAddress(name, password) {
    return this.request('deleteAddress', { name }, { password }, { method: 'POST' });
  }

  // ============================================
  // Message API
  // ============================================

  /**
   * 取得訊息
   */
  async getMessage(type) {
    return this.request('getMessage', { type }, {}, { method: 'POST', showLoading: false });
  }

  /**
   * 列出所有訊息（需要 Admin 權限）
   */
  async listMessages(password) {
    return this.request('listMessages', {}, { password }, { method: 'POST' });
  }

  /**
   * 設定訊息（需要 Admin 權限）
   */
  async setMessage(type, content, password) {
    return this.request('setMessage', {}, { type, content, password });
  }

  // ============================================
  // Config API
  // ============================================

  /**
   * 取得配置
   */
  async getConfig() {
    return this.request('getConfig', {}, {}, { method: 'POST', showLoading: false });
  }

  /**
   * 設定配置（需要 Admin 權限）
   */
  async setConfig(config, password) {
    return this.request('setConfig', {}, { config, password });
  }

  // ============================================
  // Image API
  // ============================================

  /**
   * 上傳圖片到 ImageKit
   */
  async uploadImage(imageBase64, type, password, title = '', description = '') {
    return this.request('uploadImage', {}, {
      image: imageBase64,
      type,
      password,
      title,
      description
    }, {
      timeout: 30000  // 圖片上傳延長時間
    });
  }

  /**
   * 刪除圖片（需要 Admin 權限）
   */
  async deleteImage(fileId, password) {
    return this.request('deleteImage', { fileId }, { password }, { method: 'POST' });
  }

  /**
   * 清除 ImageKit CDN 快取（需要 Admin 權限）
   */
  async purgeImageCache(type, password, url = '') {
    return this.request('purgeImageCache', {}, { type, url, password }, { method: 'POST' });
  }

  // ============================================
  // Auth API
  // ============================================

  /**
   * 檢查是否為 Admin
   */
  async checkAdmin(password) {
    return this.request('checkAdmin', {}, { password }, { method: 'POST', showLoading: false });
  }

  /**
   * 登入（取得 Token）
   */
  async login() {
    return this.request('login');
  }

  /**
   * 登出
   */
  async logout() {
    return this.request('logout');
  }

  // ============================================
  // Mock API Methods
  // ============================================

  /**
   * 模擬 API 請求
   * @param {string} action - API action
   * @param {Object} params - 查詢參數
   * @param {Object} data - POST 資料
   * @param {Object} options - 額外選項
   */
  async mockRequest(action, params = {}, data = null, options = {}) {
    const showLoading = options.showLoading !== undefined ? options.showLoading : true;
    const delay = this.config.dev.mockDelay || 500;

    console.log(`🎭 Mock API Request: ${action}`, { params, data, options });

    // 顯示 Loading
    if (showLoading) {
      this.showLoading();
    }

    try {
      // 模擬網路延遲
      await this.delay(delay);

      // 檢查是否有 MockData
      if (typeof MockData === 'undefined') {
        throw new Error('MockData 未載入，請確認已引入 mock-data.js');
      }

      // 取得模擬回應
      const result = MockData.getMockResponse(action, params, data);

      console.log(`✅ Mock Response: ${action}`, result);

      // 檢查回應狀態
      if (result.status === 'error') {
        throw new Error(result.message || '模擬錯誤');
      }

      return result;

    } catch (error) {
      console.error('Mock API Error:', error);
      this.handleError(error);
      throw error;

    } finally {
      // 隱藏 Loading
      if (showLoading) {
        this.hideLoading();
      }
    }
  }
}

// ============================================
// 全域實例化
// ============================================

let apiManager = null;

/**
 * 初始化 API Manager
 */
async function initAPI() {
  try {
    // 載入配置
    const response = await fetch('./config.json');
    const config = await response.json();

    // 檢查 API URL
    if (config.api.baseUrl === 'YOUR_WEB_APP_URL_HERE') {
      console.warn('⚠️ 請在 config.json 中設定正確的 API URL');
      return null;
    }

    // 建立 API Manager 實例
    apiManager = new SpringFestivalAPI(config);
    
    console.log('✅ API Manager 初始化成功');
    return apiManager;

  } catch (error) {
    console.error('❌ API Manager 初始化失敗:', error);
    return null;
  }
}

// 暴露到全域
window.apiManager = apiManager;
window.initAPI = initAPI;

// 自動初始化
if (typeof window !== 'undefined') {
  // 立即初始化，不等待 DOMContentLoaded
  initAPI().then(manager => {
    window.apiManager = manager;
  });
}

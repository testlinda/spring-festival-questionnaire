/**
 * Spring Festival Admin Panel
 * 管理後台 - 圖片管理、訊息管理、配置管理
 */

const app = new Vue({
  el: '#app',
  data: {
    // Auth
    isAdmin: false,
    checkingAuth: true,
    userEmail: '',
    
    // Tab
    activeTab: 'mainpage',
    
    // Config
    config: {
      images: {
        header: { url: '' },
        main: { url: '' },
        footer: { url: '' }
      },
      imagekit: {
        publicKey: '',
        urlEndpoint: ''
      }
    },
    
    // Messages
    messages: {
      hello: '',
      thankyou: ''
    },
    
    // Addresses
    addresses: [],
    
    // Upload
    uploadProgress: null
  },
  
  async mounted() {
    console.log('Admin panel 初始化中...');
    
    // 等待 API Manager 初始化
    await this.waitForAPIManager();
    
    // 檢查管理員權限
    await this.checkAdminStatus();
  },
  
  methods: {
    /**
     * 等待 API Manager 初始化
     */
    async waitForAPIManager() {
      let attempts = 0;
      // 等待 apiManager 存在且已初始化（config 已載入）
      while ((!window.apiManager || !window.apiManager.config) && attempts < 100) {
        await new Promise(resolve => setTimeout(resolve, 100));
        attempts++;
      }
      
      if (!window.apiManager || !window.apiManager.config) {
        console.error('API Manager 初始化失敗，請確認 config.json 是否正確載入');
        throw new Error('API Manager 初始化失敗');
      }
      
      console.log('API Manager 初始化完成');
    },
    
    /**
     * 檢查管理員權限
     */
    async checkAdminStatus() {
      try {
        // 從 localStorage 獲取密碼
        const adminPassword = localStorage.getItem('adminPassword');
        
        if (!adminPassword) {
          // 提示輸入密碼
          const password = prompt('請輸入管理員密碼：');
          if (!password) {
            this.isAdmin = false;
            this.checkingAuth = false;
            return;
          }
          
          // 驗證密碼
          const result = await window.apiManager.checkAdmin(password);
          
          if (result.isAdmin) {
            // 保存密碼到 localStorage
            localStorage.setItem('adminPassword', password);
            this.isAdmin = true;
            this.userEmail = result.email || 'admin';
          } else {
            this.showToast('密碼錯誤', 'error');
            this.isAdmin = false;
          }
        } else {
          // 使用已保存的密碼驗證
          const result = await window.apiManager.checkAdmin(adminPassword);
          
          if (result.isAdmin) {
            this.isAdmin = true;
            this.userEmail = result.email || 'admin';
          } else {
            // 密碼失效，清除並重新輸入
            localStorage.removeItem('adminPassword');
            await this.checkAdminStatus();
          }
        }
      } catch (error) {
        console.error('權限檢查失敗:', error);
        this.isAdmin = false;
      } finally {
        this.checkingAuth = false;
      }
    },
    
    /**
     * 載入配置
     */
    async loadConfig() {
      try {
        const password = localStorage.getItem('adminPassword');
        const result = await window.apiManager.getConfig(password);
        if (result.status === 'ok') {
          this.config = {
            images: result.config.images || {},
            imagekit: result.config.imagekit || { publicKey: '', urlEndpoint: '' }
          };
          console.log('配置已載入:', this.config);
        }
      } catch (error) {
        console.error('載入配置失敗:', error);
        this.showToast('載入配置失敗', 'error');
      }
    },
    
    /**
     * 儲存配置
     */
    async saveConfig() {
      try {
        const password = localStorage.getItem('adminPassword');
        const result = await window.apiManager.setConfig(this.config, password);
        if (result.status === 'ok') {
          this.showToast('配置已儲存', 'success');
        } else {
          this.showToast('儲存失敗: ' + result.message, 'error');
        }
      } catch (error) {
        console.error('儲存配置失敗:', error);
        this.showToast('儲存配置失敗', 'error');
      }
    },
    
    /**
     * 載入訊息
     */
    async loadMessages() {
      try {
        const password = localStorage.getItem('adminPassword');
        const result = await window.apiManager.listMessages(password);
        if (result.status === 'ok' && result.messages) {
          // 將數組轉換為對象
          const messagesObj = {};
          result.messages.forEach(msg => {
            messagesObj[msg.type] = msg.message;
          });
          
          this.messages = {
            hello: messagesObj.hello || '',
            thankyou: messagesObj.thankyou || ''
          };
          
          console.log('訊息已載入:', this.messages);
        }
      } catch (error) {
        console.error('載入訊息失敗:', error);
        this.showToast('載入訊息失敗', 'error');
      }
    },
    
    /**
     * 儲存訊息
     */
    async saveMessages() {
      try {
        const password = localStorage.getItem('adminPassword');
        
        // 儲存 hello 訊息
        await window.apiManager.setMessage('hello', this.messages.hello, password);
        
        // 儲存 thankyou 訊息
        await window.apiManager.setMessage('thankyou', this.messages.thankyou, password);
        
        this.showToast('訊息已儲存', 'success');
      } catch (error) {
        console.error('儲存訊息失敗:', error);
        this.showToast('儲存訊息失敗', 'error');
      }
    },
    
    /**
     * 載入地址清單
     */
    async loadAddresses() {
      try {
        const password = localStorage.getItem('adminPassword');
        const result = await window.apiManager.listAddresses(password);
        if (result.status === 'ok') {
          // 轉換為陣列格式
          this.addresses = Object.entries(result.addresses || {}).map(([name, data]) => ({
            name,
            ...data
          }));
          console.log('地址清單已載入:', this.addresses);
        }
      } catch (error) {
        console.error('載入地址清單失敗:', error);
        this.showToast('載入地址清單失敗', 'error');
      }
    },
    
    /**
     * 刪除地址
     */
    async deleteAddress(name) {
      if (!confirm(`確定要刪除 "${name}" 的地址嗎？`)) {
        return;
      }
      
      try {
        const password = localStorage.getItem('adminPassword');
        const result = await window.apiManager.deleteAddress(name, password);
        if (result.status === 'ok') {
          this.showToast('地址已刪除', 'success');
          // 重新載入清單
          await this.loadAddresses();
        } else {
          this.showToast('刪除失敗: ' + result.message, 'error');
        }
      } catch (error) {
        console.error('刪除地址失敗:', error);
        this.showToast('刪除地址失敗', 'error');
      }
    },
    
    /**
     * 處理圖片上傳
     */
    async handleImageUpload(event, type) {
      const file = event.target.files[0];
      if (!file) return;
      
      // 檢查檔案大小（25MB）
      if (file.size > 25 * 1024 * 1024) {
        this.showToast('圖片大小不能超過 25MB', 'error');
        return;
      }
      
      // 檢查檔案類型（僅允許 PNG）
      if (file.type !== 'image/png') {
        this.showToast('請上傳 PNG 檔（支援透明背景）', 'error');
        return;
      }
      
      try {
        this.uploadProgress = `正在上傳 ${type} 圖片...`;
        
        // 讀取檔案為 Base64
        const base64 = await this.readFileAsBase64(file);
        
        // 上傳到 ImageKit
        const password = localStorage.getItem('adminPassword');
        const result = await window.apiManager.uploadImage(base64, type, password);
        
        if (result.status === 'ok') {
          this.showToast('圖片上傳成功', 'success');
          
          // 重新載入配置以顯示新圖片
          await this.loadConfig();
        } else {
          this.showToast('上傳失敗: ' + result.message, 'error');
        }
      } catch (error) {
        console.error('上傳圖片失敗:', error);
        this.showToast('上傳圖片失敗', 'error');
      } finally {
        this.uploadProgress = null;
        // 清空 input
        event.target.value = '';
      }
    },

    /**
     * 清除指定圖片的 CDN 快取
     */
    async purgeImageCache(type) {
      const imageUrl = this.config.images?.[type]?.url;
      if (!imageUrl) {
        this.showToast('目前沒有可清除的圖片 URL', 'warning');
        return;
      }
      
      if (!confirm('確定要清除這張圖片的 CDN 快取嗎？')) {
        return;
      }
      
      try {
        this.uploadProgress = `正在清除 ${type} 圖片快取...`;
        const password = localStorage.getItem('adminPassword');
        const result = await window.apiManager.purgeImageCache(type, password, imageUrl);
        
        if (result.status === 'ok') {
          this.showToast('已送出 CDN 清除請求', 'success');
        } else {
          this.showToast('清除失敗: ' + result.message, 'error');
        }
      } catch (error) {
        console.error('清除快取失敗:', error);
        this.showToast('清除快取失敗', 'error');
      } finally {
        this.uploadProgress = null;
      }
    },
    
    /**
     * 讀取檔案為 Base64
     */
    readFileAsBase64(file) {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
    },
    
    /**
     * 顯示 Toast 訊息
     */
    showToast(message, type = 'info') {
      const container = document.getElementById('toast-container');
      const toast = document.createElement('div');
      toast.className = `toast ${type}`;
      
      // 根據類型設定邊框顏色
      const borderColors = {
        success: 'border-green-500',
        error: 'border-red-500',
        warning: 'border-yellow-500',
        info: 'border-blue-500'
      };
      
      toast.innerHTML = `
        <div class="bg-white dark:bg-gray-800 border-l-4 ${borderColors[type]} rounded shadow-lg p-4 max-w-sm">
          <p class="text-sm font-medium text-gray-900 dark:text-white">${message}</p>
        </div>
      `;
      
      container.appendChild(toast);
      
      setTimeout(() => {
        toast.style.animation = 'slideOutRight 0.3s ease-out';
        setTimeout(() => toast.remove(), 300);
      }, 3000);
    }
  }
});

// 監聽 API 事件
window.addEventListener('api-loading', (e) => {
  const overlay = document.getElementById('loading-overlay');
  if (e.detail.loading) {
    overlay.classList.remove('hidden');
  } else {
    overlay.classList.add('hidden');
  }
});

window.addEventListener('api-message', (e) => {
  if (app && app.showToast) {
    app.showToast(e.detail.message, e.detail.type);
  }
});

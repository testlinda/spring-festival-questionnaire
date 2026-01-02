/**
 * Spring Festival Admin Panel
 * Admin dashboard - Image management, message management, configuration management
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
    console.log('Admin panel initializing...');
    
    // Wait for API Manager initialization
    await window.waitForAPI();
    
    // Check admin permissions
    await this.checkAdminStatus();
  },
  
  methods: {
    /**
     * Check admin permissions
     */
    async checkAdminStatus() {
      try {
        // Get password from localStorage
        const adminPassword = localStorage.getItem('adminPassword');
        
        if (!adminPassword) {
          // Prompt for password
          const password = prompt('請輸入管理員密碼：');
          if (!password) {
            this.isAdmin = false;
            this.checkingAuth = false;
            return;
          }
          
          // Verify password
          const result = await window.apiManager.checkAdmin(password);
          
          if (result.isAdmin) {
            // Save password to localStorage
            localStorage.setItem('adminPassword', password);
            this.isAdmin = true;
            this.userEmail = result.email || 'admin';
          } else {
            this.showToast('密碼錯誤', 'error');
            this.isAdmin = false;
          }
        } else {
          // Use saved password for verification
          const result = await window.apiManager.checkAdmin(adminPassword);
          
          if (result.isAdmin) {
            this.isAdmin = true;
            this.userEmail = result.email || 'admin';
          } else {
            // Password expired, clear and re-enter
            localStorage.removeItem('adminPassword');
            await this.checkAdminStatus();
          }
        }
      } catch (error) {
        console.error('Permission check failed:', error);
        this.isAdmin = false;
      } finally {
        this.checkingAuth = false;
      }
    },
    
    /**
     * Load configuration
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
          console.log('Config loaded:', this.config);
        }
      } catch (error) {
        console.error('Failed to load config:', error);
        this.showToast('載入配置失敗', 'error');
      }
    },
    
    /**
     * Save configuration
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
        console.error('Failed to save config:', error);
        this.showToast('儲存配置失敗', 'error');
      }
    },
    
    /**
     * Load messages
     */
    async loadMessages() {
      try {
        const password = localStorage.getItem('adminPassword');
        const result = await window.apiManager.listMessages(password);
        if (result.status === 'ok' && result.messages) {
          // Convert array to object
          const messagesObj = {};
          result.messages.forEach(msg => {
            messagesObj[msg.type] = msg.message;
          });
          
          this.messages = {
            hello: messagesObj.hello || '',
            thankyou: messagesObj.thankyou || ''
          };
          
          console.log('Messages loaded:', this.messages);
        }
      } catch (error) {
        console.error('Failed to load messages:', error);
        this.showToast('載入訊息失敗', 'error');
      }
    },
    
    /**
     * Save messages
     */
    async saveMessages() {
      try {
        const password = localStorage.getItem('adminPassword');
        
        // Save hello message
        await window.apiManager.setMessage('hello', this.messages.hello, password);
        
        // Save thankyou message
        await window.apiManager.setMessage('thankyou', this.messages.thankyou, password);
        
        this.showToast('訊息已儲存', 'success');
      } catch (error) {
        console.error('Failed to save messages:', error);
        this.showToast('儲存訊息失敗', 'error');
      }
    },
    
    /**
     * Load address list
     */
    async loadAddresses() {
      try {
        const password = localStorage.getItem('adminPassword');
        const result = await window.apiManager.listAddresses(password);
        if (result.status === 'ok') {
          // Convert to array format
          this.addresses = Object.entries(result.addresses || {}).map(([name, data]) => ({
            name,
            ...data
          }));
          console.log('Address list loaded:', this.addresses);
        }
      } catch (error) {
        console.error('Failed to load address list:', error);
        this.showToast('載入地址清單失敗', 'error');
      }
    },
    
    /**
     * Delete address
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
          // Reload list
          await this.loadAddresses();
        } else {
          this.showToast('刪除失敗: ' + result.message, 'error');
        }
      } catch (error) {
        console.error('Failed to delete address:', error);
        this.showToast('刪除地址失敗', 'error');
      }
    },
    
    /**
     * Handle image upload
     */
    async handleImageUpload(event, type) {
      const file = event.target.files[0];
      if (!file) return;
      
      // Check file size (25MB)
      if (file.size > 25 * 1024 * 1024) {
        this.showToast('圖片大小不能超過 25MB', 'error');
        return;
      }
      
      // Check file type (only allow PNG)
      if (file.type !== 'image/png') {
        this.showToast('請上傳 PNG 檔（支援透明背景）', 'error');
        return;
      }
      
      try {
        this.uploadProgress = `正在上傳 ${type} 圖片...`;
        
        // Read file as Base64
        const base64 = await this.readFileAsBase64(file);
        
        // Upload to ImageKit
        const password = localStorage.getItem('adminPassword');
        const result = await window.apiManager.uploadImage(base64, type, password);
        
        if (result.status === 'ok') {
          this.showToast('圖片上傳成功', 'success');
          
          // Reload config to display new image
          await this.loadConfig();
        } else {
          this.showToast('上傳失敗: ' + result.message, 'error');
        }
      } catch (error) {
        console.error('Failed to upload image:', error);
        this.showToast('上傳圖片失敗', 'error');
      } finally {
        this.uploadProgress = null;
        // Clear input
        event.target.value = '';
      }
    },

    /**
     * Clear specific image's CDN cache
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
        console.error('Failed to clear cache:', error);
        this.showToast('清除快取失敗', 'error');
      } finally {
        this.uploadProgress = null;
      }
    },
    
    /**
     * Read file as Base64
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
     * Show toast message
     */
    showToast(message, type = 'info') {
      const container = document.getElementById('toast-container');
      const toast = document.createElement('div');
      toast.className = `toast ${type}`;
      
      // Set border color based on type
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

// Listen for API events
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

/**
 * Mock Data for Development & Testing
 * Mock data - for development and testing, avoiding consuming Google Apps Script quota
 * 
 * Usage Instructions:
 * 1. Set dev.mockMode = true in config.json to enable mock mode
 * 2. Freely edit the constants below (INITIAL_ADDRESSES, INITIAL_MESSAGES, etc.) to test different data
 * 3. Use scenarios to control the response scenarios for each API (success/error/timeout)
 * 4. Only need to modify data once, reset() and mockGetConfig() will automatically reference latest data
 */

// ============================================
// Initial Data Constants (edit here)
// ============================================

/**
 * Initial address data
 * Modify this constant, reset() and initialization will automatically update
 */
const INITIAL_ADDRESSES = [
  {
    name: "test",
    zone_id: "10001",
    address: "台北市信義區信義路五段7號",
    timestamp: "2026-01-15 10:30:00",
    note: "",
    tag: ""
  },
  {
    name: "Mary",
    zone_id: "403",
    address: "台中市西區模範街8巷23號",
    timestamp: "",
    note: "",
    tag: ""
  },
  {
    name: "Emily",
    zone_id: "807031",
    address: "高雄市三民區寶盛里15鄰大順三路307號",
    timestamp: "2026-01-20 14:20:00",
    note: "",
    tag: "colleague"
  },
  {
    name: "Sophia",
    zone_id: "106",
    address: "台北市大安區基隆路四段43號",
    timestamp: "2026-01-18 15:45:00",
    note: "",
    tag: ""
  }
];

/**
 * Initial message data
 * Only supports 'hello' and 'thankyou' types (consistent with backend)
 * Modify this constant, mockGetMessage() will automatically reference latest data
 */
const INITIAL_MESSAGES = {
  hello: {
    type: "hello",
    message: `親愛的朋友們，

新年快樂！🎊

又到了一年一度寄送春節賀卡的時候了！
為了確保賀卡能準確送達到您手中，
請幫忙確認或更新您的郵寄地址。

謝謝您的配合，祝福您新的一年
平安順遂、萬事如意！`
  },
  thankyou: {
    type: "thankyou",
    message: `感謝您提供地址資訊！

您的賀卡將會在春節前寄出，
請留意信箱。

再次祝福您
新年快樂、闔家平安！

期待與您分享節日的喜悅 💝`
  }
};

/**
 * Initial configuration data
 * Modify this constant, mockGetConfig() will automatically reference latest data
 * Format consistent with backend getDefaultConfig()
 */
const INITIAL_CONFIG = {
  images: {
    header: {
      url: "https://ik.imagekit.io/ccblack/spring-festival/header.png",
      alt: "header image",
      height: "200px"
    },
    main: {
      url: "https://ik.imagekit.io/ccblack/spring-festival/main.png",
      alt: "black bear",
      width: "360px",
      height: "270px"
    },
    footer: {
      url: "https://ik.imagekit.io/ccblack/spring-festival/foot.png",
      alt: "foot image",
      height: "200px"
    }
  },
  imagekit: {
    publicKey: "Hello, I'm the public key.",
    privateKey: "Hello, I'm the private key.",
    urlEndpoint: "Hello, I'm the URL endpoint."
  },
  messages: {
    greeting: "新年快樂！",
    title: "黑西西🐻賀卡地址收集"
  },
  features: {
    enableDarkMode: true,
    enableOffline: false
  }
};

// ============================================
// MockData Body
// ============================================

const MockData = {
  /**
   * Mock address database
   * Initialize using INITIAL_ADDRESSES constant
   */
  addresses: JSON.parse(JSON.stringify(INITIAL_ADDRESSES)),

  /**
   * Mock message data
   * Initialize using INITIAL_MESSAGES constant
   */
  messages: JSON.parse(JSON.stringify(INITIAL_MESSAGES)),

  /**
   * API response scenario control
   * Set the response type for each API:
   * - "success": successful response
   * - "error": error response
   * - "timeout": timeout (no response)
   * - "notfound": data not found
   * - "duplicate": duplicate data
   */
  scenarios: {
    getAddress: "success",      // Get address
    setAddress: "success",      // Set address
    listAddresses: "success",   // List all addresses (admin)
    deleteAddress: "success",   // Delete address (admin)
    getMessage: "success",      // Get message
    getMessages: "success"      // Get all messages (public)
  },

  /**
   * Admin password (for testing)
   */
  adminPassword: "admin123",

  /**
   * Get mock response
   */
  getMockResponse(action, params = {}, data = null) {
    const scenario = this.scenarios[action] || "success";
    
    console.log(`🎭 Mock API: ${action}`, { scenario, params, data });

    // Handle timeout scenario
    if (scenario === "timeout") {
      return new Promise(() => {}); // Never resolve
    }

    // Handle various API actions
    switch (action) {
      case "getAddress":
        return this.mockGetAddress(params.name, scenario);
      
      case "setAddress":
        return this.mockSetAddress(data, scenario);
      
      case "listAddresses":
        return this.mockListAddresses(data, scenario);
      
      case "deleteAddress":
        return this.mockDeleteAddress(params.name, data, scenario);
      
      case "getMessage":
        return this.mockGetMessage(params.type, scenario);

      case "getMessages":
        return this.mockGetMessages(scenario);
      
      case "getConfig":
        return this.mockGetConfig(scenario);
      
      case "setConfig":
        return this.mockSetConfig(data.config, scenario);
      
      case "listMessages":
        return this.mockListMessages(data, scenario);
      
      case "checkAdmin":
        return this.mockCheckAdmin(data, scenario);
      
      default:
        return {
          status: "error",
          message: `未知的 API action: ${action}`
        };
    }
  },

  /**
   * 模擬 getMessages (public)
   */
  mockGetMessages(scenario) {
    if (scenario === "error") {
      return {
        status: "error",
        message: "取得訊息時發生錯誤"
      };
    }

    const messages = Object.keys(this.messages).map(key => ({
      type: key,
      message: this.messages[key].message
    }));

    return {
      status: "ok",
      messages
    };
  },

  /**
   * 模擬 getAddress API
   */
  mockGetAddress(name, scenario) {
    if (scenario === "error") {
      return {
        status: "error",
        message: "取得地址時發生錯誤"
      };
    }

    const address = this.addresses.find(addr => addr.name === name);
    
    if (scenario === "notfound" || !address) {
      return {
        name: name,
        zone_id: '',
        address: '',
        status: 'not found'
      };
    }

    return {
      name: address.name,
      zone_id: address.zone_id,
      address: address.address,
      last_update: address.timestamp || '',
      status: 'ok'
    };
  },

  /**
   * 模擬 setAddress API
   */
  mockSetAddress(data, scenario) {
    if (scenario === "error") {
      return {
        status: "error",
        message: "儲存地址時發生錯誤"
      };
    }

    if (scenario === "duplicate") {
      return {
        status: "error",
        message: "此名稱已存在，請使用編輯功能"
      };
    }

    // 檢查是否已存在
    const existingIndex = this.addresses.findIndex(addr => addr.name === data.name);
    const timestamp = new Date().toLocaleString('zh-TW', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit' }).replace(/\//g, '-').replace(/(\d{4})-(\d{2})-(\d{2}) (\d{2}):(\d{2}):(\d{2})/, '$1-$2-$3 $4:$5:$6');
    
    const newAddress = {
      name: data.name,
      zone_id: data.zone_id || '',
      address: data.address || '',
      timestamp: timestamp,
      note: data.note || '',
      tag: data.tag || ''
    };

    if (existingIndex >= 0) {
      // 更新現有地址
      this.addresses[existingIndex] = newAddress;
    } else {
      // 新增地址
      this.addresses.push(newAddress);
    }

    console.log('📝 Mock: Address saved', newAddress);

    // 後端回應格式：status='ok'，有 message 和 action 欄位
    return {
      status: "ok",
      message: "地址已儲存",
      action: existingIndex >= 0 ? "updated" : "created"
    };
  },

  /**
   * 模擬 listAddresses API
   */
  mockListAddresses(data, scenario) {
    if (scenario === "error") {
      return {
        status: "error",
        message: "取得地址列表時發生錯誤"
      };
    }

    // Validate password
    if (data.password !== this.adminPassword) {
      return {
        status: "error",
        message: "密碼錯誤"
      };
    }

    // Backend response format: status='ok', addresses field, count field
    // Transform addresses to include last_update and default note/tag fields
    const addresses = this.addresses.map(addr => ({
      address: addr.address || '',
      last_update: addr.timestamp || '',
      name: addr.name,
      note: addr.note || '',
      tag: addr.tag || '',
      zone_id: addr.zone_id || ''
    }));

    return {
      status: "ok",
      addresses: addresses,
      count: addresses.length
    };
  },

  /**
   * 模擬 deleteAddress API
   */
  mockDeleteAddress(name, data, scenario) {
    if (scenario === "error") {
      return {
        status: "error",
        message: "刪除地址時發生錯誤"
      };
    }

    // 驗證密碼
    if (data.password !== this.adminPassword) {
      return {
        status: "error",
        message: "密碼錯誤"
      };
    }

    const index = this.addresses.findIndex(addr => addr.name === name);
    
    if (index === -1) {
      return {
        status: "error",
        message: "找不到此地址"
      };
    }

    // 刪除地址
    const deleted = this.addresses.splice(index, 1)[0];
    console.log('🗑️ Mock: Address deleted', deleted);

    // 後端回應格式：status='ok'，只有 message 欄位
    return {
      status: "ok",
      message: "地址已刪除"
    };
  },

  /**
   * 模擬 getMessage API
   */
  mockGetMessage(type, scenario) {
    if (scenario === "error") {
      return {
        status: "error",
        message: "取得訊息時發生錯誤"
      };
    }

    // 支援訊息類型別名（hello ↔ greeting 相互對應）
    const typeMap = {
      'hello': 'hello',
      'greeting': 'hello',  // 別名，對應到 hello
      'thankyou': 'thankyou'
    };

    const mappedType = typeMap[type] || type;
    const messageData = this.messages[mappedType];
    
    if (!messageData) {
      return {
        status: "error",
        message: `找不到訊息類型: ${type}`
      };
    }

    // 回應格式與後端 API 一致：status='ok'，直接返回 type 和 message
    return {
      status: "ok",
      type: mappedType,
      message: messageData.message
    };
  },

  /**
   * 模擬 getConfig API
   * 回應格式與後端一致：status='ok'，config 欄位
   */
  mockGetConfig(scenario) {
    if (scenario === "error") {
      return {
        status: "error",
        message: "取得配置時發生錯誤"
      };
    }

    return {
      status: "ok",
      config: JSON.parse(JSON.stringify(INITIAL_CONFIG))
    };
  },

  /**
   * 模擬 setConfig API
   */
  mockSetConfig(config, scenario) {
    if (scenario === "error") {
      return {
        status: "error",
        message: "設定配置時發生錯誤"
      };
    }

    console.log('⚙️ Mock: Configuration updated', config);

    return {
      status: "success",
      message: "配置已更新"
    };
  },

  /**
   * 模擬 checkAdmin API
   * 回應格式與後端一致
   */
  mockCheckAdmin(data, scenario) {
    if (scenario === "error") {
      return {
        status: "error",
        message: "檢查管理員權限時發生錯誤"
      };
    }

    const password = data?.password;

    if (!password) {
      return {
        status: "ok",
        isAdmin: false,
        message: "需要管理員密碼"
      };
    }

    // 檢查密碼是否正確
    const isAdmin = password === this.adminPassword;

    console.log(`🔐 Mock: Check admin permission - isAdmin: ${isAdmin}`);

    // 回應格式與後端一致
    return {
      status: "ok",
      isAdmin: isAdmin,
      email: isAdmin ? "admin" : ""
    };
  },

  /**
   * 模擬 listMessages API
   * 回應格式與後端一致
   */
  mockListMessages(data, scenario) {
    if (scenario === "error") {
      return {
        status: "error",
        message: "取得訊息列表時發生錯誤"
      };
    }

    // 驗證密碼
    if (data?.password !== this.adminPassword) {
      return {
        status: "error",
        message: "密碼錯誤"
      };
    }

    // 將訊息對象轉換為陣列格式
    const messages = Object.keys(this.messages).map(key => ({
      type: key,
      message: this.messages[key].message
    }));

    console.log('📋 Mock: Messages list', messages);

    // 回應格式與後端一致：status='ok', messages 陣列
    return {
      status: "ok",
      messages: messages
    };
  },

  /**
   * 重置為初始數據
   * 直接引用 INITIAL_ADDRESSES 和 INITIAL_MESSAGES 常數
   * 修改常數後，reset() 會自動使用最新數據
   */
  reset() {
    this.addresses = JSON.parse(JSON.stringify(INITIAL_ADDRESSES));
    this.messages = JSON.parse(JSON.stringify(INITIAL_MESSAGES));
    console.log('🔄 Mock Data reset to initial state');
  },

  /**
   * 清空所有地址
   */
  clearAddresses() {
    this.addresses = [];
    console.log('🗑️ All Mock addresses cleared');
  }
};

// 在 console 中提供全域存取
if (typeof window !== 'undefined') {
  window.MockData = MockData;
  console.log('🎭 Mock Data loaded - accessible via window.MockData');
}

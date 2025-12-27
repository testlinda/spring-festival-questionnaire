var app = new Vue({
  el: "#app",
  data() {
    return {
		hello: "",
		userName: "",
		address: "",
		zone_id: "",
		mdf: null,
		search_loading: false,
		search_done: false,
		send_status: "",
		send_loading: false,
		send_done: false,
		send_ok: false
    };
  },
  async beforeMount(){
	  await this.waitForAPI();
	  await this.getHello();
  },
  methods: {
	async waitForAPI() {
		let attempts = 0;
		while (!window.apiManager && attempts < 50) {
			await new Promise(resolve => setTimeout(resolve, 100));
			attempts++;
		}
		if (!window.apiManager) {
			console.error('API Manager 初始化超時');
			this.hello = "系統初始化失敗，請重新整理頁面";
		}
	},
	async getHello() {
		if (!window.apiManager) return;
		try {
			const response = await window.apiManager.getMessage('hello');
			// 提取 message 欄位並處理換行
			this.hello = response.message || response;
		} catch (error) {
			console.error('Failed to load message:', error);
			this.hello = "無法載入訊息";
		}
    },
    async searchUser() {
		if (!this.userName.trim()) {
			return;
		}
		
		this.search_loading = true;
		this.search_done = false;
		this.mdf = null;
		
		try {
			const data = await window.apiManager.getAddress(this.userName);
			this.zone_id = data.zone_id || "";
			this.address = data.address || "";
			this.search_done = true;
		} catch (error) {
			console.error('Search failed:', error);
			if (window.apiManager) {
				window.apiManager.showToast('查詢失敗，請稍後再試', 'error');
			}
		} finally {
			this.search_loading = false;
		}
    },
    async confirmSend() {
		this.send_loading = true;
		this.send_done = false;
		
		try {
			const result = await window.apiManager.setAddress(
				this.userName, 
				this.zone_id, 
				this.address
			);
			
			this.send_status = result.status;
			this.send_ok = (this.send_status === "ok");
			
			if (this.send_ok) {
				this.storeLocalData();
				setTimeout(() => {
					this.gotoResult();
				}, 1000);
			}
		} catch (error) {
			console.error('Send failed:', error);
			this.send_status = "error";
			this.send_ok = false;
			if (window.apiManager) {
				window.apiManager.showToast('送出失敗，請稍後再試', 'error');
			}
		} finally {
			this.send_loading = false;
			this.send_done = true;
		}
    },
	getLocalData() {
		this.hello = localStorage.getItem("hello");
		this.userName = localStorage.getItem("userName");
		this.address = localStorage.getItem("address");
		this.zone_id = localStorage.getItem("zone_id");
    },
	storeLocalData() {
		localStorage.setItem("hello", this.hello);
		localStorage.setItem("userName", this.userName);
		localStorage.setItem("address", this.address);
		localStorage.setItem("zone_id", this.zone_id);
    },
	gotoEdit() {
		this.storeLocalData();
		location.href = "edit.html";
	},
	gotoResult() {
		location.href = "result.html";
	},
	gotoNext() {
		if (this.mdf === false) {
			this.confirmSend();
		} else if (this.mdf === true) {
			this.gotoEdit();
		}
	},
	enable_button() {
		// Vue handles this via :disabled binding
	}
  },
});

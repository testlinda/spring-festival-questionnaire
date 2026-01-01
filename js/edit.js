var app = new Vue({
  el: "#app",
  data() {
    return {
		userName: "",
		address: "",
		zone_id: "",
		confirmed: false,
		search_loading: false,
		search_done: false,
		search_ok: false,
		send_loading: false,
		send_lock: false,
		send_done: false,
		send_ok: false,
		send_status: "",
		headerSrc: "https://ik.imagekit.io/ccblack/spring-festival/header.png"
    };
  },
  async beforeMount(){
	  await this.waitForAPI();
	  this.getLocalData();
	  await this.loadImagesFromConfig();
  },
  methods: {
	async waitForAPI() {
		let attempts = 0;
		while (!window.apiManager && attempts < 50) {
			await new Promise(resolve => setTimeout(resolve, 100));
			attempts++;
		}
	},
	async loadImagesFromConfig() {
		if (!window.apiManager) return;
		try {
			const res = await window.apiManager.getConfig();
			if (res && res.status === 'ok' && res.config && res.config.images) {
				const images = res.config.images;
				this.headerSrc = (images.header && images.header.url) ? images.header.url : this.headerSrc;
			}
		} catch (err) {
			console.error('載入配置圖片失敗:', err);
		}
	},
	getLocalData() {
		this.userName = localStorage.getItem("userName") || "";
		this.address = localStorage.getItem("address") || "";
		this.zone_id = localStorage.getItem("zone_id") || "";
    },
	storeLocalData() {
		localStorage.setItem("userName", this.userName);
		localStorage.setItem("address", this.address);
		localStorage.setItem("zone_id", this.zone_id);
    },
	async confirmSend() {
		if (this.send_loading || this.send_lock || !this.confirmed || !this.zone_id || !this.address) {
			return;
		}
		
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
				// Keep locked to prevent further clicks until navigation
				this.send_lock = true;
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
			// Only re-enable on failure; remain locked/loading on success until navigation
			if (!this.send_ok) {
				this.send_loading = false;
			}
			this.send_done = true;
		}
    },
	async getZipCode() {
		if (this.search_loading) {
			return;
		}
		if (!this.address.trim()) {
			if (window.apiManager) {
				window.apiManager.showToast('請先輸入地址', 'error');
			}
			return;
		}
		
		this.search_loading = true;
		this.search_done = false;
		this.search_ok = false;
		
		try {
			const response = await axios({
				method: "get",
				url: "https://zip5.5432.tw/zip5json.py",
				params: { adrs: this.address },
			});
			
			console.log(response.data);
			// 檢查是否有有效的郵遞區號（優先使用6碼）
			const hasZipcode6 = response.data.zipcode6 && response.data.zipcode6.length > 0;
			const hasZipcode = response.data.zipcode && response.data.zipcode.length > 0;
			this.search_ok = hasZipcode6 || hasZipcode;
			
			if (this.search_ok) {
				if (response.data.zipcode6 !== "") {
					this.zone_id = response.data.zipcode6;
				} else {
					this.zone_id = response.data.zipcode;
				}
				if (window.apiManager) {
					window.apiManager.showToast('郵遞區號查詢成功', 'success');
				}
			} else {
				if (window.apiManager) {
					window.apiManager.showToast('查詢失敗，請確認地址正確', 'error');
				}
			}
		} catch (error) {
			console.error('Zip code lookup failed:', error);
			this.search_ok = false;
			if (window.apiManager) {
				window.apiManager.showToast('查詢失敗，請稍後再試', 'error');
			}
		} finally {
			this.search_loading = false;
			this.search_done = true;
		}
    },
	getZipCodeManually() {
		window.open("https://www.post.gov.tw/post/internet/Postal/index.jsp?ID=208", "_blank");
	},
	gotoResult() {
		location.href = "result.html";
	},
  },
});

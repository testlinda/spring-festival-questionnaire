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
		send_done: false,
		send_ok: false,
		send_status: ""
    };
  },
  async beforeMount(){
	  await this.waitForAPI();
	  this.getLocalData();
  },
  methods: {
	async waitForAPI() {
		let attempts = 0;
		while (!window.apiManager && attempts < 50) {
			await new Promise(resolve => setTimeout(resolve, 100));
			attempts++;
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
		if (!this.confirmed || !this.zone_id || !this.address) {
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
	async getZipCode() {
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

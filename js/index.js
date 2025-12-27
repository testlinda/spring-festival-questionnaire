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
		send_ok: false,
		// Images from config
		headerSrc: "https://ik.imagekit.io/ccblack/spring-festival/header.png",
		mainSrc: "https://ik.imagekit.io/ccblack/spring-festival/main.png",
		footSrc: "https://ik.imagekit.io/ccblack/spring-festival/foot.png",
		footerRatio: null,
		search_status: 'ok',
		preventConfirm: false
    };
  },
  async beforeMount(){
	  await this.waitForAPI();
	  await this.getHello();
	  await this.loadImagesFromConfig();
  },
	mounted() {
		this.$nextTick(() => {
			this.setupFooterSync();
			this.loadFooterDimensions();
		});
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
	async loadImagesFromConfig() {
		if (!window.apiManager) return;
		try {
			const res = await window.apiManager.getConfig();
			if (res && res.status === 'ok' && res.config && res.config.images) {
				const images = res.config.images;
				this.headerSrc = (images.header && images.header.url) ? images.header.url : this.headerSrc;
				this.mainSrc = (images.main && images.main.url) ? images.main.url : this.mainSrc;
				this.footSrc = (images.footer && images.footer.url) ? images.footer.url : this.footSrc;
				console.log(`Loaded images: header=${this.headerSrc}, main=${this.mainSrc}, foot=${this.footSrc}`);
				// Recalculate footer height after image sources potentially changed
				this.loadFooterDimensions();
			}
		} catch (err) {
			console.error('載入配置圖片失敗:', err);
		}
	},
		setupFooterSync() {
			const apply = this.applyFooterHeight.bind(this);
			window.addEventListener('resize', this.debounce(apply, 100));
			// Fallback initial application
			setTimeout(apply, 200);
		},
		applyFooterHeight() {
			// Use footer image ratio if available; fallback to header height
			let heightPx = 0;
			if (this.footerRatio && this.footerRatio > 0) {
				const vw = window.innerWidth || document.documentElement.clientWidth || 0;
				heightPx = Math.round(vw * this.footerRatio);
				const maxH = Math.round((window.innerHeight || 0) * 0.5);
				if (maxH > 0) {
					heightPx = Math.min(heightPx, maxH);
				}
				const minH = 80;
				heightPx = Math.max(heightPx, minH);
			} else {
				const headerImg = document.querySelector('#header-image img');
				if (headerImg) {
					heightPx = Math.round(headerImg.getBoundingClientRect().height || 0);
				}
			}
			document.documentElement.style.setProperty('--footer-height', heightPx + 'px');
		},
		loadFooterDimensions() {
			if (!this.footSrc) return;
			const img = new Image();
			img.onload = () => {
				if (img.naturalWidth > 0) {
					this.footerRatio = img.naturalHeight / img.naturalWidth;
				}
				this.applyFooterHeight();
			};
			img.onerror = () => {
				this.applyFooterHeight();
			};
			img.src = this.footSrc;
		},
		debounce(fn, wait) {
			let t;
			return (...args) => {
				clearTimeout(t);
				t = setTimeout(() => fn(...args), wait);
			};
		},
		triggerFooterRecalc() {
			this.$nextTick(() => setTimeout(() => this.applyFooterHeight(), 50));
		},
		scrollToBottom() {
			const target = document.documentElement || document.body;
			const top = target.scrollHeight;
			window.scrollTo({ top, behavior: 'smooth' });
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
			this.search_status = data.status || 'ok';
			const isOk = this.search_status === 'ok';
			this.zone_id = isOk ? (data.zone_id || "") : "";
			this.address = isOk ? (data.address || "") : "";
			this.preventConfirm = !isOk;
			// Force user to新增/修改 when not ok
			this.mdf = isOk ? null : true;
			this.search_done = true;
			this.$nextTick(() => this.scrollToBottom());
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
		if (!this.preventConfirm && this.mdf === false) {
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

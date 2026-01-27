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
		send_lock: false,
		send_done: false,
		send_ok: false,
			errors: {
				name: "",
				zone_id: "",
				address: ""
			},
			validationRules: {
				name: { minLength: 2, maxLength: 50, required: true },
				zoneId: { pattern: "^[0-9]{3,6}$", required: true },
				address: { minLength: 5, maxLength: 200, required: true }
			},
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
	  await window.waitForAPI();
	  await this.loadMessages();
	  await this.loadImagesFromConfig();
	  this.loadValidationRules();
  },
	mounted() {
		this.$nextTick(() => {
			this.setupFooterSync();
			this.loadFooterDimensions();
		});
	},
  methods: {

	loadValidationRules() {
		const rules = window.apiManager?.config?.validation;
		if (!rules) return;
		this.validationRules = {
			name: {
				minLength: rules.name?.minLength ?? this.validationRules.name.minLength,
				maxLength: rules.name?.maxLength ?? this.validationRules.name.maxLength,
				required: rules.name?.required ?? this.validationRules.name.required
			},
			zoneId: {
				pattern: rules.zoneId?.pattern ?? this.validationRules.zoneId.pattern,
				required: rules.zoneId?.required ?? this.validationRules.zoneId.required
			},
			address: {
				minLength: rules.address?.minLength ?? this.validationRules.address.minLength,
				maxLength: rules.address?.maxLength ?? this.validationRules.address.maxLength,
				required: rules.address?.required ?? this.validationRules.address.required
			}
		};
	},

	clearErrors() {
		this.errors = { name: "", zone_id: "", address: "" };
	},

	validateName(name) {
		const trimmed = (name || "").trim();
		const { required, minLength, maxLength } = this.validationRules.name;
		if (required && !trimmed) return "請輸入姓名";
		if (trimmed.length < minLength) return `姓名至少需 ${minLength} 字`;
		if (trimmed.length > maxLength) return `姓名請勿超過 ${maxLength} 字`;
		return "";
	},

	validateZone(zone) {
		const trimmed = (zone || "").trim();
		const { required, pattern } = this.validationRules.zoneId;
		if (required && !trimmed) return "請輸入郵遞區號";
		const re = new RegExp(pattern);
		if (trimmed && !re.test(trimmed)) return "郵遞區號格式不正確";
		return "";
	},

	validateAddress(address) {
		const trimmed = (address || "").trim();
		const { required, minLength, maxLength } = this.validationRules.address;
		if (required && !trimmed) return "請輸入地址";
		if (trimmed.length < minLength) return `地址至少需 ${minLength} 字`;
		if (trimmed.length > maxLength) return `地址請勿超過 ${maxLength} 字`;
		return "";
	},

	validateForSearch() {
		this.clearErrors();
		const nameErr = this.validateName(this.userName);
		if (nameErr) {
			this.errors.name = nameErr;
			window.apiManager?.showToast(nameErr, 'error');
			return false;
		}
		// Trim stored value to keep consistency
		this.userName = this.userName.trim();
		return true;
	},

	validateForSend() {
		this.clearErrors();
		const nameErr = this.validateName(this.userName);
		const zoneErr = this.validateZone(this.zone_id);
		const addrErr = this.validateAddress(this.address);
		if (nameErr) this.errors.name = nameErr;
		if (zoneErr) this.errors.zone_id = zoneErr;
		if (addrErr) this.errors.address = addrErr;
		if (nameErr || zoneErr || addrErr) {
			const first = nameErr || zoneErr || addrErr;
			window.apiManager?.showToast(first, 'error');
			return false;
		}
		this.userName = this.userName.trim();
		this.zone_id = this.zone_id.trim();
		this.address = this.address.trim();
		return true;
	},

	async loadMessages() {
		if (!window.apiManager) return;
		try {
			const res = await window.apiManager.getMessages();
			const helloEntry = (res && res.messages) ? res.messages.find(m => m.type === 'hello') : null;
			this.hello = (helloEntry && helloEntry.message) ? helloEntry.message : "";
		} catch (error) {
			console.error('Failed to load messages:', error);
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
		if (this.search_loading) {
			return;
		}
		if (!this.validateForSearch()) {
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
		if (this.send_loading || this.send_lock) {
			return;
		}
		if (!this.validateForSend()) {
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
				// Lock further submissions until navigation completes
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
			// Keep loading state on success to prevent double submit; release on failure
			if (!this.send_ok) {
				this.send_loading = false;
				this.send_lock = false;
			}
			this.send_done = true;
		}
    },
	getLocalData() {
		try {
			const data = JSON.parse(localStorage.getItem('spring-festival-data') || '{}');
			this.hello = data.hello || '';
			this.userName = data.userName || '';
			this.address = data.address || '';
			this.zone_id = data.zone_id || '';
		} catch (error) {
			console.error('Failed to load local data:', error);
		}
    },
	storeLocalData() {
		const data = {
			hello: this.hello,
			userName: this.userName,
			address: this.address,
			zone_id: this.zone_id,
			timestamp: Date.now()
		};
		localStorage.setItem('spring-festival-data', JSON.stringify(data));
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
	}
  },
});

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
			headerSrc: "https://ik.imagekit.io/ccblack/spring-festival/header.png",
			errors: {
				zone_id: "",
				address: "",
				name: ""
			},
			validationRules: {
				name: { minLength: 2, maxLength: 50, required: true },
				zoneId: { pattern: "^[0-9]{3,6}$", required: true },
				address: { minLength: 5, maxLength: 200, required: true }
			}
    };
  },
  async beforeMount(){
	  await window.waitForAPI();
	  this.getLocalData();
	  await this.loadImagesFromConfig();
	  this.loadValidationRules();
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
		this.errors = { zone_id: "", address: "", name: "" };
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
	async loadImagesFromConfig() {
		if (!window.apiManager) return;
		try {
			const res = await window.apiManager.getConfig();
			if (res && res.status === 'ok' && res.config && res.config.images) {
				const images = res.config.images;
				this.headerSrc = (images.header && images.header.url) ? images.header.url : this.headerSrc;
			}
		} catch (err) {
			console.error('Failed to load config images:', err);
		}
	},
	getLocalData() {
		try {
			const data = JSON.parse(localStorage.getItem('spring-festival-data') || '{}');
			this.userName = data.userName || '';
			this.address = data.address || '';
			this.zone_id = data.zone_id || '';
		} catch (error) {
			console.error('Failed to load local data:', error);
		}
    },
	storeLocalData() {
		const data = {
			userName: this.userName,
			address: this.address,
			zone_id: this.zone_id,
			timestamp: Date.now()
		};
		localStorage.setItem('spring-festival-data', JSON.stringify(data));
    },
	async confirmSend() {
		if (this.send_loading || this.send_lock || !this.confirmed || !this.zone_id || !this.address) {
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
		const addrErr = this.validateAddress(this.address);
		if (addrErr) {
			this.errors.address = addrErr;
			window.apiManager?.showToast(addrErr, 'error');
			return;
		}
		this.address = this.address.trim();
		
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
			// Check if there is a valid zip code (prioritize 6-digit)
			const hasZipcode6 = response.data.zipcode6 && response.data.zipcode6.length > 0;
			const hasZipcode = response.data.zipcode && response.data.zipcode.length > 0;
			this.search_ok = hasZipcode6 || hasZipcode;
			
			if (this.search_ok) {
				if (response.data.zipcode6 !== "") {
					this.zone_id = response.data.zipcode6;
				} else {
					this.zone_id = response.data.zipcode;
				}
				this.errors.zone_id = "";
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

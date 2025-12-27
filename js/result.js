var app = new Vue({
  el: "#app",
  data() {
    return {
		thankyou: "",
		headerSrc: "https://ik.imagekit.io/ccblack/spring-festival/header.png"
    };
  },
  async beforeMount(){
	  await this.waitForAPI();
	  await this.getThankyou();
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
	async getThankyou() {
		if (!window.apiManager) {
			this.thankyou = "感謝您的填寫！";
			return;
		}
		try {
			const response = await window.apiManager.getMessage('thankyou');
			// 提取 message 欄位
			this.thankyou = response.message || response;
		} catch (error) {
			console.error('Failed to load thank you message:', error);
			this.thankyou = "感謝您的填寫！";
		}
    },
  },
});


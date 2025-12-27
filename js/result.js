var app = new Vue({
  el: "#app",
  data() {
    return {
		thankyou: "",		
    };
  },
  async beforeMount(){
	  await this.waitForAPI();
	  await this.getThankyou();
  },
  methods: {
	async waitForAPI() {
		let attempts = 0;
		while (!window.apiManager && attempts < 50) {
			await new Promise(resolve => setTimeout(resolve, 100));
			attempts++;
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


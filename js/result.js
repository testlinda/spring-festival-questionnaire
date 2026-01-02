var app = new Vue({
  el: "#app",
  data() {
    return {
		thankyou: "",
		headerSrc: "https://ik.imagekit.io/ccblack/spring-festival/header.png"
    };
  },
  async beforeMount(){
	  await window.waitForAPI();
	  await this.loadMessages();
	  await this.loadImagesFromConfig();
  },
  methods: {
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
	async loadMessages() {
		if (!window.apiManager) {
			this.thankyou = "感謝您的填寫！";
			return;
		}
		try {
			const res = await window.apiManager.getMessages();
			const thankyouEntry = (res && res.messages) ? res.messages.find(m => m.type === 'thankyou') : null;
			this.thankyou = (thankyouEntry && thankyouEntry.message) ? thankyouEntry.message : "感謝您的填寫！";
		} catch (error) {
			console.error('Failed to load thank you message:', error);
			this.thankyou = "感謝您的填寫！";
		}
    },
  },
});


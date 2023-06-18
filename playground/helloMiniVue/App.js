export default {
	setup() {
		return {
			msg: "hello mini vue"
		};
	},
	render() {
		return h("div", {}, `${this.msg}`);
	}
};

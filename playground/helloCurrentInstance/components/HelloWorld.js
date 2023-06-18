import { h, getCurrentInstance } from "../../../lib/mini-vue.esm.js";

export default {
	setup() {
		const instance = getCurrentInstance();
		console.log("HelloWorld:", instance);
	},
	render() {
		return h("div", {}, "Hello World");
	}
};

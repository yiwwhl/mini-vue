import { h } from "../../lib/mini-vue.esm.js";

export default {
	setup() {
		return {
			msg: "mini vue"
		};
	},
	render() {
		return h("div", {}, `hello ${this.msg}`);
	}
};

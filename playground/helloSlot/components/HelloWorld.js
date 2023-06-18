import { h, renderSlots } from "../../../lib/mini-vue.esm.js";

export default {
	setup() {
		return {
			age: 18
		};
	},
	render() {
		return h("div", {}, [
			renderSlots(this.$slots, "default", {
				age: this.age
			}),
			h("p", {}, "this is p"),
			renderSlots(this.$slots, "footer")
		]);
	}
};

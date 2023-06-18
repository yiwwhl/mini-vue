import { h } from "../../../lib/mini-vue.esm.js";

export default {
	setup(_, { emit }) {
		const emitAdd = () => {
			emit("test", "test value");
			emit("add-foo-bar", "hello", "2");
		};
		return { emitAdd };
	},
	render() {
		const btn = h(
			"button",
			{
				onClick: this.emitAdd
			},
			"emit"
		);
		const content = h("div", {}, `Hello World ${this.count}`);
		return h("div", {}, [content, btn]);
	}
};

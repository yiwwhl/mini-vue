import { h, createTextVNode } from "../../lib/mini-vue.esm.js";
import HelloWorld from "./components/HelloWorld.js";

export default {
	name: "App",
	setup() {
		return {};
	},
	render() {
		const app = h("div", {}, "App");
		const helloWorld = h(
			HelloWorld,
			{},
			{
				default: ({ age }) => [
					h("h1", {}, "default" + age),
					createTextVNode("你好呀")
				],
				footer: () => h("a", {}, "footer lnk")
			}
		);

		return h("div", {}, [app, helloWorld]);
	}
};

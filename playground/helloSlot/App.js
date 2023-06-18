import { h } from "../../lib/mini-vue.esm.js";
import HelloWorld from "./components/HelloWorld.js";

export default {
	name: "App",
	setup() {
		return {};
	},
	render() {
		const app = h("div", {}, "App");
		// single slot
		// const helloWorld = h(HelloWorld, {}, h("p", {}, "123"));

		// array slots
		// const helloWorld = h(HelloWorld, {}, [
		// 	h("p", {}, "123"),
		// 	h("h1", {}, "hahaha")
		// ]);

		// object slots
		const helloWorld = h(
			HelloWorld,
			{},
			{
				default: ({ age }) => [
					h("h1", {}, "default" + age),
					h("h1", {}, "@22")
				],
				footer: () => h("a", {}, "footer lnk")
			}
		);

		return h("div", {}, [app, helloWorld]);
	}
};

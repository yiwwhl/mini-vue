import { h, getCurrentInstance } from "../../lib/mini-vue.esm.js";
import HelloWorld from "./components/HelloWorld.js";

export default {
	name: "App",
	setup() {
		const instance = getCurrentInstance();
		console.log("App:", instance);
		return {};
	},
	render() {
		return h("div", {}, [h("p", {}, "currentInstance demo"), h(HelloWorld)]);
	}
};

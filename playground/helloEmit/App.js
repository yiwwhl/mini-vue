import { h } from "../../lib/mini-vue.esm.js";
import HelloWorld from "./components/HelloWorld.js";

export default {
	name: "App",
	setup() {
		return {};
	},
	render() {
		return h("div", {}, [
			h("div", {}, "App"),
			h(HelloWorld, {
				onAddFooBar(...values) {
					console.log("get value", values);
				},
				onTest(testValue) {
					console.log("get: " + testValue);
				}
			})
		]);
	}
};

import { h } from "../../lib/mini-vue.esm.js";
import HelloWorld from "./components/HelloWorld.js";

window.self = null;
export default {
	setup() {
		return {
			msg: "mini vue"
		};
	},
	render() {
		window.self = this;
		return h(
			"div",
			{
				style: `background: #333`
			},
			[
				h(
					"h1",
					{
						style: `color: green`,
						onClick() {
							console.log("hello click");
						}
					},
					"test children array 1"
				),
				h(
					"a",
					{
						style: `color: orange; font-size: 30px`,
						href: `https://www.baidu.com`
					},
					`go to baidu ${this.msg}`
				),
				h(HelloWorld, {
					count: 88
				})
			]
		);
	}
};

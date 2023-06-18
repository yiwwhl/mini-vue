import { h } from "../../lib/mini-vue.esm.js";

export default {
	setup() {
		return {
			msg: "mini vue"
		};
	},
	render() {
		return h(
			"div",
			{
				style: `background: #333`
			},
			[
				h(
					"h1",
					{
						style: `color: green`
					},
					"test children array 1"
				),
				h(
					"a",
					{
						style: `color: orange; font-size: 30px`,
						href: `https://www.baidu.com`
					},
					"go to baidu"
				)
			]
		);
	}
};

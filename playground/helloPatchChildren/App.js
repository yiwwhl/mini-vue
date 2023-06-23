import { h } from "../../lib/mini-vue.esm.js";

import ArrayToText from "./ArrayToText.js";
import TextToText from "./TextToText.js";
import TextToArray from "./TextToArray.js";
import ArrayToArray from "./ArrayToArray.js";

export default {
	name: "App",
	setup() {
		return {};
	},
	render() {
		return h(
			"div",
			{
				tid: 1
			},
			[
				h("p", {}, "主页"),
				// h(ArrayToText)
				// h(TextToText)
				// h(TextToArray)
				h(ArrayToArray)
			]
		);
	}
};

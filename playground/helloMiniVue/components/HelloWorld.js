import { h } from "../../../lib/mini-vue.esm.js";

export default {
	setup(props) {
		console.log("props", props);
		props.count += 1;
	},
	render() {
		return h(
			"div",
			{
				style: "color: white"
			},
			`Hello World ${this.count}`
		);
	}
};

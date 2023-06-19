import { h, provide, inject } from "../../lib/mini-vue.esm.js";

export const Provider = {
	name: "Provider",
	setup() {
		provide("foo", "fooVal");
		provide("bar", "barVal");
	},
	render() {
		return h("div", {}, [h("p", {}, "Provider"), h(Consumer)]);
	}
};

export const Consumer = {
	name: "Consumer",
	setup() {
		provide("foo", "fooNextVal");
		const foo = inject("foo");
		const bar = inject("bar");
		const baz = inject("baz", "bazDefaultValue");
		const functionBaz = inject("baz", () => "functionBazDefault");
		return {
			foo,
			bar,
			baz,
			functionBaz
		};
	},
	render() {
		return h("div", {}, [
			h(
				"h1",
				{},
				`hi ${this.foo} ${this.bar} baz: ${this.baz}, functionBaz: ${this.functionBaz}`
			),
			h(ConsumerChild)
		]);
	}
};

export const ConsumerChild = {
	name: "ConsumerChild",
	setup() {
		const foo = inject("foo");
		const bar = inject("bar");
		return {
			foo,
			bar
		};
	},
	render() {
		return h("div", {}, `Consumer Child: - ${this.foo} - ${this.bar}`);
	}
};

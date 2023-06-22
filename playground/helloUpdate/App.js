import { h, ref, createTextVNode } from "../../lib/mini-vue.esm.js";

export default {
	name: "App",
	setup() {
		const count = ref(0);
		const props = ref({
			foo: "foo",
			bar: "bar"
		});

		const onClick = () => {
			count.value++;
			console.log("value", count.value);
		};

		const onChangePropsDemo1 = () => {
			props.value.foo = "new-foo";
		};

		const onChangePropsDemo2 = () => {
			props.value.foo = undefined;
		};

		const onChangePropsDemo3 = () => {
			props.value = {
				foo: "foo"
			};
		};

		return {
			count,
			onClick,
			props,
			onChangePropsDemo1,
			onChangePropsDemo2,
			onChangePropsDemo3
		};
	},
	render() {
		return h("div", { id: this.props.foo, bar: this.props.bar }, [
			h("div", {}, "count:" + this.count),
			h(
				"button",
				{
					onClick: this.onClick
				},
				"click"
			),
			h("h1", {}, [
				createTextVNode(this.props.foo),
				createTextVNode(" "),
				createTextVNode(this.props.bar)
			]),
			h(
				"button",
				{
					onClick: this.onChangePropsDemo1,
					id: this.props.foo
				},
				"修改属性"
			),
			h(
				"button",
				{
					onClick: this.onChangePropsDemo2
				},
				"改属性 props foo 为 undefine"
			),
			h(
				"button",
				{
					onClick: this.onChangePropsDemo3
				},
				"删除 props bar 属性"
			)
		]);
	}
};

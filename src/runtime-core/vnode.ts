export function createVNode(type, props?, children?) {
	/**
	 * 需要特别说明的是，这里的 type 并不是传统意义上理解的 ElementType，
	 * 而是一个组件的用户侧实现
	 * 举个简单的例子：你可以认为就是 tsx 中通过 defineComponent 定义的一个对象
	 * 当然，这是从初始化的角度来说，实际上，最终通过递归这里的 type 会逐渐拆箱成一个
	 * ElementType
	 */
	const vnode = {
		type,
		props,
		children
	};
	return vnode;
}

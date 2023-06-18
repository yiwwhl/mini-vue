import { isArray, isObject, isObjectButNotArray, isString } from "../shared/is";
import { ShapeFlags } from "../shared/ShapeFlags";

export function createVNode(type, props?, children?) {
	/**
	 * 需要特别说明的是，初始化传入 App.js 的时候这里的 type
	 * 并不是传统意义上理解的 ElementType，而是一个组件的用户侧实现，你可以认为
	 * 初始化的时候这个 type 就是 tsx 中通过 defineComponent 定义的一个对象
	 *
	 * 当然，实际上，这个 type 在使用的时候是可能为 ElementType 的
	 * 就比如 h("div", undefined, "case")
	 */
	const vnode = {
		type,
		props,
		children,
		el: null,
		shapeFlags: getShapeFlag(type)
	};

	if (isString(children)) {
		vnode.shapeFlags |= ShapeFlags.TEXT_CHILDREN;
	}

	if (isArray(children)) {
		vnode.shapeFlags |= ShapeFlags.ARRAY_CHILDREN;
	}

	if (vnode.shapeFlags & ShapeFlags.STATEFUL_COMPONENT) {
		if (isObjectButNotArray(children)) {
			vnode.shapeFlags |= ShapeFlags.SLOT_CHILDREN;
		}
	}

	return vnode;
}

function getShapeFlag(type) {
	return isString(type) ? ShapeFlags.ELEMENT : ShapeFlags.STATEFUL_COMPONENT;
}

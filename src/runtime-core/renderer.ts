import { effect } from "../reactivity/effect";
import { ShapeFlags } from "../shared/ShapeFlags";
import { isEmptyObject } from "../shared/is";
import { createComponentInstance, setupComponent } from "./component";
import { createAppAPI } from "./createApp";
import { Fragment, Text } from "./vnode";

export function createRenderer(options) {
	const {
		createElement: hostCreateElement,
		patchProp: hostPatchProp,
		insert: hostInsert
	} = options;

	function render(vnode, container) {
		patch(null, vnode, container);
	}

	function patch(oldVnode, newVnode, container, parentComponent?) {
		/**
		 * 由于这是一个递归的过程，所以我们需要做一个判断，让这个递归有一出口
		 * 而出口就是拆箱到组件类型为 element 的时候，这时候需要去 mount 这个 element
		 */

		const { type, shapeFlags } = newVnode;

		// Fragment -> only render children
		switch (type) {
			case Fragment:
				processFragment(oldVnode, newVnode, container, parentComponent);
				break;

			case Text:
				processText(oldVnode, newVnode, container);
				break;

			default:
				if (shapeFlags & ShapeFlags.ELEMENT) {
					processElement(oldVnode, newVnode, container, parentComponent);
				}
				if (shapeFlags & ShapeFlags.STATEFUL_COMPONENT) {
					processComponent(oldVnode, newVnode, container, parentComponent);
				}
				break;
		}
	}

	function processText(oldVnode, newVnode, container) {
		const { children } = newVnode;
		const textNode = (newVnode.el = document.createTextNode(children));
		container.append(textNode);
	}

	function processFragment(oldVnode, newVnode, container, parentComponent) {
		mountArrayChildren(newVnode, container, parentComponent);
	}

	function processComponent(oldVnode, newVnode, container, parentComponent) {
		mountComponent(newVnode, container, parentComponent);
	}

	/**
	 * 对于组件的挂载来说，主要有三步
	 * 1. 创建组件实例，扩展可携带元数据的能力
	 * 2. 基于第一步创建的实例对象，装载诸如 props, slots 等元数据，同时处理 setup 函数和 render 函数的互动，最终生成一个渲染函数
	 * 3.
	 */
	function mountComponent(vnode, container, parentComponent) {
		const instance = createComponentInstance(vnode, parentComponent);
		setupComponent(instance);
		setupRenderEffect(instance, container);
	}

	function mountElement(vnode, container, parentComponent) {
		const el = (vnode.el = hostCreateElement(vnode.type));

		/**
		 * 对于 children 来说，有两种类型，string 或 array，需要分别处理
		 * 但是对于 happy 来说，我们首先关注的是 string 的 case
		 */

		const { children, shapeFlags } = vnode;

		if (shapeFlags & ShapeFlags.TEXT_CHILDREN) {
			el.textContent = children;
		}
		if (shapeFlags & ShapeFlags.ARRAY_CHILDREN) {
			mountArrayChildren(vnode, el, parentComponent);
		}

		const { props } = vnode;

		Object.keys(props).forEach((key) => {
			hostPatchProp(el, key, null, props[key]);
		});

		hostInsert(el, container);
	}

	function mountArrayChildren(vnode, container, parentComponent) {
		vnode.children.forEach((v) => patch(null, v, container, parentComponent));
	}

	/**
	 * 该操作主要在获取 render 的返回值，而 render 在上一步的 setup 中已经确认了一定有值
	 * 所以这一阶段的 happy path 只需要简单调用 instance 上的 render
	 *
	 * 所以其实用户侧的实现更像是一个箱子，用户将需要渲染的内容以装箱的形式整体提供给 vue
	 * 而 vue 在内部通过拆箱的方式去将整体模块拆分至 element，最后再进行 element 的挂载
	 */
	function setupRenderEffect(instance, container) {
		// 取名 subTree，因为通过 h 函数返回的是一棵 vnode 树
		effect(() => {
			if (!instance.isMounted) {
				const { proxy } = instance;
				const subTree = (instance.subTree = instance.render.call(proxy));
				patch(null, subTree, container, instance);
				instance.vnode.el = subTree.el;
				instance.isMounted = true;
			} else {
				const { proxy } = instance;
				const subTree = instance.render.call(proxy);
				const prevSubTree = instance.subTree;
				instance.subTree = subTree;
				patch(prevSubTree, subTree, container, instance);
			}
		});
	}

	/**
	 * 对于 element 的处理来说，有初始化和更新两种，首先实现初始化
	 */
	function processElement(oldVnode, newVnode, container, parentComponent) {
		if (!oldVnode) {
			mountElement(newVnode, container, parentComponent);
		} else {
			patchElement(oldVnode, newVnode, container);
		}
	}

	function patchElement(oldVnode, newVnode, container) {
		console.log("hiss", oldVnode, newVnode);
		// TODO: compare
		// props
		const oldProps = oldVnode.props ?? {};
		const newProps = newVnode.props ?? {};
		const el = (newVnode.el = oldVnode.el);
		patchProps(el, oldProps, newProps);
		// children
	}

	function patchProps(el, oldProps, newProps) {
		if (oldProps !== newProps) {
			for (const key in newProps) {
				const prevProp = oldProps[key];
				const nextProp = newProps[key];
				if (prevProp !== nextProp) {
					hostPatchProp(el, key, prevProp, nextProp);
				}
			}

			if (isEmptyObject(oldProps)) {
				for (const oldKey in oldProps) {
					if (!(oldKey in newProps)) {
						hostPatchProp(el, oldKey, oldProps[oldKey], null);
					}
				}
			}
		}
	}

	return {
		createApp: createAppAPI(render)
	};
}

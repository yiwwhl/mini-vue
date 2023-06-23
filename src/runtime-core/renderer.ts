import { effect } from "../reactivity/effect";
import { ShapeFlags } from "../shared/ShapeFlags";
import { isEmptyObject } from "../shared/is";
import { createComponentInstance, setupComponent } from "./component";
import { createAppAPI } from "./createApp";
import { Fragment, Text, createTextVNode } from "./vnode";

export function createRenderer(options) {
	const {
		createElement: hostCreateElement,
		patchProp: hostPatchProp,
		insert: hostInsert,
		remove: hostRemove,
		setElementText: hostSetElementText
	} = options;

	function render(vnode, container) {
		patch(null, vnode, container);
	}

	function patch(oldVnode, newVnode, container, parentComponent?, anchor?) {
		/**
		 * 由于这是一个递归的过程，所以我们需要做一个判断，让这个递归有一出口
		 * 而出口就是拆箱到组件类型为 element 的时候，这时候需要去 mount 这个 element
		 */

		const { type, shapeFlag } = newVnode;

		// Fragment -> only render children
		switch (type) {
			case Fragment:
				processFragment(oldVnode, newVnode, container, parentComponent);
				break;

			case Text:
				processText(oldVnode, newVnode, container);
				break;

			default:
				if (shapeFlag & ShapeFlags.ELEMENT) {
					processElement(
						oldVnode,
						newVnode,
						container,
						parentComponent,
						anchor
					);
				}
				if (shapeFlag & ShapeFlags.STATEFUL_COMPONENT) {
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
		mountArrayChildren(newVnode.children, container, parentComponent);
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

	function mountElement(vnode, container, parentComponent, anchor) {
		const el = (vnode.el = hostCreateElement(vnode.type));

		/**
		 * 对于 children 来说，有两种类型，string 或 array，需要分别处理
		 * 但是对于 happy 来说，我们首先关注的是 string 的 case
		 */

		const { children, shapeFlag } = vnode;

		if (shapeFlag & ShapeFlags.TEXT_CHILDREN) {
			el.textContent = children;
		}
		if (shapeFlag & ShapeFlags.ARRAY_CHILDREN) {
			mountArrayChildren(vnode.children, el, parentComponent);
		}

		const { props } = vnode;

		Object.keys(props).forEach((key) => {
			hostPatchProp(el, key, null, props[key]);
		});

		// 需要在 insert 的时候指定锚点
		hostInsert(el, container, anchor);
	}

	function mountArrayChildren(children, container, parentComponent) {
		children.forEach((v) => patch(null, v, container, parentComponent));
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
	function processElement(
		oldVnode,
		newVnode,
		container,
		parentComponent,
		anchor
	) {
		if (!oldVnode) {
			mountElement(newVnode, container, parentComponent, anchor);
		} else {
			patchElement(oldVnode, newVnode, container, parentComponent);
		}
	}

	function patchElement(oldVnode, newVnode, container, parentComponent) {
		// TODO: compare
		// props
		const oldProps = oldVnode.props ?? {};
		const newProps = newVnode.props ?? {};
		const el = (newVnode.el = oldVnode.el);
		patchChildren(oldVnode, newVnode, el, parentComponent);
		patchProps(el, oldProps, newProps);
	}

	function patchChildren(oldVnode, newVnode, container, parentComponent) {
		/**
		 * children 的四种更新情况
		 * 1. array to text
		 * 2. text to text
		 * 3. array to array
		 * 4. text to array
		 */
		const { shapeFlag: oldShapeFlag } = oldVnode;
		const { shapeFlag: newShapFlag } = newVnode;

		if (oldShapeFlag & ShapeFlags.ARRAY_CHILDREN) {
			// array to text
			if (newShapFlag & ShapeFlags.TEXT_CHILDREN) {
				// 1. clear old children
				unmountChildren(oldVnode.children);
				// 2. set text
				if (oldVnode.children !== newVnode.children) {
					hostSetElementText(container, newVnode.children);
				}
			}

			if (newShapFlag & ShapeFlags.ARRAY_CHILDREN) {
				// array to array
				patchKeyedChildren(
					oldVnode.children,
					newVnode.children,
					container,
					parentComponent
				);
			}
		}

		if (oldShapeFlag & ShapeFlags.TEXT_CHILDREN) {
			if (newShapFlag & ShapeFlags.TEXT_CHILDREN) {
				if (oldVnode.children !== newVnode.children) {
					hostSetElementText(container, newVnode.children);
				}
			}

			if (newShapFlag & ShapeFlags.ARRAY_CHILDREN) {
				hostSetElementText(container, "");
				mountArrayChildren(newVnode.children, container, parentComponent);
			}
		}
	}

	function isVNodeTypeTheSame(oldChild, newChild) {
		/**
		 *  决定两个虚拟节点是否一样有两种方式
		 *  1. type：虚拟节点类型
		 *  2. key
		 */
		return oldChild.type === newChild.type && oldChild.key === newChild.key;
	}

	function patchKeyedChildren(
		oldChildren,
		newChildren,
		container,
		parentComponent
	) {
		// init pointer
		let i = 0;
		let e1 = oldChildren.length - 1;
		let e2 = newChildren.length - 1;

		// 左侧
		while (i <= e1 && i <= e2) {
			const oldChild = oldChildren[i];
			const newChild = newChildren[i];

			/**
			 * 这里再简单的解释一下，isVNodeTypeTheSame 是为了判断新旧虚拟节点是否同一个类型，这里判断的标准是
			 * type 相等或者 key 相等
			 * 如果是同一个类型，那么说明变化的只是 props 或者 children，只需要调用 patch 函数去 patchProps 和 patchChildren
			 * 如果不是同一个类型，对左侧的查找来说，i 指针就会指向范围缩小后的起点
			 */
			if (isVNodeTypeTheSame(oldChild, newChild)) {
				patch(oldChild, newChild, container, parentComponent);
			} else {
				break;
			}

			i++;
		}

		// 右侧
		while (i <= e1 && i <= e2) {
			const oldChild = oldChildren[e1];
			const newChild = newChildren[e2];

			if (isVNodeTypeTheSame(oldChild, newChild)) {
				patch(oldChild, newChild, container, parentComponent);
			} else {
				break;
			}

			e1--;
			e2--;
		}

		console.log("-----------双端对比指针结果----------");
		console.log(
			"开始的值：",
			oldChildren,

			oldChildren.map(({ children }) => children).join(",")
		);
		console.log(
			"结束的值：",
			newChildren,
			newChildren.map(({ children }) => children).join(",")
		);
		console.log("i", i);
		console.log("e1", e1);
		console.log("e2", e2);
		console.log("----------------------------------");

		// 3. 左侧对比情况下：新的比老的多，需要创建新的节点
		if (i > e1) {
			if (i <= e2) {
				const nextIndex = e2 + 1;
				const anchor =
					nextIndex < newChildren.length ? newChildren[nextIndex].el : null;

				while (i <= e2) {
					// happy path
					patch(null, newChildren[i], container, parentComponent, anchor);
					i++;
				}
			}
		}

		// 4. 左侧对比情况下：老的比新的多，删除老的
		if (i > e2) {
			while (i <= e1) {
				hostRemove(oldChildren[i].el);
				i++;
			}
		}

		/**
		 * 总结：上述代码是针对【有序部分】的几种处理，分别是
		 * 1，创建：
		 * 	从左到右，新的比老的长，比如 AB -> ABC
		 * 	从右到左，新的比老的长，比如 BC -> ABC
		 * 2. 删除：
		 * 	从左到右，老的比新的长，比如 ABC -> AB
		 *  从右到左，老的比新的长，比如 ABC -> BC
		 */

		/**
		 * 那么还有一些情况是乱序的，分别是下面三种
		 * 1. 创建新的（在老的里面不存在，在新的里面存在）
		 * 2. 删除老的（在老的里面存在， 在新的里面不存在）
		 * 3. 移动（节点同时存在于新的和老的里面，但是位置变了）
		 */
	}

	function unmountChildren(children) {
		console.log(children);
		children.forEach((v) => {
			const el = v.el;
			// remove
			hostRemove(el);
		});
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

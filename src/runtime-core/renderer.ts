import { effect } from "../reactivity/effect";
import { ShapeFlags } from "../shared/ShapeFlags";
import { isEmptyObject, isNullOrUndefined, isUndefined } from "../shared/is";
import { createComponentInstance, setupComponent } from "./component";
import { shouldUpdateComponent } from "./componentUpdateUtils";
import { createAppAPI } from "./createApp";
import { queueJobs } from "./scheduler";
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
		if (!oldVnode) {
			mountComponent(newVnode, container, parentComponent);
		} else {
			updateComponent(oldVnode, newVnode);
		}
	}

	function updateComponent(oldVnode, newVnode) {
		const instance = (newVnode.component = oldVnode.component);
		instance.next = newVnode;
		if (shouldUpdateComponent(oldVnode, newVnode)) {
			instance.update();
		}
	}

	/**
	 * 对于组件的挂载来说，主要有三步
	 * 1. 创建组件实例，扩展可携带元数据的能力
	 * 2. 基于第一步创建的实例对象，装载诸如 props, slots 等元数据，同时处理 setup 函数和 render 函数的互动，最终生成一个渲染函数
	 * 3.
	 */
	function mountComponent(vnode, container, parentComponent) {
		const instance = (vnode.component = createComponentInstance(
			vnode,
			parentComponent
		));
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
		instance.update = effect(
			() => {
				if (!instance.isMounted) {
					const { proxy } = instance;
					const subTree = (instance.subTree = instance.render.call(proxy));
					patch(null, subTree, container, instance);
					instance.vnode.el = subTree.el;
					instance.isMounted = true;
				} else {
					const { proxy } = instance;
					const { next, vnode } = instance;
					if (next) {
						next.el = vnode.el;
						updateComponentPreRender(instance, next);
					}
					const subTree = instance.render.call(proxy);
					const prevSubTree = instance.subTree;
					instance.subTree = subTree;
					patch(prevSubTree, subTree, container, instance);
				}
			},
			{
				scheduler() {
					console.log("update");
					queueJobs(instance.update);
				}
			}
		);
	}

	function updateComponentPreRender(instance, nextVNode) {
		instance.vnode = nextVNode;
		instance.next = null;
		instance.props = nextVNode.props;
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
		 *
		 * 而对于乱序来说，比如 ab(cd)fg 和 ab(ec)fg，我们会锁定对比算法到中间的 cd 和 ec 上
		 * 那么这个时候，如果希望实现第二种情况，也就是将老的删除，我们需要遍历老的节点，看看是否在新的节点中，
		 * 伪代码可以认为是 [c,d].forEach((i) => if(![e,c].includes(i)) { hostRemove(i.el)})
		 *
		 * 如果这个 list 刚好被 key 标识过，那么查找算法的复杂度会下降
		 * 找不到就删除，找到了就调用 patch 继续对比 props 和 children
		 */

		// 中间对比
		/**
		 * 对于移动节点来说，我们需要尽可能保证被移动的节点数量更少，这是因为整个 diff 算法在框架中使用非常频繁，
		 * 对性能要求极高
		 * 而保证移动节点数量少的关键就是寻找到【最长递增子序列】
		 * 比如，对于 cde 和 ecd 来说，cd 是相对稳定的序列，需要变的是 e 这个节点的位置
		 */

		let oldStart = i; // 老节点的开始
		let newStart = i; // 新节点的开始
		let shouldMove = false;
		let currentMaxiumIndex = 0;

		// 新节点的映射表建立
		/**
		 * 延伸：这也引出了一个经典的问题，也就是为什么不推荐用 index 作 key
		 * 如果用 index 作 key，而我们判断两个节点是否是同一个节点的依据中，也就是 isVNodeTypeTheSame 中用到了这个 key
		 * 1.如果形如 ABC -> BCD，但又比较复杂导致 A B C 的 type 各不相同时，无法判断出 ABC 中 index 为 1 的 B 和 BCD 中 index 为 0 的 B 是同一个
		 * 则会导致无法复用 dom
		 * 2.存在数据错位的风险，比如 ABC -> DABC，如果刚好 A 和 D 的 type 相同，会认为 A 和 D 是可复用的，因为他们的 key 都是 0
		 * 那么会导致 A 的数据残留在 D 这个组件中，带来预期外的问题
		 */
		// 记录 patch 过的节点
		const toBePatched = e2 - newStart + 1;
		let patched = 0;

		const KeyToNewIndexMap = new Map();

		// 这里创建映射关系是为了寻找最长递增子序列，而给一个定长的数组，是为了保证更高的性能
		const newIndexToOldIndexMap = new Array(toBePatched);
		for (let i = 0; i < toBePatched; i++) {
			newIndexToOldIndexMap[i] = 0;
		}

		for (let i = newStart; i <= e2; i++) {
			const newChild = newChildren[i];
			KeyToNewIndexMap.set(newChild.key, i);
		}

		console.log(
			"如果有 key 时创建的一个 keyToNewIndex 映射表：",
			KeyToNewIndexMap
		);

		for (let i = oldStart; i <= e1; i++) {
			const oldChild = oldChildren[i];
			let newIndex; // 这个 newIndex 将是最终查找 anchor 的关键，也是新旧节点如果发生位置变化后的一个插入依据

			if (patched >= toBePatched) {
				hostRemove(oldChild.el);
				continue;
			}

			if (!isNullOrUndefined(oldChild.key)) {
				newIndex = KeyToNewIndexMap.get(oldChild.key);
			} else {
				for (let j = newStart; j <= e2; j++) {
					const newChild = newChildren[j];

					if (isVNodeTypeTheSame(oldChild, newChild)) {
						newIndex = j;
						break;
					}
				}
			}

			if (isNullOrUndefined(newIndex)) {
				hostRemove(oldChild.el);
			} else {
				/**
				 * 因为移动的逻辑是基于存在的，必须存在才能够移动，所以在这可以拿到老节点中存在的节点索引
				 */

				if (newIndex >= currentMaxiumIndex) {
					currentMaxiumIndex = newIndex;
				} else {
					shouldMove = true;
				}

				// 注意这里的 i 可能为 0，代表他在老节点中是第 0 个，但是 0 对于这个映射关系有重要的意义
				// 如果为 0，我们最终会认为他不存在于新的节点中，因为初始化的时候也用的 0，所以在这用 i+1 避免这个问题
				newIndexToOldIndexMap[newIndex - newStart] = i + 1;

				patch(oldChild, newChildren[newIndex], container, parentComponent);
				patched++;
			}
		}

		console.log("寻找最长递增子序列时的映射关系表：", newIndexToOldIndexMap);

		// 求出最长递增子序列
		const longestIncreasingSubsequence = shouldMove
			? getLongestIncreasingSubsequence(newIndexToOldIndexMap)
			: [];
		console.log("最长递增子序列：", longestIncreasingSubsequence);
		let j = longestIncreasingSubsequence.length - 1;

		for (let i = toBePatched - 1; i >= 0; i--) {
			const nextIndex = i + newStart;
			const nextChild = newChildren[nextIndex];
			const anchor =
				nextIndex + 1 < newChildren.length
					? newChildren[nextIndex + 1].el
					: null;

			/**
			 * 之前其实也提到了 i+1 避免为 0 的问题，这里的 0 其实就是一个标识，标识他在老的节点中不存在，需要创建
			 * 这是因为当我们初始化映射表的时候，会将差异节点的旧表节点值初始化为 0，并在旧表中找到对应节点后标识索引 + 1
			 */
			if (newIndexToOldIndexMap[i] === 0) {
				patch(null, nextChild, container, parentComponent, anchor);
			}

			if (shouldMove) {
				if (j < 0 || i !== longestIncreasingSubsequence[j]) {
					hostInsert(nextChild.el, container, anchor);
				} else {
					j--;
				}
			}
		}

		console.log("----------------------------------");
	}

	function getLongestIncreasingSubsequence(nums) {
		if (nums.length == 0) {
			return [];
		}

		let dp = new Array(nums.length).fill(1);
		let prev = new Array(nums.length).fill(-1);
		let maxLen = 1;
		let maxIndex = 0;

		for (let i = 1; i < nums.length; i++) {
			for (let j = 0; j < i; j++) {
				if (nums[i] > nums[j] && dp[j] + 1 > dp[i]) {
					dp[i] = dp[j] + 1;
					prev[i] = j;
				}
			}
			if (dp[i] > maxLen) {
				maxLen = dp[i];
				maxIndex = i;
			}
		}

		let longestSubseqIndexes: any[] = [];
		for (let i = maxIndex; i >= 0; i = prev[i]) {
			longestSubseqIndexes.unshift(i);
		}

		return longestSubseqIndexes;
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

import { createComponentInstance, setupComponent } from "./component";

export function render(vnode, container) {
	patch(vnode, container);
}

function patch(vnode, container) {
	/**
	 * 由于这是一个递归的过程，所以我们需要做一个判断，让这个递归有一出口
	 * 而出口就是拆箱到组件类型为 element 的时候，这时候需要去 mount 这个 element
	 */

	processComponent(vnode, container);
}

function processComponent(vnode, container) {
	mountComponent(vnode, container);
}

/**
 * 对于组件的挂载来说，主要有三步
 * 1. 创建组件实例，扩展可携带元数据的能力
 * 2. 基于第一步创建的实例对象，装载诸如 props, slots 等元数据，同时处理 setup 函数和 render 函数的互动，最终生成一个渲染函数
 * 3.
 */
function mountComponent(vnode, container) {
	const instance = createComponentInstance(vnode);
	setupComponent(instance);
	setupRenderEffect(instance, container);
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
	const subTree = instance.render();
	patch(subTree, container);
}

import { readonly, shallowReadonly } from "../reactivity/reactive";
import { isObject } from "../shared/is";
import { initProps } from "./componentProps";
import { publicInstanceProxyHandlers } from "./componentPublicInstance";

export function createComponentInstance(vnode) {
	const componentInstance = {
		vnode,
		type: vnode.type,
		setupState: {},
		props: {}
	};
	return componentInstance;
}

export function setupComponent(instance) {
	// TODO: handle props
	initProps(instance, instance.vnode.props);
	// TODO: handle slots
	// initSlots()

	/**
	 * 初始化一个有状态的组件
	 * 扫盲：
	 * 1.什么是有状态的组件
	 *  有状态的组件，也叫做类组件或智能组件，拥有自己的状态（state）并管理它。
	 *  这种类型的组件可以有生命周期方法，可以进行网络请求，并且可以处理用户输入或者其他事件。
	 *  有状态的组件通常用于处理应用程序的逻辑和功能。
	 * 2.什么是无状态的组件
	 *  无状态的组件，也叫做函数组件或呈现组件，不包含和管理自己的状态。
	 *  它们只接受输入（props）并渲染 UI，不涉及状态管理或生命周期方法。
	 *  这使得无状态的组件更简单，更易于理解和测试。无状态的组件通常用于渲染 UI 和布局。
	 */
	setupStatefulComponent(instance);
}

function setupStatefulComponent(instance) {
	// 你可以认为这里的 Component 命名，是为了和 defineComponent 产生对应
	const Component = instance.type;

	instance.proxy = new Proxy(
		{
			_: instance
		},
		publicInstanceProxyHandlers
	);

	const { setup } = Component;
	if (setup) {
		/**
		 * setup 可能会返回 function，也可能会返回 object
		 * 如果是 function 的话，会作为该 Component 的 render 函数
		 * 如果是 object 的话，会将该 object 合并到组件的上下文中
		 */

		const setupResult = setup(shallowReadonly(instance.props));
		handleSetupResult(instance, setupResult);
	}
}

function handleSetupResult(instance, setupResult) {
	/**
	 * 这个其实也是属于任务拆分的一部分，优先实现 happy path，或者说 core path
	 * 将边缘 case 留作 TODO
	 */
	// TODO: implement function later

	if (isObject(setupResult)) {
		instance.setupState = setupResult;
	}

	finishComponentSetup(instance);
}

function finishComponentSetup(instance) {
	const Component = instance.type;
	if (Component.render) {
		instance.render = Component.render;
	}
}

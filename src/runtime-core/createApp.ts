import { isString } from "../shared/is";
import { createVNode } from "./vnode";

export function createAppAPI(render) {
	return function createApp(rootComponent) {
		return {
			mount(rootContainerId) {
				if (isString(rootContainerId)) {
					rootContainerId = document.querySelector(rootContainerId);
				}
				const vnode = createVNode(rootComponent);
				render(vnode, rootContainerId);
			}
		};
	};
}

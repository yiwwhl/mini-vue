import { render } from "./renderer";
import { createVNode } from "./vnode";

export function createApp(rootComponent) {
	return {
		mount(rootContainerId) {
			const rootContainer = document.getElementById(rootContainerId);
			const vnode = createVNode(rootComponent);
			render(vnode, rootContainer);
		}
	};
}

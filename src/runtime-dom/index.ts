import { createRenderer } from "../runtime-core";
import { isOn } from "../shared/is";

function createElement(type) {
	return document.createElement(type);
}
function patchProp(el, key, value) {
	if (isOn(key)) {
		const event = key.slice(2).toLowerCase();
		el.addEventListener(event, value);
	} else {
		el.setAttribute(key, value);
	}
}
function insert(el, container) {
	container.append(el);
}

const renderer = createRenderer({
	createElement,
	patchProp,
	insert
});

export function createApp(rootComponent) {
	return renderer.createApp(rootComponent);
}

export * from "../runtime-core/index";

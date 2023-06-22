import { createRenderer } from "../runtime-core";
import { isNullOrUndefined, isOn } from "../shared/is";

function createElement(type) {
	return document.createElement(type);
}
function patchProp(el, key, prevValue, nextValue) {
	if (isOn(key)) {
		const event = key.slice(2).toLowerCase();
		el.addEventListener(event, nextValue);
	} else {
		if (isNullOrUndefined(nextValue)) {
			// should remove prop
			el.removeAttribute(key);
		} else {
			el.setAttribute(key, nextValue);
		}
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

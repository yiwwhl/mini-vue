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
function insert(child, container, anchor) {
	/**
	 * 这个 api 比较有意思，如果 anchor 未指定，则默认行为是 append，如果指定，则会将节点添加到 anchor 之前
	 */
	container.insertBefore(child, anchor);
}

function remove(el) {
	const parent = el.parentNode;
	if (parent) {
		parent.removeChild(el);
	}
}

function setElementText(container, text) {
	container.textContent = text;
}

const renderer = createRenderer({
	createElement,
	patchProp,
	insert,
	remove,
	setElementText
});

export function createApp(rootComponent) {
	return renderer.createApp(rootComponent);
}

export * from "../runtime-core/index";

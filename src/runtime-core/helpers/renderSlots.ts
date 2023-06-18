import { isFunction } from "../../shared/is";
import { createVNode } from "../vnode";

export function renderSlots(slots, key?, props?) {
	const slot = slots[key];
	if (slot) {
		if (isFunction(slot)) {
			return createVNode("div", {}, slot(props));
		}
	}
	return createVNode("div", {}, slots);
}

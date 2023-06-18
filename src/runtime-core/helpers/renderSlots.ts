import { isFunction } from "../../shared/is";
import { Fragment, createVNode } from "../vnode";

export function renderSlots(slots, key?, props?) {
	const slot = slots[key];
	if (slot) {
		if (isFunction(slot)) {
			return createVNode(Fragment, {}, slot(props));
		}
	}
	return createVNode("div", {}, slots);
}

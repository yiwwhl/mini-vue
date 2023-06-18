import { isObject } from "../shared/is";
import {
	mutableHandlers,
	readonlyHandlers,
	shallowReadonlyHandlers
} from "./baseHandlers";

export const enum ReactiveFlags {
	IS_REACTIVE = "__v_isReactive",
	IS_READONLy = "__v_isReadonly"
}

function createActiveObject(raw, baseHandlers) {
	if (!isObject(raw)) {
		console.warn(`proxy target must be a object`);
		return;
	}
	return new Proxy(raw, baseHandlers);
}

export function reactive(raw) {
	return createActiveObject(raw, mutableHandlers);
}

export function readonly(raw) {
	return createActiveObject(raw, readonlyHandlers);
}

export function shallowReadonly(raw) {
	return createActiveObject(raw, shallowReadonlyHandlers);
}

export function isReactive(value) {
	return !!value[ReactiveFlags.IS_REACTIVE];
}

export function isReadonly(value) {
	return !!value[ReactiveFlags.IS_READONLy];
}

export function isProxy(value) {
	return isReactive(value) || isReadonly(value);
}

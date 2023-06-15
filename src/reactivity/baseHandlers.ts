import { track, trigger } from "./effect";

function createGetter(isReadonly = false) {
	return function get(target, key) {
		const r = Reflect.get(target, key);
		if (!isReadonly) {
			track(target, key);
		}
		return r;
	};
}

function createSetter() {
	return function set(target, key, value) {
		const r = Reflect.set(target, key, value);
		trigger(target, key);
		return r;
	};
}

const get = createGetter();
const set = createSetter();
const readonlyGet = createGetter(true);

export const mutableHandlers = {
	get,
	set
};

export const readonlyHandlers = {
	get: readonlyGet,
	set(target, key, value) {
		console.warn(`key: ${key} set failed, because ${target} is readonly`);
		return true;
	}
};

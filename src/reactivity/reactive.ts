import { track, trigger } from "./effect";

export function reactive(raw) {
	return new Proxy(raw, {
		get(target, key) {
			const r = Reflect.get(target, key);
			track(target, key);
			return r;
		},
		set(target, key, value) {
			const r = Reflect.set(target, key, value);
			trigger(target, key);
			return r;
		}
	});
}

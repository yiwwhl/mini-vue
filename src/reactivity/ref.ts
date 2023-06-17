import { isTracking, trackEffects, triggerEffects } from "./effect";
import { reactive } from "./reactive";
import { hasChanged, isObject } from "./shared/utils";

export class RefImpl {
	private _value: any;
	private _rawValue: any;
	public deps;
	public __v_isRef = true;
	constructor(value) {
		this._rawValue = value;
		this._value = convert(value);
		this.deps = new Set();
	}
	get value() {
		isTracking() && trackEffects(this.deps);
		return this._value;
	}
	set value(newValue) {
		if (!hasChanged(newValue, this._rawValue)) return;
		this._rawValue = newValue;
		this._value = convert(newValue);
		triggerEffects(this.deps);
	}
}

function convert(value) {
	return isObject(value) ? reactive(value) : value;
}

export function ref(value) {
	return new RefImpl(value);
}

export function isRef(mayBeRef) {
	return !!mayBeRef.__v_isRef;
}

export function unRef(mayBeRef) {
	return isRef(mayBeRef) ? mayBeRef.value : mayBeRef;
}

export function proxyRefs(objectWithRefs) {
	return new Proxy(objectWithRefs, {
		get(target, key) {
			return unRef(Reflect.get(target, key));
		},
		set(target, key, value) {
			if (isRef(target[key]) && !isRef(value)) {
				return (target[key].value = value);
			} else {
				return Reflect.set(target, key, value);
			}
		}
	});
}

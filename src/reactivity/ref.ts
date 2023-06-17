import { isTracking, trackEffects, triggerEffects } from "./effect";
import { reactive } from "./reactive";
import { hasChanged, isObject } from "./shared/utils";

export class RefImpl {
	private _value: any;
	private _rawValue: any;
	public deps;
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

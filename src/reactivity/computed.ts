import { ReactiveEffect } from "./effect";

class ComputedRefImpl {
	private _value;
	private _effect;
	private _dirty = true;
	constructor(getter) {
		const that = this;
		this._effect = new ReactiveEffect(getter, {
			scheduler() {
				if (!that._dirty) {
					that._dirty = true;
				}
			}
		});
	}
	get value() {
		if (this._dirty) {
			this._dirty = false;
			this._value = this._effect.run();
		}
		return this._value;
	}
}

export function computed(getter) {
	return new ComputedRefImpl(getter);
}

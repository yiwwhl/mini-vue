import { merge } from "./shared/utils";

let activeEffect;
let shouldTrack;

class ReactiveEffect {
	fn;
	scheduler;
	active = true;
	depsPool = [];
	onStop: any;
	onScheduler: any;

	constructor(_fn, options) {
		merge(this, options);
		this.fn = _fn;
	}

	run() {
		if (!this.active) {
			return this.fn();
		}
		shouldTrack = true;
		activeEffect = this;
		const r = this.fn();
		shouldTrack = false;
		return r;
	}

	stop() {
		if (this.active) {
			if (this.onStop) {
				this.onStop();
			}
			cleanupEffect(this);
			this.active = false;
		}
	}
}

function cleanupEffect(effect) {
	effect.depsPool.forEach((deps: Set<any>) => {
		deps.delete(effect);
	});
	effect.depsPool.length = 0;
}

const targetMap = new Map();

function isTracking() {
	return shouldTrack && activeEffect !== undefined;
}

export function track(target, key) {
	if (!isTracking()) return;

	let keyMap = targetMap.get(target);
	if (!keyMap) {
		keyMap = new Map();
		targetMap.set(target, keyMap);
	}
	let deps = keyMap.get(key);
	if (!deps) {
		deps = new Set();
		keyMap.set(key, deps);
	}

	if (deps.has(activeEffect)) return;

	deps.add(activeEffect);
	activeEffect.depsPool.push(deps);
}

export function trigger(target, key) {
	let keyMap = targetMap.get(target);
	let deps = keyMap.get(key);

	for (const dep of deps) {
		if (dep.scheduler) {
			dep.scheduler();
		} else {
			dep.run();
		}
	}
}

export function effect(fn, options?) {
	const effect = new ReactiveEffect(fn, options);
	effect.run();
	const runner: any = effect.run.bind(effect);
	runner.effect = effect;
	return runner;
}

export function stop(runner) {
	runner.effect.stop();
}

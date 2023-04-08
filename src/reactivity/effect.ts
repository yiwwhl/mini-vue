let activeEffect;

class ReactiveEffect {
	fn;

	constructor(_fn) {
		this.fn = _fn;
	}

	run() {
		activeEffect = this;
		this.fn();
	}
}

const targetMap = new Map();

export function track(target, key) {
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

	deps.add(activeEffect);
}

export function trigger(target, key) {
	let keyMap = targetMap.get(target);
	let deps = keyMap.get(key);

	for (const dep of deps) {
		dep.run();
	}
}

export function effect(fn) {
	const effect = new ReactiveEffect(fn);
	effect.run();
}

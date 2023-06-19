import { isFunction } from "../shared/is";
import { getCurrentInstance } from "./component";

export function provide(key, value) {
	const currentInstance = getCurrentInstance();
	if (currentInstance) {
		const { provides } = currentInstance;
		provides[key] = value;
	}
}

export function inject(key, defaultValue) {
	const currentInstance = getCurrentInstance();
	if (currentInstance) {
		const parentProvides = currentInstance.parent.provides;

		if (isFunction(defaultValue)) {
			defaultValue = defaultValue();
		}

		return parentProvides[key] ?? defaultValue;
	}
}

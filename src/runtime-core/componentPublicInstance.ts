import { hasOwn } from "../shared/utils";

const publicPropertiesMap = {
	$el: (i) => i.vnode.el,
	$slots: (i) => i.slots
};

export const publicInstanceProxyHandlers = {
	get({ _: instance }, key) {
		// strategies mode
		if (hasOwn(publicPropertiesMap, key)) {
			return publicPropertiesMap[key](instance);
		}

		// setupState
		const { setupState, props } = instance;

		if (hasOwn(props, key)) {
			return props[key];
		}
		if (hasOwn(setupState, key)) {
			return setupState[key];
		}
	}
};

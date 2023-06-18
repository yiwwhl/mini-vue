const publicPropertiesMap = {
	$el: (i) => i.vnode.el
};

export const publicInstanceProxyHandlers = {
	get({ _: instance }, key) {
		// strategies mode
		if (key in publicPropertiesMap) {
			return publicPropertiesMap[key](instance);
		}

		// setupState
		const { setupState } = instance;
		if (key in setupState) {
			return setupState[key];
		}
	}
};

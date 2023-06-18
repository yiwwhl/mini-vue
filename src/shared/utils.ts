export const merge = Object.assign;

export const hasChanged = (value, anotherValue) => {
	return !Object.is(value, anotherValue);
};

export const hasOwn = (target, key) => {
	if (!target || !key) return;
	return Object.prototype.hasOwnProperty.call(target, key);
};

export const merge = Object.assign;

export const hasChanged = (value, anotherValue) => {
	return !Object.is(value, anotherValue);
};

export function isEmptyObject(value) {
	return isObjectButNotArray(value) && Object.keys(value).length === 0;
}

export function isNullOrUndefined(value) {
	return isNull(value) || isUndefined(value);
}

export function isNull(value) {
	return value === null;
}

export function isUndefined(value) {
	return value === undefined;
}

export const isObjectButNotArray = (value) => {
	return isObject(value) && !isArray(value);
};

export const isObject = (value) => {
	return !isNull(value) && typeof value === "object";
};

export const isString = (value) => {
	return !isNull(value) && typeof value === "string";
};

export const isArray = Array.isArray;

export const isOn = (key) => /^on[A-Z]/.test(key);

export const isFunction = (value) => {
	return !isNull(value) && typeof value === "function";
};

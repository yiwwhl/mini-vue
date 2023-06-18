export function isNull(value) {
	return value === null;
}

export function isUndefined(value) {
	return value === null;
}

export const isObject = (value) => {
	return !isNull(value) && typeof value === "object";
};

export const isString = (value) => {
	return !isNull(value) && typeof value === "string";
};

export const isArray = Array.isArray;

export const isOn = (key) => /^on[A-Z]/.test(key);

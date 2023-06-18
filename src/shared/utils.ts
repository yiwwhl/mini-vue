import { isString } from "./is";

export const merge = Object.assign;

export const hasChanged = (value, anotherValue) => {
	return !Object.is(value, anotherValue);
};

export const hasOwn = (target, key) => {
	if (!target || !key) return;
	return Object.prototype.hasOwnProperty.call(target, key);
};

export const capitalizeTheFirstLetter = (str) => {
	return [...str].reduce(
		(acc, cur) =>
			acc === "" ? acc.concat(cur.toUpperCase()) : acc.concat(cur),
		""
	);
};

/**
 * 用于支持烤肉串式命名
 */
export const camelize = (str) => {
	return str.replace(/-(\w)/g, (_, c) => {
		return capitalizeTheFirstLetter(c);
	});
};

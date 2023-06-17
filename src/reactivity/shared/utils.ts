export const merge = Object.assign;

export const isObject = (value) => {
	return value !== null && typeof value === "object";
};

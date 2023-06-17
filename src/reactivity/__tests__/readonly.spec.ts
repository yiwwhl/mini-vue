import { isProxy, isReadonly, readonly } from "../reactive";

describe("readonly", () => {
	it("happy path", () => {
		const original = { foo: 1, bar: { baz: 2 } };
		const wrapped = readonly(original);
		expect(wrapped).not.toBe(original);
		expect(wrapped.foo).toBe(1);
		expect(isReadonly(wrapped)).toBe(true);
		expect(isReadonly(original)).toBe(false);
		expect(isReadonly(wrapped.bar)).toBe(true);
		expect(isReadonly(original.bar)).toBe(false);
		expect(isProxy(wrapped.bar)).toBe(true);
		expect(isProxy(original.bar)).toBe(false);
	});

	it("should warn when call set", () => {
		// fake warn
		console.warn = jest.fn();

		const user = readonly({
			name: "yiwwhl"
		});
		user.age = 11;
		expect(console.warn).toBeCalled();
	});
});

import { readonly } from "../reactive";

describe("readonly", () => {
	it("happy path", () => {
		const original = { foo: 1, bar: { baz: 2 } };
		const wrapped = readonly(original);
		expect(wrapped).not.toBe(original);
		expect(wrapped.foo).toBe(1);
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

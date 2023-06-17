import { isReadonly, shallowReadonly } from "../reactive";

describe("shallow readonly", () => {
	it("should not make non-reactive properties reactive", () => {
		const props = shallowReadonly({ n: { foo: 1 } });
		expect(isReadonly(props)).toBe(true);
		expect(isReadonly(props.n)).toBe(false);
	});

	it("should warn when call shallow set", () => {
		// fake warn
		console.warn = jest.fn();

		const user = shallowReadonly({
			name: "yiwwhl"
		});
		user.age = 11;
		expect(console.warn).toBeCalled();
	});
});

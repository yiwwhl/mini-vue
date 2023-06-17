import { computed } from "../computed";
import { effect } from "../effect";
import { reactive } from "../reactive";

describe("computed", () => {
	it("happy path", () => {
		const user = reactive({
			age: 1
		});

		const age = computed(() => {
			return user.age;
		});

		expect(age.value).toBe(1);
	});

	it("should computed lazily", () => {
		const value = reactive({
			foo: 1
		});
		const getter = jest.fn(() => {
			return value.foo;
		});
		const cValue = computed(getter);

		// lazy
		expect(getter).not.toHaveBeenCalled();
		expect(cValue.value).toBe(1);
		expect(getter).toHaveBeenCalledTimes(1);

		// should not computed again
		cValue.value;
		expect(getter).toHaveBeenCalledTimes(1);

		// should not compute until the reactive dependency updated
		value.foo = 2;
		expect(getter).toHaveBeenCalledTimes(1);

		expect(cValue.value).toBe(2);
		expect(getter).toHaveBeenCalledTimes(2);

		// // should not computed again
		// cValue.value;
		// expect(getter).toHaveBeenCalledTimes(2);
	});
});

import { effect } from "../effect";
import { reactive } from "../reactive";
import { isRef, ref, unRef } from "../ref";

describe("ref", () => {
	it("happy path", () => {
		const count = ref(1);
		expect(count.value).toBe(1);
	});

	it("should be reactive", () => {
		const count = ref(1);
		let dummy;
		let calls = 0;
		effect(() => {
			calls++;
			dummy = count.value;
		});
		expect(calls).toBe(1);
		expect(dummy).toBe(1);
		count.value = 2;
		expect(calls).toBe(2);
		expect(dummy).toBe(2);
		// same value should not trigger
		count.value = 2;
		expect(calls).toBe(2);
		expect(dummy).toBe(2);
	});

	it("should make nested properties reactive", () => {
		const user = ref({
			name: "josh"
		});
		let dummy;
		effect(() => {
			dummy = user.value.name;
		});
		expect(dummy).toBe("josh");
		user.value.name = "tom";
		expect(dummy).toBe("tom");
	});

	it("isRef", () => {
		const a = ref(1);
		const user = reactive({ age: 2 });
		expect(isRef(a)).toBeTruthy();
		expect(isRef(1)).toBeFalsy();
		expect(isRef(user)).toBeFalsy();
	});

	it("unRef", () => {
		const a = ref(1);
		expect(unRef(a)).toBe(1);
		expect(unRef(1)).toBe(1);
	});
});

import { NodeTypes } from "../src/ast";
import { baseParser } from "../src/parser";

describe("parser", () => {
	/**
	 * 插值
	 */
	describe("interpolation", () => {
		it("simple interpolation", () => {
			const ast = baseParser("{{ message }}");
			// root
			expect(ast.children[0]).toStrictEqual({
				type: NodeTypes.INTERPOLATION,
				content: {
					type: NodeTypes.SIMPLE_EXPRESSION,
					content: "message"
				}
			});
		});
	});

	describe("element", () => {
		it("simple element div", () => {
			const ast = baseParser("<div></div>");
			expect(ast.children[0]).toStrictEqual({
				type: NodeTypes.ELEMENT,
				tag: "div",
				children: []
			});
		});
	});

	describe("text", () => {
		it("simple text", () => {
			const ast = baseParser("some text");
			expect(ast.children[0]).toStrictEqual({
				type: NodeTypes.TEXT,
				content: "some text"
			});
		});
	});

	test("hello world", () => {
		const ast = baseParser("<p>hi, {{message}}</p>");
		expect(ast.children[0]).toStrictEqual({
			type: NodeTypes.ELEMENT,
			tag: "p",
			children: [
				{
					type: NodeTypes.TEXT,
					content: "hi, "
				},
				{
					type: NodeTypes.INTERPOLATION,
					content: {
						type: NodeTypes.SIMPLE_EXPRESSION,
						content: "message"
					}
				}
			]
		});
	});

	test("Nested element", () => {
		const ast = baseParser("<div><p>hi</p>{{message}}</div>");
		expect(ast.children[0]).toStrictEqual({
			type: NodeTypes.ELEMENT,
			tag: "div",
			children: [
				{
					type: NodeTypes.ELEMENT,
					tag: "p",
					children: [
						{
							type: NodeTypes.TEXT,
							content: "hi"
						}
					]
				},
				{
					type: NodeTypes.INTERPOLATION,
					content: {
						type: NodeTypes.SIMPLE_EXPRESSION,
						content: "message"
					}
				}
			]
		});
	});

	test.only("should throw error when lack end tag", () => {
		expect(() => {
		 baseParser("<div><span></div>");
		}).toThrow();
	});
});

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
});

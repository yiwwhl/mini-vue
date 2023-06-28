import { createVNodeCall, NodeTypes } from "../ast";

export function transformElement(node, context) {
	if (node.type === NodeTypes.ELEMENT) {
		return () => {
			const vnodeTag = `'${node.tag}'`;
			const vnodeProps = null;
			let vnodeChildren = null;
			if (node.children.length > 0) {
				if (node.children.length === 1) {
					const child = node.children[0];
					vnodeChildren = child;
				}
			}

			node.codegenNode = createVNodeCall(
				context,
				vnodeTag,
				vnodeProps,
				vnodeChildren
			);
		};
	}
}

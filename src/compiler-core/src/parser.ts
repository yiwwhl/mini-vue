import { NodeTypes } from "./ast";

export function baseParser(content: string) {
	const context = createParserContext(content);
	return createRoot(parserChildren(context));
}

function parserChildren(context) {
	const nodes: any[] = [];

	// {{}}
	let node;
	if (context.source.startsWith("{{")) {
		node = parserInterpolation(context);
	}

	nodes.push(node);
	return nodes;
}

function advanceBy(context, length) {
	context.source = context.source.slice(length);
}

function parserInterpolation(context) {
	// {{message}} => message
	const openDelimiter = "{{";
	const closeDelimiter = "}}";

	const closeIndex = context.source.indexOf(
		closeDelimiter,
		openDelimiter.length
	);
	advanceBy(context, openDelimiter.length);
	const rawContentLength = closeIndex - openDelimiter.length;
	const rawContent = context.source.slice(0, rawContentLength);
	// edge case
	const content = rawContent.trim();
	advanceBy(context, rawContentLength + closeDelimiter.length);

	return {
		type: NodeTypes.INTERPOLATION,
		content: {
			type: NodeTypes.SIMPLE_EXPRESSION,
			content
		}
	};
}

function createRoot(children) {
	return {
		children
	};
}

function createParserContext(content: string): any {
	return {
		source: content
	};
}

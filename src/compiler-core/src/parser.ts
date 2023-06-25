import { NodeTypes } from "./ast";

const enum TagType {
	Start,
	End
}

export function baseParser(content: string) {
	const context = createParserContext(content);
	return createRoot(parseChildren(context, ""));
}

function parseChildren(context, parentTag) {
	const nodes: any[] = [];

	while (!isEnd(context, parentTag)) {
		// {{}}
		let node;
		const source = context.source;
		if (source.startsWith("{{")) {
			node = parserInterpolation(context);
		}

		if (source[0] === "<") {
			if (/[a-z]/.test(source[1])) {
				node = parseElemenet(context);
			}
		}

		if (!node) {
			node = parseText(context);
		}

		nodes.push(node);
	}
	return nodes;
}

function isEnd(context, parentTag) {
	if (parentTag && context.source.startsWith(`</${parentTag}>`)) {
		return true;
	}

	if (!context.source) return true;

	throw `缺少结束标签}`;
}

function parseText(context) {
	let endIndex = context.source.length;
	let endTokens = ["<", "{{"];

	for (let i = 0; i < endTokens.length; i++) {
		const index = context.source.indexOf(endTokens[i]);
		if (index !== -1 && endIndex > index) {
			endIndex = index;
		}
	}

	const content = parseTextData(context, endIndex);

	return {
		type: NodeTypes.TEXT,
		content
	};
}

function parseElemenet(context) {
	const element: any = parseTag(context, TagType.Start);
	element.children = parseChildren(context, element.tag);
	parseTag(context, TagType.End);
	return element;
}

function parseTag(context, type: TagType) {
	const match: any = /^<\/?([a-z]*)/i.exec(context.source);
	const tag = match[1];

	advanceBy(context, match[0].length);
	advanceBy(context, 1);

	if (type === TagType.End) return;

	return {
		type: NodeTypes.ELEMENT,
		tag
	};
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
	const rawContent = parseTextData(context, rawContentLength);
	// edge case
	const content = rawContent.trim();
	advanceBy(context, closeDelimiter.length);

	return {
		type: NodeTypes.INTERPOLATION,
		content: {
			type: NodeTypes.SIMPLE_EXPRESSION,
			content
		}
	};
}

function parseTextData(context, length) {
	const content = context.source.slice(0, length);
	advanceBy(context, length);
	return content;
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

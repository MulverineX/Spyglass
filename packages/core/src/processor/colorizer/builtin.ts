import type {
	AstNode,
	BooleanNode,
	CommentNode,
	ErrorNode,
	FloatNode,
	IntegerNode,
	LiteralBaseNode,
	LiteralNode,
	LongNode,
	ResourceLocationBaseNode,
	ResourceLocationNode,
	StringBaseNode,
	StringNode,
	SymbolBaseNode,
	SymbolNode,
	UnicodeEscapeNode,
} from '../../node/index.js'
import type { MetaRegistry } from '../../service/index.js'
import { Range } from '../../source/index.js'
import { traversePreOrder } from '../util.js'
import type { Colorizer, ColorTokenType } from './Colorizer.js'
import { ColorToken } from './Colorizer.js'

/**
 * Use the shallowest children that have their own colorizers to provide the color tokens.
 */
export const fallback: Colorizer = (node, ctx) => {
	const ans: ColorToken[] = []
	traversePreOrder(
		node as AstNode,
		(node) =>
			!ctx.meta.hasColorizer(node.type)
			&& (!ctx.range || Range.intersects(node.range, ctx.range)),
		(node) => ctx.meta.hasColorizer(node.type),
		(node) => {
			const colorizer = ctx.meta.getColorizer(node.type)
			const result = colorizer(node, ctx)
			ans.push(...result)
		},
	)
	return Object.freeze(ans)
}

export const boolean: Colorizer = (node) => {
	return [ColorToken.create(node, 'literal')]
}

export const comment: Colorizer = (node) => {
	return [ColorToken.create(node, 'comment')]
}

export const error: Colorizer = (node) => {
	// return [ColorToken.create(node, 'error')]
	return []
}

export const literal: Colorizer<LiteralBaseNode> = (node) => {
	return [ColorToken.create(node, node.options.colorTokenType ?? 'literal')]
}

export const number: Colorizer = (node) => {
	return [ColorToken.create(node, 'number')]
}

export const resourceLocation: Colorizer<ResourceLocationBaseNode> = (node, _ctx) => {
	let type: ColorTokenType
	switch (node.options.category) {
		case 'function':
		case 'tag/function':
			type = 'function'
			break
		default:
			type = 'resourceLocation'
			break
	}
	return [ColorToken.create(node, type)]
}

export const string: Colorizer<StringBaseNode> = (node, ctx) => {
	if (node.children) {
		// Ranges occupied by unicode escape children take precedence: any tokens
		// emitted by other children (e.g. the value-parser result, which covers
		// the resolved char at the same source position) must not override the
		// escape's semantic token.
		const escapeRanges = node.children
			.filter(c => c.type === 'unicode_escape')
			.map(c => c.range)
		const overlapsEscape = (r: Range) => escapeRanges.some(er => Range.intersects(er, r))
		// Collect tokens from every child. Children with their own colorizer
		// (e.g. `UnicodeEscapeNode`) get highlighted directly. Children without
		// one (e.g. the value-parser result, like `mcfunction:command`) are
		// traversed with the fallback colorizer so their colorizer-bearing
		// descendants still contribute tokens.
		const tokens: ColorToken[] = []
		for (const child of node.children) {
			if (ctx.meta.hasColorizer(child.type)) {
				tokens.push(...ctx.meta.getColorizer(child.type)(child, ctx))
			} else if (child.children?.length) {
				for (const token of fallback(child, ctx)) {
					if (!overlapsEscape(token.range)) {
						tokens.push(token)
					}
				}
			}
		}
		if (tokens.length) {
			// TODO: Fill the gap between the last token and the ending quote with errors.
			return ColorToken.fillGap(
				tokens.slice().sort((a, b) => a.range.start - b.range.start),
				node.range,
				node.options.colorTokenType ?? 'string',
			)
		}
	}
	return [ColorToken.create(node, node.options.colorTokenType ?? 'string')]
}

export const symbol: Colorizer<SymbolBaseNode> = (node) => {
	// TODO: Set the modifiers according to `node.symbol`.
	return [ColorToken.create(node, 'variable')]
}

export const unicodeEscape: Colorizer<UnicodeEscapeNode> = (node) => {
	const { range, kind } = node
	const tokens: ColorToken[] = []
	if (kind === 'N') {
		if (node.prefixRange!.start < node.prefixRange!.end) {
			tokens.push(ColorToken.create(node.prefixRange!, 'escape'))
		}
		tokens.push(
			ColorToken.create(
				Range.create(node.prefixRange!.end, node.suffixRange!.start),
				'resourceLocation',
			),
		)
		if (node.suffixRange!.start < node.suffixRange!.end) {
			tokens.push(ColorToken.create(node.suffixRange!, 'escape'))
		}
	} else {
		// `\xHH` / `\uHHHH` / `\UHHHHHHHH`; highlight the entire escape as `escape`
		tokens.push(
			ColorToken.create(Range.create(range.start, range.end), 'escape'),
		)
	}
	return tokens
}

export function registerColorizers(meta: MetaRegistry) {
	meta.registerColorizer<BooleanNode>('boolean', boolean)
	meta.registerColorizer<CommentNode>('comment', comment)
	meta.registerColorizer<ErrorNode>('error', error)
	meta.registerColorizer<FloatNode>('float', number)
	meta.registerColorizer<IntegerNode>('integer', number)
	meta.registerColorizer<LongNode>('long', number)
	meta.registerColorizer<LiteralNode>('literal', literal)
	meta.registerColorizer<ResourceLocationNode>('resource_location', resourceLocation)
	meta.registerColorizer<StringNode>('string', string)
	meta.registerColorizer<SymbolNode>('symbol', symbol)
	meta.registerColorizer<UnicodeEscapeNode>('unicode_escape', unicodeEscape)
}

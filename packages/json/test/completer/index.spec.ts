import * as core from '@spyglassmc/core'
import { mockProjectData } from '@spyglassmc/core/test/utils.ts'
import * as mcdoc from '@spyglassmc/mcdoc'
import * as assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { TextDocument } from 'vscode-languageserver-textdocument'
import * as json from '../../lib/index.js'

const lit = (value: string): mcdoc.McdocType => ({
	kind: 'literal',
	value: { kind: 'string', value },
})

/**
 * A struct with a `foo` string field, a `bar` field that only accepts a handful of numbers, and a `baz` string field.
 */
const type: mcdoc.McdocType = {
	kind: 'struct',
	fields: [
		{ kind: 'pair', key: lit('foo'), type: { kind: 'string' } },
		{
			kind: 'pair',
			key: lit('bar'),
			type: {
				kind: 'union',
				members: [1, 2, 3, 4].map(value => ({
					kind: 'literal',
					value: { kind: 'int', value },
				})),
			},
		},
		{ kind: 'pair', key: lit('baz'), type: { kind: 'string' } },
	],
}

/**
 * `::java::util::InclusiveRange<T> = (T | [T] @ 2 | struct ExplicitInclusiveRange { min_inclusive: T, max_inclusive: T })`
 */
const inclusiveRangeAlias: mcdoc.McdocType = {
	kind: 'union',
	members: [
		{ kind: 'reference', path: 'T' },
		{
			kind: 'list',
			item: { kind: 'reference', path: 'T' },
			lengthRange: { kind: 0b00, min: 2, max: 2 },
		},
		{
			kind: 'struct',
			fields: [
				{ kind: 'pair', key: lit('min_inclusive'), type: { kind: 'reference', path: 'T' } },
				{ kind: 'pair', key: lit('max_inclusive'), type: { kind: 'reference', path: 'T' } },
			],
		},
	],
}

/**
 * A struct with a `formats` field that only accepts a list of two pack formats.
 */
const typeWithTemplate: mcdoc.McdocType = {
	kind: 'struct',
	fields: [
		{
			kind: 'pair',
			key: lit('formats'),
			type: {
				kind: 'concrete',
				child: {
					kind: 'template',
					child: { kind: 'reference', path: 'InclusiveRange' },
					typeParams: [{ path: 'T' }],
				},
				typeArgs: [{ kind: 'int', attributes: [{ name: 'pack_format' }] }],
			},
		},
	],
}

/**
 * Parses `content` as a JSON file, checks it against `type`, and returns the completion items at `offset`.
 */
function completeAt(
	content: string,
	offset: number,
	typeDef: mcdoc.McdocType = type,
): core.CompletionItem[] {
	const project = mockProjectData({})
	json.getInitializer()({ meta: project.meta } as any)
	mcdoc.runtime.registerAttribute(project.meta, 'pack_format', () => undefined, {
		numericCompleter: (_, ctx) =>
			[48, 71, 107].map(v => ({
				range: core.Range.create(ctx.offset),
				label: `${v}`,
			})),
	})

	const doc = TextDocument.create('file:///test.json', 'json', 0, content)
	project.symbols.query(doc, 'mcdoc', 'InclusiveRange').enter({
		data: { data: { typeDef: inclusiveRangeAlias } },
		usage: { type: 'definition' },
	})
	const file = json.parser.file(
		new core.Source(content),
		core.ParserContext.create(project, { doc }),
	)
	if (file === core.Failure) {
		throw new Error('Failed to parse the JSON file')
	}
	json.checker.index(typeDef)(file.children[0], core.CheckerContext.create(project, { doc }))

	const ctx = core.CompleterContext.create(project, { doc, offset })
	const child = core.AstNode.findShallowestChild({
		node: file,
		needle: offset,
		endInclusive: true,
		predicate: n => project.meta.hasCompleter(n.type),
	})
	return child ? project.meta.getCompleter(child.type)(child, ctx) : []
}

describe('json completer', () => {
	describe('primitive()', () => {
		it('returns the values of the type definition for an empty value', () => {
			const content = '{ "foo": "test", "bar": , "baz": "funny" }'
			const items = completeAt(content, content.indexOf('"bar": ') + 7)
			assert.deepEqual(items.map(i => i.label), ['1', '2', '3', '4'])
		})

		it('returns the values of the type definition for an empty value not followed by a comma', () => {
			const content = '{ "foo": "test", "bar":  "baz": "funny" }'
			const items = completeAt(content, content.indexOf('"bar": ') + 7)
			assert.deepEqual(items.map(i => i.label), ['1', '2', '3', '4'])
		})

		it('does not suggest a quote pair when the type definition has values', () => {
			const content = '{ "foo": "test", "bar": , "baz": "funny" }'
			const items = completeAt(content, content.indexOf('"bar": ') + 7)
			assert.ok(!items.some(i => i.label === '""'))
		})

		it('suggests a quote pair when there is no type definition', () => {
			const content = '{ "foo": , "baz": "funny" }'
			const items = completeAt(content, content.indexOf('"foo": ') + 7)
			assert.deepEqual(items.map(i => i.label), ['""'])
		})
	})

	describe('array()', () => {
		it('returns the values of the item type for an empty array', () => {
			const content = '{ "formats": [] }'
			const items = completeAt(content, content.indexOf('[]') + 1, typeWithTemplate)
			assert.deepEqual(items.map(i => i.label), ['48', '71', '107'])
		})

		it('returns the values of the item type for an array with a trailing comma', () => {
			const content = '{ "formats": [48, ] }'
			const items = completeAt(content, content.indexOf('48, ]') + 4, typeWithTemplate)
			assert.deepEqual(items.map(i => i.label), ['48', '71', '107'])
		})
	})
})

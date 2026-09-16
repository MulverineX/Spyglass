import * as core from '@spyglassmc/core'
import type { Attribute, McdocType, StructTypePairField, UnionType } from '../../type/index.js'
import type {
	McdocCheckerContext,
	SimplifiedMcdocType,
	SimplifiedMcdocTypeNoUnion,
} from '../checker/index.js'
import type { McdocCompleterContext } from '../completer/index.js'
import type { McdocAttributeValidator } from './validator.js'

export * as validator from './validator.js'

/**
 * The two views of a string node's value that are passed to attribute
 * `stringParser` implementations.
 *
 * - `resolved`: the value with all unicode escapes replaced by their resolved
 *   characters (e.g. `\N{Acute Angle}` → `⦟`). Use this when the attribute
 *   needs the "what the game actually sees" value (resource location lookups,
 *   numeric parsing, etc.).
 * - `unresolved`: the value as it was parsed from the source, with unicode
 *   escape sequences still present as raw text. Use this when the value is
 *   going to be re-parsed recursively by a syntax-aware parser (e.g. the
 *   `command` attribute, where the inner NBT string parser needs to see the
 *   raw escape syntax to re-emit `UnicodeEscapeNode` children).
 */
export interface StringSources {
	resolved: core.Source
	unresolved: core.Source
}

export interface McdocAttribute<C = unknown> {
	checkInferred?: <T>(
		config: C,
		inferred: SimplifiedMcdocTypeNoUnion,
		ctx: McdocCheckerContext<T>,
	) => boolean
	mapType?: <T>(
		config: C,
		typeDef: SimplifiedMcdocType,
		ctx: McdocCheckerContext<T>,
	) => SimplifiedMcdocType
	mapField?: <T>(
		config: C,
		field: StructTypePairField,
		ctx: McdocCheckerContext<T>,
	) => StructTypePairField
	filterElement?: (config: C, ctx: core.ContextBase) => boolean
	stringParser?: <T>(
		config: C,
		typeDef: SimplifiedMcdocTypeNoUnion,
		sources: StringSources,
		ctx: McdocCheckerContext<T>,
	) => core.InfallibleParser<core.AstNode | undefined> | undefined
	checker?: <T>(
		config: C,
		inferred: Exclude<McdocType, UnionType>,
		ctx: McdocCheckerContext<T>,
	) => core.SyncChecker<core.AstNode> | undefined
	stringMocker?: (
		config: C,
		typeDef: core.DeepReadonly<SimplifiedMcdocTypeNoUnion>,
		ctx: McdocCompleterContext,
	) => core.AstNode | undefined
	numericCompleter?: (
		config: C,
		ctx: McdocCompleterContext,
	) => core.CompletionItem[]
}

export function registerAttribute<C extends core.Returnable>(
	meta: core.MetaRegistry,
	name: string,
	validator: McdocAttributeValidator<C>,
	attribute: McdocAttribute<C>,
) {
	meta.registerCustom('mcdoc:attribute', name, { validator, attribute })
}

interface AttributeInfo {
	validator: McdocAttributeValidator<core.Returnable>
	attribute: McdocAttribute
}

export function getAttribute(meta: core.MetaRegistry, name: string) {
	return meta.getCustom<AttributeInfo>('mcdoc:attribute')?.get(name)
}

export function handleAttributes(
	attributes: core.DeepReadonly<Attribute[]> | undefined,
	ctx: core.ContextBase,
	fn: <C>(handler: McdocAttribute<C>, config: C) => void,
) {
	for (const { name, value } of attributes ?? []) {
		const handler = getAttribute(ctx.meta, name)
		if (!handler) {
			continue
		}

		const config = handler.validator(value, ctx)
		if (config === core.Failure) {
			continue
		}
		fn(handler.attribute, config)
	}
}

export function shouldKeepAccordingToAttributeFilters(
	attributes: core.DeepReadonly<Attribute[]> | undefined,
	ctx: core.ContextBase,
) {
	let keep = true
	handleAttributes(attributes, ctx, (handler, config) => {
		if (!keep || !handler.filterElement) {
			return
		}
		if (!handler.filterElement(config, ctx)) {
			keep = false
		}
	})
	return keep
}

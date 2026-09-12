import * as core from '@spyglassmc/core'
import { localize } from '@spyglassmc/locales'
import type {
	NbtBoolFunctionNode,
	NbtByteNode,
	NbtDoubleNode,
	NbtFloatNode,
	NbtFunctionNode,
	NbtIntNode,
	NbtLongNode,
	NbtNumberNode,
	NbtShortNode,
	NbtStringNode,
	NbtUuidFunctionNode,
} from '@spyglassmc/nbt'
import { ReleaseVersion } from '../dependency/common.js'

/** Minimum game version that supports the SNBT additions gated by this step. */
const MIN_NEW_SYNTAX: ReleaseVersion = '1.21.5'

/**
 * Per-checker-call dedup for the underscore-separator info-level
 * diagnostic. The walker used to thread a `state` object through the
 * recursion; without that, a module-level `WeakSet` keyed on the
 * checker context does the same job - and naturally GC's when the
 * context is dropped.
 */
const underscoreNotifiedContexts = new WeakSet<core.CheckerContext>()

function getRelease(ctx: core.CheckerContext): ReleaseVersion | undefined {
	return ctx.project['loadedVersion'] as ReleaseVersion | undefined
}

function isOldSyntax(ctx: core.CheckerContext): boolean {
	const release = getRelease(ctx)
	if (release === undefined) {
		// Version not yet resolved. Skip gating; the mcdoc/runtime checker
		// will surface actual errors regardless.
		return false
	}
	return ReleaseVersion.cmp(release, MIN_NEW_SYNTAX) < 0
}

/**
 * Shared body for the typed number checkers. Reports the
 * `radix-not-supported` error (when `node.radix` is set) and the
 * `underscore-not-supported` info (when `node.hasUnderscoreSeparator` is
 * set), matching the order the old walker used so existing snapshots stay
 * stable.
 */
function checkRadixAndUnderscore(
	node: NbtNumberNode,
	ctx: core.CheckerContext,
	oldSyntax: boolean,
): void {
	if (node.radix !== undefined && oldSyntax) {
		// Catches the typed radix collapses (`0x42b`, `0xffs`, `0b101i`,
		// `0b101f`, `0b101d`). The suffix-less form and the `0x...l` long
		// form are caught by `checkLong`. When the radix branch fires,
		// the old walker used `else if`, so the underscore-separator info
		// below was suppressed for this node - mirror that here to keep
		// existing snapshots stable.
		ctx.err.report(
			localize('nbt.parser.number.radix-not-supported'),
			node,
			core.ErrorSeverity.Error,
		)
		return
	}
	if (node.hasUnderscoreSeparator && oldSyntax && !underscoreNotifiedContexts.has(ctx)) {
		// `1_000_000` is a perfectly valid unquoted string value pre-1.21.5.
		// Therefore, this shouldn't be an error nor a warning - just an info,
		// and only once per file.
		ctx.err.report(
			localize('nbt.parser.number.underscore-not-supported'),
			node,
			core.ErrorSeverity.Information,
		)
		underscoreNotifiedContexts.add(ctx)
	}
}

function reportSnbtFunctionsNotSupported(
	node: NbtFunctionNode,
	ctx: core.CheckerContext,
): void {
	ctx.err.report(
		localize('nbt.parser.function.snbt-functions-not-supported'),
		node.prefixRange,
		core.ErrorSeverity.Error,
	)
}

const checkBoolFunction: core.SyncChecker<NbtBoolFunctionNode> = (node, ctx) => {
	if (isOldSyntax(ctx)) {
		reportSnbtFunctionsNotSupported(node, ctx)
	}
}

const checkUuidFunction: core.SyncChecker<NbtUuidFunctionNode> = (node, ctx) => {
	if (isOldSyntax(ctx)) {
		reportSnbtFunctionsNotSupported(node, ctx)
	}
}

const checkLong: core.SyncChecker<NbtLongNode> = (node, ctx) => {
	// Catches both the suffix-less radix form (`0xff`, `0b101`) and the
	// suffixed long form (`0xffl`, `0b101l`) - both carry the `radix`
	// flag after the nbt:hex/nbt:bin → nbt:long fold. The shared body
	// also handles the underscore-separator info.
	checkRadixAndUnderscore(node, ctx, isOldSyntax(ctx))
}

const checkInt: core.SyncChecker<NbtIntNode> = (node, ctx) => {
	const oldSyntax = isOldSyntax(ctx)
	if (oldSyntax && node.hasExplicitIntSuffix) {
		ctx.err.report(
			localize('nbt.parser.number.explicit-int-suffix-not-supported'),
			node,
			core.ErrorSeverity.Error,
		)
	}
	checkRadixAndUnderscore(node, ctx, oldSyntax)
}

const checkByte: core.SyncChecker<NbtByteNode> = (node, ctx) => {
	checkRadixAndUnderscore(node, ctx, isOldSyntax(ctx))
}

const checkShort: core.SyncChecker<NbtShortNode> = (node, ctx) => {
	checkRadixAndUnderscore(node, ctx, isOldSyntax(ctx))
}

const checkFloat: core.SyncChecker<NbtFloatNode> = (node, ctx) => {
	checkRadixAndUnderscore(node, ctx, isOldSyntax(ctx))
}

const checkDouble: core.SyncChecker<NbtDoubleNode> = (node, ctx) => {
	checkRadixAndUnderscore(node, ctx, isOldSyntax(ctx))
}

const checkString: core.SyncChecker<NbtStringNode> = (node, ctx) => {
	// Source-text heuristics (leading char, negative radix) work equally
	// well against `node.value` when the string came from a JSON-string
	// attach, which is the case where `ctx.src.slice(node.range)` would be
	// wrong.
	if (isOldSyntax(ctx) || node.quote) {
		return
	}
	const v = node.value
	if (/^-0[xXbB]/.test(v)) {
		ctx.err.report(
			localize('nbt.parser.number.negative-radix-not-supported'),
			node,
			core.ErrorSeverity.Error,
		)
	} else if (/^[0-9.+-]/.test(v)) {
		ctx.err.report(
			localize('nbt.parser.string.unquoted-string-first-character'),
			node,
			core.ErrorSeverity.Error,
		)
	}
}

export function register(meta: core.MetaRegistry): void {
	meta.registerChecker<NbtBoolFunctionNode>('nbt:bool_function', checkBoolFunction)
	meta.registerChecker<NbtUuidFunctionNode>('nbt:uuid_function', checkUuidFunction)
	meta.registerChecker<NbtLongNode>('nbt:long', checkLong)
	meta.registerChecker<NbtIntNode>('nbt:int', checkInt)
	meta.registerChecker<NbtByteNode>('nbt:byte', checkByte)
	meta.registerChecker<NbtShortNode>('nbt:short', checkShort)
	meta.registerChecker<NbtFloatNode>('nbt:float', checkFloat)
	meta.registerChecker<NbtDoubleNode>('nbt:double', checkDouble)
	meta.registerChecker<NbtStringNode>('nbt:string', checkString)
}

import { Range } from './Range.js'

/**
 * The pairs should be in ascending order.
 */
export type IndexMap = { outer: Range; inner: Range }[]

export namespace IndexMap {
	function convertOffset(
		map: IndexMap,
		offset: number,
		from: 'inner' | 'outer',
		to: 'inner' | 'outer',
	): number {
		let ans = offset

		for (const pair of map) {
			if (Range.contains(pair[from], offset)) {
				// When inner and outer have the same length (e.g. raw
				// escapes like `\N{...}` that the parser wrote verbatim
				// into the value), preserve the offset within the entry.
				// Otherwise collapse to the start of the entry (kept for
				// length-mismatched entries like `\uHHHH` where the value
				// holds the resolved char).
				const innerLen = pair.inner.end - pair.inner.start
				const outerLen = pair.outer.end - pair.outer.start
				if (innerLen === outerLen) {
					return pair[to].start + (offset - pair[from].start)
				}
				return pair[to].start
			} else if (Range.endsBefore(pair[from], offset)) {
				ans = offset - pair[from].end + pair[to].end
			} else {
				break
			}
		}

		return ans
	}

	export function toInnerOffset(map: IndexMap, offset: number): number {
		return convertOffset(map, offset, 'outer', 'inner')
	}

	export function toInnerRange(map: IndexMap, outer: Range): Range {
		return Range.create(toInnerOffset(map, outer.start), toInnerOffset(map, outer.end))
	}

	export function toOuterOffset(map: IndexMap, offset: number): number {
		return convertOffset(map, offset, 'inner', 'outer')
	}

	export function toOuterRange(map: IndexMap, inner: Range): Range {
		return Range.create(toOuterOffset(map, inner.start), toOuterOffset(map, inner.end))
	}
}

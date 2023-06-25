import { atArray } from '@spyglassmc/core'

export interface GameVersion {
	/**
	 * ID of the version as specified in [`version_manifest.json`](https://piston-meta.mojang.com/mc/game/version_manifest.json).
	 *
	 * @example `1.20-rc1`
	 */
	id: string
	/**
	 * Human-readable name of the version as specified in the game client jar's `version.json` file.
	 *
	 * @example `1.20 Release Candidate 1`
	 */
	name: string
}

export class GameVersionComparator {
	/**
	 * A map from version IDs to their freshness.
	 * 
	 * Freshness: how many versions are released before a vestion.
	 * Larger freshness -> newer version.
	 */
	#freshnessMap: Map<string, number>
	/**
	 * The ID of the latest version.
	 */
	#latestVersion: string

	/**
	 * @param versions Sorted from latest to oldest
	 */
	constructor(versions: readonly GameVersion[]) {
		if (!versions.length) {
			throw new Error('Version list is empty')
		}

		this.#latestVersion = versions[0].id
		this.#freshnessMap = new Map()
		for (const [i, version] of versions.entries()) {
			this.#freshnessMap.set(version.id, versions.length - i - 1)
		}
	}

	/**
	 * @param a `GameVersion` or version ID.
	 * @param b `GameVersion` or version ID.
	 * 
	 * @returns
	 * * Negative if `a` is older than `b`
	 * * 0 if `a` is the same version as `b`
	 * * Positive if `a` is newer than `b`
	 */
	cmp(a: GameVersion | string, b: GameVersion | string): number {
		const [freshnessA, freshnessB] = [a, b].map((v) => {
			const freshness = this.#freshnessMap.get(this.#getId(v))
			if (freshness === undefined) {
				throw new Error(`Unknown version ID '${this.#getId(v)}'`)
			}
			return freshness
		})
		return freshnessA - freshnessB
	}

	/**
	 * @param v `GameVersion` or version ID.
	 * @returns If the version is the latest version.
	 */
	isLatest(v: GameVersion | string): boolean {
		return this.#getId(v) === this.#latestVersion
	}

	#getId(v: GameVersion | string): string {
		return typeof v === 'string' ? v : v.id
	}
}

export interface PackMcmeta {
	pack: {
		pack_format: number
	}
}
export namespace PackMcmeta {
	export function assert(data: any): asserts data is PackMcmeta {
		const format: unknown = data?.pack?.pack_format
		// eslint-disable-next-line no-restricted-syntax
		if (!(typeof format === 'number' && Number.isInteger(format))) {
			throw new Error('Expected pack.pack_format to be an integer ')
		}
	}
}

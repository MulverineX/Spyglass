import { SymbolAccessType } from '@spyglassmc/core'
import { CommandTreePatcherFunction } from '../patch'

export const bossbar: CommandTreePatcherFunction = (patcher) => {
	const base = patcher.branch('bossbar')

	patcher.patch(patcher.branch(base, 'add', 'id'), {
		properties: {
			category: 'bossbar',
			usageType: 'definition',
		},
	})

	const category = {
		properties: {
			category: 'bossbar',
		}
	}
	patcher.patch(patcher.branch(base, 'get', 'id'), category)
	patcher.patch(patcher.branch(base, 'remove', 'id'), category)

	patcher.patch(patcher.branch(base, 'set', 'id'), {
		properties: {
			category: 'bossbar',
			accessType: SymbolAccessType.Write,
		},
	})
}
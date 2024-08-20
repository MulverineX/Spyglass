import { PartialTreeNode } from '@spyglassmc/mcfunction'
import { CommandTreePatcherFunction, getDataPatch } from '../patch'
import { SymbolAccessType } from '@spyglassmc/core'

export const execute: CommandTreePatcherFunction = (patcher) => {
	const base = patcher.branch('execute')

	patcher.patch(patcher.branch(base, 'if'), ExecuteCondition)
	
	patcher.patch(patcher.branch(base, 'unless'), ExecuteCondition)

	const store = patcher.branch(base, 'store')

	patcher.patch(patcher.branch(store, 'result'), ExecuteStoreTarget)

	patcher.patch(patcher.branch(store, 'success'), ExecuteStoreTarget)
}

const ExecuteCondition: PartialTreeNode = Object.freeze({
	children: {
		data: getDataPatch('source', 'path', {
			isPredicate: true,
		}),
		predicate: {
			children: {
				predicate: {
					properties: {
						category: 'predicate',
					},
				},
			},
		},
	},
})

const ExecuteStoreTarget: PartialTreeNode = Object.freeze({
	children: {
		...getDataPatch('target', 'path', {
			nbtAccessType: SymbolAccessType.Write,
			vaultAccessType: SymbolAccessType.Write,
		})
			.children,
		bossbar: {
			children: {
				id: {
					properties: {
						category: 'bossbar',
						accessType: SymbolAccessType.Write,
					},
				},
			},
		},
	},
})
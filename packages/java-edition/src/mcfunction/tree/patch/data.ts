import { SymbolAccessType } from '@spyglassmc/core'
import { CommandTreePatcherFunction, getDataModifySource, getDataPatch } from '../patch'

export const data: CommandTreePatcherFunction = (patcher) => {
	const base = patcher.branch('data')

	patcher.patch(patcher.branch(base, 'get'), getDataPatch('target', 'path'))
	
	patcher.patch(patcher.branch(base, 'merge'), getDataPatch('target', 'nbt', {
		isMerge: true,
		vaultAccessType: SymbolAccessType.Write,
	}))

	patcher.patch(patcher.branch(base, 'remove'), getDataPatch('target', 'path', {
		nbtAccessType: SymbolAccessType.Write,
		vaultAccessType: SymbolAccessType.Write,
	}))

	patcher.patch(patcher.branch(base, 'modify'), getDataPatch('target', 'targetPath', {
		nbtAccessType: SymbolAccessType.Write,
		vaultAccessType: SymbolAccessType.Write,
		children: (type) => ({
			append: getDataModifySource(type, {
				isListIndex: true,
			}),
			insert: {
				children: {
					index: getDataModifySource(type, {
						isListIndex: true,
					}),
				},
			},
			merge: getDataModifySource(type, {
				isMerge: true,
			}),
			prepend: getDataModifySource(type, {
				isListIndex: true,
			}),
			set: getDataModifySource(type),
		}),
	}))
}
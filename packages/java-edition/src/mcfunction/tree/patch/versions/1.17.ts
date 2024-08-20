import { CommandTreePatcherMap, getDataPatch } from '../../patch'

export const patchers: CommandTreePatcherMap = {
	'1.17': (patcher) => {
		if (patcher.since('1.17')) {
            // Added in 20w46a (pack format 7)
			const itemReplace = patcher.branch('item', 'replace')

            const itemReplaceBlockFrom = patcher.branch(itemReplace, 'block', 'pos', 'slot', 'from')

            const itemModifierCategory = {
                properties: {
                    category: 'item_modifier'
                }
            }

            const source = ['source', 'sourceSlot', 'modifier'] as const

            patcher.patch(
                patcher.branch(itemReplaceBlockFrom, 'block', ...source), 
                itemModifierCategory
            )
            patcher.patch(
                patcher.branch(itemReplaceBlockFrom, 'entity', ...source),
                itemModifierCategory
            )

            const itemReplaceEntityFrom = patcher.branch(itemReplace, 'entity', 'targets', 'slot', 'from')

            patcher.patch(
                patcher.branch(itemReplaceEntityFrom, 'block', ...source),
                itemModifierCategory
            )
            patcher.patch(
                patcher.branch(itemReplaceEntityFrom, 'entity', ...source),
                itemModifierCategory
            )

            const itemModify = patcher.branch('item', 'modify')

            patcher.patch(
                patcher.branch(itemModify, 'block', 'pos', 'slot', 'modifier'),
                itemModifierCategory
            )
            patcher.patch(
                patcher.branch(itemModify, 'entity', 'targets', 'slot', 'modifier'),
                itemModifierCategory
            )
		}
	}
}
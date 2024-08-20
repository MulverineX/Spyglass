import { NbtParserProperties } from '../../argument'
import { CommandTreePatcherMap, getDataPatch } from '../../patch'

export const patchers: CommandTreePatcherMap = {
	'1.20.2': (patcher) => {
		if (patcher.since('1.20.2')) {
			const base = patcher.branch('function', 'name')

			patcher.patch(patcher.branch(base, 'arguments'), {
                properties: {
                    dispatcher: 'minecraft:macro_function',
                    dispatchedBy: 'name',
                } satisfies NbtParserProperties,
            })

            patcher.patch(patcher.branch(base, 'with'), getDataPatch('source', 'path'))
		}
	}
}
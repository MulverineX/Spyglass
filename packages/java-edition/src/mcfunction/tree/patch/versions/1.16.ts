import { ReleaseVersion } from '../../../../dependency'
import { CommandTreePatcherMap } from '../../patch'

export const patchers: CommandTreePatcherMap = {
	'1.16': (patcher) => {
		if (patcher.since('1.16')) {
			const root = patcher.branch('attribute', 'target', 'attribute')

			patcher.patch(root, {
				properties: {
					category: 'attribute'
				}
			})

			const modifier = patcher.branch(root, 'modifier')

			const modifierUUID = {
				properties: {
					category: 'attribute_modifier_uuid',
					usageType: 'definition',
				},
			}

			patcher.patch(patcher.branch(modifier, 'add', 'uuid'), modifierUUID)

			patcher.patch(patcher.branch(modifier, 'remove', 'uuid'), modifierUUID)

			patcher.patch(patcher.branch(modifier, 'value', 'get', 'uuid'), modifierUUID)

			if (ReleaseVersion.isBetween(patcher.release, '1.16', '1.19')) {
				// Added in 20w06a (1.16, pack format 5)
				// Removed in 22w19a (1.19, pack format 10)
				patcher.patch(patcher.branch('locatebiome', 'biome'), {
						properties: {
							category: 'worldgen/biome',
							// Allowed in 1.18.2-pre1 (1.18.2, pack format 9)
							allowTag: patcher.since('1.18.2'),
						},
					}
				)
			}
		}
	}
}
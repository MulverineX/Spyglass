import { CommandTreePatcherFunction } from '../patch'

export const permissions: CommandTreePatcherFunction = (patcher) => {
	function setPermission(command: string, permission: 0 | 1 | 2 | 3 | 4) {
		if (patcher.currentPatch.children) {
			patcher.currentPatch.children[command] = { permission }
		}
	}
	setPermission('help', 0)
	setPermission('list', 0)
	setPermission('me', 0)
	setPermission('msg', 0)
	setPermission('teammsg', 0)
	setPermission('tell', 0)
	setPermission('tm', 0)
	setPermission('trigger', 0)
	setPermission('w', 0)

	setPermission('ban', 3)
	setPermission('ban-ip', 3)
	setPermission('banlist', 3)
	setPermission('debug', 3)
	setPermission('deop', 3)
	setPermission('kick', 3)
	setPermission('op', 3)
	setPermission('pardon', 3)
	setPermission('pardon-ip', 3)
	setPermission('setidletimeout', 3)
	setPermission('whitelist', 3)

	setPermission('publish', 4)
	setPermission('save-all', 4)
	setPermission('save-off', 4)
	setPermission('save-on', 4)
	setPermission('stop', 4)

	if (patcher.since('1.20.3')) {
		// Added in 23w43a (pack format 22)
		setPermission('tick', 3)
	}
	if (patcher.since('1.20.5')) {
		// Added in 24w04a (pack format 29)
		setPermission('transfer', 3)
	}
}
/** Readable names of MCP clients that are likely to write entries. */
const NAMES: Record<string, string> = {
  'claude-code': 'Claude Code',
  'claude-ai': 'Claude',
  'claude-desktop': 'Claude Desktop',
  cursor: 'Cursor',
  'cursor-vscode': 'Cursor',
  vscode: 'VS Code',
  windsurf: 'Windsurf',
  zed: 'Zed',
}

/** Client names as stored in `TimeEntry.addedVia`; anything else is not shown. */
const CLIENT = /^[A-Za-z0-9][A-Za-z0-9 ._-]{0,39}$/

/** Display name for an entry's `addedVia`, or null if there is none or it is malformed. */
export function aiClientLabel(addedVia: unknown): string | null {
  if (typeof addedVia !== 'string' || !CLIENT.test(addedVia)) return null
  return NAMES[addedVia.toLowerCase()] ?? addedVia
}

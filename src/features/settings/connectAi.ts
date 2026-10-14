/** The MCP server package the snippets install; kept equal to mcp/package.json by a test. */
export const MCP_PACKAGE = 'workaddict-mcp@1.0.0-beta.1'

/** Placeholder the user replaces with their token; the app never puts a real token in a snippet. */
export const TOKEN_PLACEHOLDER = 'github_pat_…'

export type Shell = 'windows' | 'unix'

/** Sets the variables the plugin's MCP configuration reads, for new terminals. */
export function envCommands(repo: string, shell: Shell): string {
  return shell === 'windows'
    ? [`setx WORKADDICT_REPO "${repo}"`, `setx WORKADDICT_TOKEN "${TOKEN_PLACEHOLDER}"`].join('\n')
    : [
        `echo 'export WORKADDICT_REPO="${repo}"' >> ~/.zshrc`,
        `echo 'export WORKADDICT_TOKEN="${TOKEN_PLACEHOLDER}"' >> ~/.zshrc`,
      ].join('\n')
}

export const PLUGIN_INSTALL = '/plugin install workaddict --marketplace Workaddict/workaddict'

/**
 * Adds the server to Claude Code without the plugin. Native Windows needs `cmd /c` to start npx.
 */
export function claudeMcpAdd(repo: string, shell: Shell): string {
  const npx = shell === 'windows' ? 'cmd /c npx' : 'npx'
  return `claude mcp add workaddict --scope user -e WORKADDICT_REPO=${repo} -e WORKADDICT_TOKEN=${TOKEN_PLACEHOLDER} -- ${npx} -y ${MCP_PACKAGE}`
}

/** `mcpServers` entry for Claude Desktop and other clients configured with JSON. */
export function mcpJson(repo: string): string {
  return JSON.stringify(
    {
      mcpServers: {
        workaddict: {
          command: 'npx',
          args: ['-y', MCP_PACKAGE],
          env: { WORKADDICT_REPO: repo, WORKADDICT_TOKEN: TOKEN_PLACEHOLDER },
        },
      },
    },
    null,
    2,
  )
}

import mcpPackage from '../../../mcp/package.json'
import pluginMcp from '../../../plugin/.mcp.json'
import { claudeMcpAdd, envCommands, MCP_PACKAGE, mcpJson } from './connectAi'

describe('Connect AI snippets', () => {
  it('install the published server version', () => {
    expect(MCP_PACKAGE).toBe(`${mcpPackage.name}@${mcpPackage.version}`)
    expect(pluginMcp.mcpServers.workaddict.args).toContain(MCP_PACKAGE)
  })

  it('fill in the data repository and never a real token', () => {
    expect(envCommands('acme/data', 'windows')).toBe(
      'setx WORKADDICT_REPO "acme/data"\nsetx WORKADDICT_TOKEN "github_pat_…"',
    )
    expect(envCommands('acme/data', 'unix')).toContain(`export WORKADDICT_REPO="acme/data"`)
    expect(claudeMcpAdd('acme/data', 'windows')).toContain('-- cmd /c npx -y workaddict-mcp@')
    expect(claudeMcpAdd('acme/data', 'unix')).toContain('-- npx -y workaddict-mcp@')
    expect(JSON.parse(mcpJson('acme/data')).mcpServers.workaddict.env).toEqual({
      WORKADDICT_REPO: 'acme/data',
      WORKADDICT_TOKEN: 'github_pat_…',
    })
  })
})

import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'
import { readConfig } from './config'
import { ConnectError, connect } from './connect'
import { createServer } from './server'

// stdout carries the MCP protocol; anything else goes to stderr.
const config = await readConfig(process.env)
if (!config.ok) console.error(`workaddict-mcp: ${config.error}`)

const server = createServer(async (client) => {
  if (!config.ok) throw new ConnectError(config.error)
  return connect(config.config, client)
})
await server.connect(new StdioServerTransport())

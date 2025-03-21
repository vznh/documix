# Documix - MCP

This feature addition is intended to be compatible for Claude Desktop. Running this MCP server allows you to place a URL within your chat context to assist from complete documentation.
You can find a live demo of this working [here]().

## Prerequisites
- Node.js 18+ and npm/yarn/pnpm/bun/..
- API keys for OpenAI or Groq

## Setup
Getting started with Documix in your Claude Desktop can be detailed below.
1. In your `~/Library/Application Support/Claude/claude_desktop_config.json`, add this to the already existent config:
```
{
  "mcpServers": {
    "documix-mcp-server": {
      "command": "node",
      "args": [

        "/Users/<your-user>/<installation-folder>/documix/mcp/build/index.js"
      ]
    }
  }
}
```

2. Compile Documix using the build method for your specific package manager.
For this example, we'll be using [bun](https://bun.dev).
`bun run build` and should output nothing to indicate success.

3. Restart your Claude Desktop; everything should be set up and you can use Documix in your repository context!

## Guide
You can pack your desired documentation through variations of the prompt below within your request to Claude.
```
Please pack this repository [? with compress] [? only specific content][? pages to avoid] in Documix.
https://modelcontextprotocol.io/
```

Claude should be now able to understand all that the provided docs provided. Some use-cases are:
- reading you a high-level overview of what this documentation covers
- explaining the architecture & main components of the content provided
- any key technologies / necessities which are needed prior to using this tech
- highlighting any best practices that the documentation requires you to follow
- summarizing main sections of the docs & their functions at a collapsed view
- noting any gaps within documentation that could be improved / lacks context

For more MCP details, please refer to the documentation:
[https://modelcontextprotocol.io](https://modelcontextprotocol.io)

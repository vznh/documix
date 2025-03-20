// mcpServer.ts
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { registerDocumixInitializationPrompt } from "./prompts/registerDocumixInitializationPrompt.js";
import { registerPackDocumentationTool } from "./tools/packDocumentationTool.js";
// tools...

export const createMcpServer = async () => {
  const mcpServer = new McpServer({
    name: "documix-mcp-server",
    version: "1"
  });

  registerDocumixInitializationPrompt(mcpServer);

  registerPackDocumentationTool(mcpServer);
  // .. and more?

  return mcpServer;
}

export const runMcpServer = async () => {
  const server = await createMcpServer();
  const transport = new StdioServerTransport();
  const processExit = process.exit;

  const handleExit = async () => {
    try {
      await server.close();
      console.error("* Documix MCP server closure completed successfully!");
      processExit(0);
    } catch (error) {
      console.error("* Error during MCP server closure: ", error);
    }
  }

  process.on('SIGINT', handleExit);
  process.on('SIGTERM', handleExit);

  try {
    await server.connect(transport);
    //
  } catch (error) {
    console.error("* Failed to start MCP server. Error: ", error);
    processExit(0);
  }
};

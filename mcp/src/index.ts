// index.ts
import { runMcpServer } from "./mcpServer";

const runMcpAction = async (): Promise<void> => {
  console.error("+ Starting Documix MCP server...");
  await runMcpServer();
}

const main = async () => {
  await runMcpAction();
}

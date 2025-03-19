// registerDocumixInitializationPrompt.ts
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";

export const registerDocumixInitializationPrompt = (mcpServer: McpServer) => {
  mcpServer.prompt(
    'do_function_here',
    'Pack any webpage documentation repository for analysis',
    {
      docs: z.string().describe("The webpage URL (e.g. https://example.com/docs)"),
      includePatterns: z
        .string()
        .optional()
        .describe("Comma-separated list of patterns to include in the analysis."),
      ignorePatterns: z
        .string()
        .optional()
        .describe("Comma-separated list of patterns to exclude from the analysis."),
    },
    async ({ docs, includePatterns, ignorePatterns }) => {
      return {
        messages: [
          {
            role: 'user',
            content: {
              type: 'text',
              text: `Please analyze the documentation at ${docs}.
First, use the do_function_here tool with these parameters:

Once you have the documentation analyzed:
1. Give me a high-level overview of what this documentation covers.
2. Explain the architecture and main components of the system/product described.
3. Identify the key technologies and features documented.
4. Highlight any interesting patterns, best practices, or design decisions mentioned.
5. Summarize the main sections of the documentation and what information each provides.
6. Note any gaps within the documentation that could be improved.

Please be thorough with your analysis.`
            },
          },
        ],
      };
    },
  );
};

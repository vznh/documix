// packDocumentationTool.ts
import { z } from 'zod';
import path from 'node:path';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { createToolWorkspace, formatToolError, formatToolResponse } from './mcpToolRuntime.js';

export const registerPackDocumentationTool = (mcpServer: McpServer) => {
  mcpServer.tool(
    'pack_documentation',
    'Fetch, read, and package documentation into a consolidated file for optimal AI analysis.',
    {
      url: z
        .string()
        .describe(''),
      compress: z
        .boolean()
        .default(true)
        .describe(
          'idk'
        ),
      includePatterns: z
        .string()
        .optional()
        .describe(
          ''
        ),
      ignorePatterns: z
        .string()
        .optional()
        .describe(
          ''
        ),
    },
    async ({ url, compress, includePatterns, ignorePatterns }): Promise<CallToolResult> => {
      let tempDir = '';

      try {
        tempDir = await createToolWorkspace();
        const outputFilePath = path.join(tempDir, 'documix-output.xml');

        // do action here to pack repo
        const result = '';
        if (!result) {
          return {
            isError: true,
            content: [
              {
                type: 'text',
                text: 'Failed to return a result. Did you place a valid documentation URL?'
              },
            ],
          };
        }

        // our pack info!
        const { packResult } = result;

        return formatToolResponse({ url: url }, packResult, outputFilePath);
      } catch (error) {
        return formatToolError(error);
      }
    }
  )
}

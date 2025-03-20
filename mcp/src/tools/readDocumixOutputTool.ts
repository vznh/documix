// readDocumixOutputTool.ts
import fs from 'node:fs/promises';
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { z } from 'zod';
import { getOutputFilePath } from './mcpToolRuntime.js';

export const registerReadDocumixOutputTool = (mcpServer: McpServer) => {
  mcpServer.tool(
    'read_documix_output',
    'Read the contents of a Documix output file in environments where direct file access is not possible. This tool is specifically intended for cases where the client cannot access the file system directly, such as in web-based environments or sandboxed applications. For systems where direct file access is possible, use standard file operations instead.',
    {
      outputId: z.string().describe('ID of the Documix output file to read'),
    },
    async ({ outputId }): Promise<CallToolResult> => {
      try {
        console.error(`+ Reading Documix output with ID: ${outputId}`);

        const filePath = getOutputFilePath(outputId);
        if (!filePath) {
          return {
            isError: true,
            content: [
              {
                type: 'text',
                text: `* Error: Output file with ID ${outputId} was not found. Has the output file been accidentally deleted or is the ID invalid?`
              },
            ],
          };
        }

        try {
          await fs.access(filePath);
        } catch (error) {
          return {
            isError: true,
            content: [
              {
                type: 'text',
                text: `* Error: Output file does not exist at path: ${filePath}. Has the temporary file been evicted too early?`
              },
            ],
          };
        }

        const content = await fs.readFile(filePath, 'utf8');

        return {
          content: [
            {
              type: 'text',
              text: content,
            },
          ],
        };
      } catch (error) {
        console.error(`* Error reading Documix output. Error: ${error}`);
        return {
          isError: true,
          content: [
            {
              type: 'text',
              text: `* Error reading Documix output. Error: ${error instanceof Error ? error.message : String(error)}`
            }
          ],
        };
      }
    },
  );
};

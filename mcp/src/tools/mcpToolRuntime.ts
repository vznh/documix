// mcpToolRuntime.js
import crypto from 'crypto';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import type { CallToolResult } from '@modelcontextprotocol/sdk/types.js';

const outputFileRegistry = new Map<string, string>();

export interface McpToolMetrics {
  totalCharacters: number;
  totalTokens: number;
}

export interface McpToolContext {
  url: string;
}

export interface formatToolResponse {
  url: string;
}

export const createToolWorkspace = async (): Promise<string> => {
  try {
    const tempBaseDir = path.join(os.tmpdir(), 'documix', 'mcp-outputs');
    await fs.mkdir(tempBaseDir, { recursive: true });
    return await fs.mkdtemp(`${tempBaseDir}/`);
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    throw new Error(`Failed to create tempdir. Error: ${msg}`);
  }
};

export const registerOutputFile = (id: string, filePath: string) => outputFileRegistry.set(id, filePath);

export const getOutputFilePath = (id: string): string | undefined => { return outputFileRegistry.get(id) };

export const generateOutputId = (): string => {
  return crypto.randomBytes(16).toString('hex');
};

export const formatToolResponse = (
  ctx: McpToolContext,
  metrics: McpToolMetrics,
  outputFilePath: string
): CallToolResult => {
  // registration
  const outputId = generateOutputId();
  registerOutputFile(outputId, outputFilePath);

  const jsonResult = JSON.stringify(
    {
      url: ctx.url,
      outputFilePath,
      outputId,
      metrics: {
        totalCharacters: metrics.totalCharacters,
        totalTokens: metrics.totalTokens,
      },
    },
    null,
    2
  );

  return {
    content: [
      {
        type: 'text',
        text: "🎉 Successfully analyzed documentation!\nPlease review the metrics below."
      },
      {
        type: 'text',
        text: jsonResult,
      },
      {
        type: 'resource',
        resource: {
          text: "Documix - Output File",
          uri: `file://${outputFilePath}`,
          mimeType: 'application/xml'
        }
      },
      {
        type: 'text',
        text: `For environments without directory support, you can use the read_documix_output tool with this outputId: ${outputId} to access the analysis results.`
      },
    ],
  };
};

export const formatToolError = (error: unknown): CallToolResult => {
  console.error(`* Error in tool: ${error instanceof Error ? error.message : String(error)}`);

  return {
    isError: true,
    content: [
      {
        type: 'text',
        text: JSON.stringify(
          {
            success: false,
            error: error instanceof Error ? error.message : String(error),
          },
          null,
          2,
        ),
      },
    ],
  };
};

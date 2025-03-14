import { UpstashVectorStore } from "@langchain/community/vectorstores/upstash";
import { Index } from "@upstash/vector";
import { OllamaEmbeddings } from "@langchain/ollama";
import { NextRequest } from "next/server";
import type { Document } from "@langchain/core/documents";
import short from "short-uuid";
import { NextResponse } from "next/server";
import { EmbeddedContentItem } from "@/lib/types";

export async function POST(req: NextRequest) {
  const embeddingModel = req.nextUrl.searchParams.get("model");
  const { contentItems } = await req.json();
  const MAX_CONTENT_LENGTH = 2048; // Reduced from 8000 to prevent context length issues

  try {
    const index = new Index({
      url: process.env.NEXT_PUBLIC_UPSTASH_VECTOR_URL_768,
      token: process.env.UPSTASH_VECTOR_TOKEN_768,
    });

    const embeddings = new OllamaEmbeddings({
      model: embeddingModel || "nomic-embed-text",
      baseUrl: "http://localhost:11434",
    });

    const vectorStore = new UpstashVectorStore(embeddings, {
      index,
    });

    let updatedContentItems: EmbeddedContentItem[] = [];

    for (const contentItem of contentItems) {
      try {
        // If content is too long, split it into chunks
        if (contentItem.content.length > MAX_CONTENT_LENGTH) {
          const chunks = [];
          for (
            let i = 0;
            i < contentItem.content.length;
            i += MAX_CONTENT_LENGTH
          ) {
            chunks.push(
              contentItem.content.substring(i, i + MAX_CONTENT_LENGTH),
            );
          }

          // Process chunks in batches to avoid overwhelming the embedding model
          for (let i = 0; i < chunks.length; i++) {
            const document: Document = {
              pageContent: chunks[i],
              metadata: {
                url: contentItem.url,
                title: `${contentItem.title} (part ${i + 1}/${chunks.length})`,
                id: short.generate(),
                chunkIndex: i,
                totalChunks: chunks.length,
              },
            };

            await vectorStore.addDocuments([document], {
              ids: [document.metadata.id],
            });

            // Add a small delay between chunks to avoid rate limiting
            if (i < chunks.length - 1) {
              await new Promise((resolve) => setTimeout(resolve, 100));
            }
          }
        } else {
          // Handle normal-sized content
          const document: Document = {
            pageContent: contentItem.content,
            metadata: {
              url: contentItem.url,
              title: contentItem.title,
              id: short.generate(),
            },
          };

          await vectorStore.addDocuments([document], {
            ids: [document.metadata.id],
          });
        }

        updatedContentItems.push({ ...contentItem, embedded: true });
      } catch (error) {
        console.error(`Error embedding item ${contentItem.url}:`, error);
        // Still include the item but mark as not embedded
        updatedContentItems.push({ ...contentItem, embedded: false });
      }
    }

    return new Response(JSON.stringify(updatedContentItems), { status: 200 });
  } catch (error: any) {
    console.error("Embedding error:", error);
    return new NextResponse(JSON.stringify({ error: error.message }), {
      status: 500,
    });
  }
}

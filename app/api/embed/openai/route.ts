import { UpstashVectorStore } from "@langchain/community/vectorstores/upstash";
import { Index } from "@upstash/vector";
import { OpenAIEmbeddings } from "@langchain/openai";
import { NextRequest } from "next/server";
import type { Document } from "@langchain/core/documents";
import short from "short-uuid";
import { NextResponse } from "next/server";
import { EmbeddedContentItem } from "@/lib/types";

export async function POST(req: NextRequest) {
  try {
    const requestData = await req.json();
    const { contentItems, embeddingModel } = requestData;
    const apiKey = req.headers.get("Authorization")?.replace("Bearer ", "");
    const MAX_CONTENT_LENGTH = 2048; // Reduced from 8000 to avoid token limits

    const index = new Index({
      url: process.env.NEXT_PUBLIC_UPSTASH_VECTOR_URL_1536,
      token: process.env.UPSTASH_VECTOR_TOKEN_1536,
    });
    const embeddings = new OpenAIEmbeddings({
      model: embeddingModel || "text-embedding-ada-002",
      apiKey: apiKey,
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

          // Create a document for each chunk
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
        updatedContentItems.push({ ...contentItem, embedded: false });
      }
    }

    return new Response(JSON.stringify(updatedContentItems), { status: 200 });
  } catch (error: any) {
    console.error("OpenAI embedding error:", error);
    return new NextResponse(JSON.stringify({ error: error.message }), {
      status: 500,
    });
  }
}

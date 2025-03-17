import { groq, createGroq } from "@ai-sdk/groq";
import { convertToCoreMessages, streamText } from "ai";
import { NextRequest } from "next/server";
import { Index } from "@upstash/vector";
import type { Document } from "@langchain/core/documents";
import { UpstashVectorStore } from "@langchain/community/vectorstores/upstash";
import { OllamaEmbeddings } from "@langchain/ollama";
import { NextResponse } from "next/server";

// Allow streaming responses up to 30 seconds
export const maxDuration = 30;

export async function POST(req: NextRequest) {
  // Log the entire request body to see its structure
  const requestData = await req.json();
  const url = new URL(req.url);
  const userId = url.searchParams.get("userId");
  const modelName = url.searchParams.get("model");
  const embeddingProvider = url.searchParams.get("embeddingProvider");
  const embeddingModel = url.searchParams.get("embeddingModel");
  if (!userId) {
    return NextResponse.json({ error: "No user id provided" }, { status: 500 });
  }

  const apiKey = req.headers.get("Authorization")?.replace("Bearer ", "");
  // Based on your logs, it looks like messages are directly in the request body
  const { messages, tools } = requestData;

  const embeddings = new OllamaEmbeddings({
    model: embeddingModel || "nomic-embed-text",
  });
  const index = new Index({
    url:
      embeddingProvider === "openai"
        ? process.env.NEXT_PUBLIC_UPSTASH_VECTOR_URL_1536 || ""
        : process.env.NEXT_PUBLIC_UPSTASH_VECTOR_URL_768 || "",
    token:
      embeddingProvider === "openai"
        ? process.env.UPSTASH_VECTOR_TOKEN_1536 || ""
        : process.env.UPSTASH_VECTOR_TOKEN_768 || "",
  });

  const store = await UpstashVectorStore.fromExistingIndex(embeddings, {
    index,
  });
  const retriever = store.asRetriever({ filter: `userId = '${userId}'`, k: 3 });

  const lastMessage = messages[messages.length - 1];

  let retrievedDocs: Document[] = [];
  if (lastMessage && lastMessage.content) {
    // Extract text content safely
    const queryText = Array.isArray(lastMessage.content)
      ? lastMessage.content
          .map((item: any) =>
            typeof item === "string" ? item : item.text || "",
          )
          .join(" ")
      : lastMessage.content.toString();

    try {
      retrievedDocs = await retriever.invoke(queryText);
      console.log("Retrieved docs:", retrievedDocs.length);
    } catch (error) {
      console.error("Error retrieving docs:", error);
      // Continue without retrieved docs if there's an error
    }
  }

  const groq = createGroq({ apiKey: apiKey });
  const model = groq(modelName || "llama-3.3-70b-versatile");
  // Prepare context from retrieved documents
  let contextText = "";
  if (retrievedDocs && retrievedDocs.length > 0) {
    contextText = retrievedDocs
      .map(
        (doc, index) =>
          `Document ${doc.metadata.url}:\n${doc.pageContent}\nSource: ${doc.metadata.url || "Unknown"}\n`,
      )
      .join("\n");
  }

  const result = streamText({
    model,
    messages: convertToCoreMessages(messages),
    temperature: 0.7,
    system:
      retrievedDocs && retrievedDocs.length > 0
        ? `You have access to the following retrieved context documents. If the query has no apparent relevance to the retrieved context documents, answer normally. If it does have relevance, cite sources using [Source: URL] format when referencing specific information.\n\n${contextText}`
        : undefined,
  });

  return result.toDataStreamResponse();
}

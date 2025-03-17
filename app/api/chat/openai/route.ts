import { createOpenAI } from "@ai-sdk/openai";
import { convertToCoreMessages, streamText } from "ai";
import { NextRequest } from "next/server";
import { Index } from "@upstash/vector";
import type { Document } from "@langchain/core/documents";
import { UpstashVectorStore } from "@langchain/community/vectorstores/upstash";
import { OllamaEmbeddings } from "@langchain/ollama";

// Allow streaming responses up to 30 seconds
export const maxDuration = 30;

export async function POST(req: NextRequest) {
  // Get data from request body and query params
  const requestData = await req.json();
  const url = new URL(req.url);
  const modelName = url.searchParams.get("model") || "gpt-4o";
  const embeddingProvider = url.searchParams.get("embeddingProvider");
  const embeddingModel = url.searchParams.get("embeddingModel");
  const userId = url.searchParams.get("userId");
  const apiKey = req.headers.get("Authorization")?.replace("Bearer ", "");
  const { messages, tools } = requestData;

  // Set up embeddings with timeout
  const embeddings = new OllamaEmbeddings({
    model: "nomic-embed-text",
  });

  // Configure vector store based on embedding provider
  const index = new Index({
    url:
      embeddingProvider === "openai"
        ? process.env.NEXT_PUBLIC_UPSTASH_VECTOR_URL_1536 || ""
        : process.env.NEXT_PUBLIC_UPSTASH_VECTOR_URL_768 || "",
    token:
      embeddingProvider === "openai"
        ? process.env.NEXT_PUBLIC_UPSTASH_VECTOR_TOKEN_1536 || ""
        : process.env.NEXT_PUBLIC_UPSTASH_VECTOR_TOKEN_768 || "",
  });

  // Initialize vector store and retriever
  const store = await UpstashVectorStore.fromExistingIndex(embeddings, {
    index,
  });
  const retriever = store.asRetriever({ filter: `userId = '${userId}'`, k: 3 });

  // Get the last message for retrieval
  const lastMessage = messages[messages.length - 1];

  // Retrieve relevant documents based on the last message
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

  // Log diagnostic information
  console.log("Messages:", messages ? messages.length : "undefined");
  console.log("API Key present:", !!apiKey);
  console.log("Model Name:", modelName || "undefined");
  console.log("Retrieved docs count:", retrievedDocs.length);

  // Prepare context from retrieved documents
  let contextText = "";
  if (retrievedDocs && retrievedDocs.length > 0) {
    contextText = retrievedDocs
      .map(
        (doc, index) =>
          `Document ${index + 1}:\n${doc.pageContent}\nSource: ${doc.metadata.source || "Unknown"}\n`,
      )
      .join("\n");
  }

  // Set up OpenAI client
  const openai = createOpenAI({ apiKey });

  // Stream response
  const result = streamText({
    model: openai(modelName),
    messages: convertToCoreMessages(messages),
    temperature: 0.7,
    system:
      retrievedDocs && retrievedDocs.length > 0
        ? `You have access to the following retrieved context documents. When answering, cite sources using [Source: URL] format when referencing specific information.\n\n${contextText}`
        : undefined,
  });

  return result.toDataStreamResponse();
}

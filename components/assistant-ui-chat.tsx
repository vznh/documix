"use client";

import { AssistantRuntimeProvider } from "@assistant-ui/react";
import { useChatRuntime } from "@assistant-ui/react-ai-sdk";
import { useState, useCallback, useMemo, useEffect } from "react";
import { ThreadList } from "@/components/assistant-ui/thread-list";
import { Thread } from "@/components/assistant-ui/thread";
import { ModelConfiguration } from "@/components/configuration";
import EmbeddingInfoComponent from "./embedding-info";
import { UpstashVectorStore } from "@langchain/community/vectorstores/upstash";
import { OllamaEmbeddings } from "@langchain/ollama";
import { OpenAIEmbeddings } from "@langchain/openai";
import { configurationStore } from "@/lib/stores";
import { Index } from "@upstash/vector";
import { VectorStoreRetriever } from "@langchain/core/vectorstores";
import { DocumentInterface } from "@langchain/core/documents";
import { Button } from "./ui/button";

const ChatComponent = () => {
  // 1. First useState hook - always called first
  const { provider, openAiAPIKey, groqAPIKey, modelName } =
    configurationStore();
  const [vectorStore, setVectorStore] = useState<UpstashVectorStore | null>(
    null,
  );
  const [retriever, setRetriever] = useState<VectorStoreRetriever | null>(null);
  const { embeddingModel, embeddingProvider } = configurationStore();

  // const getBodyData = async (messages: any, tools: any) => {
  //   // Extract the user's last query from messages
  //   console.log("getBodyData called with messages:", messages.length);
  //   alert("get body data called");
  //   const lastUserMessage = messages
  //     .filter((msg: any) => msg.role === "user")
  //     .pop();

  //   let contextDocs: DocumentInterface[] = [];

  //   // Access vectorStore from component state
  //   if (vectorStore && lastUserMessage?.content) {
  //     try {
  //       // Get relevant documents for the user's query
  //       contextDocs = (await retriever?.invoke(lastUserMessage)) || [];

  //       console.log(
  //         "Retrieved context documents:",
  //         contextDocs.map((doc: any) => ({
  //           title: doc.metadata?.title,
  //           url: doc.metadata?.url,
  //         })),
  //       );
  //     } catch (error) {
  //       console.error("Error retrieving context:", error);
  //     }
  //   }

  //   // Prepare augmented messages with context if available
  //   let augmentedMessages = [...messages];

  //   if (contextDocs.length > 0) {
  //     const contextMessage = {
  //       role: "system",
  //       content: `Here is some relevant information to help answer the user's query:\n\n${contextDocs
  //         .map(
  //           (doc: any) =>
  //             `DOCUMENT: ${doc.metadata?.title || "Untitled"}\nSOURCE: ${doc.metadata?.url || "Unknown"}\nCONTENT: ${doc.pageContent}\n\n`,
  //         )
  //         .join(
  //           "",
  //         )}Please use this information to provide an accurate and helpful response.`,
  //     };

  //     augmentedMessages = [
  //       ...messages.slice(0, -1),
  //       contextMessage,
  //       messages[messages.length - 1],
  //     ];
  //   }

  //   // Access configuration values from your store/state

  //   // Ensure you're accessing API keys properly
  //   const currentProvider = provider || "groq"; // Provide a fallback
  //   const currentModelName =
  //     modelName || provider == "openai"
  //       ? "gpt-4o-mini"
  //       : "llama-3.3-70b-versatile"; // Provide a fallback
  //   const apiKey = provider == "openai" ? openAiAPIKey : groqAPIKey;

  //   console.log("Using model:", currentModelName);
  //   console.log("Using provider:", currentProvider);
  //   console.log("API key defined:", !!apiKey); // Log if key exists, not the actual key

  //   // Return the final data for the chat API
  //   return {
  //     messages: augmentedMessages,
  //     tools,
  //     modelName: currentModelName,
  //     apiKey: apiKey,
  //     retrievedDocs: contextDocs, // Include the docs in case needed elsewhere
  //   };
  // };
  //
  const getBodyData = (messages: any, tools: any) => {
    console.log(modelName, provider == "openai" ? openAiAPIKey : groqAPIKey);
    return {
      messages,
      tools,
      modelName: modelName,
      apiKey: provider == "openai" ? openAiAPIKey : groqAPIKey,
    };
  };

  const getConfigData = () => {
    console.log(modelName, provider == "openai" ? openAiAPIKey : groqAPIKey);
  };

  useEffect(() => {
    const initializeVectorStore = async () => {
      try {
        const createEmbeddings = (() => {
          if (embeddingProvider === "openai") {
            return new OpenAIEmbeddings({
              apiKey: configurationStore.getState().openAiAPIKey,
              model: embeddingModel,
            });
          } else {
            return new OllamaEmbeddings({
              model: embeddingModel,
              baseUrl: "http://localhost:11434",
            });
          }
        })();

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

        const store = await UpstashVectorStore.fromExistingIndex(
          createEmbeddings,
          {
            index,
          },
        );
        setVectorStore(store);
        const retriever = store.asRetriever({ filter: "", k: 3 });
        setRetriever(retriever);
      } catch (error) {
        console.error("Failed to initialize vector store:", error);
      }
    };

    initializeVectorStore();
  }, [embeddingModel, embeddingProvider]);

  const runtime = useChatRuntime({
    api:
      provider == "openai"
        ? `/api/chat/openai?model=${modelName}&embeddingProvider=${embeddingProvider}&embeddingModel=${embeddingModel}`
        : `/api/chat/groq?model=${modelName}&embeddingProvider=${embeddingProvider}&embeddingModel=${embeddingModel}`,
    headers: {
      Authorization: `Bearer ${provider == "openai" ? openAiAPIKey : groqAPIKey}`,
    },
    body: getBodyData,
  });

  return (
    <AssistantRuntimeProvider runtime={runtime}>
      <div className="grid h-screen grid-cols-[200px_1fr] gap-x-2 px-4 py-4">
        <div className="flex flex-col">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-medium">Chats</h2>
            <ModelConfiguration />
          </div>

          <ThreadList />
        </div>
        <Thread />
      </div>
    </AssistantRuntimeProvider>
  );
};

export default ChatComponent;

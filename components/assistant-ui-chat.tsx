"use client";

import { AssistantRuntimeProvider } from "@assistant-ui/react";
import { useChatRuntime } from "@assistant-ui/react-ai-sdk";
import { useState, useCallback, useMemo, useEffect } from "react";
import { ThreadList } from "@/components/assistant-ui/thread-list";
import { Thread } from "@/components/assistant-ui/thread";
import { ModelConfiguration } from "@/components/configuration";
import { UpstashVectorStore } from "@langchain/community/vectorstores/upstash";
import { OllamaEmbeddings } from "@langchain/ollama";
import { OpenAIEmbeddings } from "@langchain/openai";
import { configurationStore } from "@/lib/stores";
import { Index } from "@upstash/vector";
import { VectorStoreRetriever } from "@langchain/core/vectorstores";

const ChatComponent = () => {
  // Get configuration from store
  const { provider, openAiAPIKey, groqAPIKey, modelName } =
    configurationStore();
  const { embeddingModel, embeddingProvider } = configurationStore();

  const getBodyData = (messages: any, tools: any) => {
    console.log(modelName, provider == "openai" ? openAiAPIKey : groqAPIKey);
    return {
      messages,
      tools,
      modelName: modelName,
      apiKey: provider == "openai" ? openAiAPIKey : groqAPIKey,
    };
  };

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
    <div className="h-[calc(70vh)] flex flex-col">
      <AssistantRuntimeProvider runtime={runtime}>
        <div className="grid h-full grid-cols-[200px_1fr] gap-x-2 px-4 py-4 overflow-hidden">
          <div className="flex flex-col overflow-hidden">
            <div className="flex justify-between items-center mb-2">
              <h2 className="text-lg font-medium">Chats</h2>
              <ModelConfiguration />
            </div>

            <div className="overflow-y-auto flex-grow">
              <ThreadList />
            </div>
          </div>
          
          <div className="overflow-hidden flex flex-col">
            <Thread />
          </div>
        </div>
      </AssistantRuntimeProvider>
    </div>
  );
};

export default ChatComponent;

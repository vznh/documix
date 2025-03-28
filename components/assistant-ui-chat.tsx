"use client";

import { AssistantRuntimeProvider } from "@assistant-ui/react";
import { useChatRuntime } from "@assistant-ui/react-ai-sdk";
import { ThreadList } from "@/components/assistant-ui/thread-list";
import { Thread } from "@/components/assistant-ui/thread";
import { ModelConfiguration } from "@/components/configuration";
import { configurationStore } from "@/lib/stores";

interface ChatProps {
  userId?: string;
}
const ChatComponent = ({ userId }: ChatProps) => {
  // Get configuration from store
  const { provider, openAiAPIKey, groqAPIKey, modelName } =
    configurationStore();
  const { embeddingModel, embeddingProvider } = configurationStore();

  const getBodyData = (messages: any, tools: any) => {
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
        ? `/api/chat/openai?model=${modelName}&embeddingProvider=${embeddingProvider}&embeddingModel=${embeddingModel}&userId=${userId}`
        : `/api/chat/groq?model=${modelName}&embeddingProvider=${embeddingProvider}&embeddingModel=${embeddingModel}&userId=${userId}`,
    headers: {
      Authorization: `Bearer ${provider == "openai" ? openAiAPIKey : groqAPIKey}`,
    },
    body: (messages: any, tools: any) => {
      // Format messages to ensure no empty content arrays
      const formattedMessages = messages.map((msg) => {
        if (Array.isArray(msg.content) && msg.content.length === 0) {
          return {
            ...msg,
            content: [{ type: "text", text: " " }], // Add a space as minimal content
          };
        }
        return msg;
      });

      return {
        messages: formattedMessages,
        tools,
        modelName,
        apiKey: provider === "openai" ? openAiAPIKey : groqAPIKey,
      };
    },
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

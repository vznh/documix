"use client";
import { useState, useCallback } from "react";
import { AssistantRuntimeProvider } from "@assistant-ui/react";
import { useChatRuntime } from "@assistant-ui/react-ai-sdk";
import { ThreadList } from "@/components/assistant-ui/thread-list";
import { Thread } from "@/components/assistant-ui/thread";

export const MyApp = () => {
  const [error, setError] = useState<string | null>(null);

  // Error handling function
  const handleError = useCallback((err: any) => {
    console.error("Chat runtime error:", err);
    setError(err?.message || "An error occurred in the chat");
  });
  const runtime = useChatRuntime({
    api: "/api/chat/test",
    onError: handleError,
  });

  return (
    <AssistantRuntimeProvider runtime={runtime}>
      {error && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg max-w-md">
            <h3 className="text-lg font-bold text-red-600 mb-2">Error</h3>
            <p className="mb-4">{error}</p>
            <button
              className="px-4 py-2 bg-blue-500 text-white rounded"
              onClick={() => setError(null)}
            >
              Dismiss
            </button>
          </div>
        </div>
      )}
      <div className="grid h-dvh grid-cols-[200px_1fr] gap-x-2 px-4 py-4">
        <ThreadList />
        <Thread />
      </div>
    </AssistantRuntimeProvider>
  );
};

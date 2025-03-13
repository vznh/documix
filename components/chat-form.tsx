"use client";

import { useState, useEffect, useCallback } from "react";
import { cn } from "@/lib/utils";
import { ArrowUpIcon, Clipboard, Link, Settings, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { AutoResizeTextarea } from "@/components/autoresize-textarea";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import EmbeddingInfoComponent from "./embedding-info";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "./ui/scroll-area";
import ChatComponent from "./assistant-ui-chat";
import { EmbeddedContentItem, ContentItem } from "@/lib/types";
import { VectorStore } from "./vector_store";
import { contentItemStore } from "@/lib/stores";

// Define message type for chat
type Message = {
  role: "user" | "assistant";
  content: string;
};

export function ChatForm({ className }: React.ComponentProps<"form">) {
  const { items, addItem, removeItem, embeddedItems, addEmbeddedItem } =
    contentItemStore();
  // URL and documentation state
  const [url, setUrl] = useState("");
  const [docsData, setDocsData] = useState<ContentItem[]>([]);
  const [displayContent, setDisplayContent] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [embeddedDocuments, setEmbeddedDocuments] = useState<
    EmbeddedContentItem[] | null
  >(null);

  // Chat state
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // API keys state
  const [apiKeys, setApiKeys] = useState({
    openai: "",
    groq: "",
  });
  const [keysConfigured, setKeysConfigured] = useState({
    openai: false,
    groq: false,
  });

  // Vector store for embeddings
  const [vectorStore, setVectorStore] = useState<VectorStore | null>(null);

  // Tab state
  const [activeTab, setActiveTab] = useState<string>("url");

  // Load API keys from localStorage on component mount
  useEffect(() => {
    const loadApiKeys = () => {
      const openaiKey = localStorage.getItem("openai_api_key");
      const groqKey = localStorage.getItem("groq_api_key");

      setApiKeys({
        openai: openaiKey || "",
        groq: groqKey || "",
      });

      setKeysConfigured({
        openai: !!openaiKey,
        groq: !!groqKey,
      });
    };

    loadApiKeys();
  }, []);

  // URL validation helper
  const validateUrl = useCallback((url: string) => {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }, []);

  // Handle URL submission to load documentation
  const handleUrlSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateUrl(url)) {
      toast.error("Please enter a valid URL");
      return;
    }

    if (!keysConfigured.openai) {
      toast.error("Please configure your OpenAI API key first");
      return;
    }

    try {
      setIsProcessing(true);
      const response = await fetch(
        `/api/scrape?url=${encodeURIComponent(url)}`,
      );

      if (!response.ok) {
        throw new Error(`Failed to load content: ${response.statusText}`);
      }

      const data = await response.json();
      console.log(data);

      if (!data.allTextContent || data.allTextContent.length === 0) {
        throw new Error("No content found on the provided URL");
      }

      setDocsData(docsData.concat(data.allTextContent) as ContentItem[]);
      for (let item of data.allTextContent) {
        addItem(item);
        addEmbeddedItem({ embedded: false, url: item.url, title: item.title });
      }
      console.log(items);

      // Set display content to show the first content item
      if (data.allTextContent.length > 0) {
        setDisplayContent(data.allTextContent[0].content);
      }

      toast.success("Documentation loaded successfully!");
      setActiveTab("chat"); // Switch to chat tab after loading docs
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to load content",
      );
      console.error(error);
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle sending a chat message
  const sendMessage = async (content: string) => {
    if (!content.trim()) return;
    if (!keysConfigured.openai) {
      toast.error("Please configure your OpenAI API key first");
      return;
    }

    // Add user message to chat
    const userMessage: Message = { role: "user", content };
    setMessages((prev) => [...prev, userMessage]);
    setInput(""); // Clear input
    setIsLoading(true);

    try {
      // Get context from vector store if available
      let context = "";
      if (vectorStore) {
        const results = await vectorStore.similaritySearch(content, 3);
        context = results.map((r) => r.pageContent).join("\n\n");
      }

      // Send message to API
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [...messages, userMessage],
          context,
          apiKey: apiKeys.openai,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to get response");
      }

      const data = await response.json();

      // Add assistant message to chat
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: data.content },
      ]);
    } catch (error) {
      toast.error("Failed to get response");
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle form submission
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    sendMessage(input);
  };

  // Handle keyboard shortcuts
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  // Copy content to clipboard
  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(displayContent);
      toast.success("Copied to clipboard!");
    } catch (err) {
      toast.error("Failed to copy to clipboard");
    }
  };

  // Save API keys
  const saveApiKeys = () => {
    const keys = { ...apiKeys };
    const configured = { ...keysConfigured };

    // Validate OpenAI key
    if (keys.openai && !keys.openai.trim().startsWith("sk-")) {
      toast.error("Please enter a valid OpenAI API key");
      return;
    }

    // Save OpenAI key if provided
    if (keys.openai) {
      localStorage.setItem("openai_api_key", keys.openai);
      configured.openai = true;
    }

    // Save Groq key if provided
    if (keys.groq) {
      localStorage.setItem("groq_api_key", keys.groq);
      configured.groq = true;
    }

    setKeysConfigured(configured);
    toast.success("API keys saved successfully!");
  };

  // Clear API keys
  const clearApiKeys = () => {
    localStorage.removeItem("openai_api_key");
    localStorage.removeItem("groq_api_key");

    setApiKeys({
      openai: "",
      groq: "",
    });

    setKeysConfigured({
      openai: false,
      groq: false,
    });

    toast.success("API keys removed");
  };

  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-b from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      {/* Header */}
      <AppHeader
        isConfigured={keysConfigured.openai}
        apiKeys={apiKeys}
        setApiKeys={setApiKeys}
        saveApiKeys={saveApiKeys}
        clearApiKeys={clearApiKeys}
      />

      {/* Main Content */}
      <div className="flex-1 container mx-auto max-w-5xl px-4 py-8">
        <Card className="border shadow-lg">
          <CardHeader>
            <Tabs
              value={activeTab}
              onValueChange={setActiveTab}
              className="w-full"
            >
              <div className="flex justify-between items-center mb-4">
                <CardTitle className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 text-3xl font-bold">
                  <div>
                    {activeTab === "url"
                      ? "Load Documentation"
                      : activeTab === "chat"
                        ? "Chat With Your Docs"
                        : "AI Chat"}
                  </div>
                  {activeTab === "chat" && (
                    <EmbeddingInfoComponent
                      className="text-base font-normal mt-2 md:mt-0"
                      upstash_vector_url={
                        process.env.NEXT_PUBLIC_UPSTASH_VECTOR_URL || ""
                      }
                      upstash_vector_token={
                        process.env.NEXT_PUBLIC_UPSTASH_VECTOR_TOKEN || ""
                      }
                    />
                  )}
                </CardTitle>

                <TabsList>
                  <TabsTrigger value="url">URL</TabsTrigger>
                  <TabsTrigger value="chat">AI Chat</TabsTrigger>
                </TabsList>
              </div>

              {/* URL Tab Content */}
              <TabsContent value="url" className="space-y-4">
                <UrlTabContent
                  url={url}
                  setUrl={setUrl}
                  handleUrlSubmit={handleUrlSubmit}
                  displayContent={displayContent}
                  copyToClipboard={copyToClipboard}
                  docsData={docsData}
                  isProcessing={isProcessing}
                />
              </TabsContent>

              {/* Chat Tab Content */}

              {/* New Chat Tab Content */}
              <TabsContent value="chat">
                <ChatComponent />
              </TabsContent>
            </Tabs>
          </CardHeader>

          {/* Chat Input Field */}
          {activeTab === "chat" && displayContent && (
            <CardFooter className="border-t p-4">
              <form
                onSubmit={handleSubmit}
                className="relative flex items-center w-full rounded-lg border bg-background shadow-sm"
              >
                <AutoResizeTextarea
                  onKeyDown={handleKeyDown}
                  onChange={(v) => setInput(v)}
                  value={input}
                  placeholder={
                    keysConfigured.openai
                      ? "Ask about the documentation..."
                      : "Configure your API key first to start chatting"
                  }
                  className="min-h-[50px] w-full resize-none bg-transparent px-4 py-3 pr-12 focus:outline-none"
                  disabled={!keysConfigured.openai}
                />
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      type="submit"
                      size="icon"
                      className="absolute right-2 h-9 w-9 rounded-full"
                      disabled={
                        isLoading || !keysConfigured.openai || !input.trim()
                      }
                    >
                      {isLoading ? (
                        <div className="animate-spin">⋯</div>
                      ) : (
                        <ArrowUpIcon className="h-4 w-4" />
                      )}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Send message</TooltipContent>
                </Tooltip>
              </form>
            </CardFooter>
          )}
        </Card>
      </div>
    </div>
  );
}

// Header Component
function AppHeader({
  isConfigured,
  apiKeys,
  setApiKeys,
  saveApiKeys,
  clearApiKeys,
}: {
  isConfigured: boolean;
  apiKeys: { openai: string; groq: string };
  setApiKeys: React.Dispatch<
    React.SetStateAction<{ openai: string; groq: string }>
  >;
  saveApiKeys: () => void;
  clearApiKeys: () => void;
}) {
  return (
    <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-md border-b">
      <div className="container mx-auto max-w-5xl px-4 py-3 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <Zap className="h-6 w-6 text-primary" />
          <h1 className="text-xl font-bold">Documix</h1>
        </div>

        <div className="flex items-center gap-3">
          {isConfigured && (
            <Badge
              variant="outline"
              className="bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-400 border-green-200 dark:border-green-800"
            >
              API Key Configured
            </Badge>
          )}
        </div>
      </div>
    </div>
  );
}

// URL Tab Content Component
function UrlTabContent({
  url,
  setUrl,
  handleUrlSubmit,
  displayContent,
  copyToClipboard,
  docsData,
  isProcessing,
}: {
  url: string;
  setUrl: (url: string) => void;
  handleUrlSubmit: (e: React.FormEvent) => Promise<void>;
  displayContent: string;
  copyToClipboard: () => Promise<void>;
  docsData: ContentItem[];
  isProcessing: boolean;
}) {
  return (
    <>
      <div className="bg-muted/50 p-6 rounded-lg">
        <h3 className="text-lg font-medium mb-3">
          Load Documentation From URL
        </h3>
        <form onSubmit={handleUrlSubmit} className="flex gap-2">
          <Input
            type="url"
            placeholder="https://docs.example.com"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            className="flex-1"
          />
          <Button
            type="submit"
            className="gap-2"
            disabled={!url.trim() || isProcessing}
          >
            {isProcessing ? (
              <div className="animate-spin">⋯</div>
            ) : (
              <Link className="h-4 w-4" />
            )}
            {isProcessing ? "Loading..." : "Load Docs"}
          </Button>
        </form>
      </div>

      {displayContent && (
        <Card className="relative overflow-hidden border">
          <CardHeader className="py-3 px-4 bg-muted/70 border-b flex flex-row justify-between items-center">
            <h3 className="font-medium">Content Preview</h3>
            <Button
              variant="ghost"
              size="sm"
              className="hover:bg-secondary"
              onClick={copyToClipboard}
            >
              <Clipboard className="h-4 w-4 mr-2" />
              Copy
            </Button>
          </CardHeader>
          <CardContent className="p-0">
            <div className="max-h-[300px] overflow-y-auto p-4 prose dark:prose-invert prose-sm max-w-none">
              {displayContent}
            </div>
          </CardContent>
        </Card>
      )}

      {docsData.length > 0 && (
        <Card>
          <CardHeader className="py-3 px-4">
            <h3 className="font-medium">
              All Links Scraped ({docsData.length})
            </h3>
          </CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="h-[200px] p-4">
              {docsData.map((doc, index) => (
                <div
                  key={index}
                  className="text-sm py-1 border-b last:border-0"
                >
                  <a
                    href={doc.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline"
                  >
                    {doc.url}
                  </a>
                </div>
              ))}
            </ScrollArea>
          </CardContent>
        </Card>
      )}
    </>
  );
}

// Chat Tab Content Component
function ChatTabContent({
  displayContent,
  messages,
}: {
  displayContent: string;
  messages: Message[];
}) {
  if (!displayContent) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center text-muted-foreground">
        <Link className="h-12 w-12 mb-4 opacity-50" />
        <h3 className="text-lg font-medium">No documentation loaded</h3>
        <p className="max-w-md">
          Start by loading documentation from a URL in the URL tab
        </p>
      </div>
    );
  }

  if (messages.length === 0) {
    return (
      <div className="text-center p-8 text-muted-foreground">
        <p className="mb-2 text-lg">Start chatting with your documentation</p>
        <p className="text-sm">Ask questions about the loaded content</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 px-1 py-3">
      {messages.map((message, index) => (
        <div
          key={index}
          className={cn(
            "flex w-full",
            message.role === "user" ? "justify-end" : "justify-start",
          )}
        >
          <div
            className={cn(
              "rounded-lg px-4 py-3 max-w-[85%] shadow-sm",
              message.role === "user"
                ? "bg-primary text-primary-foreground"
                : "bg-muted border",
            )}
          >
            {message.content}
          </div>
        </div>
      ))}
    </div>
  );
}

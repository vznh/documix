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
import { AlertCircle, FileUp } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
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

import EmbeddingInfoComponent from "./embedding-info";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "./ui/scroll-area";
import ChatComponent from "./assistant-ui-chat";
import { EmbeddedContentItem, ContentItem } from "@/lib/types";
import { VectorStore } from "./vector_store";
import { contentItemStore, configurationStore } from "@/lib/stores";

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
  const [activeTab, setActiveTab] = useState<string>("sources");
  // File upload state
  const [files, setFiles] = useState<File[]>([]);
  const [fileContent, setFileContent] = useState<string>("");
  const [fileUploadError, setFileUploadError] = useState<string>("");
  const [isFileUploading, setIsFileUploading] = useState(false);

  // File upload handler
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    setFileUploadError("");
    const uploadedFiles = e.target.files;
    if (!uploadedFiles || uploadedFiles.length === 0) return;

    setIsFileUploading(true);

    try {
      const file = uploadedFiles[0];
      setFiles([...files, file]);

      // Handle different file types
      if (
        file.type === "text/plain" ||
        file.type === "text/markdown" ||
        file.type === "application/pdf" ||
        file.name.endsWith(".md") ||
        file.name.endsWith(".txt")
      ) {
        const text = await readFileAsText(file);
        setFileContent(text);

        // Add to content items
        const newItem: ContentItem = {
          url: `local://${file.name}`,
          title: file.name,
          content: text,
        };

        addItem(newItem);
        addEmbeddedItem({
          embedded: false,
          url: newItem.url,
          title: newItem.title,
        });

        toast.success(`File "${file.name}" uploaded successfully`);
      } else {
        setFileUploadError(
          "Unsupported file type. Please upload text, markdown, or PDF files.",
        );
        toast.error("Unsupported file type");
      }
    } catch (error) {
      console.error(error);
      setFileUploadError("Failed to process the file. Please try again.");
      toast.error("File upload failed");
    } finally {
      setIsFileUploading(false);
    }
  };

  // Helper function to read file as text
  const readFileAsText = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          resolve(event.target.result as string);
        } else {
          reject(new Error("Failed to read file"));
        }
      };
      reader.onerror = () => reject(new Error("File read error"));
      reader.readAsText(file);
    });
  };

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
        console.log(await response.text());
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
      setActiveTab("sources"); // Keep on sources tab after loading docs
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to load content",
      );
      console.error(error);
    } finally {
      setIsProcessing(false);
    }
  };

  // Copy content to clipboard
  const copyToClipboard = async () => {
    try {
      const contentToCopy = displayContent || fileContent;
      await navigator.clipboard.writeText(contentToCopy);
      toast.success("Copied to clipboard!");
    } catch (err) {
      toast.error("Failed to copy to clipboard");
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-b from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      {/* Header */}
      <AppHeader />

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
                    {activeTab === "sources"
                      ? "Load Documentation & Files"
                      : "Chat With Your Docs"}
                  </div>
                  {activeTab === "chat" && (
                    <EmbeddingInfoComponent
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
                  <TabsTrigger value="sources">Sources</TabsTrigger>
                  <TabsTrigger value="chat">AI Chat</TabsTrigger>
                </TabsList>
              </div>

              {/* Sources Tab Content (URL + Files) */}
              <TabsContent value="sources" className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* URL Input Section */}
                  <div className="bg-muted/50 p-6 rounded-lg">
                    <h3 className="text-lg font-medium mb-3 flex items-center gap-2">
                      <Link className="h-5 w-5" />
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
                        {isProcessing ? "Loading..." : "Load"}
                      </Button>
                    </form>
                  </div>

                  {/* File Upload Section */}
                  <div className="bg-muted/50 p-6 rounded-lg">
                    <h3 className="text-lg font-medium mb-3 flex items-center gap-2">
                      <FileUp className="h-5 w-5" />
                      Upload Files for Embedding
                    </h3>
                    <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center hover:bg-muted/70 transition-colors">
                      <label
                        htmlFor="file-upload"
                        className="cursor-pointer block"
                      >
                        <div className="flex flex-col items-center justify-center gap-2">
                          <FileUp className="h-6 w-6 text-muted-foreground" />
                          <p className="font-medium">
                            {isFileUploading
                              ? "Uploading..."
                              : "Drag files here or click to browse"}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            Supports .txt, .md, and .pdf files
                          </p>
                        </div>
                        <Input
                          id="file-upload"
                          type="file"
                          accept=".txt,.md,.pdf,text/plain,text/markdown,application/pdf"
                          onChange={handleFileUpload}
                          className="hidden"
                          disabled={isFileUploading}
                        />
                      </label>
                    </div>
                  </div>
                </div>

                {fileUploadError && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Error</AlertTitle>
                    <AlertDescription>{fileUploadError}</AlertDescription>
                  </Alert>
                )}

                {/* Content Preview */}
                {(displayContent || fileContent) && (
                  <Card className="relative overflow-hidden border">
                    <CardHeader className="py-3 px-4 bg-muted/70 border-b flex flex-row justify-between items-center">
                      <h3 className="font-medium">Content Preview</h3>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="hover:bg-secondary"
                        onClick={() => copyToClipboard()}
                      >
                        <Clipboard className="h-4 w-4 mr-2" />
                        Copy
                      </Button>
                    </CardHeader>
                    <CardContent className="p-0">
                      <div className="max-h-[300px] overflow-y-auto p-4 prose dark:prose-invert prose-sm max-w-none">
                        {displayContent || fileContent}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Sources List - Combined Documents and Files */}
                {(docsData.length > 0 || files.length > 0) && (
                  <Card>
                    <CardHeader className="py-3 px-4">
                      <h3 className="font-medium">
                        Added Sources ({docsData.length + files.length})
                      </h3>
                    </CardHeader>
                    <CardContent className="p-0">
                      <ScrollArea className="h-[200px] p-4">
                        {/* Document URLs */}
                        {docsData.map((doc, index) => (
                          <div
                            key={`doc-${index}`}
                            className="text-sm py-1 border-b last:border-0 flex justify-between items-center"
                          >
                            <div className="flex items-center gap-2">
                              <Link className="h-4 w-4 text-muted-foreground" />
                              <a
                                href={doc.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-primary hover:underline truncate max-w-[400px]"
                              >
                                {doc.title || doc.url}
                              </a>
                            </div>
                            <Badge variant="outline" className="text-xs">
                              URL
                            </Badge>
                          </div>
                        ))}

                        {/* Uploaded Files */}
                        {files.map((file, index) => (
                          <div
                            key={`file-${index}`}
                            className="text-sm py-1 border-b last:border-0 flex justify-between items-center"
                          >
                            <div className="flex items-center gap-2">
                              <FileUp className="h-4 w-4 text-muted-foreground" />
                              <span className="truncate max-w-[400px]">
                                {file.name}
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className="text-xs">
                                {(file.size / 1024).toFixed(1)} KB
                              </Badge>
                              <Badge variant="outline" className="text-xs">
                                File
                              </Badge>
                            </div>
                          </div>
                        ))}
                      </ScrollArea>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              {/* Chat Tab Content */}

              {/* New Chat Tab Content */}
              <TabsContent value="chat">
                <ChatComponent />
              </TabsContent>
            </Tabs>
          </CardHeader>
        </Card>
      </div>
    </div>
  );
}

// Header Component
function AppHeader() {
  const {
    embeddingProvider,
    embeddingModel,
    openAiAPIKey,
    groqAPIKey,
    provider,
  } = configurationStore();
  const isConfigured =
    ((embeddingProvider == "openai" || provider == "openai") &&
      !!openAiAPIKey) ||
    (provider == "groq" && !!groqAPIKey);
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
              All API Keys configured
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

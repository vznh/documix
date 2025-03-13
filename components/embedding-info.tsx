import React, { useState, useEffect } from "react";
import { Button } from "./ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "./ui/table";
import { contentItemStore, configurationStore } from "@/lib/stores";
import { CheckCircle2, XCircle } from "lucide-react";
import { Index } from "@upstash/vector";
import { UpstashVectorStore } from "@langchain/community/vectorstores/upstash";
import type { Document } from "@langchain/core/documents";
import { OllamaEmbeddings } from "@langchain/ollama";
import { OpenAIEmbeddings } from "@langchain/openai";
import short from "short-uuid";
import { embed } from "ai";
import { toast } from "sonner";

type EmbeddingInfoComponentProps = {
  embeddingId?: string;
  upstash_vector_url: string;
  upstash_vector_token: string;
};

const EmbeddingInfoComponent: React.FC<EmbeddingInfoComponentProps> = ({
  embeddingId,
  upstash_vector_url,
  upstash_vector_token,
}) => {
  const {
    items,
    updateItems,
    embeddedItems,
    addEmbeddedItem,
    updateEmbeddedItems,
  } = contentItemStore();
  const { embeddingModel, embeddingProvider } = configurationStore();
  const [open, setOpen] = useState(false);
  const [vectorStore, setVectorStore] = useState<UpstashVectorStore | null>(
    null,
  );
  const [isModelReady, setIsModelReady] = useState(false);
  const [modelError, setModelError] = useState<string | null>(null);

  useEffect(() => {
    const initializeVectorStore = async () => {
      try {
        setModelError(null);

        const embeddings = await createEmbeddings(
          embeddingModel,
          embeddingProvider,
        );
        const index = new Index({
          url:
            embeddingProvider == "openai"
              ? process.env.NEXT_PUBLIC_UPSTASH_VECTOR_URL_1536
              : process.env.NEXT_PUBLIC_UPSTASH_VECTOR_URL_768,
          token:
            embeddingProvider == "openai"
              ? process.env.NEXT_PUBLIC_UPSTASH_VECTOR_TOKEN_1536
              : process.env.NEXT_PUBLIC_UPSTASH_VECTOR_TOKEN_768,
        });
        const store = new UpstashVectorStore(embeddings, { index });

        setVectorStore(store);
        setIsModelReady(true);
      } catch (error) {
        console.error("Failed to initialize vector store:", error);
        setModelError(error instanceof Error ? error.message : String(error));
        setIsModelReady(false);
      }
    };

    initializeVectorStore();
  }, [
    embeddingModel,
    embeddingProvider,
    upstash_vector_url,
    upstash_vector_token,
  ]);

  const createEmbeddings = async (
    embeddingModel: string,
    embeddingProvider: string,
  ) => {
    if (embeddingProvider === "openai") {
      return new OpenAIEmbeddings({
        apiKey: configurationStore.getState().openAiAPIKey,
        model: embeddingModel,
      });
    } else if (embeddingProvider === "ollama") {
      // Create the embeddings instance
      const ollamaEmbeddings = new OllamaEmbeddings({
        model: embeddingModel,
        baseUrl: "http://localhost:11434",
      });

      // Test if the model is actually available
      try {
        // Try to embed a simple test string
        const embeddings = await ollamaEmbeddings.embedQuery("Test connection");
        return ollamaEmbeddings;
      } catch (error) {
        console.error("Ollama embedding model check failed:", error);
        throw new Error(
          `Ollama embedding model "${embeddingModel}" is not available. ` +
            `Make sure Ollama is running and the model is installed with: ollama pull ${embeddingModel}`,
        );
      }
    }

    throw new Error(`Embedding provider "${embeddingProvider}" not supported`);
  };

  const handleEmbedSingle = async (url: string) => {
    if (!url) {
      return;
    }
    const contentItem = items.find((element) => element.url === url);
    if (!contentItem) {
      return;
    }
    const document: Document = {
      pageContent: contentItem?.content,
      metadata: {
        url: contentItem?.url,
        title: contentItem?.title,
        id: short.generate(),
        // adding a field for which user added this document might be useful
      },
    };
    await vectorStore?.addDocuments([document], {
      ids: [document.metadata.id],
    });
    let updatedEmbeddedItems = embeddedItems.map((item) => {
      if (item.url == url) {
        item.embedded = true;
      }
      return item;
    });
    updateEmbeddedItems(updatedEmbeddedItems);
    toast("Document embedded successfuly! Feel free to chat");
  };

  const handleEmbedMultiple = async (urls: string[]) => {
    if (urls.length === 0) {
      return;
    }

    const contentItems = items.filter((element) => urls.includes(element.url));
    const MAX_CONTENT_LENGTH = 4000; // Adjust based on your model's limitations

    // Process each item individually to handle large content
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

            await vectorStore?.addDocuments([document], {
              ids: [document.metadata.id],
            });
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
          await vectorStore?.addDocuments([document], {
            ids: [document.metadata.id],
          });
        }

        // Update embedded status
        let updatedEmbeddedItems = embeddedItems.map((item) => {
          if (item.url === contentItem.url) {
            item.embedded = true;
          }
          return item;
        });
        updateEmbeddedItems(updatedEmbeddedItems);
      } catch (error) {
        console.error(`Error embedding ${contentItem.url}:`, error);
        toast.error(`Failed to embed ${contentItem.title}`);
      }
    }

    toast("Documents embedded successfully! Feel free to chat");
  };

  const handleDelete = (url: string) => {
    updateItems(items.filter((item) => item.url !== url));
    updateEmbeddedItems(embeddedItems.filter((item) => item.url !== url));
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">View Embedded Content</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[80vw] md:max-w-[70vw] lg:max-w-[65vw] max-h-[80vh]">
        <DialogHeader className="flex flex-row items-center justify-between">
          <DialogTitle>Embedded Content Information</DialogTitle>
          <Button
            onClick={async () => {
              try {
                // Get only the URLs of non-embedded items
                const urlsToEmbed = embeddedItems
                  .filter((item) => !item.embedded)
                  .map((item) => item.url);

                if (urlsToEmbed.length === 0) {
                  toast("No new content to embed");
                  return;
                }

                await handleEmbedMultiple(urlsToEmbed);
              } catch (error: any) {
                toast.error("Error embedding content: " + error.message);
                console.error("Embedding error:", error);
              }
            }}
            size="sm"
            variant="default"
            className="bg-primary text-primary-foreground hover:bg-primary/90"
          >
            Embed All
          </Button>
        </DialogHeader>

        {embeddedItems.length === 0 ? (
          <div className="flex justify-center py-4">
            No content has been embedded yet.
          </div>
        ) : (
          <div className="overflow-auto max-h-[calc(80vh-120px)]">
            <Table>
              <TableHeader className="sticky top-0 bg-background z-10">
                <TableRow>
                  <TableHead className="w-1/4">Embedded Status</TableHead>
                  <TableHead className="w-1/4">Title</TableHead>
                  <TableHead className="w-1/3">URL</TableHead>
                  <TableHead className="w-1/5">Embed</TableHead>
                  <TableHead className="w-1/5">Remove</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {embeddedItems.map((item, index) => (
                  <TableRow key={index}>
                    <TableCell className="font-medium">
                      {item.embedded ? <CheckCircle2 /> : <XCircle />}
                    </TableCell>
                    <TableCell className="font-medium">{item.title}</TableCell>
                    <TableCell className="max-w-[30%] truncate">
                      <a
                        href={item.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-500 hover:underline"
                      >
                        {item.url}
                      </a>
                    </TableCell>
                    <TableCell>
                      <Button
                        disabled={item.embedded}
                        onClick={() => handleEmbedSingle(item.url)}
                      >
                        Embed
                      </Button>
                    </TableCell>
                    <TableCell>
                      <Button onClick={(index) => handleDelete}>Delete</Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default EmbeddingInfoComponent;

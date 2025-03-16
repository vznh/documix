import React, { useState, useEffect } from "react";

import { useCallback } from "react";
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
import { EmbeddedContentItem } from "@/lib/types";
import { UpstashVectorStore } from "@langchain/community/vectorstores/upstash";
import type { Document } from "@langchain/core/documents";
import short from "short-uuid";
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
  const { embeddingModel, embeddingProvider, openAiAPIKey } =
    configurationStore();
  const [open, setOpen] = useState(false);
  const [vectorStore, setVectorStore] = useState<UpstashVectorStore | null>(
    null,
  );
  const [isModelReady, setIsModelReady] = useState(false);
  const [modelError, setModelError] = useState<string | null>(null);
  const [ollamaRunning, setOllamaRunning] = useState<boolean | null>(null);

  const checkOllamaStatus = useCallback(async () => {
    if (embeddingProvider !== "ollama") {
      return;
    }

    try {
      const response = await fetch("/api/embed/ollama/health", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        setOllamaRunning(true);
      } else {
        setOllamaRunning(false);
        toast.error(
          "Ollama service is not running. Please start the Ollama application.",
          {
            duration: 5000,
            id: "ollama-check",
          },
        );
      }
    } catch (error) {
      console.error("Failed to check Ollama status:", error);
      setOllamaRunning(false);
      toast.error(
        "Failed to connect to Ollama service. Please make sure Ollama is installed and running.",
        {
          duration: 5000,
          id: "ollama-check",
        },
      );
    }
  }, [embeddingProvider]);

  useEffect(() => {
    if (open && embeddingProvider === "ollama") {
      checkOllamaStatus();
    }
  }, [open, embeddingProvider, checkOllamaStatus]);

  // useEffect(() => {
  // useEffect(() => {
  //   const initializeVectorStore = async () => {
  //     try {
  //       setModelError(null);

  //       const embeddings = await createEmbeddings(
  //         embeddingModel,
  //         embeddingProvider,
  //       );
  //       const index = new Index({
  //         url:
  //           embeddingProvider == "openai"
  //             ? process.env.NEXT_PUBLIC_UPSTASH_VECTOR_URL_1536
  //             : process.env.NEXT_PUBLIC_UPSTASH_VECTOR_URL_768,
  //         token:
  //           embeddingProvider == "openai"
  //             ? process.env.NEXT_PUBLIC_UPSTASH_VECTOR_TOKEN_1536
  //             : process.env.NEXT_PUBLIC_UPSTASH_VECTOR_TOKEN_768,
  //       });
  //       const store = new UpstashVectorStore(embeddings, { index });

  //       setVectorStore(store);
  //       setIsModelReady(true);
  //     } catch (error) {
  //       console.error("Failed to initialize vector store:", error);
  //       setModelError(error instanceof Error ? error.message : String(error));
  //       setIsModelReady(false);
  //     }
  //   };

  //   initializeVectorStore();
  // }, [
  //   embeddingModel,
  //   embeddingProvider,
  //   upstash_vector_url,
  //   upstash_vector_token,
  // ]);

  // const createEmbeddings = async (
  //   embeddingModel: string,
  //   embeddingProvider: string,
  // ) => {
  //   if (embeddingProvider === "openai") {
  //     return new OpenAIEmbeddings({
  //       apiKey: configurationStore.getState().openAiAPIKey,
  //       model: embeddingModel,
  //     });
  //   } else if (embeddingProvider === "ollama") {
  //     // Create the embeddings instance
  //     const ollamaEmbeddings = new OllamaEmbeddings({
  //       model: embeddingModel,
  //       baseUrl: "http://localhost:11434",
  //     });

  //     // Test if the model is actually available
  //     try {
  //       // Try to embed a simple test string
  //       const embeddings = await ollamaEmbeddings.embedQuery("Test connection");
  //       return ollamaEmbeddings;
  //     } catch (error) {
  //       console.error("Ollama embedding model check failed:", error);
  //       throw new Error(
  //         `Ollama embedding model "${embeddingModel}" is not available. ` +
  //           `Make sure Ollama is running and the model is installed with: ollama pull ${embeddingModel}`,
  //       );
  //     }
  //   }

  //   throw new Error(`Embedding provider "${embeddingProvider}" not supported`);
  // };

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
    const MAX_CONTENT_LENGTH = 8000; // Adjust based on your model's limitations

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

  const embedDocuments = async (urls: string[]) => {
    const contentItems = items.filter((element) => urls.includes(element.url));
    const response = await fetch(
      embeddingProvider == "openai"
        ? `/api/embed/openai?model=${embeddingModel}`
        : `/api/embed/ollama?model=${embeddingModel}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${embeddingProvider == "openai" ? openAiAPIKey : undefined}, `,
        },
        body: JSON.stringify({ contentItems }),
      },
    );
    const data = response.json();
    if (!response.ok) {
      return null;
    }
    return data;
  };

  const handleDelete = (url: string) => {
    updateItems(items.filter((item) => item.url !== url));
    updateEmbeddedItems(embeddedItems.filter((item) => item.url !== url));
  };

  const embedButtonHandler = async (urls: string[]) => {
    try {
      const toastId = toast.loading("Embedding documents...");
      const data = await embedDocuments(urls);
      if (!data) {
        throw new Error("Failed to embed documents");
      }
      if (data) {
        const currentEmbeddedItems = [...embeddedItems];

        // Create the updated array by marking embedded items
        const updatedItems = currentEmbeddedItems.map((item) => {
          // Find if this item was successfully embedded
          const matchedItem = data.find(
            (embeddedItem: EmbeddedContentItem) =>
              embeddedItem.url === item.url,
          );

          // If found in the response and marked as embedded
          if (matchedItem && matchedItem.embedded === true) {
            return { ...item, embedded: true };
          }
          return item;
        });

        // Update the embedded items state
        updateEmbeddedItems(updatedItems);
        toast.dismiss(toastId);
        toast.success("Documents embedded successfully");
      }
    } catch (error) {
      console.error("Error embedding documents:", error);
      toast.error("Failed to embed documents");
    }
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
            onClick={() =>
              embedButtonHandler(embeddedItems.map((item) => item.url))
            }
            size="sm"
            variant="default"
            className="bg-primary text-primary-foreground hover:bg-primary/90"
            disabled={embeddingProvider === "ollama" && ollamaRunning === false}
          >
            Embed All
          </Button>
        </DialogHeader>

        {embeddingProvider === "ollama" && ollamaRunning === false && (
          <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <XCircle
                  className="h-5 w-5 text-yellow-400"
                  aria-hidden="true"
                />
              </div>
              <div className="ml-3">
                <p className="text-sm text-yellow-700">
                  Ollama service is not running. Please start the Ollama
                  application before embedding documents.
                </p>
              </div>
            </div>
          </div>
        )}

        {embeddedItems.length === 0 ? (
          <div>
            <div className="flex justify-center py-4">
              No content has been embedded yet.
            </div>
            <Button
              variant="link"
              className="p-0 mt-1 text-sm text-yellow-800"
              onClick={checkOllamaStatus}
            >
              Check again
            </Button>
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
                      {item.embedded ? (
                        <span className="inline-flex items-center justify-center rounded-full bg-green-500">
                          <CheckCircle2 className="text-white" />
                        </span>
                      ) : (
                        <span className="inline-flex items-center justify-center rounded-full bg-red-500">
                          <XCircle className="text-white" />
                        </span>
                      )}
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
                        disabled={
                          item.embedded ||
                          (embeddingProvider === "ollama" &&
                            ollamaRunning === false)
                        }
                        onClick={() => embedButtonHandler([item.url])}
                      >
                        Embed
                      </Button>
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="destructive"
                        onClick={(index) => handleDelete}
                      >
                        Delete
                      </Button>
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

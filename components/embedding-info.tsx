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
  userId?: string;
};

const EmbeddingInfoComponent: React.FC<EmbeddingInfoComponentProps> = ({
  userId,
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
        body: JSON.stringify({ contentItems, userId }),
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

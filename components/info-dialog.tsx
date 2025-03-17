"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  InfoIcon,
  FileUp,
  Link,
  MessageSquare,
  Settings,
  Zap,
  Check,
} from "lucide-react";
import { Badge } from "./ui/badge";
import { Card } from "./ui/card";

export function InfoDialog() {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon">
          <InfoIcon className="h-5 w-5" />
          <span className="sr-only">Get Started Guide</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-2xl">
            <Zap className="h-6 w-6 text-primary" />
            Getting Started with Documix
          </DialogTitle>
          <DialogDescription>
            Follow these steps to start chatting with your documents
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Step 1 */}
          <div className="flex gap-4">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
              1
            </div>
            <div className="space-y-2">
              <h4 className="font-medium leading-none">Configure API Keys</h4>
              <div className="flex items-center gap-2">
                <Settings className="h-4 w-4 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">
                  Set up your API keys from Groq / OpenAI in the configuration
                  panel
                </p>
              </div>
            </div>
          </div>

          {/* Step 2 */}
          <div className="flex gap-4">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
              2
            </div>
            <div className="space-y-2">
              <h4 className="font-medium leading-none">Add Documents</h4>
              <div className="flex items-center gap-2">
                <FileUp className="h-4 w-4 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">
                  Upload local files (PDF, TXT, MD) or provide URLs to
                  documentation websites
                </p>
              </div>
            </div>
          </div>

          {/* Step 3 */}
          <div className="flex gap-4">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
              3
            </div>
            <div className="space-y-2">
              <h4 className="font-medium leading-none">Embed Content</h4>
              <div className="flex items-center gap-2">
                <Zap className="h-4 w-4 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">
                  Your documents will be automatically processed. In the AI Chat
                  tab, click "View Embedded Content" and use the "Embed All"
                  button to prepare them for AI retrieval
                </p>
              </div>
            </div>
          </div>

          {/* Step 4 */}
          <div className="flex gap-4">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
              4
            </div>
            <div className="space-y-2">
              <h4 className="font-medium leading-none">Chat with Your Docs</h4>
              <div className="flex items-center gap-2">
                <MessageSquare className="h-4 w-4 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">
                  Switch to the AI Chat tab to start querying your documentation
                </p>
              </div>
            </div>
          </div>

          {/* Notes */}
          <div className="rounded-md bg-muted p-4 mt-6">
            <div className="flex">
              <div className="flex-shrink-0">
                <Check className="h-5 w-5 text-primary" aria-hidden="true" />
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium">Important Notes</h3>
                <div className="mt-2 text-sm text-muted-foreground">
                  <ul className="list-disc pl-5 space-y-1">
                    <li>
                      You need to be logged in to access the AI Chat
                      functionality
                    </li>
                    <li>
                      Your API keys are stored locally in your browser and never
                      sent to our servers
                    </li>
                    <li>
                      <strong>Embeddings:</strong> OpenAI is recommended for
                      production use, Ollama is for testing only
                    </li>
                    <li>
                      <strong>Browser limitation:</strong> Ollama embeddings
                      only work when running Documix locally, not with the
                      hosted version
                    </li>
                    <li>
                      <strong>Vector database:</strong> The shared database is
                      cleared regularly. Information embedded more than a few
                      days ago may no longer be available
                    </li>
                    <li>
                      For persistent usage, consider setting up your own Upstash
                      Vector instance
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button onClick={() => setOpen(false)}>Got it, thanks!</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

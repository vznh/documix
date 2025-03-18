"use client";

import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SettingsIcon, Tv } from "lucide-react";
import { configurationStore } from "@/lib/stores";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const MODEL_OPTIONS = {
  openai: ["gpt-4o", "gpt-4o-mini", "o1-mini", "o3-mini"],
  groq: [
    "llama-3.3-70b-versatile",
    "deepseek-r1-distill-llama-70b",
    "qwen-qwq-32b",
  ],
};

const EMBEDDING_OPTIONS = {
  openai: ["text-embedding-3-small", "text-embedding-3-large"],
  ollama: ["nomic-embed-text", "snowflake-arctic-embed:137m"],
};

export function ModelConfiguration() {
  const [isOpen, setIsOpen] = useState(false);

  const {
    provider,
    modelName,
    openAiAPIKey,
    groqAPIKey,
    updateConfig,
    embeddingModel,
    embeddingProvider,
  } = configurationStore();

  const [localSettings, setLocalSettings] = useState({
    provider,
    modelName,
    openAiAPIKey,
    embeddingModel,
    embeddingProvider,
    groqAPIKey,
  });

  // Handle dialog open/close state
  const handleOpenChange = useCallback(
    (open: boolean) => {
      if (open) {
        // Initialize local settings when dialog opens
        setLocalSettings({
          provider,
          modelName,
          openAiAPIKey,
          embeddingModel,
          embeddingProvider,
          groqAPIKey,
        });
      }
      setIsOpen(open);
    },
    [provider, modelName, openAiAPIKey, groqAPIKey],
  );

  const handleSave = useCallback(() => {
    // Update the configuration store with all local settings
    updateConfig({
      provider: localSettings.provider,
      modelName: localSettings.modelName,
      openAiAPIKey: localSettings.openAiAPIKey,
      groqAPIKey: localSettings.groqAPIKey,
      embeddingModel: localSettings.embeddingModel,
      embeddingProvider: localSettings.embeddingProvider,
    });
  }, [localSettings, updateConfig]);

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant="outline" size="icon">
          <SettingsIcon className="h-4 w-4" />
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Documix Settings</DialogTitle>
        </DialogHeader>
        <Tabs>
          <TabsList>
            <TabsTrigger value="inference">inference</TabsTrigger>
            <TabsTrigger value="embedding">embedding </TabsTrigger>
          </TabsList>
          <TabsContent value="inference">
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="provider" className="text-right">
                  Provider
                </Label>
                <Select
                  value={localSettings.provider}
                  onValueChange={(value) => {
                    setLocalSettings({
                      ...localSettings,
                      provider: value,
                      // Set default model for provider
                      modelName:
                        MODEL_OPTIONS[value as keyof typeof MODEL_OPTIONS][0],
                      // Update API key when changing provider
                    });
                  }}
                >
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="Select provider" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="openai">OpenAI</SelectItem>
                    <SelectItem value="groq">Groq</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="model" className="text-right">
                  Model
                </Label>
                <Select
                  value={localSettings.modelName}
                  onValueChange={(value) =>
                    setLocalSettings({ ...localSettings, modelName: value })
                  }
                >
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="Select model" />
                  </SelectTrigger>
                  <SelectContent>
                    {MODEL_OPTIONS[
                      localSettings.provider as keyof typeof MODEL_OPTIONS
                    ].map((option) => (
                      <SelectItem key={option} value={option}>
                        {option}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="apiKey" className="text-right">
                  {localSettings.provider === "openai"
                    ? "OpenAI Key"
                    : "Groq Key"}
                </Label>
                <Input
                  id="apiKey"
                  type="password"
                  value={
                    localSettings.provider === "openai"
                      ? localSettings.openAiAPIKey
                      : localSettings.groqAPIKey
                  }
                  onChange={(e) => {
                    setLocalSettings({
                      ...localSettings,
                      [localSettings.provider === "openai"
                        ? "openAiAPIKey"
                        : "groqAPIKey"]: e.target.value,
                    });
                  }}
                  className="col-span-3"
                  placeholder={`Enter your ${localSettings.provider} API key`}
                />
              </div>
            </div>
          </TabsContent>
          <TabsContent value="embedding">
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="provider" className="text-right">
                  Provider
                </Label>
                <Select
                  value={localSettings.embeddingProvider}
                  onValueChange={(value) => {
                    setLocalSettings({
                      ...localSettings,
                      embeddingProvider: value,
                      // Set default model for provider
                      embeddingModel:
                        EMBEDDING_OPTIONS[
                          value as keyof typeof EMBEDDING_OPTIONS
                        ][0],
                      // Update API key when changing provider
                      openAiAPIKey: value === "openai" ? openAiAPIKey : "",
                    });
                  }}
                >
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="Select provider" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="openai">OpenAI</SelectItem>
                    <SelectItem value="ollama">Ollama</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="model" className="text-right">
                  Model
                </Label>
                <Select
                  value={localSettings.embeddingModel}
                  onValueChange={(value) =>
                    setLocalSettings({
                      ...localSettings,
                      embeddingModel: value,
                    })
                  }
                >
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="Select model" />
                  </SelectTrigger>
                  <SelectContent>
                    {EMBEDDING_OPTIONS[
                      localSettings.embeddingProvider
                        ? (localSettings.embeddingProvider as keyof typeof EMBEDDING_OPTIONS)
                        : ("openai" as keyof typeof EMBEDDING_OPTIONS)
                    ].map((option) => (
                      <SelectItem key={option} value={option}>
                        {option}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {localSettings.embeddingProvider == "openai" && (
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="apiKey" className="text-right">
                    OpenAI Key
                  </Label>
                  <Input
                    id="apiKey"
                    type="password"
                    value={localSettings.openAiAPIKey}
                    onChange={(e) =>
                      setLocalSettings({
                        ...localSettings,
                        openAiAPIKey: e.target.value,
                      })
                    }
                    className="col-span-3"
                    placeholder={`Enter your OpenAI API key`}
                  />
                </div>
              )}
            </div>
          </TabsContent>
          <Button onClick={handleSave}>Save Settings</Button>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}

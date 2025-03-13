import { EmbeddedContentItem, ContentItem } from "./types";
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { UpstashVectorStore } from "@langchain/community/vectorstores/upstash";

interface ContentItemState {
  items: ContentItem[];
  updateItems: (items: ContentItem[]) => void;
  addItem: (item: ContentItem) => void;
  removeItem: (item: ContentItem) => void;
  embeddedItems: EmbeddedContentItem[];
  addEmbeddedItem: (item: EmbeddedContentItem) => void;
  removeEmbeddedItem: (item: EmbeddedContentItem) => void;
  updateEmbeddedItems: (items: EmbeddedContentItem[]) => void;
}

export const contentItemStore = create<ContentItemState>((set) => ({
  items: [],
  updateItems: (items: ContentItem[]) => set(() => ({ items: items })),
  addItem: (item: ContentItem) =>
    set((state) => ({ items: [...state.items, item] })),
  removeItem: (item: ContentItem) =>
    set((state) => ({
      items: state.items.filter((content) => content.url !== item.url),
    })),
  embeddedItems: [],
  addEmbeddedItem: (item: EmbeddedContentItem) =>
    set((state) => ({ embeddedItems: [...state.embeddedItems, item] })),
  removeEmbeddedItem: (item: EmbeddedContentItem) =>
    set((state) => ({
      embeddedItems: state.embeddedItems.filter(
        (content) => content.url !== item.url,
      ),
    })),
  updateEmbeddedItems: (items: EmbeddedContentItem[]) =>
    set((state) => ({
      embeddedItems: items,
    })),
}));

interface ConfigSettings {
  provider: string;
  modelName: string;
  openAiAPIKey: string;
  groqAPIKey: string;
  embeddingProvider: string;
  embeddingModel: string;
  searchDepth: number;
}

interface ConfigurationState extends ConfigSettings {
  updateConfig: (config: Partial<ConfigSettings>) => void;
  setProvider: (provider: string) => void;
  setModelName: (modelName: string) => void;
  setOpenAiAPIKey: (key: string) => void;
  setGroqAPIKey: (key: string) => void;
  setEmbeddingProvider: (provider: string) => void;
  setEmbeddingModel: (model: string) => void;
  setSearchDepth: (number: number) => void;
}

export const configurationStore = create(
  persist<ConfigurationState>(
    (set) => ({
      // Default values
      provider: "groq",
      modelName: "llama-3.3-70b-versatile",
      openAiAPIKey: "",
      groqAPIKey: "",
      embeddingProvider: "openai",
      embeddingModel: "text-embedding-3-small",
      searchDepth: 25,

      // Update methods
      updateConfig: (config) => set((state) => ({ ...state, ...config })),
      setProvider: (provider) => set(() => ({ provider })),
      setModelName: (modelName) => set(() => ({ modelName })),
      setOpenAiAPIKey: (openAiAPIKey) => set(() => ({ openAiAPIKey })),
      setGroqAPIKey: (groqAPIKey) => set(() => ({ groqAPIKey })),
      setEmbeddingProvider: (embeddingProvider) =>
        set(() => ({ embeddingProvider })),
      setEmbeddingModel: (embeddingModel) => set(() => ({ embeddingModel })),
      setSearchDepth: (searchDepth) => set(() => ({ searchDepth })),
    }),
    {
      name: "documix-config-storage", // name of the item in local storage
      storage: createJSONStorage(() => localStorage), // use localStorage
    },
  ),
);

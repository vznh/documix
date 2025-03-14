import { CloseVectorWeb } from "@langchain/community/vectorstores/closevector/web";
import { OllamaEmbeddings } from "@langchain/ollama";
import { OpenAIEmbeddings } from "@langchain/openai";
import { ContentItem } from "@/lib/types";

export class VectorStore {
  embedding_choice: string;
  embedder: OpenAIEmbeddings | OllamaEmbeddings;

  constructor(embedding_choice: string, api_key?: string) {
    this.embedding_choice = embedding_choice;
    this.embedder =
      this.embedding_choice == "openai"
        ? new OpenAIEmbeddings({
            apiKey: api_key,
            model: "text-embedding-3-large",
          })
        : new OllamaEmbeddings({
            model: "nomic-embed-text",
            baseUrl: "http://localhost:11434",
          });
  }

  async create_store(texts: ContentItem[]) {
    const store = await CloseVectorWeb.fromTexts(
      texts.map((text) => this.convert_to_markdown(text)),
      texts.map((text) => text.url),
      this.embedder,
    );
    return store;
  }

  convert_to_markdown(item: ContentItem) {
    let markdownContent = "";
    markdownContent += `## ${item.title}\n`;
    markdownContent += `Source: ${item.url}\n\n`;
    markdownContent += `${item.content}\n\n`;
    markdownContent += "---\n\n";
    return markdownContent;
  }
}

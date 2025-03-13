import { OpenAIEmbeddings } from "@langchain/openai";
import { OllamaEmbeddings } from "@langchain/ollama";

export class OpenAIEmbedder {
  model: string;
  embeddings: OpenAIEmbeddings;

  constructor(api_key: string, model?: string);

  constructor(api_key: string, model: string) {
    if (model) {
      this.model = model;
    } else {
      this.model = "text-embedding-3-large";
    }
    this.embeddings = new OpenAIEmbeddings({
      apiKey: api_key,
      model: model,
    });
  }
}

export class OllamaEmbedder {
  model: string;
  embeddings: OllamaEmbeddings;
  baseUrl: string;

  constructor();
  constructor(model: string);

  constructor(model?: string) {
    if (model) {
      this.model = model;
    } else {
      this.model = "nomic-embed-text";
    }
    this.baseUrl = "http://localhost:11434";
    this.embeddings = new OllamaEmbeddings({
      model: this.model,
      baseUrl: this.baseUrl,
    });
  }
}

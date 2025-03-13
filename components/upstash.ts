import { UpstashVectorStore } from "@langchain/community/vectorstores/upstash";
import { OpenAIEmbeddings } from "@langchain/openai";
import { OllamaEmbeddings } from "@langchain/ollama";

import { Index } from "@upstash/vector";

const embeddings = new OpenAIEmbeddings({
  model: "text-embedding-3-small",
});

const indexWithCredentials = new Index({
  url: process.env.UPSTASH_VECTOR_REST_URL,
  token: process.env.UPSTASH_VECTOR_REST_TOKEN,
});

const vectorStore = new UpstashVectorStore(embeddings, {
  index: indexWithCredentials,
  // You can use namespaces to partition your data in an index
  // namespace: "test-namespace",
});

const vectorStoreInitialization = (
  embedder: "openai" | "ollama",
  apiKey: string,
) => {
  const embeddings =
    embedder == "openai"
      ? new OpenAIEmbeddings({
          apiKey: apiKey,
          modelName: "text-embedding-3-small",
        })
      : new OllamaEmbeddings({ model: "nomic-embed-text" });
  const vectorStore = new UpstashVectorStore(embeddings, {
    index: indexWithCredentials,
  });
  return vectorStore;
};

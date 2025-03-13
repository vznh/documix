import { OpenAIEmbedder, OllamaEmbedder } from "@/lib/embeddings";
import { EmbeddedContentItem, ContentItem } from "@/lib/types";

export async function POST(req: Request) {
  const data = await req.json();
  const { documents, embedding_provider, api_key, model } = data;
  let embedder;
  try {
    if (embedding_provider === "openai") {
      if (!api_key) {
        throw Error("API Key not provided");
      }
      embedder = new OpenAIEmbedder(api_key, model ? model : "");
    } else {
      embedder = new OllamaEmbedder();
    }
    let embedded_documents: EmbeddedContentItem[] = [];
    const vector_embeddings = await embedder.embeddings.embedDocuments(
      documents.map((doc: ContentItem) => doc.content),
    );
    for (let i = 0; i < documents.length; i++) {
      embedded_documents.push({
        embedded: false,
        content: vector_embeddings[i],
        url: documents[i].url,
        title: documents[i].title,
      });
    }
    return new Response(JSON.stringify(embedded_documents), { status: 200 });
  } catch (error: any) {
    return new Response(error.message, { status: 500 });
  }
}

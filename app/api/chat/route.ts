import { createOpenAI } from "@ai-sdk/openai";
import { createGroq } from "@ai-sdk/groq";
import { streamText } from "ai";

export const runtime = "edge";
export const maxDuration = 30;

export async function POST(req: Request) {
  try {
    const { messages, model, modelName, apiKey } = await req.json();

    // Validate inputs
    if (!messages || !Array.isArray(messages)) {
      return new Response(
        JSON.stringify({ error: "Messages must be an array" }),
        { status: 400, headers: { "Content-Type": "application/json" } },
      );
    }

    if (!modelName) {
      return new Response(JSON.stringify({ error: "Model name is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    let llm;
    switch (model.toLowercase()) {
      case "groq":
        llm = createGroq({
          apiKey: apiKey || process.env.GROQ_API_KEY || "",
        });
        break;
      case "openai":
      default:
        llm = createOpenAI({
          apiKey: apiKey || process.env.OPENAI_API_KEY || "",
        });
        break;
    }

    const result = streamText({
      model: llm(modelName),
      messages: messages,
    });

    return result.toDataStreamResponse();
  } catch (error: any) {
    console.error("API error:", error);
    return new Response(
      JSON.stringify({ error: error.message || "An unknown error occurred" }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  }
}

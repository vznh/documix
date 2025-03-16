import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    // Test Ollama with a minimal embedding request
    const response = await fetch("http://localhost:11434/api/embeddings", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "nomic-embed-text", // Using a common embedding model
        prompt: "test", // Minimal test prompt
      }),
      // Set a reasonable timeout
      signal: AbortSignal.timeout(3000),
    });

    if (response.ok) {
      const data = await response.json();

      // Check if we actually got embeddings back
      if (data && data.embedding && Array.isArray(data.embedding)) {
        return NextResponse.json(
          {
            status: "ok",
            message: "Ollama service is running and can generate embeddings",
          },
          { status: 200 },
        );
      } else {
        return NextResponse.json(
          {
            status: "error",
            message: "Ollama returned invalid embedding data",
          },
          { status: 503 },
        );
      }
    } else {
      const errorData = await response.text();
      return NextResponse.json(
        {
          status: "error",
          message: "Ollama service responded with an error",
          details: errorData,
        },
        { status: 503 },
      );
    }
  } catch (error: any) {
    console.error("Error checking Ollama status:", error);
    return NextResponse.json(
      {
        status: "error",
        message: "Failed to connect to Ollama service",
        error: error.message || "Unknown error",
      },
      { status: 503 },
    );
  }
}

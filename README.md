# Documix - Advanced AI-Powered Documentation Assistant

![Documix](https://raw.githubusercontent.com/anshaysaboo/documix/main/public/documix-logo.png)

Documix is an AI-powered documentation and knowledge base assistant that helps you quickly find, understand, and interact with complex documentation. It lets you load documentation from URLs or upload files (including PDF, Markdown, and text files), indexes the content for semantic search, and provides an intuitive chat interface to query your knowledge base.

Live demo: [documix.vercel.app](https://documix.vercel.app)

## Features

- 🌐 **URL Scraping**: Load documentation directly from any website
- 📁 **File Upload**: Support for PDF, Markdown, and text files
- 🧠 **Semantic Search**: Powered by embeddings for accurate document retrieval
- 💬 **AI Chat Interface**: Chat with your documentation using state-of-the-art LLMs
- 🚀 **Multiple LLM Options**: Support for OpenAI, Groq, and local models via Ollama
- 🔄 **Persistence**: Save and restore your chat sessions
- 📈 **Vector Store Integration**: Uses Upstash Vector for efficient semantic search

## Getting Started

### Prerequisites

- Node.js 18+ and npm/yarn/pnpm
- [Ollama](https://ollama.ai/) (optional, for local embedding models)
- API keys for OpenAI or Groq

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/documix.git
   cd documix
   ```

2. Install dependencies:
   ```bash
   npm install
   # or
   yarn install
   # or
   pnpm install
   ```

3. Create a `.env.local` file with the following variables:
   ```
   # Upstash Vector (required for storing embeddings)
   UPSTASH_VECTOR_TOKEN_768=your_upstash_token_for_768d
   UPSTASH_VECTOR_TOKEN_1536=your_upstash_token_for_1536d
   NEXT_PUBLIC_UPSTASH_VECTOR_URL_768=your_upstash_url_for_768d
   NEXT_PUBLIC_UPSTASH_VECTOR_URL_1536=your_upstash_url_for_1536

   # Optional: Default API keys (users can also input their own)
   OPENAI_API_KEY=your_openai_api_key
   GROQ_API_KEY=your_groq_api_key
   ```

4. Run the development server:
   ```bash
   npm run dev
   # or
   yarn dev
   # or
   pnpm dev
   ```

5. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Configuration

### API Keys

Documix requires API keys for operation. You can configure these in two ways:

1. **In the UI**: Click the settings icon to enter your API keys.
2. **Environment Variables**: Set the keys in `.env.local` for default values.

### Recommended Setup

For the best performance and cost efficiency, we recommend:

1. **Embeddings**: Local [Nomic Embed](https://github.com/nomic-ai/nomic) model via Ollama
   ```bash
   ollama pull nomic-embed-text
   ```

2. **Inference**: Groq API for fast responses (or OpenAI for highest quality)

3. **Vector Store**: Upstash Vector for persistent storage of embeddings

### Ollama Setup (for local embeddings)

1. Install [Ollama](https://ollama.ai/) for your platform
2. Pull the Nomic embedding model:
   ```bash
   ollama pull nomic-embed-text
   ```
3. Ensure Ollama is running when using Documix

## Usage

1. **Load Documentation**:
   - Enter a URL to scrape documentation from a website
   - Or upload PDF, Markdown, or text files

2. **Process and Embed**:
   - Documents will be processed and embedded automatically
   - View embedding status in the Sources tab

3. **Chat with Your Docs**:
   - Switch to the Chat tab
   - Ask questions about your documentation
   - The AI will respond using the knowledge from your loaded documents

4. **Manage Sessions**:
   - Create new chat threads
   - Archive old conversations
   - Return to previous discussions

## Advanced Usage

### PDF Processing Options

Documix provides multiple options for processing PDF files:

- **Standard Extraction**: Fast but basic text extraction
- **OpenAI Vision**: High-quality extraction with layout understanding
- **Local Models**: Process PDFs using local Gemma or Llama models (if configured)

### Custom Model Configuration

You can choose between different language models for chat:

1. **Groq**: Various models including llama3-70b, llama3-8b, etc.
2. **OpenAI**: GPT-4, GPT-3.5-turbo models
3. **Ollama** (coming soon): Local models for fully offline operation

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgements

- Built with [Next.js](https://nextjs.org/)
- UI components from [shadcn/ui](https://ui.shadcn.com/)
- Vector search by [Upstash Vector](https://upstash.com/vector)
- Embedding models by [Nomic AI](https://nomic.ai/)
- LLM providers: [OpenAI](https://openai.com/), [Groq](https://groq.com/), and [Ollama](https://ollama.ai/)

---

Created with ❤️ by Ryan

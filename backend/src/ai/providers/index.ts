import { createOllamaProvider } from "./OllamaProvider.js";
import { createOpenAIProvider } from "./OpenAIProvider.js";
import { createHuggingFaceProvider } from "./HuggingFaceProvider.js";
import { createGroqProvider } from "./groqProvider.js";

export function getAIProvider(name: string) {
  switch (name) {
    case "ollama":
      return createOllamaProvider();

    case "openai":
      return createOpenAIProvider();

    case "huggingface":
      return createHuggingFaceProvider();

    case "groq":
      return createGroqProvider();

    default:
      throw new Error("Unknown AI provider: " + name);
  }
}

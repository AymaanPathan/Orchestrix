import axios from "axios";

export function createOllamaProvider(model: string = "llama3.1") {
  async function generateWorkflow(
    prompt: string,
    system: string
  ): Promise<string> {
    const response = await axios.post("http://localhost:11434/api/chat", {
      model,
      messages: [
        { role: "system", content: system },
        { role: "user", content: prompt },
      ],
      stream: false,
    });

    let text = response.data?.message?.content || "{}";
    return text.replace(/```json|```/g, "").trim();
  }

  return { generateWorkflow };
}

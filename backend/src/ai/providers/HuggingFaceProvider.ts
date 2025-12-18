import { HfInference } from "@huggingface/inference";

export function createHuggingFaceProvider(
  model = "meta-llama/Llama-3.2-3B-Instruct"
) {
  if (!process.env.HF_API_KEY) {
    throw new Error("Missing HF_API_KEY");
  }

  const client = new HfInference(process.env.HF_API_KEY, {
    endpointUrl: "https://router.huggingface.co",
  });

  async function generateWorkflow(prompt: string, system: string) {
    const finalPrompt = `
${system}

USER REQUEST:
${prompt}

Return ONLY valid JSON.
No explanations or markdown.
`;

    const response = await client.textGeneration({
      model,
      inputs: finalPrompt,
      parameters: {
        max_new_tokens: 600,
        temperature: 0.1,
        return_full_text: false,
      },
    });

    let text = response.generated_text || "{}";
    return text.replace(/```json|```/g, "").trim();
  }

  return { generateWorkflow };
}


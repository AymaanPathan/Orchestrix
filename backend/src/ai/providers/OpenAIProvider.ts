import OpenAI from "openai";

export function createOpenAIProvider(model = "gpt-4.1-mini") {
  if (!process.env.OPENAI_KEY) {
    throw new Error("Missing OPENAI_KEY");
  }

  const client = new OpenAI({
    apiKey: process.env.OPENAI_KEY,
  });

  async function generateWorkflow(
    prompt: string,
    system: string
  ): Promise<string> {
    const completion = await client.chat.completions.create({
      model,
      messages: [
        { role: "system", content: system },
        { role: "user", content: prompt },
      ],
    });

    const text = completion.choices[0].message.content || "{}";
    return text.replace(/```json|```/g, "").trim();
  }

  return { generateWorkflow };
}

import Groq from "groq-sdk";

export function createGroqProvider(model = "llama-3.1-8b-instant") {
  if (!process.env.GROQ_API_KEY) {
    throw new Error("Missing GROQ_API_KEY");
  }

  const client = new Groq({
    apiKey: process.env.GROQ_API_KEY,
  });

  async function generateWorkflow(
    prompt: string,
    system: string
  ): Promise<string> {
    const messages = [
      { role: "system", content: system },
      { role: "user", content: prompt },
    ];

    const completion = await client.chat.completions.create({
      model,
      messages,
      temperature: 0.1,
      max_tokens: 800,
    });

    let text = completion.choices[0].message?.content || "{}";

    // cleanup any accidental markdown
    return text.replace(/```json|```/g, "").trim();
  }

  return { generateWorkflow };
}

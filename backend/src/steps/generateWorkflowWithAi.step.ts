import { ApiRouteConfig, StepHandler } from "motia";
import { getAIProvider } from "../ai/providers/index";
import { nodeCatalog } from "../ai/nodeCatalog";
import { extractJson } from "../lib/extractJson";
import { repairJson } from "../lib/repairJson";
import { systemPrompt } from "../ai/prompts/systemPrompt";
import { schemaPrompt } from "../ai/prompts/schemaPrompt";
import { userPrompt } from "../ai/prompts/userPrompt";

export const config: ApiRouteConfig = {
  name: "generateWorkflow",
  type: "api",
  path: "/workflow/generate",
  method: "POST",
  emits: [],
  flows: ["WorkflowBuilder"],
};

/* ---------------- LABEL DEFAULTS (SAFETY NET) ---------------- */

function capitalize(str: string) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

function defaultLabel(node: any) {
  const c = node.data?.fields?.collection;
  switch (node.type) {
    case "input":
      return "User Input";
    case "inputValidation":
      return "Validate Input";
    case "dbFind":
      return c ? `Find ${capitalize(c)}` : "Find Data";
    case "dbInsert":
      return c ? `Create ${capitalize(c)}` : "Create Data";
    case "dbUpdate":
      return c ? `Update ${capitalize(c)}` : "Update Data";
    case "dbDelete":
      return c ? `Delete ${capitalize(c)}` : "Delete Data";
    case "userLogin":
      return "User Login";
    case "emailSend":
      return "Send Email";
    case "authMiddleware":
      return "Auth Check";
    case "response":
      return "Send Response";
    default:
      return node.type;
  }
}

/* ---------------- ENSURE NODE DEFAULTS ---------------- */

function ensureNodeDefaults(node: any) {
  if (!node.data) node.data = {};
  if (!node.data.fields) node.data.fields = {};

  // ✅ ENSURE LABEL
  if (!node.data.label || typeof node.data.label !== "string") {
    node.data.label = defaultLabel(node);
  }

  return node;
}

/* ---------------- HANDLER ---------------- */

export const handler: StepHandler<typeof config> = async (req) => {
  const { prompt } = req.body;

  if (!prompt) {
    return { status: 400, body: { error: "Prompt required" } };
  }

  const ai = getAIProvider(process.env.AI_PROVIDER || "groq");
  const allowedTypes = nodeCatalog.map((n) => n.type);

  const finalSystem = `
${systemPrompt}

${schemaPrompt}
`.trim();

  const finalUser = userPrompt(prompt, nodeCatalog);

  const raw = await ai.generateWorkflow(finalUser, finalSystem);
  const cleaned = extractJson(raw);
  const repaired = repairJson(cleaned);
  const workflow = JSON.parse(repaired);

  // sanitize + label enforce
  workflow.nodes = workflow.nodes
    .filter((n: any) => allowedTypes.includes(n.type))
    .map(ensureNodeDefaults);

  return {
    status: 200,
    body: {
      ...workflow,
      metadata: {
        generatedAt: new Date().toISOString(),
        prompt: prompt.slice(0, 200),
      },
    },
  };
};

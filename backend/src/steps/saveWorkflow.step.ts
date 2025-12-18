import { ApiRouteConfig, StepHandler } from "motia";
import Workflow from "../models/workflow.model";
import PublishedApi from "../models/publishedApi.model";
import { connectMongo } from "../lib/mongo";

export const config: ApiRouteConfig = {
  name: "saveWorkflow",
  type: "api",
  path: "/workflows/save",
  method: "POST",
  emits: [],
};

export const handler: StepHandler<typeof config> = async (req, ctx) => {
  await connectMongo();
  const { logger } = ctx;

  const { workflowId, ownerId, steps, apiName } = req.body;

  if (!workflowId || !ownerId || !Array.isArray(steps) || !apiName) {
    return {
      status: 400,
      body: { error: "workflowId, ownerId, steps, apiName required" },
    };
  }

  // 🔒 SAFETY: ensure runtime-compatible steps
  for (const step of steps) {
    if (!step.type) {
      return {
        status: 400,
        body: { error: "Invalid workflow step format" },
      };
    }
  }

  // 1️⃣ Save workflow
  const workflow = await Workflow.findOneAndUpdate(
    { workflowId, ownerId },
    { steps },
    { upsert: true, new: true }
  );

  // 2️⃣ Publish API
  const slug = toApiSlug(apiName);
  const path = `/workflow/run/${workflowId}/${slug}`;

  await PublishedApi.findOneAndUpdate(
    { path, ownerId },
    {
      workflowId,
      ownerId,
      name: apiName,
      slug,
      method: "POST",
    },
    { upsert: true, new: true }
  );

  logger.info("✅ Workflow saved & API published", { path });

  return {
    status: 200,
    body: {
      ok: true,
      workflowId,
      api: { path, name: apiName },
    },
  };
};

function toApiSlug(name: string) {
  return name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

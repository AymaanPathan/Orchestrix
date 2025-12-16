import { ApiRouteConfig, StepHandler } from "motia";
import Workflow from "../models/workflow.model";
import { connectMongo } from "../lib/mongo";
import PublishedApi from "src/models/publishedApi.model";

export const config: ApiRouteConfig = {
  name: "saveWorkflow",
  type: "api",
  path: "/workflows/save",
  method: "POST",
  flows: ["WorkflowBuilder"],
  emits: [],
};

export const handler: StepHandler<typeof config> = async (req, ctx) => {
  await connectMongo();
  const { logger } = ctx;

  const { workflowId, ownerId, steps, apiName } = req.body;

  if (!workflowId || !ownerId || !steps || !apiName) {
    return {
      status: 400,
      body: { error: "workflowId, ownerId, steps, apiName required" },
    };
  }

  // 1️⃣ Save workflow
  const workflow = await Workflow.findOneAndUpdate(
    { workflowId, ownerId },
    { steps },
    { upsert: true, new: true }
  );

  // 2️⃣ Generate slug + path
  const apiSlug = toApiSlug(apiName);
  const apiPath = `/workflow/run/${workflowId}/${apiSlug}`;

  // 3️⃣ Save published API
  await PublishedApi.findOneAndUpdate(
    { path: apiPath },
    {
      name: apiName, // original name
      workflowId,
      ownerId,
      method: "POST",
      slug: apiSlug,
    },
    { upsert: true, new: true }
  );

  logger.info("WORKFLOW SAVED & API PUBLISHED", {
    workflowId,
    apiPath,
  });

  return {
    status: 200,
    body: {
      ok: true,
      workflow,
      api: {
        path: apiPath,
        name: apiName,
      },
    },
  };
};

// ------------------ helpers ------------------
function toApiSlug(name: string) {
  return name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

import "../models";
import { ApiRouteConfig, StepHandler } from "motia";
import Workflow from "../models/workflow.model";
import PublishedApi from "../models/publishedApi.model";
import { connectMongo } from "../lib/mongo";
import { runEngine } from "../lib/workflowEngine";

export const config: ApiRouteConfig = {
  name: "runWorkflowPublic",
  type: "api",
  path: "/workflow/run/:workflowId/:apiName",
  method: "POST",
  flows: ["WorkflowRunner"],
  emits: [],
};

export const handler: StepHandler<typeof config> = async (data, ctx) => {
  await connectMongo();
  const { logger } = ctx;

  // 🔑 Path params (Motia provides this)
  const { workflowId, apiName } = data.pathParams || {};

  if (!workflowId) {
    return {
      status: 400,
      body: { error: "workflowId missing in path" },
    };
  }

  // (Optional but recommended) validate API exists
  const api = await PublishedApi.findOne({
    workflowId,
    slug: apiName,
  });

  if (!api) {
    return {
      status: 404,
      body: { error: "API not published or invalid path" },
    };
  }

  // Load workflow
  const workflow = await Workflow.findOne({ workflowId });
  if (!workflow) {
    return {
      status: 404,
      body: { error: "Workflow not found" },
    };
  }

  // Input comes from body
  const input = { ...(data.body || {}) };

  logger.info("Running public workflow", {
    workflowId,
    api: api.name,
    input,
  });

  const result = await runEngine(workflow.steps, input, data.headers);

  return {
    status: 200,
    body: result,
  };
};

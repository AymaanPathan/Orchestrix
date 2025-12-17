import { ApiRouteConfig, StepHandler } from "motia";
import mongoose from "mongoose";
import { connectMongo } from "../lib/mongo";

export const config: ApiRouteConfig = {
  name: "workflowLogs",
  type: "api",
  path: "/workflow/logs",
  method: "POST",
  flows: ["WorkflowRunner"],

  emits: [],
};

export const handler: StepHandler<typeof config> = async (req) => {
  await connectMongo();

  // ✅ SAFE access (Motia merges query into body)
  const executionId = (req.body as any)?.executionId;
  const afterRaw = (req.body as any)?.after;

  if (!executionId) {
    return {
      status: 400,
      body: { error: "executionId required" },
    };
  }

  const afterTs = Number(afterRaw || 0);

  const coll = mongoose.connection.collection("workflow_logs");
  const doc = await coll.findOne({ executionId });

  const logs =
    doc?.logs?.filter((l: any) => new Date(l.at).getTime() > afterTs) || [];

  return {
    status: 200,
    headers: {
      "Cache-Control": "no-store, no-cache, must-revalidate",
    },
    body: {
      logs,
      allLogs: afterTs === 0 ? doc?.logs || [] : undefined,
      finished: doc?.status === "completed",
      timestamp: Date.now(),
    },
  };
};

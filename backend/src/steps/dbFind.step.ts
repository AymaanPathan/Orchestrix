import "../models/user.model.js";
import "../models/workflow.model.js";
import "../models/publishedApi.model.js";

import { EventConfig, StepHandler } from "motia";
import mongoose from "mongoose";
import { connectMongo } from "../lib/mongo";
import { resolveObject } from "../lib/resolveValue.js";

export const config: EventConfig = {
  name: "dbFind",
  type: "event",
  subscribes: ["dbFind"],
  emits: ["workflow.run", "workflow.trace"],
};

export const handler: StepHandler<typeof config> = async (payload, ctx) => {
  await connectMongo();

  const { step, steps, index, vars, executionId } = payload as any;
  const nodeNumber = index; // ✅ SINGLE SOURCE OF TRUTH

  // ✅ Validate collection
  const Model = mongoose.models[step.collection];
  if (!Model) {
    throw new Error(`Model not found at node ${nodeNumber}`);
  }

  // ✅ Resolve filters using vars
  const resolvedFilters = resolveObject(vars, step.filters || {});

  // ✅ Run query
  const result =
    step.findType === "findOne"
      ? await Model.findOne(resolvedFilters)
      : await Model.find(resolvedFilters);

  // ✅ Normalize output variable
  const outputVar = step.outputVar || step.output;
  if (!outputVar) {
    throw new Error(`Missing output variable at node ${nodeNumber}`);
  }

  // ✅ Create next vars snapshot
  const nextVars = {
    ...vars,
    [outputVar]: result,
  };

  // 🔍 TRACE (node-based, not id-based)
  await ctx.emit({
    topic: "workflow.trace",
    data: {
      executionId,
      nodeNumber, // ✅ FIXED
      stepType: "dbFind",
      output: result,
      varsSnapshot: nextVars,
    },
  });

  ctx.logger.info("📦 dbFind executed", {
    executionId,
    nodeNumber,
    collection: step.collection,
  });

  // ▶ Continue workflow
  await ctx.emit({
    topic: "workflow.run",
    data: {
      steps,
      index: index + 1,
      vars: nextVars,
      executionId,
    },
  });
};

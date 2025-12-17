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

  // ✅ Validate collection
  const Model = mongoose.models[step.collection];
  if (!Model) {
    throw new Error(`Model not found: ${step.collection}`);
  }

  // ✅ FIX 1: resolve filters (VERY IMPORTANT)
  const resolvedFilters = resolveObject(vars, step.filters || {});

  // ✅ Run query
  const result =
    step.findType === "findOne"
      ? await Model.findOne(resolvedFilters)
      : await Model.find(resolvedFilters);

  console.log("🟢 DB FIND RESULT:", JSON.stringify(result, null, 2));

  // ✅ FIX 2: normalize output variable
  const outputVar = step.outputVar || step.output;
  if (!outputVar) {
    throw new Error(`Missing outputVar for step ${step.id}`);
  }

  // ✅ FIX 3: create next vars snapshot
  const nextVars = {
    ...vars,
    [outputVar]: result,
  };

  // 🔹 Optional trace (keep for now)
  await ctx.emit({
    topic: "workflow.trace",
    data: {
      executionId,
      stepId: step.id,
      stepType: "dbFind",
      index,
      output: result,
      varsSnapshot: nextVars,
    },
  });

  ctx.logger.info("📦 dbFind result", {
    executionId,
    collection: step.collection,
  });

  // ✅ FIX 4: pass correct vars forward
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

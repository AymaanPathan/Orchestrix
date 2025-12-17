import "../models/user.model.js";
import "../models/workflow.model.js";
import "../models/publishedApi.model.js";

import { EventConfig, StepHandler } from "motia";
import mongoose from "mongoose";
import { connectMongo } from "../lib/mongo";
import { resolveObject } from "../lib/resolveValue";

export const config: EventConfig = {
  name: "dbInsert",
  type: "event",
  subscribes: ["dbInsert"],
  emits: ["workflow.run", "workflow.trace"],
};

export const handler: StepHandler<typeof config> = async (payload, ctx) => {
  await connectMongo();

  const { step, steps, index, vars, executionId } = payload as any;

  // ✅ ENSURE MODEL EXISTS
  const Model = mongoose.models[step.collection];
  if (!Model) {
    throw new Error(`Model not found: ${step.collection}`);
  }

  // ✅ RESOLVE DATA (VERY IMPORTANT)
  const resolvedData = resolveObject(vars, step.data || {});

  // 🟢 INSERT
  const created = await Model.create(resolvedData);

  const outputVar = step.outputVar || step.output || "createdRecord";

  const nextVars = {
    ...vars,
    [outputVar]: created,
  };

  console.log("🟢 DB INSERT CREATED:", created);

  // (optional) trace
  await ctx.emit({
    topic: "workflow.trace",
    data: {
      executionId,
      stepId: step.id,
      stepType: "dbInsert",
      index,
      output: created,
      varsSnapshot: nextVars,
    },
  });

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

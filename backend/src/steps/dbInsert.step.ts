import "../models/user.model.js";
import { EventConfig, StepHandler } from "motia";
import mongoose from "mongoose";

import { connectMongo } from "../lib/mongo";
import { resolveObject } from "../lib/resolveValue";

export const config: EventConfig = {
  name: "dbInsert",
  type: "event",
  subscribes: ["dbInsert"],
  emits: ["workflow.run"],
};

export const handler: StepHandler<typeof config> = async (payload, ctx) => {
  await connectMongo();

  const { step, steps, index, vars, executionId } = payload as any;

  const Model = mongoose.connection.models[step.collection];
  if (!Model) throw new Error("Model not registered");

  const data = resolveObject(vars, step.data || {});
  const created = await Model.create(data);

  console.log(`🟢 [${executionId}] DB INSERT`, created);

  await ctx.emit({
    topic: "workflow.run",
    data: {
      steps,
      index: index + 1,
      vars: { ...vars, [step.output || "created"]: created },
      executionId,
    },
  });
};

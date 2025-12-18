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

export const handler: StepHandler<typeof config> = async (
  payload: any,
  ctx
) => {
  await connectMongo();

  const { collection, data, output, steps, index, vars, executionId } = payload;

  const Model = mongoose.connection.models[collection];
  if (!Model) throw new Error(`Model not registered: ${collection}`);

  const resolvedData = resolveObject(vars, data || {});
  const created = await Model.create(resolvedData);

  console.log(`🟢 [${executionId}] DB INSERT`, created);

  await ctx.emit({
    topic: "workflow.run",
    data: {
      steps,
      index: index + 1,
      vars: {
        ...vars,
        [output || "created"]: created,
      },
      executionId,
    },
  });
};

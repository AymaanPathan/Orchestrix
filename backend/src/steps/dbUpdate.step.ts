import "../models/user.model.js";
import "../models/workflow.model.js";
import "../models/publishedApi.model.js";

import { EventConfig, StepHandler } from "motia";
import { connectMongo } from "../lib/mongo";
import mongoose from "mongoose";
import { resolveObject } from "../lib/resolveValue";

export const config: EventConfig = {
  name: "dbUpdate",
  type: "event",
  subscribes: ["dbUpdate"],
  emits: ["workflow.run"],
};

export const handler: StepHandler<typeof config> = async (
  payload: any,
  ctx
) => {
  await connectMongo();

  const {
    collection,
    updateType = "updateOne",
    filters,
    update,
    output,
    steps,
    index,
    vars,
    executionId,
  } = payload;

  if (!collection) {
    throw new Error("dbUpdate requires collection");
  }

  const Model = mongoose.connection.models[collection];
  if (!Model) {
    throw new Error(`Model not registered: ${collection}`);
  }

  // 🔁 Resolve template variables
  const resolvedFilters = resolveObject(vars, filters || {});
  const resolvedUpdate = resolveObject(vars, update || {});

  let result;
  if (updateType === "updateMany") {
    result = await Model.updateMany(resolvedFilters, {
      $set: resolvedUpdate,
    });
  } else {
    result = await Model.findOneAndUpdate(
      resolvedFilters,
      { $set: resolvedUpdate },
      { new: true }
    );
  }

  console.log(`🟡 [${executionId}] DB UPDATE`, result);

  // 🔁 Continue workflow
  await ctx.emit({
    topic: "workflow.run",
    data: {
      steps,
      index: index + 1,
      vars: {
        ...vars,
        [output || "updated"]: result,
      },
      executionId,
    },
  });
};

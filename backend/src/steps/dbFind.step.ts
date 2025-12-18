import "../models/user.model.js";
import "../models/workflow.model.js";
import "../models/publishedApi.model.js";

import { EventConfig, StepHandler } from "motia";
import mongoose from "mongoose";
import { connectMongo } from "../lib/mongo";
import { resolveObject } from "../lib/resolveValue";

export const config: EventConfig = {
  name: "dbFind",
  type: "event",
  subscribes: ["dbFind"],
  emits: ["workflow.run"],
};

export const handler: StepHandler<typeof config> = async (
  payload: any,
  ctx
) => {
  await connectMongo();

  const {
    collection,
    filters,
    findType = "one", // optional
    output,
    steps,
    index,
    vars,
    executionId,
  } = payload;

  if (!collection) {
    throw new Error("dbFind requires collection");
  }

  const Model = mongoose.connection.models[collection];
  if (!Model) {
    throw new Error(`Model not registered: ${collection}`);
  }

  const resolvedFilters = resolveObject(vars, filters || {});

  let result;
  if (findType === "many") {
    result = await Model.find(resolvedFilters);
  } else {
    result = await Model.findOne(resolvedFilters);
  }

  console.log(`🔍 [${executionId}] DB FIND`, result);

  await ctx.emit({
    topic: "workflow.log",
    data: {
      executionId,
      level: "debug",
      message: `DB FIND result`,
      payload: result,
      step: "dbFind",
      timestamp: Date.now(),
    },
  });

  await ctx.emit({
    topic: "workflow.run",
    data: {
      steps,
      index: index + 1,
      vars: {
        ...vars,
        [output || "found"]: result,
      },
      executionId,
    },
  });
};

import { EventConfig, StepHandler } from "motia";
import { connectMongo } from "../lib/mongo";
import userModel from "../models/user.model";

export const config: EventConfig = {
  name: "dbFind",
  type: "event",
  subscribes: ["workflow.run"],
  emits: ["workflow.step.result"],
};

export const handler: StepHandler<typeof config> = async (payload, ctx) => {
  await connectMongo();

  const { logger, emit } = ctx;
  const { findType, filters, output, input } = payload as any;

  const resolvedFilters: Record<string, any> = {};

  for (const key of Object.keys(filters)) {
    const value = filters[key];

    if (typeof value === "string" && value.startsWith("input.")) {
      const inputKey = value.replace("input.", "");
      resolvedFilters[key] = input?.[inputKey] ?? null;
    } else {
      resolvedFilters[key] = value;
    }
  }

  logger.info("RESOLVED FILTERS", resolvedFilters);

  let result;

  if (findType === "findOne") {
    result = await userModel.findOne(resolvedFilters);
  } else {
    result = await userModel.find(resolvedFilters);
  }

  logger.info("DB FIND RESULT", result);

  await emit({
    topic: "workflow.step.result",
    data: {
      [output]: result,
    },
  });
};

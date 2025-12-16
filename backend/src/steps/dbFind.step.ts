import { EventConfig, StepHandler } from "motia";
import { connectMongo } from "../lib/mongo";
import userModel from "../models/user.model";

export const config: EventConfig = {
  name: "dbFind",
  type: "event",
  subscribes: ["workflow.run"],
  emits: [],
};

export const handler: StepHandler<typeof config> = async (payload, ctx) => {
  await connectMongo();

  const { logger } = ctx;
  const { collection, findType, filters, output, input } = payload;

  logger.info("DB FIND STEP STARTED", payload);

  const resolvedFilters: Record<string, any> = {};

  for (const key of Object.keys(filters)) {
    const value = filters[key];

    // ⭐ convert input.email → actual input value
    if (typeof value === "string" && value.startsWith("input.")) {
      const inputKey = value.replace("input.", "");
      resolvedFilters[key] = input?.[inputKey] ?? null;
    } else {
      resolvedFilters[key] = value;
    }
  }

  logger.info("RESOLVED FILTERS", resolvedFilters);

  let result = null;

  if (findType === "findOne") {
    result = await userModel.findOne(resolvedFilters);
  } else {
    result = await userModel.find(resolvedFilters);
  }

  logger.info("DB FIND RESULT", result);

  return {
    [output]: result,
  };
};

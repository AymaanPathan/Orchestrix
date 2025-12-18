import mongoose from "mongoose";
import { connectMongo } from "../lib/mongo";
import { resolveObject } from "../lib/resolveValue";
import {
  logStepStart,
  logKV,
  logSuccess,
  logError,
} from "../lib/consoleLogger";
import { EventConfig, StepHandler } from "motia";

export const config: EventConfig = {
  name: "dbFind",
  type: "event",
  subscribes: ["dbFind"],
  emits: ["workflow.run"],
};

export const handler: StepHandler<typeof config> = async (payload, ctx) => {
  const start = Date.now();
  const { streams } = ctx;

  const {
    collection,
    filters,
    findType = "findOne",
    output = "result",
    steps,
    index,
    vars,
    executionId,
  } = payload;

  try {
    await connectMongo();

    logStepStart(index, "dbFind");
    logKV("Collection", collection);
    logKV("Raw filters", filters);
    logKV("Vars", vars);

    // ───────── STREAM: START ─────────
    await streams.executionLog.set(executionId, `dbfind-start-${index}`, {
      executionId,
      stepIndex: index,
      stepType: "dbFind",
      phase: "start",
      title: "DB Find started",
      timestamp: Date.now(),
    });

    const resolvedFilters = resolveObject(vars, filters);
    logKV("Resolved filters", resolvedFilters);

    await streams.executionLog.set(executionId, `dbfind-resolved-${index}`, {
      executionId,
      stepIndex: index,
      stepType: "dbFind",
      phase: "data",
      title: "Resolved filters",
      data: resolvedFilters,
      timestamp: Date.now(),
    });

    const Model =
      mongoose.connection.models[collection] ||
      mongoose.connection.models[collection] ||
      mongoose.connection.models[
        collection?.charAt(0).toUpperCase() + collection?.slice(1)
      ];

    if (!Model) {
      throw new Error(`Model not found: ${collection}`);
    }

    const result =
      findType === "many"
        ? await Model.find(resolvedFilters)
        : await Model.findOne(resolvedFilters);

    logKV("Query result", result);

    await streams.executionLog.set(executionId, `dbfind-result-${index}`, {
      executionId,
      stepIndex: index,
      stepType: "dbFind",
      phase: "data",
      title: "Query result",
      data: result,
      timestamp: Date.now(),
    });

    await streams.executionLog.set(executionId, `dbfind-end-${index}`, {
      executionId,
      stepIndex: index,
      stepType: "dbFind",
      phase: "end",
      title: "DB Find completed",
      durationMs: Date.now() - start,
      timestamp: Date.now(),
    });

    logSuccess("dbFind", Date.now() - start);

    await ctx.emit({
      topic: "workflow.run",
      data: {
        steps,
        index: index + 1,
        vars: { ...vars, [output]: result },
        executionId,
      },
    });
  } catch (err) {
    logError("dbFind", err);
    throw err;
  }
};

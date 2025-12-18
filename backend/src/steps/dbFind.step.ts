import "../models/user.model.js";
import "../models/workflow.model.js";
import "../models/publishedApi.model.js";

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

  await connectMongo();

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

  // ───────────────── START ─────────────────
  await streams.executionLog.set(executionId, `dbfind-start-${index}`, {
    executionId,
    stepIndex: index,
    stepType: "dbFind",
    phase: "start",
    title: "DB Find started",
    timestamp: Date.now(),
  });

  // ───────────── METADATA ─────────────
  await streams.executionLog.set(executionId, `dbfind-meta-${index}`, {
    executionId,
    stepIndex: index,
    stepType: "dbFind",
    phase: "data",
    title: "Query metadata",
    data: { collection, findType, rawFilters: filters },
    timestamp: Date.now(),
  });

  const resolvedFilters = resolveObject(vars, filters);

  await streams.executionLog.set(executionId, `dbfind-resolved-${index}`, {
    executionId,
    stepIndex: index,
    stepType: "dbFind",
    phase: "data",
    title: "Resolved filters",
    data: resolvedFilters,
    timestamp: Date.now(),
  });

  const Model = mongoose.connection.models[collection];
  const result =
    findType === "many"
      ? await Model.find(resolvedFilters)
      : await Model.findOne(resolvedFilters);

  await streams.executionLog.set(executionId, `dbfind-result-${index}`, {
    executionId,
    stepIndex: index,
    stepType: "dbFind",
    phase: "data",
    title: "Query result",
    data: result,
    timestamp: Date.now(),
  });

  // ───────────────── END ─────────────────
  await streams.executionLog.set(executionId, `dbfind-end-${index}`, {
    executionId,
    stepIndex: index,
    stepType: "dbFind",
    phase: "end",
    title: "DB Find completed",
    durationMs: Date.now() - start,
    timestamp: Date.now(),
  });

  await ctx.emit({
    topic: "workflow.run",
    data: {
      steps,
      index: index + 1,
      vars: { ...vars, [output]: result },
      executionId,
    },
  });
};

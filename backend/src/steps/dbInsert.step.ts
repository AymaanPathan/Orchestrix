import "../models/user.model.js";
import { EventConfig, StepHandler } from "motia";
import mongoose from "mongoose";
import { connectMongo } from "../lib/mongo";
import { resolveObject } from "../lib/resolveValue";
import {
  logStepStart,
  logKV,
  logSuccess,
  logError,
} from "../lib/consoleLogger";

export const config: EventConfig = {
  name: "dbInsert",
  type: "event",
  subscribes: ["dbInsert"],
  emits: ["workflow.run"],
};

export const handler: StepHandler<typeof config> = async (payload, ctx) => {
  const startedAt = Date.now();
  const { streams } = ctx;

  const { collection, data, output, steps, index, vars, executionId } = payload;

  try {
    await connectMongo();

    // ───────────────── CONSOLE LOGS ─────────────────
    logStepStart(index, "dbInsert");
    logKV("Collection", collection);
    logKV("Raw insert payload", data);
    logKV("Vars", vars);

    // ───────────────── STREAM: START ─────────────────
    await streams.executionLog.set(executionId, `dbinsert-start-${index}`, {
      executionId,
      stepIndex: index,
      stepType: "dbInsert",
      phase: "start",
      title: "DB Insert started",
      timestamp: Date.now(),
    });

    // ───────────────── MODEL VALIDATION ─────────────────
    const Model = mongoose.connection.models[collection];
    if (!Model) {
      throw new Error(`Model not registered: ${collection}`);
    }

    // ───────────────── RESOLVE PAYLOAD ─────────────────
    const resolved = resolveObject(vars, data || {});
    logKV("Resolved payload", resolved);

    // 🔥 CRITICAL FIX — UNWRAP `data`
    const insertDoc =
      resolved &&
      typeof resolved === "object" &&
      "data" in resolved &&
      typeof resolved.data === "object"
        ? resolved.data
        : resolved;

    logKV("Final insert document", insertDoc);

    // ───────────────── SAFETY GUARDS ─────────────────
    if (
      !insertDoc ||
      typeof insertDoc !== "object" ||
      Object.keys(insertDoc).length === 0
    ) {
      throw new Error("dbInsert: insert document is empty after resolution");
    }

    // ───────────────── STREAM: RESOLVED DATA ─────────────────
    await streams.executionLog.set(executionId, `dbinsert-resolved-${index}`, {
      executionId,
      stepIndex: index,
      stepType: "dbInsert",
      phase: "data",
      title: "Resolved insert document",
      data: insertDoc,
      timestamp: Date.now(),
    });

    // ───────────────── INSERT ─────────────────
    const created = await Model.create(insertDoc);

    logKV("Insert result", created);

    // ───────────────── STREAM: RESULT ─────────────────
    await streams.executionLog.set(executionId, `dbinsert-result-${index}`, {
      executionId,
      stepIndex: index,
      stepType: "dbInsert",
      phase: "data",
      title: "Insert result",
      data: created,
      timestamp: Date.now(),
    });

    // ───────────────── STREAM: END ─────────────────
    await streams.executionLog.set(executionId, `dbinsert-end-${index}`, {
      executionId,
      stepIndex: index,
      stepType: "dbInsert",
      phase: "end",
      title: "DB Insert completed",
      durationMs: Date.now() - startedAt,
      timestamp: Date.now(),
    });

    logSuccess("dbInsert", Date.now() - startedAt);

    // ───────────────── CONTINUE WORKFLOW ─────────────────
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
  } catch (err) {
    logError("dbInsert", err);

    await streams.executionLog.set(executionId, `dbinsert-error-${index}`, {
      executionId,
      stepIndex: index,
      stepType: "dbInsert",
      phase: "error",
      title: "DB Insert failed",
      data: { message: String(err) },
      timestamp: Date.now(),
    });

    throw err;
  }
};

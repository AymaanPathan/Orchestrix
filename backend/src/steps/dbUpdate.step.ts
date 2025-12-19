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
import { getModel } from "../lib/getModel";

export const config: EventConfig = {
  name: "dbUpdate",
  type: "event",
  subscribes: ["dbUpdate"],
  emits: ["workflow.run"],
};

export const handler: StepHandler<typeof config> = async (payload, ctx) => {
  const startedAt = Date.now();
  const { streams } = ctx;

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

  try {
    await connectMongo();

    // ───────────────── CONSOLE LOGS ─────────────────
    logStepStart(index, "dbUpdate");
    logKV("Collection", collection);
    logKV("Update type", updateType);
    logKV("Raw filters", filters);
    logKV("Raw update payload", update);
    logKV("Vars", vars);

    // ───────────────── STREAM: START ─────────────────
    await streams.executionLog.set(executionId, `dbupdate-start-${index}`, {
      executionId,
      stepIndex: index,
      stepType: "dbUpdate",
      phase: "start",
      title: "DB Update started",
      timestamp: Date.now(),
    });

    // ───────────────── VALIDATION ─────────────────
    if (!collection) {
      throw new Error("dbUpdate requires collection");
    }
    const Model = getModel(collection);
    if (!Model) {
      throw new Error(`Model not found: ${collection}`);
    }

    // ───────────────── RESOLVE FILTERS ─────────────────
    const resolvedFilters = resolveObject(vars, filters || {});
    logKV("Resolved filters", resolvedFilters);

    await streams.executionLog.set(executionId, `dbupdate-filters-${index}`, {
      executionId,
      stepIndex: index,
      stepType: "dbUpdate",
      phase: "data",
      title: "Resolved filters",
      data: resolvedFilters,
      timestamp: Date.now(),
    });

    // ───────────────── RESOLVE UPDATE ─────────────────
    const resolved = resolveObject(vars, update || {});
    logKV("Resolved update payload", resolved);

    // 🔥 CRITICAL FIX — UNWRAP `data`
    const updateDoc =
      resolved &&
      typeof resolved === "object" &&
      "data" in resolved &&
      typeof resolved.data === "object"
        ? resolved.data
        : resolved;

    logKV("Final update document", updateDoc);

    if (
      !updateDoc ||
      typeof updateDoc !== "object" ||
      Object.keys(updateDoc).length === 0
    ) {
      throw new Error("dbUpdate: update document is empty after resolution");
    }

    await streams.executionLog.set(executionId, `dbupdate-update-${index}`, {
      executionId,
      stepIndex: index,
      stepType: "dbUpdate",
      phase: "data",
      title: "Resolved update document",
      data: updateDoc,
      timestamp: Date.now(),
    });

    // ───────────────── UPDATE ─────────────────
    let result;

    if (updateType === "updateMany") {
      result = await Model.updateMany(resolvedFilters, {
        $set: updateDoc,
      });
    } else {
      result = await Model.findOneAndUpdate(
        resolvedFilters,
        { $set: updateDoc },
        { new: true }
      );
    }

    logKV("Update result", result);

    await streams.executionLog.set(executionId, `dbupdate-result-${index}`, {
      executionId,
      stepIndex: index,
      stepType: "dbUpdate",
      phase: "data",
      title: "Update result",
      data: result,
      timestamp: Date.now(),
    });

    // ───────────────── STREAM: END ─────────────────
    await streams.executionLog.set(executionId, `dbupdate-end-${index}`, {
      executionId,
      stepIndex: index,
      stepType: "dbUpdate",
      phase: "end",
      title: "DB Update completed",
      durationMs: Date.now() - startedAt,
      timestamp: Date.now(),
    });

    logSuccess("dbUpdate", Date.now() - startedAt);

    // ───────────────── CONTINUE WORKFLOW ─────────────────
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
  } catch (err) {
    logError("dbUpdate", err);

    await streams.executionLog.set(executionId, `dbupdate-error-${index}`, {
      executionId,
      stepIndex: index,
      stepType: "dbUpdate",
      phase: "error",
      title: "DB Update failed",
      data: { message: String(err) },
      timestamp: Date.now(),
    });

    throw err;
  }
};

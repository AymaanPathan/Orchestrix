import { EventConfig, StepHandler } from "motia";
import { resolveObject } from "../lib/resolveValue";
import {
  logStepStart,
  logKV,
  logSuccess,
  logError,
} from "../lib/consoleLogger";
import {
  logStepStart as logStepStartStream,
  logStepInfo,
  logStepData,
  logStepSuccess,
  logStepError,
  logExecutionFinished,
  logExecutionFailed,
} from "../lib/logStep";
import { getUserModel } from "../lib/getUserModel";

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
  } = payload as any;

  const ownerId = (payload as any).ownerId || "default-owner";
  const totalSteps = steps?.length || 0;
  const isLastStep = index >= totalSteps - 1;
  const stepId = `dbupdate-${index}`;

  try {
    // ── Get model on USER's database ──────────────────────────────────────
    const Model = await getUserModel(ownerId, collection);

    logStepStart(index, "dbUpdate");
    logKV("Collection", collection);
    logKV("Update type", updateType);
    logKV("Raw filters", filters);
    logKV("Raw update payload", update);
    logKV("Vars", vars);

    await logStepStartStream(streams, {
      executionId,
      stepId,
      stepIndex: index,
      stepType: "dbUpdate",
      totalSteps,
      message: `Updating "${collection}" collection`,
      input: { collection, filters, update, updateType },
    });

    if (!collection) {
      throw new Error("dbUpdate requires collection");
    }

    // ── Resolve filters ──────────────────────────────────────────────────
    await logStepInfo(streams, {
      executionId,
      stepId,
      stepIndex: index,
      stepType: "dbUpdate",
      title: "Resolving query filters",
      message: "Processing and resolving filter parameters...",
      data: { rawFilters: filters },
    });

    const resolvedFilters = resolveObject(vars, filters || {});
    logKV("Resolved filters", resolvedFilters);

    await logStepData(streams, {
      executionId,
      stepId,
      stepIndex: index,
      stepType: "dbUpdate",
      title: "Filters resolved",
      message: `Using ${Object.keys(resolvedFilters || {}).length} filter condition(s)`,
      data: resolvedFilters,
    });

    // ── Resolve update document ──────────────────────────────────────────
    await logStepInfo(streams, {
      executionId,
      stepId,
      stepIndex: index,
      stepType: "dbUpdate",
      title: "Resolving update document",
      message: "Processing and resolving update payload...",
      data: { rawUpdate: update },
    });

    const resolved = resolveObject(vars, update || {});
    logKV("Resolved update payload", resolved);

    // Unwrap nested `data` key if AI generated it that way
    const updateDoc =
      resolved &&
      typeof resolved === "object" &&
      "data" in resolved &&
      typeof (resolved as any).data === "object"
        ? (resolved as any).data
        : resolved;

    logKV("Final update document", updateDoc);

    if (
      !updateDoc ||
      typeof updateDoc !== "object" ||
      Object.keys(updateDoc).length === 0
    ) {
      throw new Error("dbUpdate: update document is empty after resolution");
    }

    const fieldCount = Object.keys(updateDoc).length;

    await logStepData(streams, {
      executionId,
      stepId,
      stepIndex: index,
      stepType: "dbUpdate",
      title: "Update document resolved",
      message: `Document has ${fieldCount} field(s) to update`,
      data: updateDoc,
      metadata: { fieldCount, fields: Object.keys(updateDoc) },
    });

    // ── Execute update ───────────────────────────────────────────────────
    await logStepInfo(streams, {
      executionId,
      stepId,
      stepIndex: index,
      stepType: "dbUpdate",
      title: "Executing update",
      message: `Running ${updateType === "updateMany" ? "updateMany()" : "findOneAndUpdate()"}...`,
      data: { updateType, filters: resolvedFilters },
    });

    let result;
    if (updateType === "updateMany") {
      result = await Model.updateMany(resolvedFilters, { $set: updateDoc });
    } else {
      result = await Model.findOneAndUpdate(
        resolvedFilters,
        { $set: updateDoc },
        { new: true },
      );
    }

    logKV("Update result", result);

    await logStepData(streams, {
      executionId,
      stepId,
      stepIndex: index,
      stepType: "dbUpdate",
      title: "Update executed successfully",
      message:
        updateType === "updateMany"
          ? `Updated ${(result as any)?.modifiedCount ?? 0} record(s)`
          : `Record updated with ID: ${(result as any)?._id ?? "N/A"}`,
      data: result,
      metadata: { updateType, collection, outputVariable: output || "updated" },
    });

    await logStepSuccess(streams, {
      executionId,
      stepId,
      stepIndex: index,
      stepType: "dbUpdate",
      totalSteps,
      message: `DB update on "${collection}" completed successfully`,
      output: result,
      data: result,
      metadata: { updateType, collection },
      startedAt,
    });

    logSuccess("dbUpdate", Date.now() - startedAt);

    if (isLastStep) {
      await logExecutionFinished(streams, {
        executionId,
        totalSteps,
        startedAt,
      });
    }

    await ctx.emit({
      topic: "workflow.run",
      data: {
        steps,
        index: index + 1,
        vars: { ...vars, [output || "updated"]: result },
        executionId,
        ownerId,
      },
    });
  } catch (err) {
    logError("dbUpdate", err);

    await logStepError(streams, {
      executionId,
      stepId,
      stepIndex: index,
      stepType: "dbUpdate",
      totalSteps,
      error: String(err),
      data: { collection, updateType, filters, update },
      startedAt,
    });

    await logExecutionFailed(streams, {
      executionId,
      failedStepIndex: index,
      totalSteps,
      error: String(err),
    });

    throw err;
  }
};

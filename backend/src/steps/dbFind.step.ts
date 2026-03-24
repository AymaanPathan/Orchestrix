import { resolveObject } from "../lib/resolveValue";
import {
  logStepStart,
  logKV,
  logSuccess,
  logError,
} from "../lib/consoleLogger";
import { EventConfig, StepHandler } from "motia";
import {
  logStepStart as logStepStartStream,
  logStepInfo,
  logStepData,
  logStepSuccess,
  logStepError,
  logExecutionFinished,
  logExecutionFailed,
} from "../lib/logStep";
import { getUserModel } from "../lib/getUserModel.js";

export const config: EventConfig = {
  name: "dbFind",
  type: "event",
  subscribes: ["dbFind"],
  emits: ["workflow.run"],
};

export const handler: StepHandler<typeof config> = async (payload, ctx) => {
  const startedAt = Date.now();
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
  } = payload as {
    collection: string;
    filters: Record<string, any>;
    findType?: "findOne" | "many";
    output?: string;
    steps: any[];
    index: number;
    vars: Record<string, any>;
    executionId: string;
  };

  const ownerId = (payload as any).ownerId || "default-owner";
  const totalSteps = steps?.length || 0;
  const isLastStep = index >= totalSteps - 1;
  const stepId = `dbfind-${index}`;

  try {
    // ── Get model on USER's database ──────────────────────────────────────
    const Model = await getUserModel(ownerId, collection);

    // Console logs
    logStepStart(index, "dbFind");
    logKV("Collection", collection);
    logKV("Raw filters", filters);
    logKV("Vars", vars);

    await logStepStartStream(streams, {
      executionId,
      stepId,
      stepIndex: index,
      stepType: "dbFind",
      totalSteps,
      message: `Querying "${collection}" collection`,
      input: { collection, filters, findType },
    });

    await logStepInfo(streams, {
      executionId,
      stepId,
      stepIndex: index,
      stepType: "dbFind",
      title: "Connecting to database",
      message: "Establishing MongoDB connection...",
    });

    await logStepInfo(streams, {
      executionId,
      stepId,
      stepIndex: index,
      stepType: "dbFind",
      title: "Resolving query filters",
      message: "Processing and resolving filter parameters...",
      data: { rawFilters: filters },
    });

    const resolvedFilters = resolveObject(vars, filters);
    logKV("Resolved filters", resolvedFilters);

    await logStepData(streams, {
      executionId,
      stepId,
      stepIndex: index,
      stepType: "dbFind",
      title: "Filters resolved successfully",
      message: `Query will use ${Object.keys(resolvedFilters || {}).length} filter condition(s)`,
      data: resolvedFilters,
    });

    await logStepInfo(streams, {
      executionId,
      stepId,
      stepIndex: index,
      stepType: "dbFind",
      title: "Collection model found",
      message: `Successfully located "${collection}" model`,
    });

    await logStepInfo(streams, {
      executionId,
      stepId,
      stepIndex: index,
      stepType: "dbFind",
      title: "Executing database query",
      message: `Running ${findType === "many" ? "find()" : "findOne()"} query...`,
      data: { findType, filters: resolvedFilters },
    });

    const result =
      findType === "many"
        ? await Model.find(resolvedFilters).lean()
        : await Model.findOne(resolvedFilters).lean();

    logKV("Query result", result);

    const resultCount = Array.isArray(result) ? result.length : result ? 1 : 0;

    await logStepData(streams, {
      executionId,
      stepId,
      stepIndex: index,
      stepType: "dbFind",
      title: "Query executed successfully",
      message: `Found ${resultCount} record${resultCount !== 1 ? "s" : ""}`,
      data: result,
      metadata: {
        recordCount: resultCount,
        findType,
        outputVariable: output,
        collection,
      },
    });

    await logStepSuccess(streams, {
      executionId,
      stepId,
      stepIndex: index,
      stepType: "dbFind",
      totalSteps,
      message: `Database query completed successfully`,
      output: result,
      data: result,
      metadata: { recordCount: resultCount, collection, findType },
      startedAt,
    });

    logSuccess("dbFind", Date.now() - startedAt);

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
        vars: { ...vars, [output]: result },
        executionId,
        ownerId,
      },
    });
  } catch (err) {
    logError("dbFind", err);

    await logStepError(streams, {
      executionId,
      stepId,
      stepIndex: index,
      stepType: "dbFind",
      totalSteps,
      error: String(err),
      data: { collection, findType, filters },
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

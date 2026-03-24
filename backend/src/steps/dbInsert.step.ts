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
  name: "dbInsert",
  type: "event",
  subscribes: ["dbInsert"],
  emits: ["workflow.run"],
};

export const handler: StepHandler<typeof config> = async (payload, ctx) => {
  const startedAt = Date.now();
  const { streams } = ctx;

  const { collection, data, output, steps, index, vars, executionId } =
    payload as {
      collection: string;
      data: Record<string, any>;
      output?: string;
      steps: any[];
      index: number;
      vars: Record<string, any>;
      executionId: string;
    };

  const ownerId = (payload as any).ownerId || "default-owner";
  const totalSteps = steps?.length || 0;
  const isLastStep = index >= totalSteps - 1;
  const stepId = `dbinsert-${index}`;

  try {
    // ── Get model on USER's database ──────────────────────────────────────
    const Model = await getUserModel(ownerId, collection);

    logStepStart(index, "dbInsert");
    logKV("Collection", collection);
    logKV("Raw insert payload", data);
    logKV("Vars", vars);

    await logStepStartStream(streams, {
      executionId,
      stepId,
      stepIndex: index,
      stepType: "dbInsert",
      totalSteps,
      message: `Inserting document into "${collection}" collection`,
      input: { collection, data },
    });

    await logStepInfo(streams, {
      executionId,
      stepId,
      stepIndex: index,
      stepType: "dbInsert",
      title: "Connecting to database",
      message: "Establishing MongoDB connection...",
    });

    await logStepInfo(streams, {
      executionId,
      stepId,
      stepIndex: index,
      stepType: "dbInsert",
      title: "Collection model found",
      message: `Successfully located "${collection}" model`,
    });

    await logStepInfo(streams, {
      executionId,
      stepId,
      stepIndex: index,
      stepType: "dbInsert",
      title: "Resolving insert document",
      message: "Processing and resolving insert payload...",
      data: { rawData: data },
    });

    const resolved = resolveObject(vars, data || {});
    logKV("Resolved payload", resolved);

    // Unwrap nested `data` key if AI generated it that way
    const insertDoc =
      resolved &&
      typeof resolved === "object" &&
      "data" in resolved &&
      typeof resolved.data === "object"
        ? resolved.data
        : resolved;

    logKV("Final insert document", insertDoc);

    if (
      !insertDoc ||
      typeof insertDoc !== "object" ||
      Object.keys(insertDoc).length === 0
    ) {
      throw new Error("dbInsert: insert document is empty after resolution");
    }

    const fieldCount = Object.keys(insertDoc).length;

    await logStepData(streams, {
      executionId,
      stepId,
      stepIndex: index,
      stepType: "dbInsert",
      title: "Insert document resolved successfully",
      message: `Document ready with ${fieldCount} field${fieldCount !== 1 ? "s" : ""}`,
      data: insertDoc,
      metadata: { fieldCount, fields: Object.keys(insertDoc) },
    });

    await logStepInfo(streams, {
      executionId,
      stepId,
      stepIndex: index,
      stepType: "dbInsert",
      title: "Inserting document",
      message: "Creating new record in database...",
    });

    const created = (await Model.create(insertDoc)) as any;
    logKV("Insert result", created);

    await logStepData(streams, {
      executionId,
      stepId,
      stepIndex: index,
      stepType: "dbInsert",
      title: "Document inserted successfully",
      message: `New record created with ID: ${created._id || "N/A"}`,
      data: created,
      metadata: {
        insertedId: created._id,
        collection,
        outputVariable: output || "created",
      },
    });

    await logStepSuccess(streams, {
      executionId,
      stepId,
      stepIndex: index,
      stepType: "dbInsert",
      totalSteps,
      message: `Document inserted into "${collection}" successfully`,
      output: created,
      data: created,
      metadata: { insertedId: created._id, collection, fieldCount },
      startedAt,
    });

    logSuccess("dbInsert", Date.now() - startedAt);

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
        vars: { ...vars, [output || "created"]: created },
        executionId,
        ownerId,
      },
    });
  } catch (err) {
    logError("dbInsert", err);

    await logStepError(streams, {
      executionId,
      stepId,
      stepIndex: index,
      stepType: "dbInsert",
      totalSteps,
      error: String(err),
      data: { collection, attemptedData: data },
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

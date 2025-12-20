import { EventConfig, StepHandler } from "motia";
import { connectMongo } from "../lib/mongo";
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
import { getModel } from "../lib/getModel";

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

  const totalSteps = steps?.length || 0;
  const isLastStep = index >= totalSteps - 1;
  const stepId = `dbinsert-${index}`;

  try {
    await connectMongo();

    // Console logs
    logStepStart(index, "dbInsert");
    logKV("Collection", collection);
    logKV("Raw insert payload", data);
    logKV("Vars", vars);

    // ───────────────── STREAM: STEP STARTED ─────────────────
    await logStepStartStream(streams, {
      executionId,
      stepId,
      stepIndex: index,
      stepType: "dbInsert",
      totalSteps,
      message: `Inserting document into "${collection}" collection`,
      input: { collection, data },
    });

    // ───────────────── STREAM: CONNECTING ─────────────────
    await logStepInfo(streams, {
      executionId,
      stepId,
      stepIndex: index,
      stepType: "dbInsert",
      title: "Connecting to database",
      message: "Establishing MongoDB connection...",
    });

    // ───────────────── STREAM: LOCATING MODEL ─────────────────
    await logStepInfo(streams, {
      executionId,
      stepId,
      stepIndex: index,
      stepType: "dbInsert",
      title: "Locating collection model",
      message: `Looking for model: ${collection}`,
    });

    const Model = getModel(collection);

    // ───────────────── STREAM: MODEL FOUND ─────────────────
    await logStepInfo(streams, {
      executionId,
      stepId,
      stepIndex: index,
      stepType: "dbInsert",
      title: "Collection model found",
      message: `Successfully located "${collection}" model`,
    });

    // ───────────────── STREAM: RESOLVING PAYLOAD ─────────────────
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

    // ───────────────── STREAM: DOCUMENT RESOLVED ─────────────────
    const fieldCount = Object.keys(insertDoc).length;
    await logStepData(streams, {
      executionId,
      stepId,
      stepIndex: index,
      stepType: "dbInsert",
      title: "Insert document resolved successfully",
      message: `Document ready with ${fieldCount} field${
        fieldCount !== 1 ? "s" : ""
      }`,
      data: insertDoc,
      metadata: {
        fieldCount,
        fields: Object.keys(insertDoc),
      },
    });

    // ───────────────── STREAM: INSERTING ─────────────────
    await logStepInfo(streams, {
      executionId,
      stepId,
      stepIndex: index,
      stepType: "dbInsert",
      title: "Inserting document",
      message: "Creating new record in database...",
    });

    const created = await Model.create(insertDoc);

    logKV("Insert result", created);

    // ───────────────── STREAM: INSERT RESULT ─────────────────
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

    // ───────────────── STREAM: STEP FINISHED ─────────────────
    await logStepSuccess(streams, {
      executionId,
      stepId,
      stepIndex: index,
      stepType: "dbInsert",
      totalSteps,
      message: `Document inserted into "${collection}" successfully`,
      output: created,
      data: created,
      metadata: {
        insertedId: created._id,
        collection,
        fieldCount,
      },
      startedAt,
    });

    logSuccess("dbInsert", Date.now() - startedAt);

    // ───────────────── STREAM: EXECUTION FINISHED (if last step) ─────────────────
    if (isLastStep) {
      await logExecutionFinished(streams, {
        executionId,
        totalSteps,
        startedAt,
      });
    }

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

    // ───────────────── STREAM: STEP ERROR ─────────────────
    await logStepError(streams, {
      executionId,
      stepId,
      stepIndex: index,
      stepType: "dbInsert",
      totalSteps,
      error: String(err),
      data: {
        collection,
        attemptedData: data,
      },
      startedAt,
    });

    // ───────────────── STREAM: EXECUTION FAILED ─────────────────
    await logExecutionFailed(streams, {
      executionId,
      failedStepIndex: index,
      totalSteps,
      error: String(err),
    });

    throw err;
  }
};

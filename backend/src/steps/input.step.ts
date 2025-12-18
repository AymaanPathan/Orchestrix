import { EventConfig, StepHandler } from "motia";
import {
  logStepStart,
  logKV,
  logSuccess,
  logError,
} from "../lib/consoleLogger";

export const config: EventConfig = {
  name: "input",
  type: "event",
  subscribes: ["input"],
  emits: ["workflow.run"],
};

export const handler: StepHandler<typeof config> = async (payload, ctx) => {
  const start = Date.now();
  const { streams } = ctx;

  const { data, vars = {}, steps, index, executionId } = payload;

  try {
    logStepStart(index, "input");
    logKV("Raw variables config", data?.variables);
    logKV("Incoming vars.input", vars.input);

    // ───────── STREAM: START ─────────
    await streams.executionLog.set(executionId, `input-start-${index}`, {
      executionId,
      stepIndex: index,
      stepType: "input",
      phase: "start",
      title: "Input step started",
      timestamp: Date.now(),
    });

    const resolvedInput: any = {};
    for (const v of data.variables || []) {
      resolvedInput[v.name] = vars.input?.[v.name] ?? v.default ?? null;
    }

    logKV("Resolved input", resolvedInput);

    // ───────── STREAM: DATA ─────────
    await streams.executionLog.set(executionId, `input-resolved-${index}`, {
      executionId,
      stepIndex: index,
      stepType: "input",
      phase: "data",
      title: "Resolved input values",
      data: resolvedInput,
      timestamp: Date.now(),
    });

    // ───────── STREAM: END ─────────
    await streams.executionLog.set(executionId, `input-end-${index}`, {
      executionId,
      stepIndex: index,
      stepType: "input",
      phase: "end",
      title: "Input completed",
      durationMs: Date.now() - start,
      timestamp: Date.now(),
    });

    logSuccess("input", Date.now() - start);

    await ctx.emit({
      topic: "workflow.run",
      data: {
        steps,
        index: index + 1,
        vars: { ...vars, input: resolvedInput },
        executionId,
      },
    });
  } catch (err) {
    logError("input", err);
    throw err;
  }
};

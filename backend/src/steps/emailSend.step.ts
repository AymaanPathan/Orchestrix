import { EventConfig, StepHandler } from "motia";
import { sendEmail } from "../lib/email";
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

export const config: EventConfig = {
  name: "emailSend",
  type: "event",
  subscribes: ["emailSend"],
  emits: ["workflow.run"],
};

export const handler: StepHandler<typeof config> = async (payload, ctx) => {
  const startedAt = Date.now();
  const { streams } = ctx;

  const { to, subject, body, output, steps, index, vars, executionId } =
    payload;

  const totalSteps = steps?.length || 0;
  const isLastStep = index >= totalSteps - 1;
  const stepId = `emailsend-${index}`;

  try {
    // Console logs
    logStepStart(index, "emailSend");
    logKV("Raw recipient", to);
    logKV("Raw subject", subject);
    logKV("Raw body", body);
    logKV("Vars", vars);

    // ───────────────── STREAM: STEP STARTED ─────────────────
    await logStepStartStream(streams, {
      executionId,
      stepId,
      stepIndex: index,
      stepType: "emailSend",
      totalSteps,
      message: "Preparing to send email",
      input: { to, subject, body: body?.substring(0, 100) + "..." },
    });

    // ───────────────── STREAM: RESOLVING VARIABLES ─────────────────
    await logStepInfo(streams, {
      executionId,
      stepId,
      stepIndex: index,
      stepType: "emailSend",
      title: "Resolving email variables",
      message: "Processing template variables in email fields...",
      data: { rawTo: to, rawSubject: subject },
    });

    // 🔁 Resolve {{variables}} using runtime vars
    const resolvedTo = resolveObject(vars, to);
    const resolvedSubject = resolveObject(vars, subject);
    const resolvedBody = resolveObject(vars, body);

    logKV("Resolved recipient", resolvedTo);
    logKV("Resolved subject", resolvedSubject);

    // ───────────────── STREAM: VARIABLES RESOLVED ─────────────────
    await logStepData(streams, {
      executionId,
      stepId,
      stepIndex: index,
      stepType: "emailSend",
      title: "Email content resolved",
      message: `Email will be sent to: ${resolvedTo}`,
      data: {
        to: resolvedTo,
        subject: resolvedSubject,
        bodyPreview: resolvedBody?.substring(0, 100) + "...",
      },
    });

    // ───────────────── STREAM: VALIDATION ─────────────────
    await logStepInfo(streams, {
      executionId,
      stepId,
      stepIndex: index,
      stepType: "emailSend",
      title: "Validating email fields",
      message: "Checking required fields...",
    });

    if (!resolvedTo || !resolvedSubject || !resolvedBody) {
      throw new Error("emailSend requires to, subject, body");
    }

    // ───────────────── STREAM: SENDING EMAIL ─────────────────
    await logStepInfo(streams, {
      executionId,
      stepId,
      stepIndex: index,
      stepType: "emailSend",
      title: "Sending email",
      message: `Sending email to ${resolvedTo}...`,
      data: {
        recipient: resolvedTo,
        subject: resolvedSubject,
      },
    });

    const result = await sendEmail({
      to: resolvedTo,
      subject: resolvedSubject,
      body: resolvedBody,
    });

    if (!result.success) {
      throw new Error(result.error || "Email sending failed");
    }

    logKV("Email result", result);

    // ───────────────── STREAM: EMAIL SENT ─────────────────
    await logStepData(streams, {
      executionId,
      stepId,
      stepIndex: index,
      stepType: "emailSend",
      title: "Email sent successfully",
      message: `Email delivered to ${resolvedTo}`,
      data: {
        success: true,
        messageId: result.messageId,
        recipient: resolvedTo,
        subject: resolvedSubject,
      },
      metadata: {
        messageId: result.messageId,
        outputVariable: output || "emailResult",
      },
    });

    const emailResult = {
      success: true,
      messageId: result.messageId,
      to: resolvedTo,
      subject: resolvedSubject,
    };

    // ───────────────── STREAM: STEP FINISHED ─────────────────
    await logStepSuccess(streams, {
      executionId,
      stepId,
      stepIndex: index,
      stepType: "emailSend",
      totalSteps,
      message: "Email step completed successfully",
      output: emailResult,
      data: emailResult,
      metadata: {
        messageId: result.messageId,
        recipient: resolvedTo,
      },
      startedAt,
    });

    logSuccess("emailSend", Date.now() - startedAt);

    // ───────────────── STREAM: EXECUTION FINISHED (if last step) ─────────────────
    if (isLastStep) {
      await logExecutionFinished(streams, {
        executionId,
        totalSteps,
        startedAt,
      });
    }

    // 🔁 Continue workflow
    await ctx.emit({
      topic: "workflow.run",
      data: {
        steps,
        index: index + 1,
        vars: {
          ...vars,
          [output || "emailResult"]: emailResult,
        },
        executionId,
      },
    });
  } catch (err) {
    logError("emailSend", err);

    // ───────────────── STREAM: STEP ERROR ─────────────────
    await logStepError(streams, {
      executionId,
      stepId,
      stepIndex: index,
      stepType: "emailSend",
      totalSteps,
      error: String(err),
      data: {
        to,
        subject,
        bodyPreview: body?.substring(0, 100),
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

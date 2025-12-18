import { EventConfig, StepHandler } from "motia";
import { sendEmail } from "../lib/email";
import { resolveObject } from "../lib/resolveValue";

export const config: EventConfig = {
  name: "emailSend",
  type: "event",
  subscribes: ["emailSend"],
  emits: ["workflow.run"],
};

export const handler: StepHandler<typeof config> = async (
  payload: any,
  ctx
) => {
  const { to, subject, body, output, steps, index, vars, executionId } =
    payload;

  // 🔁 Resolve {{variables}} using runtime vars
  const resolvedTo = resolveObject(vars, to);
  const resolvedSubject = resolveObject(vars, subject);
  const resolvedBody = resolveObject(vars, body);

  if (!resolvedTo || !resolvedSubject || !resolvedBody) {
    throw new Error("emailSend requires to, subject, body");
  }

  console.log(`📧 [${executionId}] Sending email`, {
    to: resolvedTo,
    subject: resolvedSubject,
  });

  const result = await sendEmail({
    to: resolvedTo,
    subject: resolvedSubject,
    body: resolvedBody,
  });

  if (!result.success) {
    throw new Error(result.error || "Email sending failed");
  }

  console.log(`✅ [${executionId}] Email sent`, {
    messageId: result.messageId,
  });

  // 🔁 Continue workflow
  await ctx.emit({
    topic: "workflow.run",
    data: {
      steps,
      index: index + 1,
      vars: {
        ...vars,
        [output || "emailResult"]: {
          success: true,
          messageId: result.messageId,
        },
      },
      executionId,
    },
  });
};

import { StreamConfig } from "motia";
import { z } from "zod";

export const executionLogSchema = z.object({
  id: z.string().optional(),
  executionId: z.string(),
  step: z.string().optional(),
  stepId: z.string().optional(),
  stepIndex: z.number().optional(),
  stepType: z.string().optional(),
  phase: z
    .enum([
      "start",
      "data",
      "result",
      "error",
      "end",
      "step_started",
      "step_finished",
      "execution_finished",
      "execution_failed",
    ])
    .optional(),
  level: z.string().optional(),
  title: z.string().optional(),
  message: z.string(),
  payload: z.any().optional(),
  input: z.any().optional(),
  output: z.any().optional(),
  data: z.any().optional(),
  metadata: z.any().optional(),
  index: z.number().optional(),
  totalSteps: z.number().optional(),
  durationMs: z.number().optional(),
  startedAt: z.number().optional(),
  timestamp: z.number(),
});

export const config: StreamConfig = {
  name: "executionLog",
  schema: executionLogSchema,
  baseConfig: { storageType: "default" },
};

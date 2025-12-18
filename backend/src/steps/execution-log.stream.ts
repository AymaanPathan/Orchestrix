import { StreamConfig } from "motia";
import { z } from "zod";

export const executionLogSchema = z.object({
  id: z.string(),
  executionId: z.string(),
  step: z.string(),
  stepType: z.string(),
  phase: z.enum(["start", "data", "result", "error", "end"]),
  message: z.string(),
  payload: z.any().optional(),
  timestamp: z.number(),
});

export const config: StreamConfig = {
  name: "executionLog",
  schema: executionLogSchema,
  baseConfig: { storageType: "default" },
};

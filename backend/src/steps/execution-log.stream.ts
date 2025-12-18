import { StreamConfig } from "motia";
import { z } from "zod";

export const executionLogSchema = z.object({
  executionId: z.string(),
  level: z.enum(["info", "debug", "error"]),
  message: z.string(),
  step: z.string().optional(),
  index: z.number().optional(),
  timestamp: z.number(),
});

export const config: StreamConfig = {
  name: "executionLog",
  schema: executionLogSchema,
  baseConfig: {
    storageType: "default", // file adapter is fine
  },
};

export type ExecutionLog = z.infer<typeof executionLogSchema>;

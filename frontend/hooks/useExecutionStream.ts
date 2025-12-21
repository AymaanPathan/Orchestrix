/* eslint-disable @typescript-eslint/no-explicit-any */
import { useStreamGroup } from "@motiadev/stream-client-react";

type ExecutionLog = {
  id?: string;
  executionId: string;
  stepIndex: number;
  stepType: string;
  phase: "start" | "data" | "end" | "error";
  title: string;
  data?: any;
  durationMs?: number;
  timestamp: number;
};

// must be NON-empty, stable
const IDLE_GROUP = "__idle_execution__";

export function useExecutionStream(executionId: string | null) {
  // ✅ ALWAYS a valid string
  const groupId = executionId || IDLE_GROUP;

  const { data = [] } = useStreamGroup<ExecutionLog>({
    streamName: "executionLog",
    groupId,
  });

  // ignore idle logs
  return executionId ? data : [];
}

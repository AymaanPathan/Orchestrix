/* eslint-disable @typescript-eslint/no-explicit-any */
// @/hooks/useExecutionStream.ts
import { useStreamGroup } from "@motiadev/stream-client-react";

type ExecutionLog = {
  id?: string;
  _id: string;
  executionId: string;
  stepIndex?: number;
  stepType?: string;
  phase: string;
  title: string;
  data?: any;
  durationMs?: number;
  timestamp: number;
};

function useExecutionStreamInternal(executionId: string): ExecutionLog[] {
  const { data } = useStreamGroup<ExecutionLog>({
    streamName: "executionLog",
    groupId: executionId,
  });

  return data || [];
}

/**
 * Safe hook wrapper that can accept null executionId
 * Uses a stable hook call pattern to avoid hook order violations
 */
export function useExecutionStream(executionId: string | null): ExecutionLog[] {
  // Provide a stable placeholder when executionId is null
  // This ensures hooks are always called in the same order
  const effectiveExecutionId = executionId || "no-execution-placeholder";

  // Always call the internal hook with a valid string
  const logs = useExecutionStreamInternal(effectiveExecutionId);

  // Return empty array when there's no real execution
  if (!executionId) {
    return [];
  }

  return logs;
}

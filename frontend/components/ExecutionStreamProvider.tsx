/* eslint-disable @typescript-eslint/no-explicit-any */
import { useExecutionStream } from "@/hooks/useExecutionStream";
import { useEffect } from "react";

type ExecutionLog = {
  executionId: string;
  stepIndex?: number;
  stepType?: string;
  phase: string;
  title: string;
  data?: any;
  durationMs?: number;
  timestamp: number;
};

export function ExecutionStreamProvider({
  executionId,
  onUpdate,
}: {
  executionId: string | null;
  onUpdate: (logs: ExecutionLog[]) => void;
}) {
  // Get logs using the safe hook
  const logs = useExecutionStream(executionId);

  // Update parent whenever logs change
  useEffect(() => {
    if (executionId) {
      onUpdate(logs);
    }
  }, [logs, executionId, onUpdate]);

  return null;
}

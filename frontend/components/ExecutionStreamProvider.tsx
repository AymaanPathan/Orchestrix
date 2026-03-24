/* eslint-disable @typescript-eslint/no-explicit-any */
import { useExecutionStream } from "@/hooks/useExecutionStream";
import { useEffect } from "react";

export type PhaseType =
  | "step_started"
  | "info"
  | "data"
  | "success"
  | "step_finished"
  | "error"
  | "execution_failed"
  | "execution_finished";

export type ExecutionLog = {
  executionId: string;
  stepIndex?: number;
  stepType?: string;
  phase: PhaseType;
  title: string;
  data?: any;
  durationMs?: number;
  timestamp: number;
};

// ✅ allowed phases
const validPhases: PhaseType[] = [
  "step_started",
  "info",
  "data",
  "success",
  "step_finished",
  "error",
  "execution_failed",
  "execution_finished",
];

// ✅ normalize function (SAFE)
const normalizePhase = (phase: string): PhaseType => {
  return validPhases.includes(phase as PhaseType)
    ? (phase as PhaseType)
    : "info";
};

export function ExecutionStreamProvider({
  executionId,
  onUpdate,
}: {
  executionId: string | null;
  onUpdate?: (logs: ExecutionLog[]) => void;
}) {
  const logs = useExecutionStream(executionId);

  useEffect(() => {
    if (executionId) {
      // ✅ transform logs safely
      const safeLogs: ExecutionLog[] = logs.map((log: any) => ({
        ...log,
        phase: normalizePhase(log.phase),
      }));

      onUpdate?.(safeLogs);
    }
  }, [logs, executionId, onUpdate]);

  return null;
}

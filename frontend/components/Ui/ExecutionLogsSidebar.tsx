import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  CheckCircle2,
  XCircle,
  Clock,
  Loader2,
  AlertCircle,
  Terminal,
  Zap,
  ChevronDown,
  ChevronRight,
  Database,
  Play,
  Check,
  Info,
  AlertTriangle,
  Activity,
} from "lucide-react";
import { useState } from "react";

interface LogEntry {
  executionId: string;
  stepIndex?: number;
  stepId?: string;
  stepType?: string;
  status?: string;
  phase?:
    | "step_started"
    | "info"
    | "data"
    | "success"
    | "step_finished"
    | "error"
    | "execution_failed"
    | "execution_finished";
  title?: string;
  message?: string;
  data?: any;
  metadata?: Record<string, any>;
  error?: string;
  durationMs?: number;
  timestamp: number;
  totalSteps?: number;
  failedStep?: number;
  totalDuration?: number;
}

interface ExecutionLogsSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  logs: LogEntry[];
  isPolling: boolean;
  executionId: string | null;
}

const ExecutionLogsSidebar = ({
  isOpen,
  onClose,
  logs,
  isPolling,
  executionId,
}: ExecutionLogsSidebarProps) => {
  const [expandedLogs, setExpandedLogs] = useState<Set<number>>(new Set());
  const [collapsedSteps, setCollapsedSteps] = useState<Set<number>>(new Set());

  const toggleExpand = (index: number) => {
    setExpandedLogs((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(index)) {
        newSet.delete(index);
      } else {
        newSet.add(index);
      }
      return newSet;
    });
  };

  const toggleStepCollapse = (stepIndex: number) => {
    setCollapsedSteps((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(stepIndex)) {
        newSet.delete(stepIndex);
      } else {
        newSet.add(stepIndex);
      }
      return newSet;
    });
  };

  // Group logs by step
  const groupedLogs = logs.reduce((acc, log, index) => {
    const stepIndex = log.stepIndex ?? -1;
    if (!acc[stepIndex]) {
      acc[stepIndex] = [];
    }
    acc[stepIndex].push({ ...log, originalIndex: index });
    return acc;
  }, {} as Record<number, (LogEntry & { originalIndex: number })[]>);

  // Get execution-level logs (step_started, step_finished, execution_finished, etc.)
  const executionLogs = groupedLogs[-1] || [];
  delete groupedLogs[-1];

  const getPhaseIcon = (phase: LogEntry["phase"]) => {
    switch (phase) {
      case "step_started":
        return <Play className="w-4 h-4 text-blue-400" />;
      case "info":
        return <Info className="w-4 h-4 text-white/50" />;
      case "data":
        return <Database className="w-4 h-4 text-purple-400" />;
      case "success":
        return <Check className="w-4 h-4 text-emerald-400" />;
      case "step_finished":
        return <CheckCircle2 className="w-4 h-4 text-emerald-400" />;
      case "error":
        return <XCircle className="w-4 h-4 text-red-400" />;
      case "execution_failed":
        return <AlertTriangle className="w-4 h-4 text-red-400" />;
      case "execution_finished":
        return <CheckCircle2 className="w-4 h-4 text-emerald-400" />;
      default:
        return <Activity className="w-4 h-4 text-white/40" />;
    }
  };

  const getPhaseColor = (phase: LogEntry["phase"]) => {
    switch (phase) {
      case "step_started":
        return "border-blue-400/20 bg-blue-500/5";
      case "info":
        return "border-white/[0.06] bg-white/[0.02]";
      case "data":
        return "border-purple-400/20 bg-purple-500/5";
      case "success":
      case "step_finished":
      case "execution_finished":
        return "border-emerald-400/20 bg-emerald-500/5";
      case "error":
      case "execution_failed":
        return "border-red-400/20 bg-red-500/5";
      default:
        return "border-white/[0.06] bg-white/[0.02]";
    }
  };

  const formatTimestamp = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString("en-US", {
      hour12: false,
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      fractionalSecondDigits: 3,
    });
  };

  const hasDetails = (entry: LogEntry) => {
    return entry.data || entry.metadata || entry.error;
  };

  const getStepStatus = (stepLogs: LogEntry[]) => {
    if (stepLogs.some((l) => l.phase === "error")) return "error";
    if (stepLogs.some((l) => l.phase === "step_finished")) return "finished";
    return "running";
  };

  const getStepIcon = (status: string) => {
    switch (status) {
      case "error":
        return <XCircle className="w-5 h-5 text-red-400" />;
      case "finished":
        return <CheckCircle2 className="w-5 h-5 text-emerald-400" />;
      case "running":
        return <Loader2 className="w-5 h-5 text-blue-400 animate-spin" />;
      default:
        return <Clock className="w-5 h-5 text-white/40" />;
    }
  };

  const isExecutionFinished = logs.some(
    (l) => l.phase === "execution_finished" || l.phase === "execution_failed"
  );

  const executionStatus = logs.some((l) => l.phase === "execution_failed")
    ? "failed"
    : isExecutionFinished
    ? "completed"
    : "running";

  return (
    <AnimatePresence mode="wait">
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40"
            onClick={onClose}
          />

          {/* Sidebar */}
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="fixed right-0 top-0 h-full w-[500px] bg-[#0F0F0F]/98 backdrop-blur-2xl border-l border-white/[0.08] z-50 flex flex-col"
          >
            {/* Header */}
            <div className="px-6 py-5 border-b border-white/[0.06]">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <motion.div
                    animate={
                      isPolling
                        ? {
                            scale: [1, 1.05, 1],
                            rotate: [0, 5, -5, 0],
                          }
                        : {}
                    }
                    transition={{
                      duration: 2,
                      repeat: isPolling ? Infinity : 0,
                    }}
                    className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500/20 to-purple-500/20 border border-white/[0.08] flex items-center justify-center"
                  >
                    <Zap className="w-5 h-5 text-blue-400" />
                  </motion.div>
                  <div>
                    <h2 className="text-lg font-semibold text-white">
                      Execution Logs
                    </h2>
                    {executionId && (
                      <p className="text-xs text-white/40 font-mono">
                        {executionId.slice(0, 12)}...
                      </p>
                    )}
                  </div>
                </div>

                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={onClose}
                  className="w-9 h-9 rounded-lg bg-white/[0.04] border border-white/[0.06] flex items-center justify-center hover:bg-white/[0.08] transition-colors"
                >
                  <X className="w-4 h-4 text-white/60" />
                </motion.button>
              </div>

              {/* Status Badge */}
              <div
                className={`inline-flex items-center gap-2.5 px-3 py-2 rounded-lg ${
                  executionStatus === "running"
                    ? "bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-400/20"
                    : executionStatus === "failed"
                    ? "bg-gradient-to-r from-red-500/10 to-orange-500/10 border border-red-400/20"
                    : "bg-gradient-to-r from-emerald-500/10 to-green-500/10 border border-emerald-400/20"
                }`}
              >
                {executionStatus === "running" ? (
                  <>
                    <motion.div
                      animate={{ scale: [1, 1.2, 1] }}
                      transition={{ duration: 1.5, repeat: Infinity }}
                      className="relative flex items-center justify-center"
                    >
                      <div className="w-2 h-2 rounded-full bg-blue-400" />
                      <div className="absolute w-4 h-4 rounded-full bg-blue-400/30 animate-ping" />
                    </motion.div>
                    <span className="text-sm font-medium text-blue-300">
                      Running
                    </span>
                  </>
                ) : executionStatus === "failed" ? (
                  <>
                    <XCircle className="w-4 h-4 text-red-400" />
                    <span className="text-sm font-medium text-red-300">
                      Failed
                    </span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span className="text-sm font-medium text-emerald-300">
                      Completed
                    </span>
                  </>
                )}
                <span className="text-xs text-white/40 ml-auto">
                  {Object.keys(groupedLogs).length} steps
                </span>
              </div>
            </div>

            {/* Logs Container */}
            <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
              {logs.length === 0 ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex flex-col items-center justify-center py-20"
                >
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{
                      duration: 3,
                      repeat: Infinity,
                      ease: "linear",
                    }}
                    className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500/10 to-purple-500/10 border border-white/[0.06] flex items-center justify-center mb-4"
                  >
                    <Terminal className="w-8 h-8 text-white/20" />
                  </motion.div>
                  <p className="text-white/50 text-sm">
                    Initializing workflow...
                  </p>
                </motion.div>
              ) : (
                <>
                  {/* Step Groups */}
                  {Object.entries(groupedLogs)
                    .sort(([a], [b]) => Number(a) - Number(b))
                    .map(([stepIndex, stepLogs]) => {
                      const stepNum = Number(stepIndex);
                      const isCollapsed = collapsedSteps.has(stepNum);
                      const stepStatus = getStepStatus(stepLogs);
                      const stepStartLog = stepLogs.find(
                        (l) => l.phase === "step_started"
                      );
                      const stepEndLog = stepLogs.find(
                        (l) => l.phase === "step_finished"
                      );

                      return (
                        <motion.div
                          key={stepIndex}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="space-y-2"
                        >
                          {/* Step Header */}
                          <div
                            onClick={() => toggleStepCollapse(stepNum)}
                            className={`group cursor-pointer rounded-xl border p-4 transition-all ${
                              stepStatus === "error"
                                ? "border-red-400/20 bg-red-500/5"
                                : stepStatus === "finished"
                                ? "border-emerald-400/20 bg-emerald-500/5"
                                : "border-blue-400/20 bg-blue-500/5"
                            } hover:bg-white/[0.02]`}
                          >
                            <div className="flex items-center gap-3">
                              <motion.div
                                animate={{ rotate: isCollapsed ? 0 : 90 }}
                                transition={{ duration: 0.2 }}
                              >
                                <ChevronRight className="w-4 h-4 text-white/40" />
                              </motion.div>
                              {getStepIcon(stepStatus)}
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                  <h3 className="text-sm font-semibold text-white">
                                    {stepStartLog?.title ||
                                      `Step ${stepNum + 1}`}
                                  </h3>
                                  {stepEndLog?.durationMs && (
                                    <span className="text-xs text-white/40">
                                      {stepEndLog.durationMs}ms
                                    </span>
                                  )}
                                </div>
                                <p className="text-xs text-white/50 mt-1">
                                  {stepStartLog?.message ||
                                    stepLogs[0]?.stepType}
                                </p>
                              </div>
                              <span className="text-xs text-white/30 font-mono">
                                {stepLogs.length} logs
                              </span>
                            </div>
                          </div>

                          {/* Step Logs */}
                          <AnimatePresence>
                            {!isCollapsed && (
                              <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: "auto", opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                transition={{ duration: 0.2 }}
                                className="overflow-hidden space-y-2 pl-4"
                              >
                                {stepLogs.map((log) => {
                                  const isExpanded = expandedLogs.has(
                                    log.originalIndex
                                  );
                                  const hasMoreDetails = hasDetails(log);

                                  return (
                                    <motion.div
                                      key={log.originalIndex}
                                      initial={{ opacity: 0, x: -10 }}
                                      animate={{ opacity: 1, x: 0 }}
                                      className={`rounded-lg border p-3 transition-all ${getPhaseColor(
                                        log.phase
                                      )}`}
                                    >
                                      <div
                                        className={
                                          hasMoreDetails ? "cursor-pointer" : ""
                                        }
                                        onClick={() =>
                                          hasMoreDetails &&
                                          toggleExpand(log.originalIndex)
                                        }
                                      >
                                        <div className="flex items-start gap-3">
                                          {getPhaseIcon(log.phase)}
                                          <div className="flex-1 min-w-0">
                                            <div className="flex items-start justify-between gap-2 mb-1">
                                              <p className="text-sm font-medium text-white/90">
                                                {log.title}
                                              </p>
                                              <span className="text-xs text-white/30 font-mono flex-shrink-0">
                                                {formatTimestamp(log.timestamp)}
                                              </span>
                                            </div>
                                            {log.message && (
                                              <p className="text-xs text-white/60 leading-relaxed">
                                                {log.message}
                                              </p>
                                            )}
                                            {log.error && (
                                              <div className="mt-2 flex items-start gap-2 p-2 rounded bg-red-500/10 border border-red-400/20">
                                                <AlertCircle className="w-3 h-3 text-red-400 flex-shrink-0 mt-0.5" />
                                                <p className="text-xs text-red-300">
                                                  {log.error}
                                                </p>
                                              </div>
                                            )}
                                          </div>
                                          {hasMoreDetails && (
                                            <motion.div
                                              animate={{
                                                rotate: isExpanded ? 180 : 0,
                                              }}
                                              transition={{ duration: 0.2 }}
                                            >
                                              <ChevronDown className="w-4 h-4 text-white/40" />
                                            </motion.div>
                                          )}
                                        </div>

                                        {/* Expanded Details */}
                                        <AnimatePresence>
                                          {isExpanded && hasMoreDetails && (
                                            <motion.div
                                              initial={{
                                                height: 0,
                                                opacity: 0,
                                              }}
                                              animate={{
                                                height: "auto",
                                                opacity: 1,
                                              }}
                                              exit={{ height: 0, opacity: 0 }}
                                              className="overflow-hidden"
                                            >
                                              <div className="mt-3 pt-3 border-t border-white/[0.06] space-y-2">
                                                {log.metadata && (
                                                  <div>
                                                    <span className="text-xs font-medium text-white/50 mb-1 block">
                                                      Metadata
                                                    </span>
                                                    <pre className="text-xs text-white/70 bg-black/40 p-2 rounded overflow-auto max-h-32 font-mono">
                                                      {JSON.stringify(
                                                        log.metadata,
                                                        null,
                                                        2
                                                      )}
                                                    </pre>
                                                  </div>
                                                )}
                                                {log.data && (
                                                  <div>
                                                    <span className="text-xs font-medium text-white/50 mb-1 block">
                                                      Data
                                                    </span>
                                                    <pre className="text-xs text-white/70 bg-black/40 p-2 rounded overflow-auto max-h-32 font-mono">
                                                      {JSON.stringify(
                                                        log.data,
                                                        null,
                                                        2
                                                      )}
                                                    </pre>
                                                  </div>
                                                )}
                                              </div>
                                            </motion.div>
                                          )}
                                        </AnimatePresence>
                                      </div>
                                    </motion.div>
                                  );
                                })}
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </motion.div>
                      );
                    })}

                  {/* Execution-level logs */}
                  {executionLogs.length > 0 && (
                    <div className="space-y-2">
                      {executionLogs.map((log) => (
                        <motion.div
                          key={log.originalIndex}
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          className={`rounded-xl border p-4 ${getPhaseColor(
                            log.phase
                          )}`}
                        >
                          <div className="flex items-center gap-3">
                            {getPhaseIcon(log.phase)}
                            <div className="flex-1">
                              <h3 className="text-sm font-semibold text-white mb-1">
                                {log.title}
                              </h3>
                              <p className="text-xs text-white/60">
                                {log.message}
                              </p>
                              {log.totalDuration && (
                                <p className="text-xs text-white/40 mt-1">
                                  Total duration: {log.totalDuration}ms
                                </p>
                              )}
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default ExecutionLogsSidebar;

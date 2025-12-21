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
import { useState, useEffect } from "react";

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
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setMounted(true);
    }
  }, [isOpen]);

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

  // Get execution-level logs
  const executionLogs = groupedLogs[-1] || [];
  delete groupedLogs[-1];

  const getPhaseIcon = (phase: LogEntry["phase"]) => {
    switch (phase) {
      case "step_started":
        return <Play className="w-3.5 h-3.5 text-white/70" />;
      case "info":
        return <Info className="w-3.5 h-3.5 text-white/40" />;
      case "data":
        return <Database className="w-3.5 h-3.5 text-white/50" />;
      case "success":
        return <Check className="w-3.5 h-3.5 text-emerald-400" />;
      case "step_finished":
        return <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />;
      case "error":
        return <XCircle className="w-3.5 h-3.5 text-red-400" />;
      case "execution_failed":
        return <AlertTriangle className="w-3.5 h-3.5 text-red-400" />;
      case "execution_finished":
        return <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />;
      default:
        return <Activity className="w-3.5 h-3.5 text-white/30" />;
    }
  };

  const getPhaseColor = (phase: LogEntry["phase"]) => {
    switch (phase) {
      case "success":
      case "step_finished":
      case "execution_finished":
        return "bg-emerald-500/5 border-emerald-500/10";
      case "error":
      case "execution_failed":
        return "bg-red-500/5 border-red-500/10";
      default:
        return "bg-white/[0.02] border-white/[0.06]";
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
        return <XCircle className="w-4 h-4 text-red-400" />;
      case "finished":
        return <CheckCircle2 className="w-4 h-4 text-emerald-400" />;
      case "running":
        return <Loader2 className="w-4 h-4 text-white/60 animate-spin" />;
      default:
        return <Clock className="w-4 h-4 text-white/30" />;
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

  if (!isOpen) return null;

  return (
    <>
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(20px) scale(0.96); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes pulse {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.2); opacity: 0.7; }
        }
        @keyframes ripple {
          0% { transform: scale(1); opacity: 0.5; }
          100% { transform: scale(1.8); opacity: 0; }
        }
        @keyframes slideInLeft {
          from { opacity: 0; transform: translateX(-10px); }
          to { opacity: 1; transform: translateX(0); }
        }
        @keyframes rotate {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .animate-fade-in {
          animation: fadeIn 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .animate-slide-up {
          animation: slideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .animate-pulse-dot {
          animation: pulse 1.5s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }
        .animate-ripple {
          animation: ripple 1.5s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }
        .animate-slide-in-left {
          animation: slideInLeft 0.25s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .animate-rotate-slow {
          animation: rotate 20s linear infinite;
        }
        .glass-effect {
          background: rgba(0, 0, 0, 0.4);
          backdrop-filter: blur(40px);
          -webkit-backdrop-filter: blur(40px);
        }
        .inner-glow {
          box-shadow: inset 0 1px 0 0 rgba(255, 255, 255, 0.03);
        }
        .transition-smooth {
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .transition-height {
          transition: height 0.25s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.2s;
        }
        .scrollbar-custom::-webkit-scrollbar {
          width: 8px;
        }
        .scrollbar-custom::-webkit-scrollbar-track {
          background: transparent;
        }
        .scrollbar-custom::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.1);
          border-radius: 4px;
        }
        .scrollbar-custom::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 255, 255, 0.15);
        }
      `}</style>

      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-xl z-40 animate-fade-in"
        onClick={onClose}
      />

      {/* Centered Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
        <div className="relative border-2 border-white rounded-2xl w-full max-w-3xl h-[85vh] pointer-events-auto animate-slide-up">
          {/* Glass container with glow */}
          <div className="relative  w-full h-full rounded-2xl glass-effect border border-white/[0.08] shadow-2xl overflow-hidden inner-glow">
            {/* Subtle inner gradient */}
            <div className="absolute inset-0 bg-gradient-to-b from-white/[0.03] to-transparent pointer-events-none" />

            {/* Header */}
            <div className="relative px-8 py-6 border-b border-white/[0.06]">
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <div className="w-11 h-11 rounded-xl bg-white/[0.04] border border-white/[0.08] flex items-center justify-center transition-smooth">
                      <Zap className="w-5 h-5 text-white/70" />
                    </div>
                    {isPolling && (
                      <div className="absolute inset-0 rounded-xl bg-white/5 animate-pulse-dot" />
                    )}
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-white tracking-tight">
                      Execution Logs
                    </h2>
                    {executionId && (
                      <p className="text-xs text-white/40 font-mono mt-0.5">
                        {executionId.slice(0, 16)}...
                      </p>
                    )}
                  </div>
                </div>

                <button
                  onClick={onClose}
                  className="w-9 h-9 rounded-lg bg-white/[0.04] border border-white/[0.06] flex items-center justify-center hover:bg-white/[0.08] hover:border-white/[0.12] hover:scale-105 active:scale-95 transition-smooth"
                >
                  <X className="w-4 h-4 text-white/60" />
                </button>
              </div>

              {/* Status Badge */}
              <div
                className={`inline-flex items-center gap-2.5 px-4 py-2.5 rounded-xl backdrop-blur-xl transition-smooth ${
                  executionStatus === "running"
                    ? "bg-white/[0.04] border border-white/[0.08]"
                    : executionStatus === "failed"
                    ? "bg-red-500/5 border border-red-500/20"
                    : "bg-emerald-500/5 border border-emerald-500/20"
                }`}
              >
                {executionStatus === "running" ? (
                  <>
                    <div className="relative flex items-center justify-center">
                      <div className="w-2 h-2 rounded-full bg-white/60 animate-pulse-dot" />
                      <div className="absolute w-3 h-3 rounded-full bg-white/20 animate-ripple" />
                    </div>
                    <span className="text-sm font-medium text-white/80">
                      Running
                    </span>
                  </>
                ) : executionStatus === "failed" ? (
                  <>
                    <XCircle className="w-4 h-4 text-red-400" />
                    <span className="text-sm font-medium text-red-400">
                      Failed
                    </span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span className="text-sm font-medium text-emerald-400">
                      Completed
                    </span>
                  </>
                )}
                <span className="text-xs text-white/40 ml-2 pl-2 border-l border-white/[0.08]">
                  {Object.keys(groupedLogs).length} steps
                </span>
              </div>
            </div>

            {/* Logs Container */}
            <div className="relative flex-1 overflow-y-auto px-8 py-6 space-y-3 h-[calc(100%-140px)] scrollbar-custom">
              {logs.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full">
                  <div className="w-16 h-16 rounded-2xl bg-white/[0.04] border border-white/[0.06] flex items-center justify-center mb-4 animate-rotate-slow">
                    <Terminal className="w-7 h-7 text-white/30" />
                  </div>
                  <p className="text-white/40 text-sm font-medium">
                    Initializing workflow...
                  </p>
                </div>
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
                        <div
                          key={stepIndex}
                          className="space-y-2"
                          style={{
                            animationDelay: `${Number(stepIndex) * 50}ms`,
                          }}
                        >
                          {/* Step Header */}
                          <div
                            onClick={() => toggleStepCollapse(stepNum)}
                            className={`group cursor-pointer rounded-xl border p-4 hover:scale-[1.005] transition-smooth ${
                              stepStatus === "error"
                                ? "bg-red-500/5 border-red-500/20 hover:bg-red-500/[0.07]"
                                : stepStatus === "finished"
                                ? "bg-emerald-500/5 border-emerald-500/20 hover:bg-emerald-500/[0.07]"
                                : "bg-white/[0.02] border-white/[0.06] hover:bg-white/[0.04]"
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <div
                                className="transition-smooth"
                                style={{
                                  transform: isCollapsed
                                    ? "rotate(0deg)"
                                    : "rotate(90deg)",
                                }}
                              >
                                <ChevronRight className="w-3.5 h-3.5 text-white/40 group-hover:text-white/60 transition-smooth" />
                              </div>
                              {getStepIcon(stepStatus)}
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                  <h3 className="text-sm font-medium text-white/90">
                                    {stepStartLog?.title ||
                                      `Step ${stepNum + 1}`}
                                  </h3>
                                  {stepEndLog?.durationMs && (
                                    <span className="text-xs text-white/30 font-mono">
                                      {stepEndLog.durationMs}ms
                                    </span>
                                  )}
                                </div>
                                <p className="text-xs text-white/50">
                                  {stepStartLog?.message ||
                                    stepLogs[0]?.stepType}
                                </p>
                              </div>
                              <span className="text-xs text-white/30 font-mono">
                                {stepLogs.length}
                              </span>
                            </div>
                          </div>

                          {/* Step Logs */}
                          {!isCollapsed && (
                            <div className="overflow-hidden space-y-2 pl-4 animate-slide-in-left">
                              {stepLogs.map((log) => {
                                const isExpanded = expandedLogs.has(
                                  log.originalIndex
                                );
                                const hasMoreDetails = hasDetails(log);

                                return (
                                  <div
                                    key={log.originalIndex}
                                    className={`rounded-lg border p-3 transition-smooth ${getPhaseColor(
                                      log.phase
                                    )} ${
                                      hasMoreDetails
                                        ? "hover:bg-white/[0.04] cursor-pointer"
                                        : ""
                                    }`}
                                    onClick={() =>
                                      hasMoreDetails &&
                                      toggleExpand(log.originalIndex)
                                    }
                                  >
                                    <div className="flex items-start gap-3">
                                      {getPhaseIcon(log.phase)}
                                      <div className="flex-1 min-w-0">
                                        <div className="flex items-start justify-between gap-2 mb-1">
                                          <p className="text-sm font-medium text-white/80">
                                            {log.title}
                                          </p>
                                          <span className="text-[10px] text-white/25 font-mono flex-shrink-0 mt-0.5">
                                            {formatTimestamp(log.timestamp)}
                                          </span>
                                        </div>
                                        {log.message && (
                                          <p className="text-xs text-white/50 leading-relaxed">
                                            {log.message}
                                          </p>
                                        )}
                                        {log.error && (
                                          <div className="mt-2 flex items-start gap-2 p-2 rounded-lg bg-red-500/10 border border-red-500/20">
                                            <AlertCircle className="w-3 h-3 text-red-400 flex-shrink-0 mt-0.5" />
                                            <p className="text-xs text-red-300 font-mono">
                                              {log.error}
                                            </p>
                                          </div>
                                        )}
                                      </div>
                                      {hasMoreDetails && (
                                        <div
                                          className="transition-smooth"
                                          style={{
                                            transform: isExpanded
                                              ? "rotate(180deg)"
                                              : "rotate(0deg)",
                                          }}
                                        >
                                          <ChevronDown className="w-3.5 h-3.5 text-white/30" />
                                        </div>
                                      )}
                                    </div>

                                    {/* Expanded Details */}
                                    {isExpanded && hasMoreDetails && (
                                      <div className="overflow-hidden transition-height">
                                        <div className="mt-3 pt-3 border-t border-white/[0.06] space-y-2">
                                          {log.metadata && (
                                            <div>
                                              <span className="text-[10px] font-medium text-white/40 mb-1.5 block uppercase tracking-wider">
                                                Metadata
                                              </span>
                                              <pre className="text-[11px] text-white/60 bg-black/40 p-2.5 rounded-lg overflow-auto max-h-32 font-mono border border-white/[0.04]">
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
                                              <span className="text-[10px] font-medium text-white/40 mb-1.5 block uppercase tracking-wider">
                                                Data
                                              </span>
                                              <pre className="text-[11px] text-white/60 bg-black/40 p-2.5 rounded-lg overflow-auto max-h-32 font-mono border border-white/[0.04]">
                                                {JSON.stringify(
                                                  log.data,
                                                  null,
                                                  2
                                                )}
                                              </pre>
                                            </div>
                                          )}
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      );
                    })}

                  {/* Execution-level logs */}
                  {executionLogs.length > 0 && (
                    <div className="space-y-2 pt-2">
                      {executionLogs.map((log) => (
                        <div
                          key={log.originalIndex}
                          className={`rounded-xl border p-4 ${getPhaseColor(
                            log.phase
                          )}`}
                        >
                          <div className="flex items-center gap-3">
                            {getPhaseIcon(log.phase)}
                            <div className="flex-1">
                              <h3 className="text-sm font-medium text-white/90 mb-1">
                                {log.title}
                              </h3>
                              <p className="text-xs text-white/50">
                                {log.message}
                              </p>
                              {log.totalDuration && (
                                <p className="text-xs text-white/30 mt-1.5 font-mono">
                                  {log.totalDuration}ms total
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};
export default ExecutionLogsSidebar;
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  ChevronDown,
  ChevronRight,
  CheckCircle2,
  XCircle,
  Clock,
  Play,
  Loader2,
  AlertCircle,
  Terminal,
  Activity,
} from "lucide-react";
import { useState } from "react";

interface LogEntry {
  step?: string;
  stepId?: string;
  type?: string;
  stepType?: string;
  status?: string;
  error?: string;
  outputVar?: string;
  result?: any;
  data?: any;
  timestamp?: string;
  event?: string;
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

  const getStatusIcon = (entry: LogEntry) => {
    const isError = entry.error || entry.status === "failed";
    const isSuccess =
      entry.status === "success" ||
      entry.status === "passed" ||
      entry.status === "completed";
    const isRunning = entry.status === "running" || entry.status === "started";

    if (isError) return <XCircle className="w-4 h-4 text-red-400" />;
    if (isSuccess) return <CheckCircle2 className="w-4 h-4 text-green-400" />;
    if (isRunning)
      return <Loader2 className="w-4 h-4 text-blue-400 animate-spin" />;
    return <Clock className="w-4 h-4 text-white/40" />;
  };

  const getStatusColor = (entry: LogEntry) => {
    const isError = entry.error || entry.status === "failed";
    const isSuccess =
      entry.status === "success" ||
      entry.status === "passed" ||
      entry.status === "completed";
    const isRunning = entry.status === "running" || entry.status === "started";

    if (isError) return "border-red-500/30 bg-red-500/5";
    if (isSuccess) return "border-green-500/30 bg-green-500/5";
    if (isRunning) return "border-blue-500/30 bg-blue-500/5";
    return "border-white/[0.08] bg-white/[0.02]";
  };

  const formatTimestamp = (timestamp?: string) => {
    if (!timestamp) return "";
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
    return entry.result || entry.data || entry.error;
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40"
            onClick={onClose}
          />

          {/* Sidebar */}
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{
              type: "spring",
              damping: 30,
              stiffness: 300,
            }}
            className="fixed right-0 top-0 h-full w-[480px] bg-[#0F0F0F] border-l border-white/[0.08] shadow-2xl z-50 flex flex-col"
          >
            {/* Header */}
            <div className="px-6 py-5 border-b border-white/[0.08] bg-[#151515]">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-white/[0.08] flex items-center justify-center">
                    <Activity className="w-5 h-5 text-white/70" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-white">
                      Execution Logs
                    </h2>
                    {executionId && (
                      <p className="text-xs text-white/40 font-mono mt-0.5">
                        ID: {executionId.slice(0, 8)}...
                      </p>
                    )}
                  </div>
                </div>

                <button
                  onClick={onClose}
                  className="w-8 h-8 rounded-lg hover:bg-white/[0.08] flex items-center justify-center transition-colors"
                >
                  <X className="w-5 h-5 text-white/60" />
                </button>
              </div>

              {/* Status Bar */}
              <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-white/[0.04] border border-white/[0.08]">
                {isPolling ? (
                  <>
                    <div className="relative flex items-center justify-center">
                      <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                      <div className="absolute w-3 h-3 rounded-full bg-green-400/30 animate-ping" />
                    </div>
                    <span className="text-sm text-white/70 font-medium">
                      Workflow Running
                    </span>
                    <Loader2 className="w-4 h-4 text-green-400 animate-spin ml-auto" />
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-green-400" />
                    <span className="text-sm text-white/70 font-medium">
                      Execution Complete
                    </span>
                    <span className="text-xs text-white/40 ml-auto">
                      {logs.length} steps
                    </span>
                  </>
                )}
              </div>
            </div>

            {/* Logs Container */}
            <div className="flex-1 overflow-y-auto px-6 py-5 space-y-3">
              {logs.length === 0 ? (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex flex-col items-center justify-center h-full text-center"
                >
                  <div className="w-16 h-16 rounded-2xl bg-white/[0.04] flex items-center justify-center mb-4">
                    <Terminal className="w-8 h-8 text-white/30" />
                  </div>
                  <p className="text-white/50 text-sm mb-2">
                    Initializing workflow...
                  </p>
                  <div className="w-8 h-8 border-2 border-white/20 border-t-white/70 rounded-full animate-spin" />
                </motion.div>
              ) : (
                logs.map((entry, index) => {
                  const isExpanded = expandedLogs.has(index);
                  const hasMoreDetails = hasDetails(entry);

                  return (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.03 }}
                      className={`rounded-xl border transition-all ${getStatusColor(
                        entry
                      )}`}
                    >
                      {/* Log Header */}
                      <div
                        className={`p-4 ${
                          hasMoreDetails ? "cursor-pointer" : ""
                        }`}
                        onClick={() => hasMoreDetails && toggleExpand(index)}
                      >
                        <div className="flex items-start gap-3">
                          {/* Status Icon */}
                          <div className="mt-0.5">{getStatusIcon(entry)}</div>

                          {/* Content */}
                          <div className="flex-1 min-w-0">
                            {/* Step Name */}
                            <div className="flex items-start justify-between gap-2 mb-2">
                              <h3 className="text-sm font-semibold text-white/90 break-words">
                                {entry.step ||
                                  entry.stepId ||
                                  `Step ${index + 1}`}
                              </h3>
                              {entry.timestamp && (
                                <span className="text-xs text-white/40 font-mono flex-shrink-0">
                                  {formatTimestamp(entry.timestamp)}
                                </span>
                              )}
                            </div>

                            {/* Event Badge */}
                            {entry.event && (
                              <div className="inline-block px-2 py-1 mb-2 text-[10px] font-medium rounded-md bg-blue-500/20 text-blue-300 uppercase">
                                {entry.event.replace("_", " ")}
                              </div>
                            )}

                            {/* Metadata */}
                            <div className="space-y-1">
                              {entry.stepType && (
                                <div className="flex items-center gap-2 text-xs text-white/50">
                                  <span className="text-white/40">Type:</span>
                                  <span className="font-medium">
                                    {entry.stepType}
                                  </span>
                                </div>
                              )}

                              {entry.status && (
                                <div className="flex items-center gap-2 text-xs">
                                  <span className="text-white/40">Status:</span>
                                  <span
                                    className={`font-medium ${
                                      entry.error || entry.status === "failed"
                                        ? "text-red-400"
                                        : entry.status === "success" ||
                                          entry.status === "completed"
                                        ? "text-green-400"
                                        : "text-white/60"
                                    }`}
                                  >
                                    {entry.status}
                                  </span>
                                </div>
                              )}

                              {entry.outputVar && (
                                <div className="flex items-center gap-2 text-xs text-white/50">
                                  <span className="text-white/40">Output:</span>
                                  <code className="font-mono text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded">
                                    {entry.outputVar}
                                  </code>
                                </div>
                              )}

                              {entry.error && (
                                <div className="flex items-start gap-2 mt-2 p-3 rounded-lg bg-red-500/10 border border-red-500/20">
                                  <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
                                  <p className="text-xs text-red-300 leading-relaxed">
                                    {entry.error}
                                  </p>
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Expand Icon */}
                          {hasMoreDetails && (
                            <button className="mt-0.5 text-white/40 hover:text-white/70 transition-colors">
                              {isExpanded ? (
                                <ChevronDown className="w-4 h-4" />
                              ) : (
                                <ChevronRight className="w-4 h-4" />
                              )}
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Expanded Details */}
                      <AnimatePresence>
                        {isExpanded && hasMoreDetails && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            className="overflow-hidden"
                          >
                            <div className="px-4 pb-4 pt-0 border-t border-white/[0.06]">
                              {(entry.result || entry.data) && (
                                <div className="mt-3">
                                  <div className="flex items-center gap-2 mb-2">
                                    <Terminal className="w-3.5 h-3.5 text-white/40" />
                                    <span className="text-xs font-medium text-white/60">
                                      {entry.result ? "Result" : "Data"}
                                    </span>
                                  </div>
                                  <pre className="text-xs text-white/70 bg-black/40 p-3 rounded-lg overflow-auto max-h-64 font-mono border border-white/[0.06]">
                                    {JSON.stringify(
                                      entry.result || entry.data,
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
                    </motion.div>
                  );
                })
              )}

              {/* Polling Indicator */}
              {isPolling && logs.length > 0 && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex items-center justify-center gap-2 py-4 text-xs text-white/40"
                >
                  <div className="flex gap-1">
                    <motion.div
                      animate={{ scale: [1, 1.2, 1] }}
                      transition={{
                        repeat: Infinity,
                        duration: 1.5,
                        delay: 0,
                      }}
                      className="w-1.5 h-1.5 rounded-full bg-white/40"
                    />
                    <motion.div
                      animate={{ scale: [1, 1.2, 1] }}
                      transition={{
                        repeat: Infinity,
                        duration: 1.5,
                        delay: 0.2,
                      }}
                      className="w-1.5 h-1.5 rounded-full bg-white/40"
                    />
                    <motion.div
                      animate={{ scale: [1, 1.2, 1] }}
                      transition={{
                        repeat: Infinity,
                        duration: 1.5,
                        delay: 0.4,
                      }}
                      className="w-1.5 h-1.5 rounded-full bg-white/40"
                    />
                  </div>
                  <span>Waiting for updates...</span>
                </motion.div>
              )}
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-white/[0.08] bg-[#151515]">
              <div className="flex items-center justify-between text-xs text-white/40">
                <span>
                  {logs.length} {logs.length === 1 ? "step" : "steps"} logged
                </span>
                <button
                  onClick={onClose}
                  className="text-white/60 hover:text-white transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default ExecutionLogsSidebar;

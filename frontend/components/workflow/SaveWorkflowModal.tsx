import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Workflow,
  ArrowRight,
  AlertCircle,
  CheckCircle2,
  Copy,
  Code,
  BookOpen,
  Zap,
  FileJson,
  Terminal,
} from "lucide-react";

interface SaveWorkflowModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (apiName: string) => void;
  isSaving?: boolean;
  savedData?: {
    workflowId: string;
    apiPath: string;
    apiName: string;
    inputVariables?: Array<{ name: string; type?: string; default?: any }>;
  } | null;
}

export default function SaveWorkflowModal({
  isOpen,
  onClose,
  onSave,
  isSaving = false,
  savedData = null,
}: SaveWorkflowModalProps) {
  const [apiName, setApiName] = useState("");
  const [error, setError] = useState("");
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<
    "overview" | "curl" | "javascript"
  >("overview");

  const generateSlug = (name: string) => {
    return name
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
  };

  const slug = apiName ? generateSlug(apiName) : "";
  const apiPath = slug ? `/workflow/run/{workflowId}/${slug}` : "";

  // Generate example body based on input variables
  const generateExampleBody = () => {
    if (!savedData?.inputVariables?.length) {
      return {
        input: {
          example: "value",
        },
      };
    }

    const inputObj: Record<string, any> = {};
    savedData.inputVariables.forEach((v) => {
      if (v.type === "number") inputObj[v.name] = 0;
      else if (v.type === "boolean") inputObj[v.name] = false;
      else inputObj[v.name] = v.default || "";
    });

    return { input: inputObj };
  };

  const exampleBody = savedData ? generateExampleBody() : null;

  const curlExample = savedData
    ? `curl -X POST http://localhost:3000${savedData.apiPath} \\
  -H "Content-Type: application/json" \\
  -d '${JSON.stringify(exampleBody, null, 2)}'`
    : "";

  const jsExample = savedData
    ? `const response = await fetch('http://localhost:3000${
        savedData.apiPath
      }', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify(${JSON.stringify(exampleBody, null, 2)})
});

const result = await response.json();
console.log(result);`
    : "";

  const copyToClipboard = async (text: string, field: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(field);
      setTimeout(() => setCopiedField(null), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  const handleSubmit = () => {
    if (!apiName.trim()) {
      setError("API name is required");
      return;
    }

    if (apiName.length < 3) {
      setError("API name must be at least 3 characters");
      return;
    }

    setError("");
    onSave(apiName.trim());
  };

  const handleClose = () => {
    if (!isSaving) {
      setApiName("");
      setError("");
      setCopiedField(null);
      setActiveTab("overview");
      onClose();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
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
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
            onClick={handleClose}
          />

          {/* Modal */}
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
              className={`w-full ${
                savedData ? "max-w-3xl" : "max-w-md"
              } bg-[#1a1a1a] rounded-2xl shadow-2xl border border-white/[0.08] pointer-events-auto overflow-hidden`}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="relative px-6 pt-6 pb-4 border-b border-white/[0.06]">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-white/[0.08] flex items-center justify-center">
                    <Workflow size={20} className="text-white/80" />
                  </div>
                  <div className="flex-1">
                    <h2 className="text-lg font-semibold text-white/95">
                      {savedData
                        ? "API Published Successfully!"
                        : "Save Workflow"}
                    </h2>
                    <p className="text-[13px] text-white/50 mt-0.5">
                      {savedData
                        ? "Your workflow is now a callable API"
                        : "Give your API endpoint a name"}
                    </p>
                  </div>
                  {!isSaving && (
                    <button
                      onClick={handleClose}
                      className="p-1.5 hover:bg-white/[0.06] rounded-lg transition-colors"
                    >
                      <X size={18} className="text-white/60" />
                    </button>
                  )}
                </div>
              </div>

              {/* Content */}
              <div className="p-6">
                {!savedData ? (
                  <div className="space-y-5">
                    {/* API Name Input */}
                    <div>
                      <label className="block text-[13px] font-medium text-white/80 mb-2">
                        API Name
                      </label>
                      <input
                        type="text"
                        value={apiName}
                        onChange={(e) => {
                          setApiName(e.target.value);
                          setError("");
                        }}
                        onKeyDown={handleKeyDown}
                        placeholder="e.g., User Registration API"
                        disabled={isSaving}
                        className="w-full px-4 py-2.5 bg-white/[0.04] border border-white/[0.08] rounded-xl 
                          text-[14px] text-white placeholder-white/40 
                          focus:outline-none focus:border-white/[0.2] focus:bg-white/[0.06]
                          disabled:opacity-50 disabled:cursor-not-allowed
                          transition-all"
                        autoFocus
                      />

                      {error && (
                        <motion.div
                          initial={{ opacity: 0, y: -4 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="flex items-center gap-2 mt-2 text-red-400 text-[12px]"
                        >
                          <AlertCircle size={14} />
                          {error}
                        </motion.div>
                      )}
                    </div>

                    {/* Generated Slug Preview */}
                    {slug && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        className="space-y-2"
                      >
                        <label className="block text-[13px] font-medium text-white/80">
                          Generated Slug
                        </label>
                        <div className="px-4 py-2.5 bg-white/[0.04] border border-white/[0.06] rounded-xl">
                          <code className="text-[13px] text-emerald-400 font-mono">
                            {slug}
                          </code>
                        </div>
                      </motion.div>
                    )}

                    {/* API Path Preview */}
                    {apiPath && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        className="space-y-2"
                      >
                        <label className="block text-[13px] font-medium text-white/80">
                          API Endpoint
                        </label>
                        <div className="px-4 py-2.5 bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/20 rounded-xl">
                          <code className="text-[13px] text-blue-300 font-mono break-all">
                            POST {apiPath}
                          </code>
                        </div>
                      </motion.div>
                    )}

                    {/* Actions */}
                    <div className="flex gap-3 pt-2">
                      <button
                        onClick={handleClose}
                        disabled={isSaving}
                        className="flex-1 px-4 py-2.5 text-[14px] font-medium text-white/70 
                          bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08]
                          rounded-xl transition-all active:scale-[0.98]
                          disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleSubmit}
                        disabled={!apiName.trim() || isSaving}
                        className="flex-1 px-4 py-2.5 text-[14px] font-medium text-black 
                          bg-white hover:bg-white/90 rounded-xl 
                          flex items-center justify-center gap-2
                          transition-all active:scale-[0.98]
                          disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isSaving ? (
                          <>
                            <div className="w-4 h-4 border-2 border-black/20 border-t-black rounded-full animate-spin" />
                            Publishing...
                          </>
                        ) : (
                          <>
                            Publish API
                            <ArrowRight size={16} />
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                ) : (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="space-y-4"
                  >
                    {/* Success Banner */}
                    <div className="flex items-center gap-3 px-4 py-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
                      <CheckCircle2
                        size={20}
                        className="text-emerald-400 flex-shrink-0"
                      />
                      <div className="flex-1">
                        <p className="text-[14px] font-medium text-emerald-300">
                          Your workflow is now live!
                        </p>
                        <p className="text-[12px] text-emerald-400/70 mt-0.5">
                          Start making API calls to execute your workflow
                        </p>
                      </div>
                    </div>

                    {/* Tabs */}
                    <div className="flex gap-2 p-1 bg-white/[0.03] rounded-lg border border-white/[0.06]">
                      <button
                        onClick={() => setActiveTab("overview")}
                        className={`flex-1 px-3 py-2 rounded-md text-[13px] font-medium transition-all ${
                          activeTab === "overview"
                            ? "bg-white/[0.08] text-white"
                            : "text-white/60 hover:text-white/80"
                        }`}
                      >
                        <div className="flex items-center justify-center gap-2">
                          <BookOpen size={14} />
                          Overview
                        </div>
                      </button>
                      <button
                        onClick={() => setActiveTab("curl")}
                        className={`flex-1 px-3 py-2 rounded-md text-[13px] font-medium transition-all ${
                          activeTab === "curl"
                            ? "bg-white/[0.08] text-white"
                            : "text-white/60 hover:text-white/80"
                        }`}
                      >
                        <div className="flex items-center justify-center gap-2">
                          <Terminal size={14} />
                          cURL
                        </div>
                      </button>
                      <button
                        onClick={() => setActiveTab("javascript")}
                        className={`flex-1 px-3 py-2 rounded-md text-[13px] font-medium transition-all ${
                          activeTab === "javascript"
                            ? "bg-white/[0.08] text-white"
                            : "text-white/60 hover:text-white/80"
                        }`}
                      >
                        <div className="flex items-center justify-center gap-2">
                          <Code size={14} />
                          JavaScript
                        </div>
                      </button>
                    </div>

                    {/* Tab Content */}
                    <div className="space-y-4">
                      {activeTab === "overview" && (
                        <motion.div
                          key="overview"
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="space-y-4"
                        >
                          {/* API Details */}
                          <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-2">
                              <label className="flex items-center gap-2 text-[12px] font-medium text-white/60">
                                <Workflow size={12} />
                                Workflow ID
                              </label>
                              <div className="flex items-center gap-2">
                                <div className="flex-1 px-3 py-2 bg-white/[0.04] border border-white/[0.06] rounded-lg">
                                  <code className="text-[12px] text-white/90 font-mono break-all">
                                    {savedData.workflowId}
                                  </code>
                                </div>
                                <button
                                  onClick={() =>
                                    copyToClipboard(
                                      savedData.workflowId,
                                      "workflowId"
                                    )
                                  }
                                  className="px-2 py-2 bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.06] rounded-lg transition-all active:scale-95"
                                  title="Copy"
                                >
                                  {copiedField === "workflowId" ? (
                                    <CheckCircle2
                                      size={14}
                                      className="text-emerald-400"
                                    />
                                  ) : (
                                    <Copy size={14} className="text-white/60" />
                                  )}
                                </button>
                              </div>
                            </div>

                            <div className="space-y-2">
                              <label className="flex items-center gap-2 text-[12px] font-medium text-white/60">
                                <Zap size={12} />
                                API Name
                              </label>
                              <div className="px-3 py-2 bg-white/[0.04] border border-white/[0.06] rounded-lg">
                                <div className="text-[13px] text-white/90 font-medium">
                                  {savedData.apiName}
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Endpoint */}
                          <div className="space-y-2">
                            <label className="flex items-center gap-2 text-[12px] font-medium text-white/60">
                              <Terminal size={12} />
                              API Endpoint
                            </label>
                            <div className="flex items-center gap-2">
                              <div className="flex-1 px-3 py-2.5 bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/20 rounded-lg">
                                <code className="text-[13px] text-blue-300 font-mono break-all">
                                  POST {savedData.apiPath}
                                </code>
                              </div>
                              <button
                                onClick={() =>
                                  copyToClipboard(
                                    `POST ${savedData.apiPath}`,
                                    "apiPath"
                                  )
                                }
                                className="px-2 py-2.5 bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.06] rounded-lg transition-all active:scale-95"
                                title="Copy"
                              >
                                {copiedField === "apiPath" ? (
                                  <CheckCircle2
                                    size={14}
                                    className="text-emerald-400"
                                  />
                                ) : (
                                  <Copy size={14} className="text-white/60" />
                                )}
                              </button>
                            </div>
                          </div>

                          {/* Request Body Structure */}
                          <div className="space-y-2">
                            <label className="flex items-center gap-2 text-[12px] font-medium text-white/60">
                              <FileJson size={12} />
                              Request Body Structure
                            </label>
                            <div className="relative">
                              <pre className="px-4 py-3 bg-[#0a0a0a] border border-white/[0.06] rounded-lg overflow-x-auto">
                                <code className="text-[12px] text-white/80 font-mono">
                                  {JSON.stringify(exampleBody, null, 2)}
                                </code>
                              </pre>
                              <button
                                onClick={() =>
                                  copyToClipboard(
                                    JSON.stringify(exampleBody, null, 2),
                                    "body"
                                  )
                                }
                                className="absolute top-2 right-2 px-2 py-1.5 bg-white/[0.08] hover:bg-white/[0.12] border border-white/[0.08] rounded-md transition-all active:scale-95"
                                title="Copy"
                              >
                                {copiedField === "body" ? (
                                  <CheckCircle2
                                    size={12}
                                    className="text-emerald-400"
                                  />
                                ) : (
                                  <Copy size={12} className="text-white/60" />
                                )}
                              </button>
                            </div>
                          </div>

                          {/* Input Variables */}
                          {savedData.inputVariables &&
                            savedData.inputVariables.length > 0 && (
                              <div className="space-y-2">
                                <label className="text-[12px] font-medium text-white/60">
                                  Input Variables
                                </label>
                                <div className="space-y-2">
                                  {savedData.inputVariables.map((v, i) => (
                                    <div
                                      key={i}
                                      className="flex items-center gap-3 px-3 py-2 bg-white/[0.03] border border-white/[0.06] rounded-lg"
                                    >
                                      <div className="flex-1">
                                        <div className="text-[13px] text-white/90 font-mono">
                                          {v.name}
                                        </div>
                                        {v.type && (
                                          <div className="text-[11px] text-white/50 mt-0.5">
                                            {v.type}
                                          </div>
                                        )}
                                      </div>
                                      {v.default !== undefined && (
                                        <div className="px-2 py-1 bg-white/[0.06] rounded text-[11px] text-white/60 font-mono">
                                          default: {JSON.stringify(v.default)}
                                        </div>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                        </motion.div>
                      )}

                      {activeTab === "curl" && (
                        <motion.div
                          key="curl"
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="space-y-2"
                        >
                          <label className="text-[12px] font-medium text-white/60">
                            cURL Example
                          </label>
                          <div className="relative">
                            <pre className="px-4 py-3 bg-[#0a0a0a] border border-white/[0.06] rounded-lg overflow-x-auto">
                              <code className="text-[12px] text-emerald-300 font-mono whitespace-pre">
                                {curlExample}
                              </code>
                            </pre>
                            <button
                              onClick={() =>
                                copyToClipboard(curlExample, "curl")
                              }
                              className="absolute top-2 right-2 px-2 py-1.5 bg-white/[0.08] hover:bg-white/[0.12] border border-white/[0.08] rounded-md transition-all active:scale-95"
                              title="Copy"
                            >
                              {copiedField === "curl" ? (
                                <CheckCircle2
                                  size={12}
                                  className="text-emerald-400"
                                />
                              ) : (
                                <Copy size={12} className="text-white/60" />
                              )}
                            </button>
                          </div>
                        </motion.div>
                      )}

                      {activeTab === "javascript" && (
                        <motion.div
                          key="javascript"
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="space-y-2"
                        >
                          <label className="text-[12px] font-medium text-white/60">
                            JavaScript Example
                          </label>
                          <div className="relative">
                            <pre className="px-4 py-3 bg-[#0a0a0a] border border-white/[0.06] rounded-lg overflow-x-auto">
                              <code className="text-[12px] text-blue-300 font-mono whitespace-pre">
                                {jsExample}
                              </code>
                            </pre>
                            <button
                              onClick={() => copyToClipboard(jsExample, "js")}
                              className="absolute top-2 right-2 px-2 py-1.5 bg-white/[0.08] hover:bg-white/[0.12] border border-white/[0.08] rounded-md transition-all active:scale-95"
                              title="Copy"
                            >
                              {copiedField === "js" ? (
                                <CheckCircle2
                                  size={12}
                                  className="text-emerald-400"
                                />
                              ) : (
                                <Copy size={12} className="text-white/60" />
                              )}
                            </button>
                          </div>
                        </motion.div>
                      )}
                    </div>

                    {/* Quick Tips */}
                    <div className="px-4 py-3 bg-blue-500/10 border border-blue-500/20 rounded-xl">
                      <div className="flex gap-2">
                        <Zap
                          size={14}
                          className="text-blue-400 mt-0.5 flex-shrink-0"
                        />
                        <div className="space-y-1">
                          <p className="text-[12px] font-medium text-blue-300">
                            Quick Tips
                          </p>
                          <ul className="text-[11px] text-blue-300/80 space-y-1 list-disc list-inside">
                            <li>
                              Include all required input variables in the
                              request body
                            </li>
                            <li>
                              The API returns the workflow execution result
                            </li>
                            <li>Check execution logs for debugging</li>
                          </ul>
                        </div>
                      </div>
                    </div>

                    {/* Close Button */}
                    <button
                      onClick={handleClose}
                      className="w-full px-4 py-2.5 text-[14px] font-medium text-black 
                        bg-white hover:bg-white/90 rounded-xl 
                        transition-all active:scale-[0.98]"
                    >
                      Done
                    </button>
                  </motion.div>
                )}
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}

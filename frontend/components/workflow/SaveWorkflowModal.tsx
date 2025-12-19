import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Workflow,
  AlertCircle,
  CheckCircle2,
  Copy,
  Code,
  BookOpen,
  Zap,
  FileJson,
  Terminal,
  Sparkles,
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
            transition={{ duration: 0.25 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-md z-50"
            onClick={handleClose}
          />

          {/* Modal */}
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 10 }}
              transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
              className={`w-full ${
                savedData ? "max-w-3xl" : "max-w-md"
              } bg-[#0f0f0f]/95 backdrop-blur-xl rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.4),inset_0_1px_1px_rgba(255,255,255,0.06)] border border-white/[0.06] pointer-events-auto`}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="relative px-6 py-5 border-b border-white/[0.06]">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-white/[0.09] to-white/[0.04] shadow-[inset_0_1px_1px_rgba(255,255,255,0.1)] flex items-center justify-center border border-white/[0.06]">
                    {savedData ? (
                      <CheckCircle2 size={18} className="text-emerald-400" />
                    ) : (
                      <Workflow size={18} className="text-white/70" />
                    )}
                  </div>
                  <div className="flex-1">
                    <h2 className="text-lg font-semibold text-white/95 tracking-tight">
                      {savedData ? "API Published" : "Save Workflow as API"}
                    </h2>
                    <p className="text-xs text-white/45 mt-0.5">
                      {savedData
                        ? "Your workflow is ready to use"
                        : "Create a callable endpoint for your workflow"}
                    </p>
                  </div>
                  {!isSaving && (
                    <button
                      onClick={handleClose}
                      className="p-1.5 hover:bg-white/[0.06] rounded-lg transition-all duration-200"
                    >
                      <X size={16} className="text-white/50" />
                    </button>
                  )}
                </div>
              </div>

              {/* Content */}
              <div className="px-6 py-5">
                {!savedData ? (
                  <div className="space-y-4">
                    {/* API Name Input */}
                    <div className="space-y-2">
                      <label className="block text-xs font-medium text-white/70">
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
                        placeholder="User Registration API"
                        disabled={isSaving}
                        className="w-full px-3 py-2.5 bg-white/[0.03] border border-white/[0.08] rounded-xl 
                          text-sm text-white placeholder-white/30 
                          focus:outline-none focus:border-white/[0.15] focus:bg-white/[0.04]
                          shadow-[inset_0_1px_2px_rgba(0,0,0,0.3)]
                          disabled:opacity-50 disabled:cursor-not-allowed
                          transition-all duration-200"
                        autoFocus
                      />

                      {error && (
                        <motion.div
                          initial={{ opacity: 0, y: -4 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="flex items-center gap-2 px-3 py-2 bg-red-500/10 border border-red-500/20 rounded-lg"
                        >
                          <AlertCircle size={12} className="text-red-400" />
                          <span className="text-xs text-red-400">{error}</span>
                        </motion.div>
                      )}
                    </div>

                    {/* Preview Section */}
                    {slug && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        className="space-y-3"
                      >
                        {/* Generated Slug */}
                        <div className="space-y-1.5">
                          <label className="block text-xs font-medium text-white/70">
                            URL Slug
                          </label>
                          <div className="px-3 py-2 bg-white/[0.02] border border-white/[0.06] rounded-lg">
                            <code className="text-xs text-emerald-400 font-mono">
                              {slug}
                            </code>
                          </div>
                        </div>

                        {/* API Endpoint Preview */}
                        <div className="space-y-1.5">
                          <label className="block text-xs font-medium text-white/70">
                            Endpoint Preview
                          </label>
                          <div className="px-3 py-2 bg-gradient-to-br from-blue-500/[0.08] to-purple-500/[0.08] border border-blue-400/[0.15] rounded-lg shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)]">
                            <div className="flex items-center gap-2">
                              <span className="px-1.5 py-0.5 bg-blue-400/20 rounded text-[10px] font-semibold text-blue-300">
                                POST
                              </span>
                              <code className="text-xs text-blue-200 font-mono">
                                {apiPath}
                              </code>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    )}

                    {/* Actions */}
                    <div className="flex gap-2 pt-2">
                      <button
                        onClick={handleClose}
                        disabled={isSaving}
                        className="flex-1 px-3 py-2.5 text-xs font-medium text-white/60 
                          bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.08]
                          rounded-xl transition-all duration-200
                          disabled:opacity-50 disabled:cursor-not-allowed
                          shadow-[inset_0_1px_1px_rgba(255,255,255,0.03)]"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleSubmit}
                        disabled={!apiName.trim() || isSaving}
                        className="flex-1 px-3 py-2.5 text-xs font-semibold text-black 
                          bg-white hover:bg-white/95 rounded-xl 
                          flex items-center justify-center gap-2
                          shadow-[0_1px_3px_rgba(0,0,0,0.3)]
                          transition-all duration-200
                          disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isSaving ? (
                          <>
                            <div className="w-3.5 h-3.5 border-2 border-black/20 border-t-black rounded-full animate-spin" />
                            Publishing...
                          </>
                        ) : (
                          <>
                            <Sparkles size={14} />
                            Publish API
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
                    {/* Success Message */}
                    {/* <div className="flex items-start gap-2.5 px-3 py-2.5 bg-emerald-500/[0.08] border border-emerald-400/[0.15] rounded-xl shadow-[inset_0_1px_1px_rgba(16,185,129,0.1)]">
                      <CheckCircle2
                        size={16}
                        className="text-emerald-400 mt-0.5 flex-shrink-0"
                      />
                      <div className="flex-1">
                        <p className="text-xs font-medium text-emerald-300">
                          Successfully published
                        </p>
                        <p className="text-[10px] text-emerald-400/60 mt-0.5">
                          Your workflow is now accessible via API endpoint
                        </p>
                      </div>
                    </div> */}

                    {/* Tabs */}
                    <div className="flex gap-1 p-0.5 bg-white/[0.02] rounded-lg border border-white/[0.06]">
                      {[
                        { id: "overview", icon: BookOpen, label: "Details" },
                        { id: "curl", icon: Terminal, label: "cURL" },
                        { id: "javascript", icon: Code, label: "JavaScript" },
                      ].map((tab) => (
                        <button
                          key={tab.id}
                          onClick={() =>
                            setActiveTab(
                              tab.id as "overview" | "curl" | "javascript"
                            )
                          }
                          className={`flex-1 px-2.5 py-2 rounded-md text-xs font-medium transition-all duration-200 ${
                            activeTab === tab.id
                              ? "bg-white/[0.08] text-white shadow-[inset_0_1px_1px_rgba(255,255,255,0.1)]"
                              : "text-white/50 hover:text-white/70 hover:bg-white/[0.03]"
                          }`}
                        >
                          <div className="flex items-center justify-center gap-1.5">
                            <tab.icon size={13} />
                            <span>{tab.label}</span>
                          </div>
                        </button>
                      ))}
                    </div>

                    {/* Tab Content */}
                    <AnimatePresence mode="wait">
                      {activeTab === "overview" && (
                        <motion.div
                          key="overview"
                          initial={{ opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -8 }}
                          transition={{ duration: 0.2 }}
                          className="space-y-3"
                        >
                          {/* Key Info Grid */}
                          <div className="grid grid-cols-2 gap-2.5">
                            {/* Workflow ID */}
                            <div className="space-y-1.5">
                              <label className="flex items-center gap-1 text-[10px] font-medium text-white/50">
                                <Workflow size={11} />
                                Workflow ID
                              </label>
                              <div className="flex items-center gap-1.5">
                                <div className="flex-1 px-2.5 py-2 bg-white/[0.02] border border-white/[0.06] rounded-lg overflow-hidden">
                                  <code className="text-[10px] text-white/80 font-mono block truncate">
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
                                  className="p-1.5 bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.06] rounded-md transition-all duration-200"
                                  title="Copy"
                                >
                                  {copiedField === "workflowId" ? (
                                    <CheckCircle2
                                      size={12}
                                      className="text-emerald-400"
                                    />
                                  ) : (
                                    <Copy size={12} className="text-white/50" />
                                  )}
                                </button>
                              </div>
                            </div>

                            {/* API Name */}
                            <div className="space-y-1.5">
                              <label className="flex items-center gap-1 text-[10px] font-medium text-white/50">
                                <Zap size={11} />
                                API Name
                              </label>
                              <div className="px-2.5 py-2 bg-white/[0.02] border border-white/[0.06] rounded-lg">
                                <div className="text-xs text-white/90 font-medium truncate">
                                  {savedData.apiName}
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Endpoint */}
                          <div className="space-y-1.5">
                            <label className="flex items-center gap-1 text-[10px] font-medium text-white/50">
                              <Terminal size={11} />
                              API Endpoint
                            </label>
                            <div className="flex items-center gap-1.5">
                              <div className="flex-1 px-2.5 py-2 bg-gradient-to-br from-blue-500/[0.08] to-purple-500/[0.08] border border-blue-400/[0.15] rounded-lg overflow-hidden">
                                <div className="flex items-center gap-2">
                                  <span className="px-1.5 py-0.5 bg-blue-400/20 rounded text-[10px] font-semibold text-blue-300 flex-shrink-0">
                                    POST
                                  </span>
                                  <code className="text-[10px] text-blue-200 font-mono truncate">
                                    {savedData.apiPath}
                                  </code>
                                </div>
                              </div>
                              <button
                                onClick={() =>
                                  copyToClipboard(
                                    `POST ${savedData.apiPath}`,
                                    "apiPath"
                                  )
                                }
                                className="p-1.5 bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.06] rounded-md transition-all duration-200"
                                title="Copy"
                              >
                                {copiedField === "apiPath" ? (
                                  <CheckCircle2
                                    size={12}
                                    className="text-emerald-400"
                                  />
                                ) : (
                                  <Copy size={12} className="text-white/50" />
                                )}
                              </button>
                            </div>
                          </div>

                          {/* Two Column Layout for Body and Variables */}
                          <div className="flex gap-4 items-center justify-between">
                            {/* Request Body */}
                            <div className="w-80">
                              <label className="flex items-center gap-1 text-[10px] font-medium text-white/50">
                                <FileJson size={11} />
                                Request Body
                              </label>
                              <div className="relative">
                                <pre className="px-2.5 py-2 bg-[#0a0a0a]/80 border border-white/[0.06] rounded-lg overflow-x-auto max-h-32 shadow-[inset_0_1px_2px_rgba(0,0,0,0.3)]">
                                  <code className="text-[10px] text-white/70 font-mono">
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
                                  className="absolute top-1.5 right-1.5 p-1 bg-white/[0.08] hover:bg-white/[0.12] border border-white/[0.08] rounded transition-all duration-200"
                                  title="Copy"
                                >
                                  {copiedField === "body" ? (
                                    <CheckCircle2
                                      size={10}
                                      className="text-emerald-400"
                                    />
                                  ) : (
                                    <Copy size={10} className="text-white/50" />
                                  )}
                                </button>
                              </div>
                            </div>

                            {/* Input Variables */}
                            <div className="space-y-1.5">
                              <label className="text-[10px] font-medium text-white/50">
                                Input Parameters{" "}
                                {savedData.inputVariables &&
                                  savedData.inputVariables.length > 0 &&
                                  `(${savedData.inputVariables.length})`}
                              </label>
                              <div className="space-y-1.5 max-h-32 overflow-y-auto pr-0.5">
                                {savedData.inputVariables &&
                                savedData.inputVariables.length > 0 ? (
                                  savedData.inputVariables.map((v, i) => (
                                    <div
                                      key={i}
                                      className="flex items-center gap-2 px-2.5 py-1.5 bg-white/[0.02] border border-white/[0.06] rounded-lg"
                                    >
                                      <div className="flex-1 min-w-0">
                                        <div className="text-[10px] text-white/85 font-mono truncate">
                                          {v.name}
                                        </div>
                                        {v.type && (
                                          <div className="text-[9px] text-white/40 mt-0.5">
                                            {v.type}
                                          </div>
                                        )}
                                      </div>
                                      {v.default !== undefined && (
                                        <div className="px-1.5 py-0.5 bg-white/[0.06] rounded text-[9px] text-white/50 font-mono flex-shrink-0">
                                          {JSON.stringify(v.default)}
                                        </div>
                                      )}
                                    </div>
                                  ))
                                ) : (
                                  <div className="px-2.5 py-6 bg-white/[0.02] border border-white/[0.06] rounded-lg text-center">
                                    <p className="text-[10px] text-white/40">
                                      No parameters defined
                                    </p>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      )}

                      {activeTab === "curl" && (
                        <motion.div
                          key="curl"
                          initial={{ opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -8 }}
                          transition={{ duration: 0.2 }}
                          className="space-y-1.5"
                        >
                          <label className="text-[10px] font-medium text-white/50">
                            Copy this command to test your API
                          </label>
                          <div className="relative">
                            <pre className="px-2.5 py-2.5 bg-[#0a0a0a]/80 border border-white/[0.06] rounded-lg overflow-x-auto max-h-48 shadow-[inset_0_1px_2px_rgba(0,0,0,0.3)]">
                              <code className="text-[10px] text-emerald-300 font-mono whitespace-pre">
                                {curlExample}
                              </code>
                            </pre>
                            <button
                              onClick={() =>
                                copyToClipboard(curlExample, "curl")
                              }
                              className="absolute top-1.5 right-1.5 p-1 bg-white/[0.08] hover:bg-white/[0.12] border border-white/[0.08] rounded transition-all duration-200"
                              title="Copy"
                            >
                              {copiedField === "curl" ? (
                                <CheckCircle2
                                  size={10}
                                  className="text-emerald-400"
                                />
                              ) : (
                                <Copy size={10} className="text-white/50" />
                              )}
                            </button>
                          </div>
                        </motion.div>
                      )}

                      {activeTab === "javascript" && (
                        <motion.div
                          key="javascript"
                          initial={{ opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -8 }}
                          transition={{ duration: 0.2 }}
                          className="space-y-1.5"
                        >
                          <label className="text-[10px] font-medium text-white/50">
                            Use this in your JavaScript application
                          </label>
                          <div className="relative">
                            <pre className="px-2.5 py-2.5 bg-[#0a0a0a]/80 border border-white/[0.06] rounded-lg overflow-x-auto max-h-48 shadow-[inset_0_1px_2px_rgba(0,0,0,0.3)]">
                              <code className="text-[10px] text-blue-300 font-mono whitespace-pre">
                                {jsExample}
                              </code>
                            </pre>
                            <button
                              onClick={() => copyToClipboard(jsExample, "js")}
                              className="absolute top-1.5 right-1.5 p-1 bg-white/[0.08] hover:bg-white/[0.12] border border-white/[0.08] rounded transition-all duration-200"
                              title="Copy"
                            >
                              {copiedField === "js" ? (
                                <CheckCircle2
                                  size={10}
                                  className="text-emerald-400"
                                />
                              ) : (
                                <Copy size={10} className="text-white/50" />
                              )}
                            </button>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {/* Done Button */}
                    <button
                      onClick={handleClose}
                      className="w-full px-3 py-2.5 text-xs font-semibold text-black 
                        bg-white hover:bg-white/95 rounded-xl 
                        shadow-[0_1px_3px_rgba(0,0,0,0.3)]
                        transition-all duration-200"
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

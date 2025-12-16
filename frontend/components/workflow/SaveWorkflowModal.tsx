import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Workflow,
  ArrowRight,
  AlertCircle,
  CheckCircle2,
  Copy,
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

  const generateSlug = (name: string) => {
    return name
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
  };

  const slug = apiName ? generateSlug(apiName) : "";
  const apiPath = slug ? `/workflow/run/{workflowId}/${slug}` : "";

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
              className="w-full max-w-md bg-[#1a1a1a] rounded-2xl shadow-2xl border border-white/[0.08] pointer-events-auto overflow-hidden"
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
                      Save Workflow
                    </h2>
                    <p className="text-[13px] text-white/50 mt-0.5">
                      Give your API endpoint a name
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
              <div className="p-6 space-y-5">
                {!savedData ? (
                  <>
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
                        placeholder="e.g., Login API"
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
                        <div
                          className="px-4 py-2.5 bg-gradient-to-r from-blue-500/10 to-purple-500/10 
                          border border-blue-500/20 rounded-xl"
                        >
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
                            Saving...
                          </>
                        ) : (
                          <>
                            Save Workflow
                            <ArrowRight size={16} />
                          </>
                        )}
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    {/* Success State */}
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="space-y-4"
                    >
                      {/* Success Icon */}
                      <div className="flex items-center justify-center">
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{
                            delay: 0.1,
                            type: "spring",
                            stiffness: 200,
                          }}
                          className="w-16 h-16 rounded-full bg-emerald-500/20 border-2 border-emerald-500/50 
                            flex items-center justify-center"
                        >
                          <CheckCircle2
                            size={32}
                            className="text-emerald-400"
                          />
                        </motion.div>
                      </div>

                      <div className="text-center space-y-1">
                        <h3 className="text-lg font-semibold text-white/95">
                          Workflow Saved Successfully!
                        </h3>
                        <p className="text-[13px] text-white/60">
                          Your workflow is now ready to use
                        </p>
                      </div>

                      {/* Workflow ID */}
                      <div className="space-y-2">
                        <label className="block text-[13px] font-medium text-white/80">
                          Workflow ID
                        </label>
                        <div className="flex items-center gap-2">
                          <div className="flex-1 px-4 py-2.5 bg-white/[0.04] border border-white/[0.06] rounded-xl">
                            <code className="text-[13px] text-white/90 font-mono break-all">
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
                            className="px-3 py-2.5 bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.06]
                              rounded-xl transition-all active:scale-95 flex-shrink-0"
                            title="Copy Workflow ID"
                          >
                            {copiedField === "workflowId" ? (
                              <CheckCircle2
                                size={16}
                                className="text-emerald-400"
                              />
                            ) : (
                              <Copy size={16} className="text-white/60" />
                            )}
                          </button>
                        </div>
                      </div>

                      {/* API Name */}
                      <div className="space-y-2">
                        <label className="block text-[13px] font-medium text-white/80">
                          API Name
                        </label>
                        <div className="px-4 py-2.5 bg-white/[0.04] border border-white/[0.06] rounded-xl">
                          <div className="text-[14px] text-white/90 font-medium">
                            {savedData.apiName}
                          </div>
                        </div>
                      </div>

                      {/* API Endpoint */}
                      <div className="space-y-2">
                        <label className="block text-[13px] font-medium text-white/80">
                          API Endpoint
                        </label>
                        <div className="flex items-center gap-2">
                          <div
                            className="flex-1 px-4 py-2.5 bg-gradient-to-r from-blue-500/10 to-purple-500/10 
                            border border-blue-500/20 rounded-xl"
                          >
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
                            className="px-3 py-2.5 bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.06]
                              rounded-xl transition-all active:scale-95 flex-shrink-0"
                            title="Copy API Endpoint"
                          >
                            {copiedField === "apiPath" ? (
                              <CheckCircle2
                                size={16}
                                className="text-emerald-400"
                              />
                            ) : (
                              <Copy size={16} className="text-white/60" />
                            )}
                          </button>
                        </div>
                      </div>

                      {/* Info Box */}
                      <div className="px-4 py-3 bg-blue-500/10 border border-blue-500/20 rounded-xl">
                        <p className="text-[12px] text-blue-300 leading-relaxed">
                          💡 You can now call this API endpoint to execute your
                          workflow. Make sure to include the workflow ID in your
                          requests.
                        </p>
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
                  </>
                )}
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}

/* eslint-disable react/no-unescaped-entities */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useCallback, useEffect, useState } from "react";
import {
  useNodesState,
  useEdgesState,
  Connection,
  ReactFlow,
  Background,
  BackgroundVariant,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";

import { v4 as uuid } from "uuid";
import {
  Menu,
  Play,
  Save,
  Workflow,
  Sparkles,
  ArrowRight,
  X,
} from "lucide-react";

import { nodeTypes } from "@/components/nodes/NodesStore";
import NodeEditorSidebar from "@/components/Ui/NodesSidebar";
import { Sidebar } from "@/components/Ui/Sidebar";
import ExecutionLogsSidebar from "@/components/Ui/ExecutionLogsSidebar";
import SaveWorkflowModal from "@/components/workflow/SaveWorkflowModal";
import { DatabaseConnect } from "@/components/connection/DatabaseConnect";

import { createNode } from "@/components/workflow/nodes/addNode";
import { saveNodeChanges } from "@/components/workflow/nodes/saveNode";

import { buildForSave } from "@/components/workflow/build/buildForSave";
import { buildForExecute } from "@/components/workflow/build/buildForExecute";

import { handleOnConnect } from "@/components/workflow/nodes/onConnect";
import { getExecutionOrder } from "@/utils/topoOrder";
import { calcStepNumbers } from "@/utils/calcStepNumbers";
import { buildGraphMeta } from "@/components/workflow/validation/buildGraph";
import { validateGraph } from "@/components/workflow/validation/validateGraph";
import { RootDispatch, RootState } from "@/store";
import { useDispatch, useSelector } from "react-redux";
import AnimatedDashedEdge from "@/components/Ui/AnimatedDashedEdge";
import {
  fetchDbSchemas,
  setUserDbConnected,
  clearDbSchemas,
} from "@/store/dbSchemasSlice";
import { ExecutionStreamProvider } from "@/components/ExecutionStreamProvider";
import type { ExecutionLog } from "@/components/ExecutionStreamProvider";
import { apiUrl } from "../../utils/api";

export default function WorkflowPage() {
  const [graphMeta, setGraphMeta] = useState<any>(null);
  const dbSchemas = useSelector((state: RootState) => state.dbSchemas.schemas);
  const isUserDbConnected = useSelector(
    (state: RootState) => state.dbSchemas.isUserDbConnected,
  );
  const ownerId = useSelector((state: RootState) => state.dbSchemas.ownerId);
  const userDbLabel = useSelector(
    (state: RootState) => state.dbSchemas.userDbLabel,
  );
  const dispatch = useDispatch<RootDispatch>();

  const [nodes, setNodes, onNodesChange] = useNodesState<any>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<any>([]);
  const [selectedNode, setSelectedNode] = useState<any>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false); // default closed on mobile
  const [rfInstance, setRfInstance] = useState<any>(null);
  const [logsOpen, setLogsOpen] = useState(false);
  const [aiPrompt, setAiPrompt] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [aiBarOpen, setAiBarOpen] = useState(false); // mobile AI bar toggle
  const [execution, setExecution] = useState<{
    executionId: string;
    logs: ExecutionLog[];
    finished: boolean;
  } | null>(null);
  const [saveModalOpen, setSaveModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [savedWorkflowData, setSavedWorkflowData] = useState<{
    workflowId: string;
    apiPath: string;
    apiName: string;
  } | null>(null);

  const stepNumbers = calcStepNumbers(nodes, edges) as Record<string, number>;
  const nodesWithSteps = nodes.map((n) => ({
    ...n,
    data: { ...n.data, _stepNumber: stepNumbers[n.id] ?? null },
  }));

  useEffect(() => {
    dispatch(fetchDbSchemas());
  }, [dispatch]);

  const handleDbConnected = useCallback(
    (schemas: Record<string, string[]>) => {
      dispatch(
        setUserDbConnected({ schemas, label: userDbLabel ?? "My Database" }),
      );
    },
    [dispatch, userDbLabel],
  );

  const handleDbDisconnected = useCallback(() => {
    dispatch(clearDbSchemas());
  }, [dispatch]);

  const handleLogsUpdate = useCallback((logs: ExecutionLog[]) => {
    setExecution((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        logs,
        finished: logs.some(
          (l) =>
            (l as any).phase === "execution_finished" ||
            (l as any).phase === "execution_failed",
        ),
      };
    });
  }, []);

  useEffect(() => {
    try {
      setGraphMeta(buildGraphMeta(nodes, edges, dbSchemas));
    } catch {
      setGraphMeta(null);
    }
  }, [nodes, edges, dbSchemas]);

  useEffect(() => {
    const aiWorkflow = sessionStorage.getItem("aiWorkflow");
    if (aiWorkflow) {
      const { nodes, edges } = JSON.parse(aiWorkflow);
      setNodes(nodes);
      setEdges(edges);
      sessionStorage.removeItem("aiWorkflow");
      setGraphMeta(buildGraphMeta(nodes, edges, dbSchemas));
    }
  }, []);

  useEffect(() => {
    setEdges((eds) => eds.map((e) => ({ ...e, type: e.type ?? "animated" })));
  }, []);

  useEffect(() => {
    const ordered = getExecutionOrder(nodes, edges);
    const map: Record<string, number> = {};
    let step = 1;
    ordered.forEach((n) => (map[n.id] = step++));
    setNodes((prev) =>
      prev.map((n) => ({
        ...n,
        data: { ...n.data, _stepNumber: map[n.id] || 0 },
      })),
    );
  }, [nodes.length, edges.length]);

  // Detect screen size and open sidebar on desktop by default
  useEffect(() => {
    const mq = window.matchMedia("(min-width: 1024px)");
    setSidebarOpen(mq.matches);
    const handler = (e: MediaQueryListEvent) => setSidebarOpen(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  const onConnect = (params: Connection) => {
    const edgeWithId = { ...params, id: uuid(), type: "animated" };
    const result = handleOnConnect(
      edgeWithId,
      rfInstance,
      nodes,
      edges,
      dbSchemas,
    );
    try {
      validateGraph(result.nodes, result.edges, dbSchemas);
    } catch (err: any) {
      console.warn("Invalid connection:", err?.message);
      return;
    }
    setNodes(result.nodes);
    setEdges(result.edges);
    setGraphMeta(buildGraphMeta(result.nodes, result.edges, dbSchemas));
  };

  const generateAIWorkflow = async () => {
    const prompt = aiPrompt.trim();
    if (!prompt) return;
    setIsGenerating(true);
    try {
      const res = await fetch(apiUrl("/workflow/generate"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
      });
      const ai = await res.json();
      if (!ai.nodes || !ai.edges) {
        alert("Invalid AI workflow returned");
        return;
      }
      const reactNodes = ai.nodes.map((n: any, index: number) => ({
        id: n.id,
        type: n.type,
        position: { x: (index % 3) * 280, y: Math.floor(index / 3) * 180 },
        data: n.data,
      }));
      const reactEdges = ai.edges.map((e: any) => ({
        id: e.id,
        source: e.source,
        target: e.target,
        type: "animated",
      }));
      setNodes(reactNodes);
      setEdges(reactEdges);
      setGraphMeta(buildGraphMeta(reactNodes, reactEdges, dbSchemas));
      setAiPrompt("");
      setAiBarOpen(false);
    } catch {
      alert("Failed to generate workflow");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      generateAIWorkflow();
    }
  };

  const saveWorkflow = async () => {
    try {
      validateGraph(nodes, edges, dbSchemas);
    } catch (err: any) {
      return alert("Cannot save workflow: " + err.message);
    }
    setSavedWorkflowData(null);
    setSaveModalOpen(true);
  };

  function extractInputVariables(nodes: any[]) {
    const inputNode = nodes.find((n) => n.type === "input");
    if (!inputNode?.data?.fields?.variables) return [];
    return inputNode.data.fields.variables.map((v: any) => ({
      name: v.name,
      type: v.type || "string",
      default: v.default,
    }));
  }

  const handleSaveWithApiName = async (apiName: string) => {
    setIsSaving(true);
    try {
      const payload = buildForSave(nodes, edges);
      const inputVariables = extractInputVariables(nodes);
      const res = await fetch(apiUrl("/workflows/save"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...payload, apiName, inputVariables }),
      });
      const result = await res.json();
      if (!result.ok) throw new Error("Save failed");
      setSavedWorkflowData({
        workflowId: result.workflowId,
        apiPath: result.apiPath,
        apiName: result.apiName,
        inputVariables: result.inputVariables,
      } as any);
    } catch {
      alert("Failed to save workflow");
    } finally {
      setIsSaving(false);
    }
  };

  const runWorkflow = async () => {
    try {
      validateGraph(nodes, edges, dbSchemas);
    } catch (err: any) {
      alert("Cannot run workflow: " + err.message);
      return;
    }
    const payload = buildForExecute(nodes, edges);
    const res = await fetch(apiUrl("/workflow/execute"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...payload, ownerId }),
    });
    const output = await res.json();
    if (!output.executionId) return;
    setExecution({
      executionId: output.executionId,
      logs: [],
      finished: false,
    });
    setLogsOpen(true);
  };

  const handleSaveNode = (id: string, newData: any) => {
    setNodes((curr) => saveNodeChanges(id, newData, curr));
  };

  const edgeTypes = { animated: AnimatedDashedEdge };

  return (
    <div className="w-full h-[100dvh] bg-gradient-to-br from-[#0a0a0a] via-[#111] to-[#0a0a0a] flex overflow-hidden">
      {/* Sidebar overlay on mobile */}
      {sidebarOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/60 z-30 backdrop-blur-sm"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div
        className={`
        fixed lg:relative inset-y-0 left-0 z-40 lg:z-auto
        transition-transform duration-300 ease-in-out
        ${sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0 lg:hidden"}
      `}
      >
        <Sidebar
          sidebarOpen={sidebarOpen}
          setSidebarOpen={setSidebarOpen}
          addNode={(t: any, l: any) => {
            setNodes((n) => [...n, createNode(t, l)]);
            setSidebarOpen(false);
          }}
          clearNodes={() => {
            setNodes([]);
            setEdges([]);
          }}
          nodes={nodes}
          edges={edges}
        />
      </div>

      <div className="flex-1 flex flex-col relative min-w-0">
        {/* Top Nav */}
        <div className="h-[52px] sm:h-[60px] bg-[#191919]/60 backdrop-blur-xl border-b border-white/[0.06] flex items-center px-3 sm:px-5 gap-2 sm:gap-3 shrink-0">
          {/* Hamburger — always visible on mobile, toggle on desktop */}
          <button
            onClick={() => setSidebarOpen((v) => !v)}
            className="p-2 hover:bg-white/[0.04] rounded-lg transition-all active:scale-95 shrink-0"
          >
            {sidebarOpen ? (
              <X size={16} className="text-white/60" />
            ) : (
              <Menu size={16} className="text-white/60" />
            )}
          </button>

          <DatabaseConnect
            ownerId={ownerId}
            onConnected={handleDbConnected}
            onDisconnected={handleDbDisconnected}
          />

          <div className="flex-1 min-w-0" />

          {/* DB warning — hidden on very small screens */}
          {!isUserDbConnected && (
            <span className="text-[11px] text-white/25 hidden md:block shrink-0">
              Connect a database to use DB nodes
            </span>
          )}

          {/* Mobile AI toggle */}
          <button
            onClick={() => setAiBarOpen((v) => !v)}
            className="sm:hidden p-2 hover:bg-white/[0.04] rounded-lg transition-all active:scale-95 shrink-0"
            title="AI generate"
          >
            <Sparkles size={16} className="text-white/60" />
          </button>

          <button
            onClick={saveWorkflow}
            className="px-3 sm:px-4 py-1.5 sm:py-2 text-[12px] sm:text-[13px] font-medium text-white/70 hover:text-white bg-white/[0.03] border border-white/[0.08] rounded-lg flex items-center gap-1.5 sm:gap-2 transition-all active:scale-95 shrink-0"
          >
            <Save size={13} />
            <span className="hidden xs:inline">Save</span>
          </button>

          <button
            onClick={runWorkflow}
            className="px-3 sm:px-4 py-1.5 sm:py-2 text-[12px] sm:text-[13px] font-medium text-black bg-white hover:bg-white/90 rounded-lg flex items-center gap-1.5 sm:gap-2 transition-all active:scale-95 shrink-0"
          >
            <Play size={13} fill="black" />
            <span className="hidden xs:inline">Run</span>
          </button>
        </div>

        {/* Canvas */}
        <div className="flex-1 relative overflow-hidden">
          <div className="absolute inset-0">
            <ReactFlow
              nodes={nodesWithSteps}
              edges={edges}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              onNodeClick={(_, n) => setSelectedNode(n)}
              onInit={(inst) => setRfInstance(inst)}
              onConnect={onConnect}
              nodeTypes={nodeTypes}
              edgeTypes={edgeTypes}
              fitView
              className="bg-[#0F0F0F]"
            >
              <Background
                variant={BackgroundVariant.Dots}
                gap={36}
                size={0.6}
                color="rgba(255,255,255,0.06)"
              />
            </ReactFlow>

            {selectedNode && (
              <div className="absolute right-0 top-0 h-full z-40 w-full sm:w-auto">
                <NodeEditorSidebar
                  selectedNode={selectedNode}
                  onClose={() => setSelectedNode(null)}
                  onSave={handleSaveNode}
                  allNodes={nodes}
                  allEdges={edges}
                  graphMeta={graphMeta}
                />
              </div>
            )}
          </div>

          {/* Empty state */}
          {nodes.length === 0 && (
            <div className="w-full h-full flex items-center justify-center bg-white/[0.02] pointer-events-none">
              <div className="text-center space-y-3 px-6">
                <div className="w-14 sm:w-16 h-14 sm:h-16 rounded-2xl bg-white/[0.05] flex items-center justify-center mx-auto">
                  <Workflow size={24} className="text-white/40" />
                </div>
                <p className="text-[14px] sm:text-[15px] text-white/90 font-medium">
                  Start building your workflow
                </p>
                <p className="text-[12px] sm:text-[13px] text-white/50">
                  {isUserDbConnected
                    ? "Use the sidebar or describe what you need below"
                    : "Connect your database first, then start building"}
                </p>
                {!isUserDbConnected && (
                  <p className="text-[11px] sm:text-[12px] text-white/30">
                    ↑ Click "Connect Database" in the toolbar above
                  </p>
                )}
              </div>
            </div>
          )}

          {/* AI Prompt Bar — always visible on desktop, toggled on mobile */}
          <div
            className={`
            absolute bottom-0 left-0 right-0 p-3 sm:p-6 pointer-events-none
            transition-all duration-300
            ${aiBarOpen || true ? "translate-y-0 opacity-100" : "translate-y-full opacity-0 sm:translate-y-0 sm:opacity-100"}
          `}
          >
            {/* Mobile: collapsible */}
            <div
              className={`sm:hidden mb-2 transition-all duration-300 ${aiBarOpen ? "block" : "hidden"}`}
            >
              <div className="max-w-3xl mx-auto pointer-events-auto">
                <MobileAiBar
                  aiPrompt={aiPrompt}
                  setAiPrompt={setAiPrompt}
                  isGenerating={isGenerating}
                  onGenerate={generateAIWorkflow}
                  onKeyDown={handleKeyDown}
                />
              </div>
            </div>

            {/* Desktop AI bar — always shown */}
            <div className="hidden sm:block max-w-3xl mx-auto pointer-events-auto">
              <div className="bg-[#191919]/95 backdrop-blur-xl border border-white/[0.1] rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.4)]">
                <div className="flex items-end gap-3 p-4">
                  <div className="flex-shrink-0 mb-1">
                    <div className="w-8 h-8 rounded-lg bg-white/[0.08] border border-white/[0.1] flex items-center justify-center">
                      <Sparkles size={16} className="text-white/70" />
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <textarea
                      value={aiPrompt}
                      onChange={(e) => setAiPrompt(e.target.value)}
                      onKeyDown={handleKeyDown}
                      placeholder="Describe your API workflow..."
                      disabled={isGenerating}
                      className="w-full bg-transparent text-[14px] text-white placeholder-white/40 resize-none focus:outline-none leading-relaxed max-h-32 min-h-[24px]"
                      rows={1}
                      onInput={(e) => {
                        const t = e.target as HTMLTextAreaElement;
                        t.style.height = "auto";
                        t.style.height = t.scrollHeight + "px";
                      }}
                    />
                  </div>
                  <div className="flex-shrink-0 mb-1">
                    <button
                      onClick={generateAIWorkflow}
                      disabled={!aiPrompt.trim() || isGenerating}
                      className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${aiPrompt.trim() && !isGenerating ? "bg-white hover:bg-white/90 text-black active:scale-95" : "bg-white/[0.08] text-white/30 cursor-not-allowed"}`}
                    >
                      {isGenerating ? (
                        <div className="w-4 h-4 border-2 border-white/20 border-t-white/70 rounded-full animate-spin" />
                      ) : (
                        <ArrowRight size={16} />
                      )}
                    </button>
                  </div>
                </div>
                <div className="px-4 pb-3 flex items-center justify-between text-[11px] text-white/40">
                  <span>
                    Press Enter to generate • Shift+Enter for new line
                  </span>
                  <span className="flex items-center gap-1">
                    <Sparkles size={10} /> AI-powered
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Logs sidebar */}
      <ExecutionLogsSidebar
        isOpen={logsOpen}
        onClose={() => setLogsOpen(false)}
        logs={execution?.logs || []}
        isPolling={execution ? !execution.finished : false}
        executionId={execution?.executionId || null}
      />

      {/* Save modal */}
      <SaveWorkflowModal
        isOpen={saveModalOpen}
        onClose={() => {
          setSaveModalOpen(false);
          setSavedWorkflowData(null);
        }}
        onSave={handleSaveWithApiName}
        isSaving={isSaving}
        savedData={savedWorkflowData}
      />

      {execution?.executionId && (
        <ExecutionStreamProvider
          executionId={execution.executionId}
          onUpdate={handleLogsUpdate}
        />
      )}
    </div>
  );
}

// ── Mobile AI bar ─────────────────────────────────────────────────────────────
function MobileAiBar({
  aiPrompt,
  setAiPrompt,
  isGenerating,
  onGenerate,
  onKeyDown,
}: any) {
  return (
    <div className="bg-[#191919]/95 backdrop-blur-xl border border-white/[0.1] rounded-xl shadow-[0_8px_32px_rgba(0,0,0,0.4)]">
      <div className="flex items-center gap-2 p-3">
        <Sparkles size={14} className="text-white/50 shrink-0" />
        <input
          value={aiPrompt}
          onChange={(e) => setAiPrompt(e.target.value)}
          onKeyDown={onKeyDown}
          placeholder="Describe your workflow..."
          disabled={isGenerating}
          className="flex-1 bg-transparent text-[13px] text-white placeholder-white/40 focus:outline-none"
        />
        <button
          onClick={onGenerate}
          disabled={!aiPrompt.trim() || isGenerating}
          className={`w-7 h-7 rounded-lg flex items-center justify-center transition-all shrink-0 ${aiPrompt.trim() && !isGenerating ? "bg-white text-black active:scale-95" : "bg-white/[0.08] text-white/30 cursor-not-allowed"}`}
        >
          {isGenerating ? (
            <div className="w-3.5 h-3.5 border-2 border-white/20 border-t-white/70 rounded-full animate-spin" />
          ) : (
            <ArrowRight size={14} />
          )}
        </button>
      </div>
    </div>
  );
}

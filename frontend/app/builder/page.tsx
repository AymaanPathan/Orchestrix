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
import { Menu, Play, Save, Workflow, Sparkles, ArrowRight } from "lucide-react";

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
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [rfInstance, setRfInstance] = useState<any>(null);
  const [logsOpen, setLogsOpen] = useState(false);
  const [aiPrompt, setAiPrompt] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
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

  // ── On mount: check if user already has a DB connected ──────────────────
  useEffect(() => {
    dispatch(fetchDbSchemas());
  }, [dispatch]);

  // ── DB connection handlers ───────────────────────────────────────────────
  const handleDbConnected = useCallback(
    (schemas: Record<string, string[]>) => {
      dispatch(
        setUserDbConnected({
          schemas,
          label: userDbLabel ?? "My Database",
        }),
      );
    },
    [dispatch, userDbLabel],
  );

  const handleDbDisconnected = useCallback(() => {
    dispatch(clearDbSchemas());
  }, [dispatch]);

  // ── Logs update ──────────────────────────────────────────────────────────
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

  // ── Graph meta ───────────────────────────────────────────────────────────
  useEffect(() => {
    try {
      const meta = buildGraphMeta(nodes, edges, dbSchemas);
      setGraphMeta(meta);
    } catch {
      setGraphMeta(null);
    }
  }, [nodes, edges, dbSchemas]);

  // ── Load AI workflow from sessionStorage ─────────────────────────────────
  useEffect(() => {
    const aiWorkflow = sessionStorage.getItem("aiWorkflow");
    if (aiWorkflow) {
      const { nodes, edges } = JSON.parse(aiWorkflow);
      setNodes(nodes);
      setEdges(edges);
      sessionStorage.removeItem("aiWorkflow");
      const meta = buildGraphMeta(nodes, edges, dbSchemas);
      setGraphMeta(meta);
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

  // ── Connections ──────────────────────────────────────────────────────────
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

  // ── AI generation ────────────────────────────────────────────────────────
  const generateAIWorkflow = async () => {
    const prompt = aiPrompt.trim();
    if (!prompt) return;
    setIsGenerating(true);
    try {
      const res = await fetch("http://localhost:3000/workflow/generate", {
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
    } catch (error) {
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

  // ── Save ─────────────────────────────────────────────────────────────────
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
      const res = await fetch("http://localhost:3000/workflows/save", {
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
    } catch (error) {
      alert("Failed to save workflow");
    } finally {
      setIsSaving(false);
    }
  };

  // ── Run ──────────────────────────────────────────────────────────────────
  const runWorkflow = async () => {
    try {
      validateGraph(nodes, edges, dbSchemas);
    } catch (err: any) {
      alert("Cannot run workflow: " + err.message);
      return;
    }
    const payload = buildForExecute(nodes, edges);
    const res = await fetch("http://localhost:3000/workflow/execute", {
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
    <div className="w-full h-screen bg-gradient-to-br from-[#0a0a0a] via-[#111] to-[#0a0a0a] flex overflow-hidden">
      <Sidebar
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
        addNode={(t, l) => setNodes((n) => [...n, createNode(t, l)])}
        clearNodes={() => {
          setNodes([]);
          setEdges([]);
        }}
        nodes={nodes}
        edges={edges}
      />

      <div className="flex-1 flex flex-col relative">
        {/* ── Top Nav Bar ─────────────────────────────────────────────── */}
        <div className="h-[60px] bg-[#191919]/60 backdrop-blur-xl border-b border-white/[0.06] flex items-center px-5 gap-3">
          {!sidebarOpen && (
            <button
              onClick={() => setSidebarOpen(true)}
              className="p-2 hover:bg-white/[0.04] rounded-lg transition-all active:scale-95"
            >
              <Menu size={18} className="text-white/60" />
            </button>
          )}

          {/* ── DB Connect button — left of save/run ─────────────── */}
          <DatabaseConnect
            ownerId={ownerId}
            onConnected={handleDbConnected}
            onDisconnected={handleDbDisconnected}
          />

          {/* Spacer pushes save/run to the right */}
          <div className="flex-1" />

          {/* DB not connected warning */}
          {!isUserDbConnected && (
            <span className="text-[11px] text-white/25 hidden sm:block">
              Connect a database to use DB nodes
            </span>
          )}

          <button
            onClick={saveWorkflow}
            className="px-4 py-2 text-[13px] font-medium text-white/70 hover:text-white bg-white/[0.03]
                border border-white/[0.08] rounded-lg flex items-center gap-2 transition-all active:scale-95"
          >
            <Save size={14} />
            Save
          </button>

          <button
            onClick={runWorkflow}
            className="px-4 py-2 text-[13px] font-medium text-black bg-white hover:bg-white/90 rounded-lg
                flex items-center gap-2 transition-all active:scale-95"
          >
            <Play size={14} fill="black" />
            Run
          </button>
        </div>

        {/* ── Canvas ──────────────────────────────────────────────────── */}
        <div className="flex-1 relative">
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
              <div className="absolute right-0 top-0 h-full z-40">
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

          {/* ── Empty state ──────────────────────────────────────────── */}
          {nodes.length === 0 && (
            <div className="w-full h-full flex items-center justify-center bg-white/[0.02] pointer-events-none">
              <div className="text-center space-y-3">
                <div className="w-16 h-16 rounded-2xl bg-white/[0.05] flex items-center justify-center mx-auto">
                  <Workflow size={28} className="text-white/40" />
                </div>
                <p className="text-[15px] text-white/90 font-medium">
                  Start building your workflow
                </p>
                <p className="text-[13px] text-white/50">
                  {isUserDbConnected
                    ? "Use the sidebar or describe what you need below"
                    : "Connect your database first, then start building"}
                </p>
                {!isUserDbConnected && (
                  <p className="text-[12px] text-white/30">
                    ↑ Click "Connect Database" in the toolbar above
                  </p>
                )}
              </div>
            </div>
          )}

          {/* ── AI Prompt ────────────────────────────────────────────── */}
          <div className="absolute bottom-0 left-0 right-0 p-6 pointer-events-none">
            <div className="max-w-3xl mx-auto pointer-events-auto">
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
                      className="w-full bg-transparent text-[14px] text-white placeholder-white/40
                          resize-none focus:outline-none leading-relaxed max-h-32 min-h-[24px]"
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
                      className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all
                            ${
                              aiPrompt.trim() && !isGenerating
                                ? "bg-white hover:bg-white/90 text-black active:scale-95"
                                : "bg-white/[0.08] text-white/30 cursor-not-allowed"
                            }`}
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
                    <Sparkles size={10} />
                    AI-powered
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Execution Logs ────────────────────────────────────────────────── */}
      <ExecutionLogsSidebar
        isOpen={logsOpen}
        onClose={() => setLogsOpen(false)}
        logs={execution?.logs || []}
        isPolling={execution ? !execution.finished : false}
        executionId={execution?.executionId || null}
      />

      {/* ── Save Modal ────────────────────────────────────────────────────── */}
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

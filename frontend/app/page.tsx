/* eslint-disable react/no-unescaped-entities */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useEffect, useState, useRef } from "react";
import {
  Zap,
  ArrowRight,
  Play,
  Menu,
  X,
  Database,
  Code,
  Workflow,
  Brain,
  CheckCircle,
  Eye,
  Boxes,
  Activity,
  Shield,
  AlertCircle,
  Loader2,
  ChevronRight,
  Server,
  Table2,
  Unplug,
} from "lucide-react";
import { RootDispatch, RootState } from "@/store";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchDbSchemas,
  setUserDbConnected,
  clearDbSchemas,
} from "@/store/dbSchemasSlice";
import { AIGenerationScreen } from "@/components/workflow/AIGenerationScreen";
import { apiUrl } from "../utils/api";

// ── DB Connection types ───────────────────────────────────────────────────────

type ConnectPhase =
  | "idle"
  | "connecting"
  | "authenticating"
  | "fetching_schemas"
  | "done"
  | "error";

const CONNECT_PHASES: { phase: ConnectPhase; label: string; sub: string }[] = [
  {
    phase: "connecting",
    label: "Connecting",
    sub: "Reaching your database server...",
  },
  {
    phase: "authenticating",
    label: "Authenticating",
    sub: "Verifying credentials...",
  },
  {
    phase: "fetching_schemas",
    label: "Reading schemas",
    sub: "Discovering your collections...",
  },
  { phase: "done", label: "Connected", sub: "Your database is ready." },
];

// ── Landing Page ──────────────────────────────────────────────────────────────

export default function LandingPage() {
  const dispatch: RootDispatch = useDispatch();
  const schemas = useSelector((state: RootState) => state.dbSchemas.schemas);
  const isConnected = useSelector(
    (state: RootState) => state.dbSchemas.isUserDbConnected,
  );
  const dbLabel = useSelector(
    (state: RootState) => state.dbSchemas.userDbLabel,
  );
  const uriMasked = useSelector(
    (state: RootState) => state.dbSchemas.userDbUriMasked,
  );
  const ownerId = useSelector((state: RootState) => state.dbSchemas.ownerId);

  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // DB connect modal
  const [showDbModal, setShowDbModal] = useState(false);
  const [dbUri, setDbUri] = useState("");
  const [dbLabelInput, setDbLabelInput] = useState("");
  const [connectPhase, setConnectPhase] = useState<ConnectPhase>("idle");
  const [completedPhases, setCompletedPhases] = useState<ConnectPhase[]>([]);
  const [connectError, setConnectError] = useState("");
  const [freshSchemas, setFreshSchemas] = useState<Record<string, string[]>>(
    {},
  );
  const uriInputRef = useRef<HTMLInputElement>(null);

  // DB info confirm modal
  const [showDbInfoModal, setShowDbInfoModal] = useState(false);
  const [pendingAction, setPendingAction] = useState<"ai" | "manual" | null>(
    null,
  );

  // AI generation
  const [showAIModal, setShowAIModal] = useState(false);
  const [aiPrompt, setAiPrompt] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [showGenerationScreen, setShowGenerationScreen] = useState(false);
  const [generationDone, setGenerationDone] = useState(false);

  useEffect(() => {
    dispatch(fetchDbSchemas());
  }, [dispatch]);
  useEffect(() => {
    if (showDbModal && connectPhase === "idle")
      setTimeout(() => uriInputRef.current?.focus(), 60);
  }, [showDbModal, connectPhase]);

  function sleep(ms: number) {
    return new Promise((r) => setTimeout(r, ms));
  }

  function requireDb(action: "ai" | "manual") {
    if (isConnected) {
      setPendingAction(action);
      setShowDbInfoModal(true);
    } else {
      setPendingAction(action);
      setShowDbModal(true);
    }
  }

  function proceedWithAction() {
    setShowDbInfoModal(false);
    if (pendingAction === "ai") setShowAIModal(true);
    else if (pendingAction === "manual") window.location.href = "/builder";
    setPendingAction(null);
  }

  // ── DB Connection ─────────────────────────────────────────────────────────

  async function handleConnect() {
    if (!dbUri.trim()) return;
    setConnectPhase("connecting");
    setCompletedPhases([]);
    setConnectError("");
    try {
      const res = await fetch(apiUrl("/user/db/connect"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ownerId,
          uri: dbUri.trim(),
          label: dbLabelInput.trim() || "My Database",
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok)
        throw new Error(data.detail || data.error || "Connection failed");

      await sleep(700);
      setConnectPhase("authenticating");
      setCompletedPhases(["connecting"]);
      await sleep(700);
      setConnectPhase("fetching_schemas");
      setCompletedPhases(["connecting", "authenticating"]);

      const schemaRes = await fetch(
        apiUrl(`/user/db/schemas?ownerId=${ownerId}`),
      );
      const schemaData = await schemaRes.json();
      const schemas = schemaData.schemas || {};

      await sleep(500);
      setConnectPhase("done");
      setCompletedPhases([
        "connecting",
        "authenticating",
        "fetching_schemas",
        "done",
      ]);
      setFreshSchemas(schemas);

      dispatch(
        setUserDbConnected({
          schemas,
          label: dbLabelInput.trim() || "My Database",
          uriMasked: data.uriMasked,
        }),
      );

      await sleep(900);
      setShowDbModal(false);
      setConnectPhase("idle");
      setDbUri("");
      setDbLabelInput("");
      setCompletedPhases([]);
      setShowDbInfoModal(true);
    } catch (err: any) {
      setConnectPhase("error");
      setConnectError(
        err.message || "Could not connect. Check your URI and try again.",
      );
    }
  }

  async function handleDisconnect() {
    await fetch(apiUrl("/user/db/disconnect"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ownerId }),
    });
    dispatch(clearDbSchemas());
  }

  // ── AI Generation ─────────────────────────────────────────────────────────

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
      if (!ai.nodes || !ai.edges)
        throw new Error("Invalid AI workflow returned");
      sessionStorage.setItem(
        "aiWorkflow",
        JSON.stringify({
          nodes: ai.nodes.map((n: any, index: number) => ({
            id: n.id,
            type: n.type,
            position: { x: (index % 3) * 280, y: Math.floor(index / 3) * 180 },
            data: n.data,
          })),
          edges: ai.edges.map((e: any) => ({
            id: e.id,
            source: e.source,
            target: e.target,
          })),
        }),
      );
      setGenerationDone(true);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleGenerateClick = async () => {
    if (!aiPrompt.trim()) return;
    setShowAIModal(false);
    setShowGenerationScreen(true);
    try {
      await generateAIWorkflow();
    } catch (e: any) {
      alert("Failed to generate workflow: " + e.message);
      setShowGenerationScreen(false);
      setShowAIModal(true);
    }
  };

  const handleAiKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleGenerateClick();
    } else if (e.key === "Escape") {
      setShowAIModal(false);
      setAiPrompt("");
    }
  };

  const isConnecting =
    connectPhase !== "idle" &&
    connectPhase !== "done" &&
    connectPhase !== "error";
  const collectionCount = Object.keys(
    isConnected ? schemas : freshSchemas,
  ).length;

  if (showGenerationScreen) {
    return (
      <AIGenerationScreen
        done={generationDone}
        onComplete={() => {
          window.location.href = "/builder";
        }}
      />
    );
  }

  return (
    <div className="min-h-screen bg-black text-white overflow-hidden relative">
      {/* Grid */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none opacity-[0.03]">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)`,
            backgroundSize: "80px 80px",
          }}
        />
      </div>

      {/* Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 animate-slide-down">
        <div className="absolute inset-0 bg-black/60 backdrop-blur-2xl border-b border-white/[0.06]" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14 sm:h-16">
            <div className="flex items-center gap-2 sm:gap-2.5 group cursor-pointer">
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-white/[0.08] border border-white/[0.12] flex items-center justify-center backdrop-blur-xl group-hover:bg-white/[0.12] transition-all duration-300">
                <Workflow size={14} className="text-white" strokeWidth={1.5} />
              </div>
              <span className="text-[14px] sm:text-[15px] font-medium tracking-tight">
                Orchestrix
              </span>
            </div>

            {/* DB pill — hidden on very small screens */}
            {isConnected && (
              <button
                onClick={() => {
                  setPendingAction(null);
                  setShowDbInfoModal(true);
                }}
                className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.07] rounded-lg transition-all duration-200 group"
              >
                <span className="relative flex h-1.5 w-1.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white/40 opacity-75" />
                  <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-white/60" />
                </span>
                <Database
                  size={13}
                  strokeWidth={1.5}
                  className="text-white/50"
                />
                <span className="text-[12px] text-white/50 max-w-[100px] truncate">
                  {dbLabel}
                </span>
              </button>
            )}

            {/* Mobile menu toggle */}
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="lg:hidden p-2 hover:bg-white/[0.08] rounded-lg transition-all duration-300"
            >
              {isMenuOpen ? (
                <X size={18} strokeWidth={1.5} />
              ) : (
                <Menu size={18} strokeWidth={1.5} />
              )}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {isMenuOpen && (
          <div className="lg:hidden absolute top-full left-0 right-0 bg-black/95 backdrop-blur-2xl border-b border-white/[0.06] px-4 py-4 space-y-2 animate-lp-fade">
            {isConnected && (
              <button
                onClick={() => {
                  setIsMenuOpen(false);
                  setPendingAction(null);
                  setShowDbInfoModal(true);
                }}
                className="w-full flex items-center gap-2 px-3 py-2.5 text-[13px] text-white/60 hover:text-white bg-white/[0.03] rounded-lg transition-all"
              >
                <Database size={14} strokeWidth={1.5} />
                {dbLabel}
                <span className="ml-auto text-[11px] text-white/30">
                  connected
                </span>
              </button>
            )}
            <button
              onClick={() => {
                setIsMenuOpen(false);
                requireDb("ai");
              }}
              className="w-full flex items-center gap-2 px-3 py-2.5 text-[13px] font-medium text-black bg-white rounded-lg"
            >
              <Brain size={15} strokeWidth={2} /> Generate with AI
            </button>
            <button
              onClick={() => {
                setIsMenuOpen(false);
                requireDb("manual");
              }}
              className="w-full flex items-center gap-2 px-3 py-2.5 text-[13px] text-white/70 bg-white/[0.04] border border-white/[0.08] rounded-lg"
            >
              <Play size={15} strokeWidth={2} /> Build Manually
            </button>
          </div>
        )}
      </nav>

      {/* Hero */}
      <section className="relative min-h-screen flex items-center justify-center px-4 sm:px-6 pt-16 sm:pt-20">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] sm:w-[800px] h-[400px] sm:h-[800px] bg-white/[0.03] rounded-full blur-[120px]" />
        </div>
        <div className="relative text-center animate-fade-in-up w-full max-w-4xl mx-auto">
          <h1 className="text-4xl sm:text-5xl lg:text-[76px] font-semibold mb-5 sm:mb-6 leading-[1.06] tracking-[-0.02em]">
            <span className="inline-block animate-fade-in-up">
              Build APIs without
            </span>
            <br />
            <span className="inline-block text-white/40 animate-fade-in-up animation-delay-100">
              writing code
            </span>
          </h1>
          <p className="text-base sm:text-lg lg:text-xl text-white/40 mb-10 sm:mb-12 max-w-2xl mx-auto leading-relaxed font-light animate-fade-in-up animation-delay-200 px-2">
            Connect nodes, define logic, and deploy production-ready APIs
            instantly. Let AI generate workflows or build manually.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 animate-fade-in-up animation-delay-300 px-4 sm:px-0">
            <button
              onClick={() => requireDb("ai")}
              className="group px-6 py-3 text-[14px] font-medium text-black bg-white hover:bg-white/90 rounded-lg w-full sm:w-auto flex items-center justify-center gap-2 transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] shadow-[0_0_40px_rgba(255,255,255,0.1)]"
            >
              <Brain size={18} strokeWidth={2} />
              Generate with AI
              <ArrowRight
                size={18}
                strokeWidth={2}
                className="group-hover:translate-x-0.5 transition-transform duration-300"
              />
            </button>
            <button
              onClick={() => requireDb("manual")}
              className="group px-6 py-3 text-[14px] font-medium text-white bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] rounded-lg backdrop-blur-xl flex items-center justify-center gap-2 transition-all duration-300 w-full sm:w-auto hover:scale-[1.02] active:scale-[0.98]"
            >
              <Play size={18} strokeWidth={2} />
              Build Manually
            </button>
          </div>
        </div>
        <div className="absolute bottom-6 sm:bottom-8 left-1/2 -translate-x-1/2 animate-fade-in animation-delay-500">
          <div className="w-5 h-9 rounded-full border border-white/[0.12] flex items-start justify-center p-1.5 backdrop-blur-xl bg-white/[0.02]">
            <div className="w-0.5 h-2 bg-white/40 rounded-full animate-scroll" />
          </div>
        </div>
      </section>

      {/* ── DB Connect Modal ─────────────────────────────────────────────── */}
      {showDbModal && (
        <>
          <div
            onClick={() => {
              if (!isConnecting) {
                setShowDbModal(false);
                setConnectPhase("idle");
                setConnectError("");
              }
            }}
            className="fixed inset-0 bg-black/80 backdrop-blur-xl z-[100] animate-lp-fade"
          />
          <div className="fixed inset-0 z-[101] flex items-center justify-center p-3 sm:p-4 animate-lp-modal">
            <div className="relative w-full max-w-lg">
              <div className="absolute inset-0 bg-white/[0.02] rounded-2xl blur-3xl" />
              <div className="relative bg-[#090909]/98 border border-white/[0.1] rounded-2xl shadow-2xl backdrop-blur-2xl overflow-hidden max-h-[90vh] overflow-y-auto">
                <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-white/[0.15] to-transparent" />
                <div className="px-5 sm:px-6 py-4 sm:py-5 border-b border-white/[0.05] flex items-center justify-between sticky top-0 bg-[#090909]/98 z-10">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-white/[0.05] border border-white/[0.08] flex items-center justify-center shrink-0">
                      <Database
                        size={15}
                        strokeWidth={1.5}
                        className="text-white/70"
                      />
                    </div>
                    <div>
                      <h3 className="text-[14px] font-medium text-white tracking-tight">
                        Connect your database
                      </h3>
                      <p className="text-[12px] text-white/30 font-light mt-0.5">
                        Required before building your API
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      if (!isConnecting) {
                        setShowDbModal(false);
                        setConnectPhase("idle");
                        setConnectError("");
                      }
                    }}
                    disabled={isConnecting}
                    className="p-1.5 hover:bg-white/[0.06] rounded-lg transition-all duration-200 disabled:opacity-30 shrink-0"
                  >
                    <X size={15} className="text-white/40" strokeWidth={1.5} />
                  </button>
                </div>

                <div className="p-5 sm:p-6">
                  {connectPhase === "idle" || connectPhase === "error" ? (
                    <div className="space-y-4">
                      <div>
                        <label className="block text-[11px] text-white/30 mb-2 tracking-wider uppercase font-medium">
                          Connection label
                        </label>
                        <input
                          type="text"
                          value={dbLabelInput}
                          onChange={(e) => setDbLabelInput(e.target.value)}
                          placeholder="My Production DB"
                          className="w-full px-3.5 py-2.5 bg-white/[0.03] border border-white/[0.07] hover:border-white/[0.11] rounded-lg text-[13px] text-white placeholder-white/20 focus:outline-none focus:border-white/[0.16] transition-all duration-200"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] text-white/30 mb-2 tracking-wider uppercase font-medium">
                          MongoDB URI
                        </label>
                        <input
                          ref={uriInputRef}
                          type="text"
                          value={dbUri}
                          onChange={(e) => setDbUri(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") handleConnect();
                          }}
                          placeholder="mongodb+srv://user:pass@cluster.mongodb.net/db"
                          spellCheck={false}
                          className="w-full px-3.5 py-2.5 bg-white/[0.03] border border-white/[0.07] hover:border-white/[0.11] rounded-lg text-[13px] text-white placeholder-white/20 font-mono focus:outline-none focus:border-white/[0.16] transition-all duration-200"
                        />
                      </div>
                      {connectError && (
                        <div className="flex items-start gap-2.5 px-3.5 py-3 bg-red-500/[0.06] border border-red-500/[0.12] rounded-lg animate-lp-fade">
                          <AlertCircle
                            size={14}
                            className="text-red-400/80 mt-0.5 shrink-0"
                            strokeWidth={1.5}
                          />
                          <p className="text-[12px] text-red-400/80 leading-relaxed">
                            {connectError}
                          </p>
                        </div>
                      )}
                      <div className="flex items-center gap-1.5 text-[11px] text-white/20 px-0.5 flex-wrap">
                        <Zap size={10} strokeWidth={1.5} />
                        <span>We'll verify the connection before saving</span>
                        <span className="ml-auto flex items-center gap-1.5 hidden sm:flex">
                          <kbd className="px-1.5 py-0.5 bg-white/[0.04] border border-white/[0.07] rounded text-[10px] font-mono">
                            ⏎
                          </kbd>
                          to connect
                        </span>
                      </div>
                      <div className="flex gap-2.5 pt-1">
                        <button
                          onClick={() => {
                            setShowDbModal(false);
                            setConnectPhase("idle");
                            setConnectError("");
                          }}
                          className="flex-1 px-4 py-2.5 text-[13px] text-white/40 hover:text-white/70 bg-white/[0.02] hover:bg-white/[0.05] border border-white/[0.07] rounded-lg transition-all duration-200"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={handleConnect}
                          disabled={!dbUri.trim()}
                          className="flex-1 px-4 py-2.5 text-[13px] font-medium text-black bg-white hover:bg-white/90 rounded-lg flex items-center justify-center gap-2 transition-all duration-200 disabled:opacity-30 disabled:cursor-not-allowed"
                        >
                          <Database size={14} strokeWidth={2} /> Connect
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="py-4">
                      <div className="text-center mb-6 sm:mb-8">
                        <div className="relative inline-flex items-center justify-center w-14 h-14 mb-4">
                          {connectPhase !== "done" && (
                            <div className="absolute inset-0 rounded-full bg-white/[0.04] animate-lp-ping" />
                          )}
                          <div className="relative w-14 h-14 rounded-full bg-white/[0.05] border border-white/[0.1] flex items-center justify-center">
                            {connectPhase === "done" ? (
                              <CheckCircle
                                size={22}
                                className="text-white/80"
                                strokeWidth={1.5}
                              />
                            ) : (
                              <Loader2
                                size={20}
                                className="text-white/60 animate-spin"
                                strokeWidth={1.5}
                              />
                            )}
                          </div>
                        </div>
                        <p className="text-[15px] font-medium text-white tracking-tight">
                          {
                            CONNECT_PHASES.find((p) => p.phase === connectPhase)
                              ?.label
                          }
                        </p>
                        <p className="text-[12px] text-white/30 mt-1 font-light">
                          {
                            CONNECT_PHASES.find((p) => p.phase === connectPhase)
                              ?.sub
                          }
                        </p>
                      </div>
                      <div className="space-y-1">
                        {CONNECT_PHASES.filter((p) => p.phase !== "done").map(
                          (p, i) => {
                            const done = completedPhases.includes(p.phase);
                            const current = connectPhase === p.phase;
                            return (
                              <div
                                key={p.phase}
                                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-lg transition-all duration-500 ${current ? "bg-white/[0.04] border border-white/[0.07]" : done ? "" : "opacity-30"}`}
                                style={{ transitionDelay: `${i * 40}ms` }}
                              >
                                <div className="shrink-0 w-5 h-5 flex items-center justify-center">
                                  {done ? (
                                    <CheckCircle
                                      size={14}
                                      className="text-white/50"
                                      strokeWidth={1.5}
                                    />
                                  ) : current ? (
                                    <Loader2
                                      size={13}
                                      className="text-white/60 animate-spin"
                                      strokeWidth={1.5}
                                    />
                                  ) : (
                                    <div className="w-1.5 h-1.5 rounded-full bg-white/20" />
                                  )}
                                </div>
                                <span
                                  className={`text-[12px] transition-colors duration-300 ${done ? "text-white/50" : current ? "text-white/80" : "text-white/20"}`}
                                >
                                  {p.label}
                                </span>
                                {current && (
                                  <span className="ml-auto text-[10px] text-white/20 font-light hidden sm:block">
                                    {p.sub}
                                  </span>
                                )}
                              </div>
                            );
                          },
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {(connectPhase === "idle" || connectPhase === "error") && (
                  <div className="px-5 sm:px-6 pb-4 sm:pb-5">
                    <div className="flex items-center gap-2 text-[11px] text-white/20 font-light">
                      <Shield size={11} strokeWidth={1.5} />
                      <span>
                        URI encrypted with AES-256 — never logged or shared
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </>
      )}

      {/* ── DB Info Modal ────────────────────────────────────────────────── */}
      {showDbInfoModal && (
        <>
          <div
            onClick={() => {
              setShowDbInfoModal(false);
              setPendingAction(null);
            }}
            className="fixed inset-0 bg-black/80 backdrop-blur-xl z-[100] animate-lp-fade"
          />
          <div className="fixed inset-0 z-[101] flex items-center justify-center p-3 sm:p-4 animate-lp-modal">
            <div className="relative w-full max-w-md">
              <div className="absolute inset-0 bg-white/[0.02] rounded-2xl blur-3xl" />
              <div className="relative bg-[#090909]/98 border border-white/[0.1] rounded-2xl shadow-2xl backdrop-blur-2xl overflow-hidden max-h-[90vh] overflow-y-auto">
                <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-white/[0.15] to-transparent" />
                <div className="px-5 sm:px-6 py-4 sm:py-5 border-b border-white/[0.05] flex items-center justify-between sticky top-0 bg-[#090909]/98 z-10">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-white/[0.05] border border-white/[0.08] flex items-center justify-center shrink-0">
                      <CheckCircle
                        size={15}
                        strokeWidth={1.5}
                        className="text-white/70"
                      />
                    </div>
                    <div>
                      <h3 className="text-[14px] font-medium text-white tracking-tight">
                        Database connected
                      </h3>
                      <p className="text-[12px] text-white/30 font-light mt-0.5">
                        Review your connection before continuing
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setShowDbInfoModal(false);
                      setPendingAction(null);
                    }}
                    className="p-1.5 hover:bg-white/[0.06] rounded-lg transition-all duration-200 shrink-0"
                  >
                    <X size={15} className="text-white/40" strokeWidth={1.5} />
                  </button>
                </div>

                <div className="p-5 sm:p-6 space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 sm:p-3.5 bg-white/[0.02] border border-white/[0.06] rounded-xl space-y-1.5">
                      <div className="flex items-center gap-1.5 text-[10px] text-white/30 uppercase tracking-wider font-medium">
                        <Server size={10} strokeWidth={1.5} /> Label
                      </div>
                      <p className="text-[13px] text-white/80 font-medium truncate">
                        {dbLabel || "My Database"}
                      </p>
                    </div>
                    <div className="p-3 sm:p-3.5 bg-white/[0.02] border border-white/[0.06] rounded-xl space-y-1.5">
                      <div className="flex items-center gap-1.5 text-[10px] text-white/30 uppercase tracking-wider font-medium">
                        <Table2 size={10} strokeWidth={1.5} /> Collections
                      </div>
                      <p className="text-[13px] text-white/80 font-medium">
                        {collectionCount} found
                      </p>
                    </div>
                  </div>

                  {uriMasked && (
                    <div className="p-3 sm:p-3.5 bg-white/[0.02] border border-white/[0.06] rounded-xl space-y-1.5">
                      <div className="flex items-center gap-1.5 text-[10px] text-white/30 uppercase tracking-wider font-medium">
                        <Database size={10} strokeWidth={1.5} /> Connection
                      </div>
                      <p className="text-[11px] text-white/50 font-mono truncate">
                        {uriMasked}
                      </p>
                    </div>
                  )}

                  {collectionCount > 0 && (
                    <div className="p-3 sm:p-3.5 bg-white/[0.02] border border-white/[0.06] rounded-xl space-y-2">
                      <div className="flex items-center gap-1.5 text-[10px] text-white/30 uppercase tracking-wider font-medium">
                        <Table2 size={10} strokeWidth={1.5} /> Discovered
                        collections
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {Object.keys(schemas)
                          .slice(0, 8)
                          .map((col) => (
                            <span
                              key={col}
                              className="px-2 py-1 bg-white/[0.04] border border-white/[0.07] rounded-md text-[11px] text-white/60 font-mono"
                            >
                              {col}
                            </span>
                          ))}
                        {Object.keys(schemas).length > 8 && (
                          <span className="px-2 py-1 text-[11px] text-white/30">
                            +{Object.keys(schemas).length - 8} more
                          </span>
                        )}
                      </div>
                    </div>
                  )}

                  <div className="flex flex-col sm:flex-row gap-2.5 pt-1">
                    <button
                      onClick={() => {
                        setShowDbInfoModal(false);
                        handleDisconnect();
                        setPendingAction(null);
                      }}
                      className="flex items-center justify-center gap-1.5 px-3.5 py-2.5 text-[12px] text-white/30 hover:text-white/60 bg-white/[0.02] hover:bg-white/[0.05] border border-white/[0.06] rounded-lg transition-all duration-200"
                    >
                      <Unplug size={13} strokeWidth={1.5} /> Disconnect
                    </button>
                    {pendingAction && (
                      <button
                        onClick={proceedWithAction}
                        className="flex-1 px-4 py-2.5 text-[13px] font-medium text-black bg-white hover:bg-white/90 rounded-lg flex items-center justify-center gap-2 transition-all duration-200"
                      >
                        {pendingAction === "ai" ? (
                          <>
                            <Brain size={14} strokeWidth={2} /> Continue with AI
                          </>
                        ) : (
                          <>
                            <Play size={14} strokeWidth={2} /> Open Builder
                          </>
                        )}
                        <ArrowRight size={14} strokeWidth={2} />
                      </button>
                    )}
                    {!pendingAction && (
                      <button
                        onClick={() => setShowDbInfoModal(false)}
                        className="flex-1 px-4 py-2.5 text-[13px] font-medium text-white/70 hover:text-white bg-white/[0.04] hover:bg-white/[0.07] border border-white/[0.08] rounded-lg transition-all duration-200"
                      >
                        Close
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* ── AI Prompt Modal ───────────────────────────────────────────────── */}
      {showAIModal && (
        <>
          <div
            onClick={() => {
              setShowAIModal(false);
              setAiPrompt("");
            }}
            className="fixed inset-0 bg-black/80 backdrop-blur-xl z-[100] animate-lp-fade"
          />
          <div className="fixed inset-0 z-[101] flex items-center justify-center p-3 sm:p-4 animate-lp-modal">
            <div className="relative w-full max-w-2xl">
              <div className="absolute inset-0 bg-white/[0.03] rounded-2xl blur-3xl" />
              <div className="relative bg-[#0A0A0A]/95 border border-white/[0.12] rounded-2xl shadow-2xl backdrop-blur-2xl overflow-hidden">
                <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />
                <div className="px-5 sm:px-6 py-4 sm:py-5 border-b border-white/[0.06] flex items-center justify-between">
                  <div>
                    <h3 className="text-[15px] font-medium text-white tracking-tight">
                      Generate API Workflow
                    </h3>
                    <p className="text-[13px] text-white/30 font-light">
                      Describe your API and let AI build it
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      setShowAIModal(false);
                      setAiPrompt("");
                    }}
                    className="p-2 hover:bg-white/[0.06] rounded-lg transition-all duration-300"
                  >
                    <X size={16} className="text-white/40" strokeWidth={1.5} />
                  </button>
                </div>
                <div className="p-5 sm:p-6">
                  <div className="mb-4">
                    <label className="block text-[12px] text-white/40 mb-2.5 font-medium tracking-wide uppercase">
                      API Description
                    </label>
                    <div className="relative">
                      <textarea
                        value={aiPrompt}
                        onChange={(e) => setAiPrompt(e.target.value)}
                        onKeyDown={handleAiKeyDown}
                        placeholder="Create a login API with email validation, password hashing, and JWT token generation"
                        disabled={isGenerating}
                        autoFocus
                        className="w-full h-28 sm:h-32 px-4 py-3 bg-white/[0.03] border border-white/[0.08] hover:border-white/[0.12] rounded-xl text-[14px] text-white placeholder-white/20 resize-none focus:outline-none focus:border-white/[0.16] focus:bg-white/[0.04] transition-all duration-300 backdrop-blur-xl"
                      />
                      <div className="absolute bottom-3 right-3 text-[10px] text-white/20 font-mono">
                        {aiPrompt.length}/500
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-white/30 mb-5 sm:mb-6 px-0.5">
                    <span className="flex items-center gap-1.5 sm:gap-2">
                      <kbd className="px-2 py-1 bg-white/[0.04] border border-white/[0.08] rounded text-[10px] font-mono">
                        ⏎
                      </kbd>{" "}
                      generate
                      <span className="text-white/10 hidden sm:inline">•</span>
                      <kbd className="px-2 py-1 bg-white/[0.04] border border-white/[0.08] rounded text-[10px] font-mono hidden sm:inline">
                        ESC
                      </kbd>
                      <span className="hidden sm:inline">close</span>
                    </span>
                    <span className="flex items-center gap-1.5 font-medium tracking-wide">
                      <div className="w-1 h-1 rounded-full bg-white/40 animate-pulse-subtle" />
                      AI-POWERED
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => {
                        setShowAIModal(false);
                        setAiPrompt("");
                      }}
                      disabled={isGenerating}
                      className="flex-1 px-4 py-2.5 text-[13px] font-medium text-white/50 hover:text-white bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.08] rounded-lg transition-all duration-300 disabled:opacity-50"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleGenerateClick}
                      disabled={!aiPrompt.trim() || isGenerating}
                      className="flex-1 px-4 py-2.5 text-[13px] font-medium text-black bg-white hover:bg-white/90 rounded-lg flex items-center justify-center gap-2 transition-all duration-300 disabled:opacity-40"
                    >
                      {isGenerating ? (
                        <>
                          <div className="w-3.5 h-3.5 border-2 border-black/20 border-t-black rounded-full animate-spin" />{" "}
                          Generating...
                        </>
                      ) : (
                        <>
                          <Brain size={15} strokeWidth={2} /> Generate Workflow
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* How It Works */}
      <section className="relative py-20 sm:py-32 px-4 sm:px-6 border-t border-white/[0.03]">
        <div className="relative max-w-7xl mx-auto">
          <div className="text-center mb-12 sm:mb-20">
            <h2 className="text-2xl sm:text-3xl lg:text-5xl font-semibold mb-4 tracking-[-0.02em]">
              How it works
            </h2>
            <p className="text-base sm:text-lg text-white/30 max-w-2xl mx-auto font-light">
              From idea to production API in minutes
            </p>
          </div>
          <div className="grid sm:grid-cols-2 gap-3 sm:gap-4">
            {[
              {
                step: "01",
                icon: Database,
                title: "Connect Your Database",
                description:
                  "Start by linking your MongoDB database. Your schemas and collections are automatically discovered.",
              },
              {
                step: "02",
                icon: Boxes,
                title: "Connect Nodes Visually",
                description:
                  "Wire up Input, Database, Auth, Validation nodes and more with our visual editor.",
              },
              {
                step: "03",
                icon: Play,
                title: "Test with Live Execution",
                description:
                  "Run your workflow with test data. Watch real-time logs via WebSocket connection.",
              },
              {
                step: "04",
                icon: Zap,
                title: "Deploy Instantly",
                description:
                  "Save your workflow and get a production-ready API endpoint immediately.",
              },
            ].map((item, i) => (
              <div
                key={item.step}
                className="group relative p-5 sm:p-7 bg-white/[0.02] hover:bg-white/[0.04] border border-white/[0.06] hover:border-white/[0.1] rounded-xl transition-all duration-500 backdrop-blur-xl"
                style={{ animationDelay: `${i * 100}ms` }}
              >
                <div className="flex items-start gap-4 sm:gap-5">
                  <div className="flex-shrink-0">
                    <div className="w-9 sm:w-10 h-9 sm:h-10 rounded-lg bg-white/[0.04] border border-white/[0.08] flex items-center justify-center backdrop-blur-xl group-hover:bg-white/[0.06] group-hover:scale-105 transition-all duration-500">
                      <item.icon
                        size={17}
                        className="text-white/80"
                        strokeWidth={1.5}
                      />
                    </div>
                  </div>
                  <div className="flex-1 pt-0.5">
                    <div className="text-[11px] text-white/20 font-mono mb-2 tracking-wider">
                      {item.step}
                    </div>
                    <h3 className="text-[15px] sm:text-[16px] font-medium mb-2 sm:mb-2.5 text-white tracking-tight">
                      {item.title}
                    </h3>
                    <p className="text-[13px] sm:text-[14px] text-white/30 leading-relaxed font-light">
                      {item.description}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="relative py-20 sm:py-32 px-4 sm:px-6 border-t border-white/[0.03]">
        <div className="relative max-w-7xl mx-auto">
          <div className="text-center mb-12 sm:mb-20">
            <h2 className="text-2xl sm:text-3xl lg:text-5xl font-semibold mb-4 tracking-[-0.02em]">
              Powerful features
            </h2>
            <p className="text-base sm:text-lg text-white/30 max-w-2xl mx-auto font-light">
              Everything you need to build production-ready APIs
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
            {[
              {
                icon: Database,
                title: "Database Operations",
                description:
                  "Visual query builders for find, insert, and update",
              },
              {
                icon: CheckCircle,
                title: "Input Validation",
                description:
                  "Built-in validation middleware for data integrity",
              },
              {
                icon: Code,
                title: "Authentication",
                description: "Auth middleware and login nodes for secure APIs",
              },
              {
                icon: Activity,
                title: "Background Jobs",
                description:
                  "Queue and process long-running tasks asynchronously",
              },
              {
                icon: Eye,
                title: "Live Execution Logs",
                description:
                  "Real-time workflow execution with WebSocket updates",
              },
              {
                icon: Workflow,
                title: "Modular Composition",
                description: "Each node becomes a reusable workflow component",
              },
            ].map((feature, i) => (
              <div
                key={feature.title}
                className="group p-5 sm:p-7 bg-white/[0.02] hover:bg-white/[0.04] border border-white/[0.06] hover:border-white/[0.1] rounded-xl transition-all duration-500 backdrop-blur-xl"
                style={{ animationDelay: `${i * 50}ms` }}
              >
                <div className="w-8 sm:w-9 h-8 sm:h-9 rounded-lg bg-white/[0.04] border border-white/[0.08] flex items-center justify-center mb-4 sm:mb-5 backdrop-blur-xl group-hover:bg-white/[0.06] group-hover:scale-105 transition-all duration-500">
                  <feature.icon
                    size={16}
                    className="text-white/70"
                    strokeWidth={1.5}
                  />
                </div>
                <h3 className="text-[14px] sm:text-[15px] font-medium mb-2 sm:mb-2.5 text-white tracking-tight">
                  {feature.title}
                </h3>
                <p className="text-[13px] sm:text-[14px] text-white/30 leading-relaxed font-light">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="relative py-20 sm:py-32 px-4 sm:px-6 border-t border-white/[0.03]">
        <div className="relative max-w-4xl mx-auto">
          <div className="relative p-10 sm:p-16 bg-white/[0.02] border border-white/[0.06] rounded-2xl backdrop-blur-xl overflow-hidden group hover:bg-white/[0.03] hover:border-white/[0.08] transition-all duration-500">
            <div className="relative text-center">
              <h2 className="text-2xl sm:text-3xl lg:text-5xl font-semibold mb-4 sm:mb-5 tracking-[-0.02em]">
                Start building today
              </h2>
              <p className="text-base sm:text-lg text-white/30 mb-8 sm:mb-10 max-w-2xl mx-auto font-light">
                Join developers building APIs 10× faster with Orchestrix
              </p>
              <button
                onClick={() => requireDb("ai")}
                className="px-6 py-3 text-[14px] font-medium text-black bg-white hover:bg-white/90 rounded-lg inline-flex items-center gap-2 transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] shadow-[0_0_40px_rgba(255,255,255,0.12)]"
              >
                Get Started Free <ArrowRight size={18} strokeWidth={2} />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative border-t border-white/[0.03] py-10 sm:py-12 px-4 sm:px-6">
        <div className="relative max-w-7xl mx-auto">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 sm:gap-6">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-white/[0.06] border border-white/[0.12] flex items-center justify-center backdrop-blur-xl">
                <Workflow size={14} className="text-white" strokeWidth={1.5} />
              </div>
              <span className="text-[14px] sm:text-[15px] font-medium">
                Orchestrix
              </span>
            </div>
            <p className="text-[12px] sm:text-[13px] text-white/20 font-light">
              © 2025 Orchestrix. All rights reserved.
            </p>
          </div>
        </div>
      </footer>

      <style>{`
        @keyframes fade-in         { from { opacity: 0; } to { opacity: 1; } }
        @keyframes fade-in-up      { from { opacity: 0; transform: translateY(24px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes slide-down      { from { transform: translateY(-100%); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
        @keyframes pulse-subtle    { 0%, 100% { opacity: 0.6; } 50% { opacity: 1; } }
        @keyframes scroll          { 0% { transform: translateY(0); opacity: 0; } 50% { opacity: 1; } 100% { transform: translateY(10px); opacity: 0; } }
        @keyframes lp-fade         { from { opacity: 0; } to { opacity: 1; } }
        @keyframes lp-modal        { from { opacity: 0; transform: scale(0.97) translateY(12px); } to { opacity: 1; transform: scale(1) translateY(0); } }
        @keyframes lp-ping         { 75%, 100% { transform: scale(2); opacity: 0; } }
        .animate-fade-in        { animation: fade-in   0.8s cubic-bezier(0.16, 1, 0.3, 1); }
        .animate-fade-in-up     { animation: fade-in-up 1s cubic-bezier(0.16, 1, 0.3, 1); }
        .animate-slide-down     { animation: slide-down 0.8s cubic-bezier(0.16, 1, 0.3, 1); }
        .animate-pulse-subtle   { animation: pulse-subtle 3s ease-in-out infinite; }
        .animate-scroll         { animation: scroll 2.5s ease-in-out infinite; }
        .animate-lp-fade        { animation: lp-fade  0.2s ease-out both; }
        .animate-lp-modal       { animation: lp-modal 0.35s cubic-bezier(0.16, 1, 0.3, 1) both; }
        .animate-lp-ping        { animation: lp-ping  1.4s cubic-bezier(0, 0, 0.2, 1) infinite; }
        .animation-delay-100 { animation-delay: 100ms; }
        .animation-delay-200 { animation-delay: 200ms; }
        .animation-delay-300 { animation-delay: 300ms; }
        .animation-delay-500 { animation-delay: 500ms; }
        * { -webkit-font-smoothing: antialiased; -moz-osx-font-smoothing: grayscale; }
      `}</style>
    </div>
  );
}

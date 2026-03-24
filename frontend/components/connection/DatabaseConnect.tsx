/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useEffect, useRef } from "react";
import {
  Database,
  X,
  CheckCircle,
  AlertCircle,
  Loader2,
  Unplug,
  ChevronRight,
  Shield,
  Zap,
} from "lucide-react";

// ── Types ─────────────────────────────────────────────────────────────────────

type Phase =
  | "idle"
  | "validating"
  | "connecting"
  | "authenticating"
  | "fetching_schemas"
  | "done"
  | "error";

interface ConnectionStatus {
  connected: boolean;
  label?: string;
  uriMasked?: string;
  connectedAt?: string;
}

interface DatabaseConnectProps {
  ownerId: string;
  onConnected?: (schemas: Record<string, string[]>) => void;
  onDisconnected?: () => void;
}

// ── Animation Steps ──────────────────────────────────────────────────────────

const PHASES: { phase: Phase; label: string; sublabel: string }[] = [
  {
    phase: "validating",
    label: "Validating URI",
    sublabel: "Parsing connection string...",
  },
  {
    phase: "connecting",
    label: "Connecting",
    sublabel: "Reaching your database server...",
  },
  {
    phase: "authenticating",
    label: "Authenticating",
    sublabel: "Verifying credentials...",
  },
  {
    phase: "fetching_schemas",
    label: "Reading schemas",
    sublabel: "Discovering your collections...",
  },
  {
    phase: "done",
    label: "Connected",
    sublabel: "Your database is ready.",
  },
];

// ── Component ─────────────────────────────────────────────────────────────────

export function DatabaseConnect({
  ownerId,
  onConnected,
  onDisconnected,
}: DatabaseConnectProps) {
  const [showModal, setShowModal] = useState(false);
  const [uri, setUri] = useState("");
  const [label, setLabel] = useState("");
  const [phase, setPhase] = useState<Phase>("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const [status, setStatus] = useState<ConnectionStatus | null>(null);
  const [completedPhases, setCompletedPhases] = useState<Phase[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  // Load current status on mount
  useEffect(() => {
    fetchStatus();
  }, [ownerId]);

  useEffect(() => {
    if (showModal && phase === "idle") {
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [showModal, phase]);

  async function fetchStatus() {
    try {
      const res = await fetch(
        `http://localhost:3000/user/db/status?ownerId=${ownerId}`,
      );
      const data = await res.json();
      setStatus(data);
    } catch {
      // Silently fail — no connection yet
    }
  }

  // ── Connection flow ──────────────────────────────────────────────────────

  async function handleConnect() {
    if (!uri.trim()) return;

    setPhase("validating");
    setCompletedPhases([]);
    setErrorMsg("");

    // Stagger the phase animations so they feel real, not instant
    const phaseDurations: Record<Phase, number> = {
      idle: 0,
      validating: 600,
      connecting: 1200,
      authenticating: 800,
      fetching_schemas: 600,
      done: 0,
      error: 0,
    };

    const advancePhase = async (next: Phase) => {
      await sleep(phaseDurations[next] || 600);
      setPhase(next);
      setCompletedPhases((prev) => [...prev, next]);
    };

    try {
      await advancePhase("connecting");

      // ── Real API call ─────────────────────────────────────────────────────
      const res = await fetch("http://localhost:3000/user/db/connect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ownerId, uri: uri.trim(), label: label.trim() }),
      });

      const data = await res.json();

      if (!res.ok || !data.ok) {
        throw new Error(data.detail || data.error || "Connection failed");
      }

      await advancePhase("authenticating");
      await advancePhase("fetching_schemas");

      // Fetch schemas now that we're connected
      const schemaRes = await fetch(
        `http://localhost:3000/user/db/schemas?ownerId=${ownerId}`,
      );
      const schemaData = await schemaRes.json();

      setPhase("done");
      setCompletedPhases(PHASES.map((p) => p.phase));

      await sleep(800);

      // Update top-level status
      await fetchStatus();
      setShowModal(false);
      setPhase("idle");
      setUri("");
      setLabel("");
      setCompletedPhases([]);

      onConnected?.(schemaData.schemas || {});
    } catch (err: any) {
      setPhase("error");
      setErrorMsg(
        err.message || "Could not connect. Check your URI and try again.",
      );
    }
  }

  async function handleDisconnect() {
    try {
      await fetch("http://localhost:3000/user/db/disconnect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ownerId }),
      });
      setStatus(null);
      onDisconnected?.();
    } catch {
      // ignore
    }
  }

  function handleClose() {
    if (phase !== "idle" && phase !== "error" && phase !== "done") return; // Prevent closing mid-connect
    setShowModal(false);
    setPhase("idle");
    setUri("");
    setLabel("");
    setErrorMsg("");
    setCompletedPhases([]);
  }

  const isConnecting =
    phase !== "idle" && phase !== "done" && phase !== "error";

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <>
      {/* ── Trigger button ───────────────────────────────────────────────── */}
      {status?.connected ? (
        <ConnectedPill
          label={status.label || "Database"}
          uriMasked={status.uriMasked}
          onDisconnect={handleDisconnect}
          onClick={() => setShowModal(true)}
        />
      ) : (
        <button
          onClick={() => setShowModal(true)}
          className="group flex items-center gap-2 px-4 py-2 text-[13px] font-medium text-white/60 hover:text-white bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.08] hover:border-white/[0.14] rounded-lg transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] backdrop-blur-xl"
        >
          <Database size={15} strokeWidth={1.5} />
          Connect Database
          <ChevronRight
            size={13}
            className="opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all duration-300"
          />
        </button>
      )}

      {/* ── Modal ────────────────────────────────────────────────────────── */}
      {showModal && (
        <>
          {/* Backdrop */}
          <div
            onClick={handleClose}
            className="fixed inset-0 bg-black/80 backdrop-blur-xl z-[100] animate-db-fade-in"
          />

          {/* Panel */}
          <div className="fixed inset-0 z-[101] flex items-center justify-center p-4 animate-db-modal-in">
            <div className="relative w-full max-w-lg">
              {/* Glow */}
              <div className="absolute inset-0 bg-white/[0.02] rounded-2xl blur-3xl" />

              <div className="relative bg-[#090909]/98 border border-white/[0.1] rounded-2xl shadow-2xl backdrop-blur-2xl overflow-hidden">
                {/* Top highlight line */}
                <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-white/[0.15] to-transparent" />

                {/* Header */}
                <div className="px-6 py-5 border-b border-white/[0.05] flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-white/[0.05] border border-white/[0.08] flex items-center justify-center">
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
                        MongoDB Atlas or self-hosted
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={handleClose}
                    disabled={isConnecting}
                    className="p-1.5 hover:bg-white/[0.06] rounded-lg transition-all duration-200 disabled:opacity-30"
                  >
                    <X size={15} className="text-white/40" strokeWidth={1.5} />
                  </button>
                </div>

                {/* Body */}
                <div className="p-6">
                  {phase === "idle" || phase === "error" ? (
                    <IdleForm
                      inputRef={inputRef}
                      uri={uri}
                      label={label}
                      errorMsg={errorMsg}
                      onUriChange={setUri}
                      onLabelChange={setLabel}
                      onConnect={handleConnect}
                      onCancel={handleClose}
                    />
                  ) : (
                    <ConnectingAnimation
                      phase={phase}
                      completedPhases={completedPhases}
                    />
                  )}
                </div>

                {/* Security note */}
                {(phase === "idle" || phase === "error") && (
                  <div className="px-6 pb-5">
                    <div className="flex items-center gap-2 text-[11px] text-white/20 font-light">
                      <Shield size={11} strokeWidth={1.5} />
                      <span>
                        URI is encrypted with AES-256 and never logged or shared
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </>
      )}

      <style>{dbModalStyles}</style>
    </>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────

function IdleForm({
  inputRef,
  uri,
  label,
  errorMsg,
  onUriChange,
  onLabelChange,
  onConnect,
  onCancel,
}: any) {
  return (
    <div className="space-y-4">
      {/* Label */}
      <div>
        <label className="block text-[11px] text-white/30 mb-2 tracking-wider uppercase font-medium">
          Connection label
        </label>
        <input
          type="text"
          value={label}
          onChange={(e) => onLabelChange(e.target.value)}
          placeholder="My Production DB"
          className="w-full px-3.5 py-2.5 bg-white/[0.03] border border-white/[0.07] hover:border-white/[0.11] rounded-lg text-[13px] text-white placeholder-white/20 focus:outline-none focus:border-white/[0.16] focus:bg-white/[0.04] transition-all duration-200"
        />
      </div>

      {/* URI */}
      <div>
        <label className="block text-[11px] text-white/30 mb-2 tracking-wider uppercase font-medium">
          MongoDB URI
        </label>
        <input
          ref={inputRef}
          type="text"
          value={uri}
          onChange={(e) => onUriChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") onConnect();
            if (e.key === "Escape") onCancel();
          }}
          placeholder="mongodb+srv://user:pass@cluster.mongodb.net/db"
          spellCheck={false}
          className="w-full px-3.5 py-2.5 bg-white/[0.03] border border-white/[0.07] hover:border-white/[0.11] rounded-lg text-[13px] text-white placeholder-white/20 font-mono focus:outline-none focus:border-white/[0.16] focus:bg-white/[0.04] transition-all duration-200"
        />
      </div>

      {/* Error */}
      {errorMsg && (
        <div className="flex items-start gap-2.5 px-3.5 py-3 bg-red-500/[0.06] border border-red-500/[0.12] rounded-lg animate-db-fade-in">
          <AlertCircle
            size={14}
            className="text-red-400/80 mt-0.5 shrink-0"
            strokeWidth={1.5}
          />
          <p className="text-[12px] text-red-400/80 leading-relaxed">
            {errorMsg}
          </p>
        </div>
      )}

      {/* Helper */}
      <div className="flex items-center gap-1.5 text-[11px] text-white/20 px-0.5">
        <Zap size={10} strokeWidth={1.5} />
        <span>We&apos;ll verify the connection before saving</span>
        <span className="ml-auto flex items-center gap-1.5">
          <kbd className="px-1.5 py-0.5 bg-white/[0.04] border border-white/[0.07] rounded text-[10px] font-mono">
            ⏎
          </kbd>
          to connect
        </span>
      </div>

      {/* Actions */}
      <div className="flex gap-2.5 pt-1">
        <button
          onClick={onCancel}
          className="flex-1 px-4 py-2.5 text-[13px] text-white/40 hover:text-white/70 bg-white/[0.02] hover:bg-white/[0.05] border border-white/[0.07] rounded-lg transition-all duration-200"
        >
          Cancel
        </button>
        <button
          onClick={onConnect}
          disabled={!uri.trim()}
          className="flex-1 px-4 py-2.5 text-[13px] font-medium text-black bg-white hover:bg-white/90 rounded-lg flex items-center justify-center gap-2 transition-all duration-200 disabled:opacity-30 disabled:cursor-not-allowed shadow-[0_0_24px_rgba(255,255,255,0.08)]"
        >
          <Database size={14} strokeWidth={2} />
          Connect
        </button>
      </div>
    </div>
  );
}

function ConnectingAnimation({
  phase,
  completedPhases,
}: {
  phase: Phase;
  completedPhases: Phase[];
}) {
  const displayPhases = PHASES.filter((p) => p.phase !== "idle");
  const currentPhaseData = displayPhases.find((p) => p.phase === phase);

  return (
    <div className="py-4">
      {/* Current phase label */}
      <div className="text-center mb-8">
        <div className="relative inline-flex items-center justify-center w-14 h-14 mb-4">
          {/* Pulse ring */}
          {phase !== "done" && (
            <div className="absolute inset-0 rounded-full bg-white/[0.04] animate-db-ping" />
          )}
          <div className="relative w-14 h-14 rounded-full bg-white/[0.05] border border-white/[0.1] flex items-center justify-center">
            {phase === "done" ? (
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
          {currentPhaseData?.label}
        </p>
        <p className="text-[12px] text-white/30 mt-1 font-light">
          {currentPhaseData?.sublabel}
        </p>
      </div>

      {/* Step list */}
      <div className="space-y-1">
        {displayPhases.map((p, i) => {
          const isCompleted = completedPhases.includes(p.phase);
          const isCurrent = phase === p.phase;
          const isPending = !isCompleted && !isCurrent;

          return (
            <div
              key={p.phase}
              className={`flex items-center gap-3 px-3.5 py-2.5 rounded-lg transition-all duration-500 ${
                isCurrent
                  ? "bg-white/[0.04] border border-white/[0.07]"
                  : isCompleted
                    ? "bg-transparent"
                    : "opacity-30"
              }`}
              style={{ transitionDelay: `${i * 40}ms` }}
            >
              {/* Status indicator */}
              <div className="shrink-0 w-5 h-5 flex items-center justify-center">
                {isCompleted && phase !== "done" ? (
                  <CheckCircle
                    size={14}
                    className="text-white/50"
                    strokeWidth={1.5}
                  />
                ) : isCompleted && phase === "done" ? (
                  <CheckCircle
                    size={14}
                    className="text-white/70"
                    strokeWidth={1.5}
                  />
                ) : isCurrent ? (
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
                className={`text-[12px] transition-colors duration-300 ${
                  isCompleted
                    ? "text-white/50"
                    : isCurrent
                      ? "text-white/80"
                      : "text-white/20"
                }`}
              >
                {p.label}
              </span>

              {isCurrent && (
                <span className="ml-auto text-[10px] text-white/20 font-light">
                  {p.sublabel}
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ConnectedPill({
  label,
  uriMasked,
  onDisconnect,
  onClick,
}: {
  label: string;
  uriMasked?: string;
  onDisconnect: () => void;
  onClick: () => void;
}) {
  const [showMenu, setShowMenu] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setShowMenu((v) => !v)}
        className="group flex items-center gap-2 px-3.5 py-2 text-[13px] text-white/70 hover:text-white bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.08] hover:border-white/[0.13] rounded-lg transition-all duration-200"
      >
        {/* Alive indicator */}
        <span className="relative flex h-1.5 w-1.5">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white/40 opacity-75" />
          <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-white/60" />
        </span>
        <Database size={14} strokeWidth={1.5} />
        <span className="max-w-[140px] truncate">{label}</span>
        <ChevronRight
          size={12}
          className={`opacity-40 transition-transform duration-200 ${showMenu ? "rotate-90" : ""}`}
        />
      </button>

      {showMenu && (
        <>
          <div
            className="fixed inset-0 z-[50]"
            onClick={() => setShowMenu(false)}
          />
          <div className="absolute top-full mt-2 left-0 z-[51] w-64 bg-[#0A0A0A]/98 border border-white/[0.1] rounded-xl shadow-2xl backdrop-blur-2xl overflow-hidden animate-db-fade-in">
            <div className="p-3 border-b border-white/[0.05]">
              <p className="text-[12px] text-white/60 font-medium">{label}</p>
              {uriMasked && (
                <p className="text-[11px] text-white/25 mt-0.5 font-mono truncate">
                  {uriMasked}
                </p>
              )}
            </div>
            <div className="p-1.5">
              <button
                onClick={() => {
                  setShowMenu(false);
                  onDisconnect();
                }}
                className="w-full flex items-center gap-2.5 px-3 py-2 text-[12px] text-red-400/70 hover:text-red-400 hover:bg-red-500/[0.06] rounded-lg transition-all duration-200"
              >
                <Unplug size={13} strokeWidth={1.5} />
                Disconnect
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

// ── Styles ────────────────────────────────────────────────────────────────────

const dbModalStyles = `
  @keyframes db-fade-in {
    from { opacity: 0; }
    to { opacity: 1; }
  }
  @keyframes db-modal-in {
    from { opacity: 0; transform: scale(0.97) translateY(12px); }
    to   { opacity: 1; transform: scale(1) translateY(0); }
  }
  @keyframes db-ping {
    75%, 100% { transform: scale(2); opacity: 0; }
  }

  .animate-db-fade-in  { animation: db-fade-in  0.2s ease-out both; }
  .animate-db-modal-in { animation: db-modal-in 0.35s cubic-bezier(0.16, 1, 0.3, 1) both; }
  .animate-db-ping     { animation: db-ping 1.4s cubic-bezier(0, 0, 0.2, 1) infinite; }
`;

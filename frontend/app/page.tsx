"use client";

import { useEffect, useState } from "react";
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
} from "lucide-react";
import Link from "next/link";
import { RootDispatch, RootState } from "@/store";
import { useDispatch, useSelector } from "react-redux";
import { fetchDbSchemas } from "@/store/dbSchemasSlice";
import { AIGenerationScreen } from "@/components/workflow/AIGenerationScreen";

export default function LandingPage() {
  const [showGenerationScreen, setShowGenerationScreen] = useState(false);
  const schemas = useSelector((state: RootState) => state.dbSchemas.schemas);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showAIModal, setShowAIModal] = useState(false);
  const dispatch: RootDispatch = useDispatch();
  const [aiPrompt, setAiPrompt] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatingPrompt, setGeneratingPrompt] = useState("");
  console.log("Schemas in LandingPage:", schemas);
  const [generationDone, setGenerationDone] = useState(false);

  useEffect(() => {
    dispatch(fetchDbSchemas());
  }, [dispatch]);

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
        throw new Error("Invalid AI workflow returned");
      }

      sessionStorage.setItem(
        "aiWorkflow",
        JSON.stringify({
          nodes: ai.nodes.map((n, index) => ({
            id: n.id,
            type: n.type,
            position: { x: (index % 3) * 280, y: Math.floor(index / 3) * 180 },
            data: n.data,
          })),
          edges: ai.edges.map((e) => ({
            id: e.id,
            source: e.source,
            target: e.target,
          })),
        })
      );

      setGenerationDone(true); // 🔥 THIS WAS MISSING
    } finally {
      setIsGenerating(false);
    }
  };

  const handleGenerateClick = async () => {
    if (!aiPrompt.trim()) return;

    setGeneratingPrompt(aiPrompt);
    setShowAIModal(false);
    setShowGenerationScreen(true);

    try {
      await generateAIWorkflow(); // SINGLE API CALL
    } catch (e) {
      handleGenerationError(e);
    }
  };

  const handleGenerationComplete = () => {
    // Redirect to builder page
    window.location.href = "/builder";
  };
  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleGenerateClick();
    } else if (e.key === "Escape") {
      setShowAIModal(false);
      setAiPrompt("");
    }
  };

  const handleGenerationError = (error) => {
    alert("Failed to generate workflow: " + error.message);
    setShowGenerationScreen(false);
    setShowAIModal(true);
  };

  if (showGenerationScreen) {
    return (
      <AIGenerationScreen
        done={generationDone}
        onComplete={handleGenerationComplete}
      />
    );
  }

  return (
    <div className="min-h-screen bg-black text-white overflow-hidden relative">
      {/* Subtle Grid Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none opacity-[0.03]">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px),
                             linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)`,
            backgroundSize: "80px 80px",
          }}
        />
      </div>

      {/* Noise Texture */}
      <div className="fixed inset-0 opacity-[0.02] pointer-events-none mix-blend-overlay">
        <div className="absolute inset-0 bg-noise" />
      </div>

      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 animate-slide-down">
        <div className="absolute inset-0 bg-black/60 backdrop-blur-2xl border-b border-white/[0.06]" />
        <div className="relative max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 lg:h-18">
            <div className="flex items-center gap-2.5 group cursor-pointer">
              <div className="w-8 h-8 rounded-lg bg-white/[0.08] border border-white/[0.12] flex items-center justify-center backdrop-blur-xl group-hover:bg-white/[0.12] transition-all duration-300">
                <Workflow size={16} className="text-white" strokeWidth={1.5} />
              </div>
              <span className="text-[15px] font-medium tracking-tight">
                Orchestrix
              </span>
            </div>

            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="lg:hidden p-2 hover:bg-white/[0.08] rounded-lg transition-all duration-300"
            >
              {isMenuOpen ? (
                <X size={20} strokeWidth={1.5} />
              ) : (
                <Menu size={20} strokeWidth={1.5} />
              )}
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center px-6 pt-20">
        {/* Radial Gradient Spotlight */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-white/[0.03] rounded-full blur-[120px]" />
        </div>

        <div className="relative z-10 max-w-5xl mx-auto text-center animate-fade-in-up">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/[0.04] border border-white/[0.08] backdrop-blur-xl mb-8 animate-fade-in">
            <div className="w-1 h-1 rounded-full bg-white/60 animate-pulse-subtle" />
            <span className="text-[12px] font-medium text-white/60 tracking-wide">
              AI-POWERED API GENERATION
            </span>
          </div>

          {/* Heading */}
          <h1 className="text-5xl sm:text-6xl lg:text-[76px] font-semibold mb-6 leading-[1.06] tracking-[-0.02em]">
            <span className="inline-block animate-fade-in-up">
              Build APIs without
            </span>
            <br />
            <span className="inline-block text-white/40 animate-fade-in-up animation-delay-100">
              writing code
            </span>
          </h1>

          {/* Subtitle */}
          <p className="text-lg sm:text-xl text-white/40 mb-12 max-w-2xl mx-auto leading-relaxed font-light animate-fade-in-up animation-delay-200">
            Connect nodes, define logic, and deploy production-ready APIs
            instantly. Let AI generate workflows or build manually.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 animate-fade-in-up animation-delay-300">
            <button
              onClick={() => setShowAIModal(true)}
              className="group px-6 py-3 text-[14px] font-medium text-black bg-white hover:bg-white/90 rounded-lg w-full sm:w-auto justify-center transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] shadow-[0_0_40px_rgba(255,255,255,0.1)]"
            >
              <span className="flex items-center gap-2">
                <Brain size={18} strokeWidth={2} />
                Generate with AI
                <ArrowRight
                  size={18}
                  strokeWidth={2}
                  className="group-hover:translate-x-0.5 transition-transform duration-300"
                />
              </span>
            </button>

            <Link href="/builder" passHref>
              <button className="group px-6 py-3 text-[14px] font-medium text-white bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] rounded-lg backdrop-blur-xl flex items-center gap-2 transition-all duration-300 w-full sm:w-auto justify-center hover:scale-[1.02] active:scale-[0.98]">
                <Play size={18} strokeWidth={2} />
                Build Manually
              </button>
            </Link>
          </div>
        </div>

        {/* Scroll Indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-fade-in animation-delay-500">
          <div className="w-5 h-9 rounded-full border border-white/[0.12] flex items-start justify-center p-1.5 backdrop-blur-xl bg-white/[0.02]">
            <div className="w-0.5 h-2 bg-white/40 rounded-full animate-scroll" />
          </div>
        </div>
      </section>

      {/* AI Modal */}
      {showAIModal && (
        <>
          <div
            onClick={() => {
              setShowAIModal(false);
              setAiPrompt("");
            }}
            className="fixed inset-0 bg-black/80 backdrop-blur-xl z-[100] animate-fade-in-fast"
          />

          <div className="fixed inset-0 z-[101] flex items-center justify-center p-4 animate-modal-in">
            <div className="relative w-full max-w-2xl">
              {/* Soft Glow */}
              <div className="absolute inset-0 bg-white/[0.03] rounded-2xl blur-3xl" />

              <div className="relative bg-[#0A0A0A]/95 border border-white/[0.12] rounded-2xl shadow-2xl backdrop-blur-2xl overflow-hidden">
                {/* Top Highlight */}
                <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />

                {/* Header */}
                <div className="px-6 py-5 border-b border-white/[0.06] flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div>
                      <h3 className="text-[15px] font-medium text-white tracking-tight">
                        Generate API Workflow
                      </h3>
                      <p className="text-[13px] text-white/30 font-light">
                        Describe your API and let AI build it
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setShowAIModal(false);
                      setAiPrompt("");
                    }}
                    className="p-2 hover:bg-white/[0.06] rounded-lg transition-all duration-300 hover:scale-105 active:scale-95"
                  >
                    <X size={16} className="text-white/40" strokeWidth={1.5} />
                  </button>
                </div>

                {/* Content */}
                <div className="p-6">
                  <div className="mb-4">
                    <label className="block text-[12px] text-white/40 mb-2.5 font-medium tracking-wide uppercase">
                      API Description
                    </label>
                    <div className="relative">
                      <textarea
                        value={aiPrompt}
                        onChange={(e) => setAiPrompt(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="Create a login API with email validation, password hashing, and JWT token generation"
                        disabled={isGenerating}
                        autoFocus
                        className="w-full h-32 px-4 py-3 bg-white/[0.03] border border-white/[0.08] hover:border-white/[0.12] rounded-xl text-[14px] text-white placeholder-white/20 resize-none focus:outline-none focus:border-white/[0.16] focus:bg-white/[0.04] transition-all duration-300 backdrop-blur-xl"
                      />
                      <div className="absolute bottom-3 right-3 text-[10px] text-white/20 font-mono tracking-wider">
                        {aiPrompt.length}/500
                      </div>
                    </div>
                  </div>

                  {/* Helper Text */}
                  <div className="flex items-center justify-between text-[11px] text-white/30 mb-6 px-0.5">
                    <span className="flex items-center gap-2">
                      <kbd className="px-2 py-1 bg-white/[0.04] border border-white/[0.08] rounded text-[10px] font-mono">
                        ⏎
                      </kbd>
                      to generate
                      <span className="text-white/10">•</span>
                      <kbd className="px-2 py-1 bg-white/[0.04] border border-white/[0.08] rounded text-[10px] font-mono">
                        ESC
                      </kbd>
                      to close
                    </span>
                    <span className="flex items-center gap-1.5 font-medium tracking-wide">
                      <div className="w-1 h-1 rounded-full bg-white/40 animate-pulse-subtle" />
                      AI-POWERED
                    </span>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => {
                        setShowAIModal(false);
                        setAiPrompt("");
                      }}
                      disabled={isGenerating}
                      className="flex-1 px-4 py-2.5 text-[13px] font-medium text-white/50 hover:text-white bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.08] rounded-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed backdrop-blur-xl hover:scale-[1.01] active:scale-[0.99]"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleGenerateClick}
                      disabled={!aiPrompt.trim() || isGenerating}
                      className="flex-1 px-4 py-2.5 text-[13px] font-medium text-black bg-white hover:bg-white/90 rounded-lg flex items-center justify-center gap-2 transition-all duration-300 disabled:opacity-40 disabled:cursor-not-allowed hover:scale-[1.01] active:scale-[0.99] shadow-[0_0_30px_rgba(255,255,255,0.15)]"
                    >
                      {isGenerating ? (
                        <>
                          <div className="w-3.5 h-3.5 border-2 border-black/20 border-t-black rounded-full animate-spin" />
                          Generating...
                        </>
                      ) : (
                        <>
                          <Brain size={15} strokeWidth={2} />
                          Generate Workflow
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
      <section className="relative py-32 px-6 border-t border-white/[0.03]">
        <div className="relative max-w-7xl mx-auto">
          <div className="text-center mb-20">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-semibold mb-4 tracking-[-0.02em]">
              How it works
            </h2>
            <p className="text-lg text-white/30 max-w-2xl mx-auto font-light">
              From idea to production API in minutes
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-4">
            {[
              {
                step: "01",
                icon: Brain,
                title: "Generate with AI or Build Manually",
                description:
                  "Describe your API in plain English and let AI connect the nodes, or drag and drop nodes yourself.",
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
                className="group relative p-7 bg-white/[0.02] hover:bg-white/[0.04] border border-white/[0.06] hover:border-white/[0.1] rounded-xl transition-all duration-500 backdrop-blur-xl"
                style={{ animationDelay: `${i * 100}ms` }}
              >
                <div className="flex items-start gap-5">
                  <div className="flex-shrink-0">
                    <div className="w-10 h-10 rounded-lg bg-white/[0.04] border border-white/[0.08] flex items-center justify-center backdrop-blur-xl group-hover:bg-white/[0.06] group-hover:scale-105 transition-all duration-500">
                      <item.icon
                        size={18}
                        className="text-white/80"
                        strokeWidth={1.5}
                      />
                    </div>
                  </div>
                  <div className="flex-1 pt-0.5">
                    <div className="text-[11px] text-white/20 font-mono mb-2 tracking-wider">
                      {item.step}
                    </div>
                    <h3 className="text-[16px] font-medium mb-2.5 text-white tracking-tight">
                      {item.title}
                    </h3>
                    <p className="text-[14px] text-white/30 leading-relaxed font-light">
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
      <section className="relative py-32 px-6 border-t border-white/[0.03]">
        <div className="relative max-w-7xl mx-auto">
          <div className="text-center mb-20">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-semibold mb-4 tracking-[-0.02em]">
              Powerful features
            </h2>
            <p className="text-lg text-white/30 max-w-2xl mx-auto font-light">
              Everything you need to build production-ready APIs
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
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
                className="group p-7 bg-white/[0.02] hover:bg-white/[0.04] border border-white/[0.06] hover:border-white/[0.1] rounded-xl transition-all duration-500 backdrop-blur-xl"
                style={{ animationDelay: `${i * 50}ms` }}
              >
                <div className="w-9 h-9 rounded-lg bg-white/[0.04] border border-white/[0.08] flex items-center justify-center mb-5 backdrop-blur-xl group-hover:bg-white/[0.06] group-hover:scale-105 transition-all duration-500">
                  <feature.icon
                    size={17}
                    className="text-white/70"
                    strokeWidth={1.5}
                  />
                </div>
                <h3 className="text-[15px] font-medium mb-2.5 text-white tracking-tight">
                  {feature.title}
                </h3>
                <p className="text-[14px] text-white/30 leading-relaxed font-light">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="relative py-32 px-6 border-t border-white/[0.03]">
        <div className="relative max-w-4xl mx-auto">
          <div className="relative p-16 bg-white/[0.02] border border-white/[0.06] rounded-2xl backdrop-blur-xl overflow-hidden group hover:bg-white/[0.03] hover:border-white/[0.08] transition-all duration-500">
            <div className="absolute inset-0 bg-gradient-radial from-white/[0.02] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
            <div className="relative text-center">
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-semibold mb-5 tracking-[-0.02em]">
                Start building today
              </h2>
              <p className="text-lg text-white/30 mb-10 max-w-2xl mx-auto font-light">
                Join developers building APIs 10× faster with Orchestrix
              </p>
              <button
                onClick={() => setShowAIModal(true)}
                className="px-6 py-3 text-[14px] font-medium text-black bg-white hover:bg-white/90 rounded-lg inline-flex items-center gap-2 transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] shadow-[0_0_40px_rgba(255,255,255,0.12)]"
              >
                Get Started Free
                <ArrowRight size={18} strokeWidth={2} />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative border-t border-white/[0.03] py-12 px-6">
        <div className="relative max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-white/[0.06] border border-white/[0.12] flex items-center justify-center backdrop-blur-xl">
                <Workflow size={16} className="text-white" strokeWidth={1.5} />
              </div>
              <span className="text-[15px] font-medium">Orchestrix</span>
            </div>
            <p className="text-[13px] text-white/20 font-light">
              © 2024 Orchestrix. All rights reserved.
            </p>
          </div>
        </div>
      </footer>

      <style>{`
        @keyframes fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes fade-in-up {
          from { opacity: 0; transform: translateY(24px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes fade-in-fast {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slide-down {
          from { transform: translateY(-100%); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        @keyframes modal-in {
          from { 
            opacity: 0;
            transform: scale(0.96) translateY(16px);
          }
          to { 
            opacity: 1;
            transform: scale(1) translateY(0);
          }
        }
        @keyframes pulse-subtle {
          0%, 100% { opacity: 0.6; }
          50% { opacity: 1; }
        }
        @keyframes scroll {
          0% { transform: translateY(0); opacity: 0; }
          50% { opacity: 1; }
          100% { transform: translateY(10px); opacity: 0; }
        }

        .animate-fade-in { animation: fade-in 0.8s cubic-bezier(0.16, 1, 0.3, 1); }
        .animate-fade-in-up { animation: fade-in-up 1s cubic-bezier(0.16, 1, 0.3, 1); }
        .animate-fade-in-fast { animation: fade-in-fast 0.2s ease-out; }
        .animate-slide-down { animation: slide-down 0.8s cubic-bezier(0.16, 1, 0.3, 1); }
        .animate-modal-in { animation: modal-in 0.4s cubic-bezier(0.16, 1, 0.3, 1); }
        .animate-pulse-subtle { animation: pulse-subtle 3s ease-in-out infinite; }
        .animate-scroll { animation: scroll 2.5s ease-in-out infinite; }

        .animation-delay-100 { animation-delay: 100ms; }
        .animation-delay-200 { animation-delay: 200ms; }
        .animation-delay-300 { animation-delay: 300ms; }
        .animation-delay-500 { animation-delay: 500ms; }

        .bg-noise {
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='3.5' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E");
        }

        * {
          -webkit-font-smoothing: antialiased;
          -moz-osx-font-smoothing: grayscale;
        }
      `}</style>
    </div>
  );
}

"use client";

import { useState } from "react";
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
  Sparkles,
} from "lucide-react";
import { AIGenerationScreen } from "../components/workflow/AIGenerationScreen";

export default function LandingPage() {
  const [showGenerationScreen, setShowGenerationScreen] = useState(false);

  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showAIModal, setShowAIModal] = useState(false);
  const [aiPrompt, setAiPrompt] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatingPrompt, setGeneratingPrompt] = useState("");
  const [generationDone, setGenerationDone] = useState(false);

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
    <div className="min-h-screen bg-black text-white overflow-hidden">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-black/80 backdrop-blur-xl border-b border-neutral-800 animate-[slideDown_0.6s_ease-out]">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 lg:h-20">
            <div className="flex items-center gap-3 hover:scale-105 transition-transform">
              <div className="w-9 h-9 rounded-lg bg-neutral-900 border border-neutral-800 flex items-center justify-center">
                <Workflow size={18} className="text-white" />
              </div>
              <span className="text-[15px] font-semibold">FlowAPI</span>
            </div>

            <div className="hidden lg:flex items-center gap-3">
              <button className="px-4 py-2 text-[14px] font-medium text-neutral-400 hover:text-white transition-colors hover:scale-105 active:scale-95">
                Sign In
              </button>
              <button className="px-4 py-2 text-[14px] font-medium text-white bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 rounded-lg transition-all hover:scale-105 active:scale-95">
                Get Started
              </button>
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="lg:hidden p-2 hover:bg-neutral-900 rounded-lg transition-colors"
            >
              {isMenuOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center px-6 pt-20">
        {/* Subtle Grid Background */}
        <div className="absolute inset-0 overflow-hidden opacity-30">
          <div
            className="absolute inset-0"
            style={{
              backgroundImage: `radial-gradient(circle at 1px 1px, rgba(255,255,255,0.05) 1px, transparent 0)`,
              backgroundSize: "40px 40px",
            }}
          />
        </div>

        <div className="relative z-10 max-w-5xl mx-auto text-center animate-[fadeInUp_0.8s_ease-out]">
          {/* Badge */}

          {/* Heading */}
          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold mb-6 leading-[1.1] tracking-tight">
            Build APIs without
            <br />
            writing code
          </h1>

          {/* Subtitle */}
          <p className="text-lg sm:text-xl text-neutral-400 mb-12 max-w-2xl mx-auto leading-relaxed">
            Connect nodes, define logic, and deploy production-ready APIs
            instantly. Let AI generate workflows or build manually with our
            visual editor.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              onClick={() => setShowAIModal(true)}
              className="group px-6 py-3 text-[14px] font-medium text-black bg-white hover:bg-neutral-100 rounded-lg flex items-center gap-2 transition-all w-full sm:w-auto justify-center hover:scale-105 active:scale-95"
            >
              <Brain size={18} />
              Generate with AI
              <ArrowRight
                size={18}
                className="group-hover:translate-x-1 transition-transform"
              />
            </button>

            <button
              onClick={() => (window.location.href = "/builder")}
              className="px-6 py-3 text-[14px] font-medium text-white bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 rounded-lg flex items-center gap-2 transition-all w-full sm:w-auto justify-center hover:scale-105 active:scale-95"
            >
              <Play size={18} />
              Build Manually
            </button>
          </div>
        </div>

        {/* Scroll Indicator */}
        <div className="absolute bottom-12 left-1/2 -translate-x-1/2">
          <div className="w-5 h-8 rounded-full border border-neutral-800 flex items-start justify-center p-1.5">
            <div className="w-1 h-1 bg-neutral-500 rounded-full animate-bounce" />
          </div>
        </div>
      </section>

      {/* AI Prompt Modal */}
      {showAIModal && (
        <>
          {/* Backdrop */}
          <div
            onClick={() => {
              setShowAIModal(false);
              setAiPrompt("");
            }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] animate-[fadeIn_0.2s_ease-out]"
          />

          {/* Modal */}
          <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[101] w-full max-w-2xl mx-4 animate-[scaleIn_0.2s_ease-out]">
            <div className="bg-[#191919] border border-white/10 rounded-2xl shadow-2xl overflow-hidden">
              {/* Header */}
              <div className="px-6 py-5 border-b border-white/10 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center">
                    <Sparkles size={18} className="text-white" />
                  </div>
                  <div>
                    <h3 className="text-[16px] font-semibold text-white">
                      Generate API Workflow
                    </h3>
                    <p className="text-[13px] text-neutral-400">
                      Describe your API and let AI build it
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setShowAIModal(false);
                    setAiPrompt("");
                  }}
                  className="p-2 hover:bg-white/5 rounded-lg transition-colors"
                >
                  <X size={18} className="text-neutral-400" />
                </button>
              </div>

              {/* Content */}
              <div className="p-6">
                <div className="mb-4">
                  <label className="block text-[13px] text-neutral-400 mb-2">
                    API Description
                  </label>
                  <textarea
                    value={aiPrompt}
                    onChange={(e) => setAiPrompt(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Example: Create a login API with email validation, password hashing, and JWT token generation"
                    disabled={isGenerating}
                    autoFocus
                    className="w-full h-32 px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-[14px] text-white placeholder-neutral-500 resize-none focus:outline-none focus:border-white/20 transition-colors"
                  />
                </div>

                {/* Helper Text */}
                <div className="flex items-center justify-between text-[12px] text-neutral-500 mb-6">
                  <span>Press Enter to generate • ESC to close</span>
                  <span className="flex items-center gap-1">
                    <Sparkles size={10} />
                    AI-powered
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
                    className="flex-1 px-4 py-2.5 text-[14px] font-medium text-neutral-400 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleGenerateClick}
                    disabled={!aiPrompt.trim() || isGenerating}
                    className="flex-1 px-4 py-2.5 text-[14px] font-medium text-black bg-white hover:bg-neutral-100 rounded-lg flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-neutral-300"
                  >
                    {isGenerating ? (
                      <>
                        <div className="w-4 h-4 border-2 border-black/20 border-t-black rounded-full animate-spin" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <Brain size={16} />
                        Generate Workflow
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* How It Works */}
      <section className="relative py-24 sm:py-32 px-6 border-t border-neutral-900">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4">
              How it works
            </h2>
            <p className="text-lg text-neutral-400 max-w-2xl mx-auto">
              From idea to production API in minutes
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-6">
            {[
              {
                step: "01",
                icon: Brain,
                title: "Generate with AI or Build Manually",
                description:
                  "Describe your API in plain English and let AI connect the nodes, or drag and drop nodes yourself for full control.",
              },
              {
                step: "02",
                icon: Boxes,
                title: "Connect Nodes Visually",
                description:
                  "Wire up Input, Database, Auth, Validation nodes and more. Pass data between nodes seamlessly with our visual editor.",
              },
              {
                step: "03",
                icon: Play,
                title: "Test with Live Execution",
                description:
                  "Run your workflow with test data. Watch real-time logs for each step via WebSocket connection.",
              },
              {
                step: "04",
                icon: Zap,
                title: "Deploy Instantly",
                description:
                  "Save your workflow and get a production-ready API endpoint immediately. Use it in your frontend right away.",
              },
            ].map((item) => (
              <div
                key={item.step}
                className="group relative p-8 bg-neutral-950 hover:bg-neutral-900/50 border border-neutral-900 rounded-xl transition-all"
              >
                <div className="flex items-start gap-6">
                  <div className="flex-shrink-0">
                    <div className="w-12 h-12 rounded-lg bg-neutral-900 border border-neutral-800 flex items-center justify-center">
                      <item.icon size={20} className="text-white" />
                    </div>
                  </div>
                  <div className="flex-1">
                    <div className="text-[13px] text-neutral-500 font-mono mb-2">
                      {item.step}
                    </div>
                    <h3 className="text-xl font-semibold mb-3 text-white">
                      {item.title}
                    </h3>
                    <p className="text-neutral-400 leading-relaxed">
                      {item.description}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="relative py-24 sm:py-32 px-6 border-t border-neutral-900">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4">
              Powerful features
            </h2>
            <p className="text-lg text-neutral-400 max-w-2xl mx-auto">
              Everything you need to build production-ready APIs
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                icon: Database,
                title: "Database Operations",
                description:
                  "Find, insert, and update records with visual query builders",
              },
              {
                icon: CheckCircle,
                title: "Input Validation",
                description:
                  "Built-in validation middleware to ensure data integrity",
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
                  "Queue long-running tasks and process them asynchronously",
              },
              {
                icon: Eye,
                title: "Live Execution Logs",
                description:
                  "Watch your workflow execute in real-time with WebSocket updates",
              },
              {
                icon: Workflow,
                title: "Motia Step Integration",
                description:
                  "Each node becomes a Motia step for modular workflow composition",
              },
            ].map((feature) => (
              <div
                key={feature.title}
                className="group p-8 bg-neutral-950 hover:bg-neutral-900/50 border border-neutral-900 rounded-xl transition-all"
              >
                <div className="w-11 h-11 rounded-lg bg-neutral-900 border border-neutral-800 flex items-center justify-center mb-5">
                  <feature.icon size={20} className="text-white" />
                </div>
                <h3 className="text-lg font-semibold mb-3 text-white">
                  {feature.title}
                </h3>
                <p className="text-neutral-400 text-[15px] leading-relaxed">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative py-24 sm:py-32 px-6 border-t border-neutral-900">
        <div className="max-w-4xl mx-auto text-center">
          <div className="relative p-12 sm:p-16 bg-neutral-950 border border-neutral-900 rounded-2xl">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-6">
              Start building today
            </h2>
            <p className="text-lg text-neutral-400 mb-8 max-w-2xl mx-auto">
              Join developers building APIs 10x faster with FlowAPI
            </p>
            <button
              onClick={() => setShowAIModal(true)}
              className="px-6 py-3 text-[14px] font-medium text-black bg-white hover:bg-neutral-100 rounded-lg inline-flex items-center gap-2 hover:scale-105 active:scale-95 transition-all"
            >
              Get Started Free
              <ArrowRight size={18} />
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative border-t border-neutral-900 py-12 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-neutral-900 border border-neutral-800 flex items-center justify-center">
                <Workflow size={18} className="text-white" />
              </div>
              <span className="text-[15px] font-semibold">FlowAPI</span>
            </div>
            <p className="text-[13px] text-neutral-500">
              © 2024 FlowAPI. All rights reserved.
            </p>
          </div>
        </div>
      </footer>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(30px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes slideDown {
          from { transform: translateY(-100%); }
          to { transform: translateY(0); }
        }
        @keyframes scaleIn {
          from { opacity: 0; transform: translate(-50%, -50%) scale(0.95); }
          to { opacity: 1; transform: translate(-50%, -50%) scale(1); }
        }
      `}</style>
    </div>
  );
}

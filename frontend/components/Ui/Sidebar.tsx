/* eslint-disable @typescript-eslint/no-explicit-any */
import { nodeTemplates } from "@/assets/NodesList";
import { Plus, Trash2, Workflow, X } from "lucide-react";
import React from "react";

interface SidebarProps {
  sidebarOpen: boolean;
  setSidebarOpen: React.Dispatch<React.SetStateAction<boolean>>;

  addNode: (type: string, label: string) => void;
  clearNodes: () => void;
  nodes: {
    id: string;
    type: string;
    data: any;
    position: { x: number; y: number };
  }[];
  edges: {
    id: string;
    source: string;
    target: string;
    type: string;
  }[];
}

export const Sidebar: React.FC<SidebarProps> = ({
  sidebarOpen,
  setSidebarOpen,
  addNode,
  clearNodes,
  nodes,
  edges,
}) => {
  return (
    <div
      className={`${
        sidebarOpen ? "w-72" : "w-0"
      } transition-all duration-300 ease-out bg-[#191919]/80 backdrop-blur-xl border-r border-white/[0.08] overflow-hidden flex flex-col shadow-[4px_0_24px_-8px_rgba(0,0,0,0.5)]`}
    >
      {/* Header */}
      <div className="px-5 py-4 border-b border-white/[0.06] flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-white/[0.04] to-white/[0.08] backdrop-blur-sm flex items-center justify-center shadow-sm">
            <Workflow size={15} className="text-white/70" strokeWidth={2} />
          </div>
          <span className="text-[15px] font-semibold text-white/90 tracking-tight">
            Building Blocks
          </span>
        </div>
        <button
          onClick={() => setSidebarOpen(false)}
          className="p-1.5 hover:bg-white/[0.04] rounded-lg transition-all duration-200 active:scale-95"
        >
          <X size={16} className="text-white/40" strokeWidth={2} />
        </button>
      </div>

      {/* Node Templates */}
      <div className="flex-1 overflow-y-auto px-4 py-5 space-y-1.5">
        <div className="text-[11px] font-semibold text-white/40 uppercase tracking-wider px-2 mb-4 letter-spacing-[0.5px]">
          Add to workflow
        </div>
        {nodeTemplates.map((template) => (
          <button
            key={template.type}
            onClick={() => addNode(template.type, template.label)}
            className="w-full px-3.5 py-3 bg-white/[0.03] hover:bg-white/[0.06] backdrop-blur-sm border border-white/[0.06] hover:border-white/[0.12] rounded-xl text-left transition-all duration-200 group shadow-[0_1px_3px_rgba(0,0,0,0.3)] hover:shadow-[0_2px_8px_rgba(0,0,0,0.4)] active:scale-[0.98]"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-white/[0.04] to-white/[0.08] group-hover:from-white/[0.08] group-hover:to-white/[0.12] backdrop-blur-sm flex items-center justify-center transition-all duration-200 shadow-sm">
                <div className="text-white/60 group-hover:text-white/80 transition-colors duration-200">
                  {template.icon}
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-medium text-[14px] text-white/90 mb-0.5 truncate">
                  {template.label}
                </div>
                <div className="text-[12px] text-white/50 truncate leading-tight">
                  {template.description}
                </div>
              </div>
              <Plus
                size={16}
                className="text-white/30 group-hover:text-white/60 transition-colors duration-200 flex-shrink-0"
                strokeWidth={2}
              />
            </div>
          </button>
        ))}
      </div>

      {/* Footer */}
      <div className="px-4 py-4 border-t border-white/[0.06] space-y-3 bg-[#191919]/60 backdrop-blur-xl">
        <button
          onClick={clearNodes}
          className="w-full px-3.5 py-2.5 bg-gradient-to-b from-white/[0.06] to-white/[0.03] backdrop-blur-sm hover:from-white/[0.08] hover:to-white/[0.05] text-white/70 hover:text-white/90 border border-white/[0.08] hover:border-white/[0.12] rounded-xl transition-all duration-200 flex items-center justify-center gap-2 text-[13px] font-medium shadow-[0_1px_3px_rgba(0,0,0,0.3)] hover:shadow-[0_2px_6px_rgba(0,0,0,0.4)] active:scale-[0.98]"
        >
          <Trash2 size={14} strokeWidth={2} />
          Clear Workflow
        </button>
        <div className="flex items-center justify-center gap-4 text-[12px] text-white/40 font-medium">
          <span className="flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-white/30 shadow-sm"></div>
            {nodes.length} nodes
          </span>
          <span className="text-white/20">•</span>
          <span className="flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-white/30 shadow-sm"></div>
            {edges.length} edges
          </span>
        </div>
      </div>
    </div>
  );
};

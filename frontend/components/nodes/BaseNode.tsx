"use client";
/* eslint-disable @typescript-eslint/no-explicit-any */

import { Handle, Position } from "@xyflow/react";
import StepBadge from "./StepBadge";
import { useWorkflowActions } from "@/assets/useWorkflowActions"; 

export interface BaseNodeProps {
  id?: string;
  data: {
    label: string;
    icon?: React.ReactNode;
    fields?: Record<string, any>;
    pass?: string; // ADD THIS
    _stepNumber?: number | string;
  };
}

export function BaseNode({ id, data }: BaseNodeProps) {
  const { removeNode } = useWorkflowActions();

  return (
    <div className="relative rounded-xl border border-white/[0.08] bg-gradient-to-br from-[#1a1a1a] to-[#151515] backdrop-blur-xl shadow-[0_8px_32px_rgba(0,0,0,0.6)] px-4 py-3 w-[220px] text-gray-100 hover:shadow-[0_8px_32px_rgba(255,255,255,0.04)] hover:border-white/[0.12] transition-all duration-300">
      {/* DELETE BUTTON */}
      <button
        onClick={() => removeNode(id!)}
        className="absolute -top-2 -right-2 bg-gradient-to-br from-white/[0.12] to-white/[0.06] hover:from-white/[0.16] hover:to-white/[0.08] backdrop-blur-xl text-white/80 hover:text-white w-6 h-6 flex items-center justify-center rounded-lg text-[11px] shadow-[0_4px_16px_rgba(0,0,0,0.4)] border border-white/[0.08] transition-all duration-200 active:scale-95"
      >
        ✕
      </button>

      {/* STEP BADGE */}
      {data._stepNumber !== undefined && (
        <StepBadge step={data._stepNumber === 0 ? "START" : data._stepNumber} />
      )}

      {/* LABEL + ICON */}
      <div className="flex items-center gap-2.5 mb-2">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-white/[0.08] to-white/[0.04] backdrop-blur-sm flex items-center justify-center border border-white/[0.06]">
          <div className="text-white/70">{data.icon}</div>
        </div>
        <span className="font-semibold text-[14px] text-white/90">
          {data.label}
        </span>
      </div>

      {/* FIELDS DISPLAY */}
      {/* FIELDS DISPLAY */}
      {data.fields && Object.keys(data.fields).length > 0 && (
        <div className="mt-3 pt-3 border-t border-white/[0.06] space-y-1.5 text-[12px]">
          {Object.entries(data.fields).map(([key, val]) => (
            <div key={key} className="flex gap-2 items-start">
              {/* KEY */}
              <span className="shrink-0 text-white/40 font-medium">{key}:</span>

              {/* VALUE */}
              <span
                className="
            text-white/60 font-mono text-[11px]
            break-all
            max-w-[150px]
            line-clamp-2
            overflow-hidden
          "
                title={typeof val === "string" ? val : JSON.stringify(val)}
              >
                {Array.isArray(val)
                  ? val
                      .map((item) =>
                        item?.field
                          ? `${item.field}${item.required ? "*" : ""}:${
                              item.type
                            }`
                          : JSON.stringify(item)
                      )
                      .join(", ")
                  : typeof val === "object"
                  ? JSON.stringify(val)
                  : String(val)}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* PASS MODE DISPLAY */}
      {data.pass && (
        <div className="mt-3 pt-3 border-t border-white/[0.06] text-[12px] flex gap-2">
          <span className="text-white/40 shrink-0">pass</span>
          <span
            className="
        text-white/80 font-mono
        break-all
        max-w-[150px]
        line-clamp-1
      "
            title={data.pass}
          >
            → {data.pass}
          </span>
        </div>
      )}

      {/* INPUT HANDLE */}
      <Handle
        type="target"
        position={Position.Top}
        className="!w-3 !h-3 !rounded-full !bg-gradient-to-br !from-emerald-400 !to-emerald-500 !border-2 !border-[#0a0a0a] !shadow-[0_2px_8px_rgba(52,211,153,0.4)] hover:!scale-110 !transition-transform !duration-200"
      />

      {/* OUTPUT HANDLE */}
      <Handle
        type="source"
        position={Position.Bottom}
        className="!w-3 !h-3 !rounded-full !bg-gradient-to-br !from-blue-400 !to-blue-500 !border-2 !border-[#0a0a0a] !shadow-[0_2px_8px_rgba(59,130,246,0.4)] hover:!scale-110 !transition-transform !duration-200"
      />
    </div>
  );
}

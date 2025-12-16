"use client";

import React, { useEffect, useState } from "react";
import { X } from "lucide-react";
import { BaseNodeEditor } from "./BaseNodeEditor";
import { useNodeConfigs } from "../workflow/build/nodeConfigs";

export default function NodeEditorModal({
  selectedNode,
  onClose,
  onSave,
  allNodes,
  allEdges,
  graphMeta,
}: any) {
  const [localData, setLocalData] = useState(selectedNode?.data || {});
  const NODE_CONFIGS = useNodeConfigs();

  useEffect(() => {
    if (selectedNode) {
      setLocalData(selectedNode.data || {});
    }
  }, [selectedNode]);

  if (!selectedNode) return null;

  const config = NODE_CONFIGS[selectedNode.type];

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="fixed inset-0 z-[90] bg-black/70 backdrop-blur-sm"
      />

      {/* Modal */}
      <div className="fixed inset-0 z-[100] flex items-center justify-center px-4">
        <div
          className="
            w-full max-w-xl max-h-[85vh]
            bg-[#0b0b0b]
            border border-white/[0.08]
            rounded-2xl
            shadow-[0_30px_120px_rgba(0,0,0,0.8)]
            flex flex-col
          "
        >
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.06]">
            <div>
              <h3 className="text-sm font-semibold text-white">Edit Node</h3>
              <p className="text-xs text-white/40">{selectedNode.type}</p>
            </div>

            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-white/[0.06] transition"
            >
              <X size={16} className="text-white/60" />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto px-5 py-5">
            {!config ? (
              <div className="text-sm text-white/60">
                No editor found for <b>{selectedNode.type}</b>
              </div>
            ) : (
              <BaseNodeEditor
                node={selectedNode}
                localData={localData}
                setLocalData={setLocalData}
                graphMeta={graphMeta}
                config={config}
                onSave={(id: string, newData: any) => {
                  onSave(id, newData);
                  onClose();
                }}
              />
            )}
          </div>

          {/* Footer */}
          <div className="px-5 py-3 border-t border-white/[0.06] text-[11px] text-white/40">
            Node ID: <span className="text-white/60">{selectedNode.id}</span>
          </div>
        </div>
      </div>
    </>
  );
}

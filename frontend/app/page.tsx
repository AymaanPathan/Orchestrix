"use client";

import Image from "next/image";
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  Node,
  Edge,
} from "reactflow";
import "reactflow/dist/style.css";

const nodes: Node[] = [
  {
    id: "1",
    position: { x: 0, y: 0 },
    data: { label: "Input Node" },
  },
  {
    id: "2",
    position: { x: 250, y: 0 },
    data: { label: "Process Node" },
  },
  {
    id: "3",
    position: { x: 500, y: 0 },
    data: { label: "Output Node" },
  },
];

const edges: Edge[] = [
  { id: "e1-2", source: "1", target: "2" },
  { id: "e2-3", source: "2", target: "3" },
];

export default function Home() {
  return (
    <div className="min-h-screen bg-white">
      <main className="mx-auto max-w-7xl px-6 py-8">
        {/* Header */}
        <div className="mb-6 flex items-center gap-3">
          <Image
            src="/next.svg"
            alt="Next.js logo"
            width={100}
            height={20}
            priority
          />
          <h1 className="text-xl font-semibold text-gray-800">
            Workflow Builder
          </h1>
        </div>

        {/* React Flow Canvas */}
        <div className="h-[500px] w-full rounded-xl border border-gray-200 bg-gray-50">
          <ReactFlow nodes={nodes} edges={edges} fitView>
            <MiniMap className="!bg-white !border-gray-200" />
            <Controls className="!bg-white !border-gray-200" />
            <Background gap={16} className="!bg-gray-50" />
          </ReactFlow>
        </div>
      </main>
    </div>
  );
}

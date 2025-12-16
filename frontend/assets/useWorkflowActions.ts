import { useReactFlow } from "@xyflow/react";

export function useWorkflowActions() {
  const { setNodes, setEdges } = useReactFlow();

  function removeNode(id: string) {
    setNodes((nds) => nds.filter((n) => n.id !== id));
    setEdges((eds) => eds.filter((e) => e.source !== id && e.target !== id));
  }

  return { removeNode };
}

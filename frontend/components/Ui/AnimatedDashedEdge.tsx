import { BaseEdge, EdgeProps, getSmoothStepPath } from "@xyflow/react";

export default function AnimatedDashedEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  style,
}: EdgeProps) {
  const [path] = getSmoothStepPath({
    sourceX,
    sourceY,
    targetX,
    targetY,
  });

  return (
    <>
      <BaseEdge
        id={id}
        path={path}
        style={{
          stroke: "rgba(255,255,255,0.35)",
          strokeWidth: 1,
          strokeDasharray: "4 6",
          animation: "edge-flow 6s linear infinite",
          ...style,
        }}
      />

      <style>{`
        @keyframes edge-flow {
          from {
            stroke-dashoffset: 0;
          }
          to {
            stroke-dashoffset: -40;
          }
        }
      `}</style>
    </>
  );
}

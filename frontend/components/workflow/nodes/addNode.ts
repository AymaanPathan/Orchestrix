// /workflow/nodes/addNode.ts
import { v4 as uuid } from "uuid";
import { NodeDefinitions } from "./NodeDefinitions";

export function createNode(type: string, label: string) {
  const def = NodeDefinitions[type];

  return {
    id: uuid(),
    type,
    position: {
      x: 300 + Math.random() * 200,
      y: 100 + Math.random() * 200,
    },
    data: {
      label,
      fields: def?.defaultFields ? structuredClone(def.defaultFields) : {},
    },
  };
}

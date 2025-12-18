export const workflowSchema = {
  type: "object",
  required: ["nodes", "edges"],
  properties: {
    nodes: {
      type: "array",
      items: {
        type: "object",
        required: ["id", "type", "data"],
        properties: {
          id: { type: "string" },
          type: { type: "string" },
          data: {
            type: "object",
            properties: {
              label: { type: "string" },
              fields: { type: "object" },
              sampleValue: {},
            },
          },
        },
      },
    },
    edges: {
      type: "array",
      items: {
        type: "object",
        required: ["id", "source", "target"],
        properties: {
          id: { type: "string" },
          source: { type: "string" },
          target: { type: "string" },
        },
      },
    },
  },
};

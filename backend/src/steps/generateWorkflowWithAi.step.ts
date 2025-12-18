  import { ApiRouteConfig, StepHandler } from "motia";
  import { getAIProvider } from "../ai/providers/index";
  import { nodeCatalog } from "../ai/nodeCatalog";
  import { extractJson } from "../lib/extractJson";
  import { repairJson } from "../lib/repairJson";
  import { systemPrompt } from "../ai/prompts/systemPrompt";
  import { schemaPrompt } from "../ai/prompts/schemaPrompt";
  import { userPrompt } from "../ai/prompts/userPrompt";

  export const config: ApiRouteConfig = {
    name: "generateWorkflow",
    type: "api",
    path: "/workflow/generate",
    method: "POST",
    emits: [],
    flows: ["WorkflowBuilder"],
  };

  // Validation helpers
  function validateWorkflowStructure(workflow: any): {
    valid: boolean;
    error?: string;
  } {
    if (!workflow || typeof workflow !== "object") {
      return { valid: false, error: "Workflow must be an object" };
    }

    if (!Array.isArray(workflow.nodes)) {
      return { valid: false, error: "Missing or invalid 'nodes' array" };
    }

    if (!Array.isArray(workflow.edges)) {
      return { valid: false, error: "Missing or invalid 'edges' array" };
    }

    if (workflow.nodes.length === 0) {
      return { valid: false, error: "Workflow must have at least one node" };
    }

    return { valid: true };
  }

  function validateNodes(
    nodes: any[],
    allowedTypes: string[]
  ): { valid: boolean; error?: string } {
    const typeSet = new Set(allowedTypes);
    const seenIds = new Set<string>();

    for (let i = 0; i < nodes.length; i++) {
      const node = nodes[i];

      // Check basic structure
      if (!node.id || typeof node.id !== "string") {
        return { valid: false, error: `Node at index ${i} missing valid 'id'` };
      }

      // Check for duplicate IDs
      if (seenIds.has(node.id)) {
        return { valid: false, error: `Duplicate node ID: ${node.id}` };
      }
      seenIds.add(node.id);

      // Check type
      if (!node.type || !typeSet.has(node.type)) {
        return {
          valid: false,
          error: `Invalid node type '${node.type}' at node ${node.id}`,
        };
      }

      // Check data object exists
      if (!node.data || typeof node.data !== "object") {
        return { valid: false, error: `Node ${node.id} missing 'data' object` };
      }
    }

    return { valid: true };
  }

  function validateEdges(
    edges: any[],
    nodeIds: Set<string>
  ): { valid: boolean; error?: string } {
    for (let i = 0; i < edges.length; i++) {
      const edge = edges[i];

      if (!edge.id || typeof edge.id !== "string") {
        return { valid: false, error: `Edge at index ${i} missing valid 'id'` };
      }

      if (!edge.source || !nodeIds.has(edge.source)) {
        return {
          valid: false,
          error: `Edge ${edge.id} has invalid source: ${edge.source}`,
        };
      }

      if (!edge.target || !nodeIds.has(edge.target)) {
        return {
          valid: false,
          error: `Edge ${edge.id} has invalid target: ${edge.target}`,
        };
      }

      // Prevent self-loops
      if (edge.source === edge.target) {
        return {
          valid: false,
          error: `Edge ${edge.id} creates self-loop on node ${edge.source}`,
        };
      }
    }

    return { valid: true };
  }

  function detectCycles(nodes: any[], edges: any[]): boolean {
    const adj = new Map<string, string[]>();
    const visited = new Set<string>();
    const recStack = new Set<string>();

    // Build adjacency list
    nodes.forEach((n) => adj.set(n.id, []));
    edges.forEach((e) => {
      if (adj.has(e.source)) {
        adj.get(e.source)!.push(e.target);
      }
    });

    // DFS cycle detection
    function hasCycle(nodeId: string): boolean {
      visited.add(nodeId);
      recStack.add(nodeId);

      const neighbors = adj.get(nodeId) || [];
      for (const neighbor of neighbors) {
        if (!visited.has(neighbor)) {
          if (hasCycle(neighbor)) return true;
        } else if (recStack.has(neighbor)) {
          return true; // Back edge found
        }
      }

      recStack.delete(nodeId);
      return false;
    }

    for (const node of nodes) {
      if (!visited.has(node.id)) {
        if (hasCycle(node.id)) return true;
      }
    }

    return false;
  }

  function ensureNodeDefaults(node: any): any {
    // Ensure data.fields exists
    if (!node.data.fields) {
      node.data.fields = {};
    }

    // Add defaults based on node type
    switch (node.type) {
      case "input":
        if (!node.data.fields.variables) {
          node.data.fields.variables = [];
        }
        break;

      case "inputValidation":
        if (!node.data.fields.rules) {
          node.data.fields.rules = [];
        }
        break;

      case "dbFind":
        if (!node.data.fields.collection) node.data.fields.collection = "";
        if (!node.data.fields.findType) node.data.fields.findType = "findOne";
        if (!node.data.fields.filters) node.data.fields.filters = {};
        if (!node.data.fields.output) node.data.fields.output = "";
        break;

      case "dbInsert":
        if (!node.data.fields.collection) node.data.fields.collection = "";
        if (!node.data.fields.document) node.data.fields.document = {};
        if (!node.data.fields.output) node.data.fields.output = "createdRecord";
        break;

      case "dbUpdate":
        if (!node.data.fields.collection) node.data.fields.collection = "";
        if (!node.data.fields.filters) node.data.fields.filters = {};
        if (!node.data.fields.update) node.data.fields.update = {};
        if (!node.data.fields.output) node.data.fields.output = "";
        break;

      case "dbDelete":
        if (!node.data.fields.collection) node.data.fields.collection = "";
        if (!node.data.fields.filters) node.data.fields.filters = {};
        if (!node.data.fields.output) node.data.fields.output = "";
        break;

      case "apiCall":
        if (!node.data.fields.url) node.data.fields.url = "";
        if (!node.data.fields.method) node.data.fields.method = "GET";
        if (!node.data.fields.headers) node.data.fields.headers = {};
        if (!node.data.fields.body) node.data.fields.body = {};
        if (!node.data.fields.output) node.data.fields.output = "";
        break;

      case "condition":
        if (!node.data.fields.condition) node.data.fields.condition = "";
        if (!node.data.fields.operator) node.data.fields.operator = "==";
        if (!node.data.fields.value) node.data.fields.value = "";
        break;

      case "transform":
        if (!node.data.fields.input) node.data.fields.input = "";
        if (!node.data.fields.transformation)
          node.data.fields.transformation = "";
        if (!node.data.fields.output) node.data.fields.output = "";
        break;

      case "response":
        if (!node.data.fields.statusCode) node.data.fields.statusCode = 200;
        if (!node.data.fields.body) node.data.fields.body = {};
        break;

      case "email":
        if (!node.data.fields.to) node.data.fields.to = "";
        if (!node.data.fields.subject) node.data.fields.subject = "";
        if (!node.data.fields.body) node.data.fields.body = "";
        if (!node.data.fields.from) node.data.fields.from = "";
        break;

      case "loop":
        if (!node.data.fields.array) node.data.fields.array = "";
        if (!node.data.fields.itemVar) node.data.fields.itemVar = "item";
        break;

      case "parallel":
        if (!node.data.fields.branches) node.data.fields.branches = [];
        break;
    }

    return node;
  }

  function sanitizeWorkflow(workflow: any, allowedTypes: string[]): any {
    const typeSet = new Set(allowedTypes);

    // Filter valid nodes and ensure defaults
    const validNodes = workflow.nodes
      .filter((n: any) => n.id && n.type && typeSet.has(n.type) && n.data)
      .map(ensureNodeDefaults);

    const nodeIds = new Set(validNodes.map((n: any) => n.id));

    // Filter valid edges (both endpoints must exist)
    const validEdges = workflow.edges.filter(
      (e: any) =>
        e.id &&
        e.source &&
        e.target &&
        nodeIds.has(e.source) &&
        nodeIds.has(e.target) &&
        e.source !== e.target
    );

    return {
      nodes: validNodes,
      edges: validEdges,
    };
  }

  export const handler: StepHandler<typeof config> = async (req, ctx) => {
    const { prompt } = req.body;

    if (!prompt || typeof prompt !== "string" || prompt.trim().length === 0) {
      return {
        status: 400,
        body: { error: "Valid prompt is required" },
      };
    }

    // Security: limit prompt length
    if (prompt.length > 5000) {
      return {
        status: 400,
        body: { error: "Prompt too long (max 5000 characters)" },
      };
    }

    try {
      const ai = getAIProvider(process.env.AI_PROVIDER || "groq");

      // Build allowed types list
      const allowedTypes = nodeCatalog.map((n) => n.type);

      // Build system prompt
      const finalSystem = `
  ${systemPrompt}

  ${schemaPrompt}

  CRITICAL RULES:
  1. Return ONLY valid JSON - no markdown, no backticks, no explanations
  2. Every node MUST have: id (string), type (string), data (object with fields object inside)
  3. Every edge MUST have: id (string), source (string), target (string)
  4. Node IDs must be unique (use descriptive IDs like "input_main", "validate_email", "find_user")
  5. Edge source/target must reference existing node IDs
  6. No self-loops (source cannot equal target)
  7. No cycles in the graph

  TEMPLATE VARIABLE SYNTAX - THIS IS CRITICAL:
  - Input variables: {{variableName}} (e.g., {{email}}, {{password}}, {{userId}})
  - Output from previous steps: {{outputVarName}} (e.g., {{foundUser}}, {{savedData}})
  - NEVER use dot notation like "input.email" or "node.field"
  - ALWAYS use double curly braces: {{variableName}}

  REQUIRED FIELDS BY NODE TYPE:
  - input: data.fields.variables (array of {name, default?})
    Example: variables: [{name: "email"}, {name: "password"}]

  - inputValidation: data.fields.rules (array of validation rules)
    Example: rules: [{field: "{{email}}", required: true, type: "email"}]

  - dbFind: data.fields.collection, findType, filters (object), output (string)
    Example: collection: "users", findType: "findOne", filters: {email: "{{email}}"}, output: "foundUser"

  - dbInsert: data.fields.collection, document (object), output (string)
    Example: collection: "users", document: {name: "{{name}}", email: "{{email}}"}, output: "newUser"

  - dbUpdate: data.fields.collection, filters (object), update (object), output (string)
    Example: collection: "users", filters: {_id: "{{userId}}"}, update: {status: "active"}, output: "updatedUser"

  - dbDelete: data.fields.collection, filters (object), output (string)
    Example: collection: "users", filters: {_id: "{{userId}}"}, output: "deleteResult"

  - apiCall: data.fields.url, method, headers (object), body (object), output (string)
    Example: url: "https://api.example.com", method: "POST", body: {data: "{{someVar}}"}, output: "apiResponse"

  - response: data.fields.statusCode (number), body (object)
    Example: statusCode: 200, body: {success: true, user: "{{foundUser}}"}

  - email: data.fields.to, subject, body, from
    Example: to: "{{email}}", subject: "Welcome", body: "Hello {{name}}"

  - condition: data.fields.condition, operator, value
    Example: condition: "{{userRole}}", operator: "==", value: "admin"

  - transform: data.fields.input, transformation, output
    Example: input: "{{rawData}}", transformation: "JSON.stringify", output: "jsonData"

  COMPLETE EXAMPLE OF CORRECT WORKFLOW:
  {
    "nodes": [
      {
        "id": "input_1",
        "type": "input",
        "data": {
          "fields": {
            "variables": [
              {"name": "email"},
              {"name": "password"}
            ]
          }
        }
      },
      {
        "id": "find_user",
        "type": "dbFind",
        "data": {
          "fields": {
            "collection": "users",
            "findType": "findOne",
            "filters": {"email": "{{email}}"},
            "output": "user"
          }
        }
      },
      {
        "id": "response_1",
        "type": "response",
        "data": {
          "fields": {
            "statusCode": 200,
            "body": {"user": "{{user}}"}
          }
        }
      }
    ],
    "edges": [
      {"id": "e1", "source": "input_1", "target": "find_user"},
      {"id": "e2", "source": "find_user", "target": "response_1"}
    ]
  }

  IMPORTANT: Always populate fields with actual values using {{variable}} syntax, never leave them empty!

  Allowed node types:
  ${allowedTypes.join(", ")}
      `.trim();

      // Build user prompt
      const finalUser = userPrompt(prompt.trim(), nodeCatalog);

      // Call AI with retry logic
      let raw: string;
      let attempts = 0;
      const maxAttempts = 3;

      while (attempts < maxAttempts) {
        try {
          raw = await ai.generateWorkflow(finalUser, finalSystem);
          break;
        } catch (err: any) {
          attempts++;
          if (attempts >= maxAttempts) {
            throw new Error(
              `AI provider failed after ${maxAttempts} attempts: ${err.message}`
            );
          }
          // Wait before retry (exponential backoff)
          await new Promise((resolve) =>
            setTimeout(resolve, Math.pow(2, attempts) * 1000)
          );
        }
      }

      // Extract and repair JSON
      const cleaned = extractJson(raw!);
      const repaired = repairJson(cleaned);

      // Parse workflow
      let workflow: any;
      try {
        workflow = JSON.parse(repaired);
      } catch (parseErr: any) {
        return {
          status: 500,
          body: {
            error: "Failed to parse AI response as JSON",
            details: parseErr.message,
            raw: repaired.substring(0, 500), // First 500 chars for debugging
          },
        };
      }

      // Validate structure
      const structureCheck = validateWorkflowStructure(workflow);
      if (!structureCheck.valid) {
        return {
          status: 500,
          body: {
            error: "Invalid workflow structure",
            details: structureCheck.error,
          },
        };
      }

      // Sanitize and filter invalid nodes/edges
      workflow = sanitizeWorkflow(workflow, allowedTypes);

      // Check if we have nodes after sanitization
      if (workflow.nodes.length === 0) {
        return {
          status: 500,
          body: {
            error: "No valid nodes in generated workflow",
            details: "AI generated nodes with invalid types or structure",
          },
        };
      }

      // Validate nodes
      const nodesCheck = validateNodes(workflow.nodes, allowedTypes);
      if (!nodesCheck.valid) {
        return {
          status: 500,
          body: {
            error: "Invalid nodes in workflow",
            details: nodesCheck.error,
          },
        };
      }

      // Validate edges
      const nodeIds = new Set(workflow.nodes.map((n: any) => n.id));
      const edgesCheck = validateEdges(workflow.edges, nodeIds);
      if (!edgesCheck.valid) {
        return {
          status: 500,
          body: {
            error: "Invalid edges in workflow",
            details: edgesCheck.error,
          },
        };
      }

      // Check for cycles
      if (detectCycles(workflow.nodes, workflow.edges)) {
        return {
          status: 500,
          body: {
            error: "Generated workflow contains cycles",
            details: "Workflows must be directed acyclic graphs (DAGs)",
          },
        };
      }

      // Ensure at least one input node exists
      const hasInput = workflow.nodes.some((n: any) => n.type === "input");
      if (!hasInput) {
        // Auto-add input node if missing
        workflow.nodes.unshift({
          id: `input_${Date.now()}`,
          type: "input",
          data: {
            fields: {
              variables: [],
            },
          },
        });
      }

      // Validate template syntax in all nodes
      const validateTemplates = (node: any): string[] => {
        const errors: string[] = [];
        const fields = node.data?.fields || {};

        const checkValue = (val: any, path: string) => {
          if (typeof val === "string") {
            // Check for dot notation (wrong)
            if (val.match(/^[a-zA-Z_][a-zA-Z0-9_]*\.[a-zA-Z_][a-zA-Z0-9_.]*$/)) {
              errors.push(
                `${path}: Found dot notation "${val}" - MUST use {{variable}} syntax`
              );
            }
            // Check for node references without {{}}
            if (val.match(/^(input|node\d+|input_\w+|find_\w+|validate_\w+)\./)) {
              errors.push(
                `${path}: Found node reference "${val}" - MUST use {{variable}} syntax`
              );
            }
          } else if (Array.isArray(val)) {
            val.forEach((item, i) => checkValue(item, `${path}[${i}]`));
          } else if (val && typeof val === "object") {
            Object.entries(val).forEach(([key, value]) => {
              checkValue(value, `${path}.${key}`);
            });
          }
        };

        Object.entries(fields).forEach(([key, value]) => {
          checkValue(value, `${node.id}.fields.${key}`);
        });

        return errors;
      };

      const allTemplateErrors: string[] = [];
      workflow.nodes.forEach((node: any) => {
        const errors = validateTemplates(node);
        allTemplateErrors.push(...errors);
      });

      if (allTemplateErrors.length > 0) {
        return {
          status: 500,
          body: {
            error: "Invalid template syntax in generated workflow",
            details: "AI generated workflow with incorrect variable references",
            templateErrors: allTemplateErrors,
            hint: "Variables must use {{variableName}} syntax, not dot notation",
          },
        };
      }

      // Add metadata
      const enrichedWorkflow = {
        ...workflow,
        metadata: {
          generatedAt: new Date().toISOString(),
          prompt: prompt.substring(0, 200), // Store truncated prompt
          nodeCount: workflow.nodes.length,
          edgeCount: workflow.edges.length,
        },
      };

      return {
        status: 200,
        body: enrichedWorkflow,
      };
    } catch (err: any) {
      console.error("AI workflow generation error:", err);

      return {
        status: 500,
        body: {
          error: "Failed to generate workflow",
          details: err.message,
          type: err.constructor.name,
        },
      };
    }
  };
